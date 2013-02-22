var models = require('./models'),
	async = require('async'),
	mail = require('./mailer');
setTimeout(resetAndPollEmailQueue, 1000);
function logError(comment, err) {
	console.log("You have a freaking error("+err+"): "+comment);
}
var last_time;

function resetAndPollEmailQueue() {
	last_time = Date.now();
	pollEmailQueue();
}
function pollEmailQueue(){
	if ( Date.now() - last_time > 1000 ) {
		console.log("timeout here");
		return setTimeout(resetAndPollEmailQueue, 30);
	}
	models.EmailQueue.findOne({status: "active"}).exec(function(err, emailQueue) {
		if ( err ) {
			return logError("Unable to find one", err);
		}
		if ( !emailQueue ) {
			console.log("queue empty");
			return setTimeout(resetAndPollEmailQueue, 1000);
		}
		sendEmail(emailQueue, function(err) {
			pollEmailQueue();
		});
	});
}

function sendEmail(queue, cb){
	console.log("Email Start Sending");
	var semaphore = 0;
	function handleSemaphore() {
		if( --semaphore <= 0 ) {
			queue.set('status', 'complete');
			queue.save(function(err){
				cb();
			});
		}
	}
	queue.jobs.forEach(function(value, key, list){
		++semaphore;
		models.EmailJob
			.findOne({ '_id':value })
			.select('to from subject status')
			.where('status').ne('sent')
			.exec(function(err,job){
				if ( err ) {
					logError("failed to read email job", err);
				}
				if ( job ) {
					mail.sendMail({'to':job.to, 'from':job.from, 'subject':job.subject ,'html':queue.html});
					job.status='sent';
					job.save();
				} else {
					console.log("couldnt find job");
				}
				handleSemaphore();
			});
	});
}
