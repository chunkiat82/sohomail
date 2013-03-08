var models = require('./models'),
	async = require('async'),
	mail = require('./mailer');
require("mongoose").connect('localhost', 'soho_mail');
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
			return setTimeout(resetAndPollEmailQueue, 1000);
		}
		sendEmail(emailQueue, function(err) {
			if ( emailQueue.statusUpdateURL ) {
				var url = require("url").parse(emailQueue.statusUpdateURL);
				var req = require('http').request({
					hostname: url.host,
					port: url.port,
					path: url.path,
					method:'POST',
					agent: false,
					headers: {
						"Content-Type": "text/json"
					}
				});
				// put something here to track if the final status has been updated properly, if it is not, retry maybe up to 5 times or something in 5 minute intervals
				// and also track if the update has been failed, so it can be seen on the interface
				req.write(JSON.stringify({id:emailQueue.rawrequest, status: emailQueue.status}));
				req.end();
			}
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
					job.save(function(err){
						if ( err ) {
							return console.log("now this would be serious, it failed while updating status");
						}
					});
				} else {
					console.log("couldnt find job");
				}
				handleSemaphore();
			});
	});
}
