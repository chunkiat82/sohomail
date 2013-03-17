var models = require('./models'),
	async = require('async'),
	mail = require('./mailer'),
	dust = require('dustjs-linkedin');
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
		function callSendMail(templateName, template) {
			sendEmail(emailQueue, templateName, template, function(err) {
				if ( emailQueue.statusUpdateURL ) {
					console.log("update status", emailQueue.statusUpdateURL);
					var url = require("url").parse(emailQueue.statusUpdateURL);
					try{
					var req = require('http').request({
						hostname: url.hostname,
						port: url.port,
						path: url.path,
						method:'POST',
						agent: false
					});
					// put something here to track if the final status has been updated properly, if it is not, retry maybe up to 5 times or something in 5 minute intervals
					// and also track if the update has been failed, so it can be seen on the interface
					req.write(require('querystring').stringify({id:emailQueue.rawrequest.toString(), status: emailQueue.status}));
					req.end();
					} catch(err) {
						console.log("failed to notify, change this later to another queue service to resend");
					}
				}
				pollEmailQueue();
			});
		}
		if ( emailQueue.templateName ) {
			// retrieve template, and then call send
			models.EmailTemplate.findOne({'name':emailQueue.templateName}).select().exec(function(err, result){
				callSendMail(result.name, result.compiled); // TODO, find out if there is a problem when two sourc eof hte same name is compiled
				// and if it will hog on the memory if we keep loading more templates
			});
		} else {
			callSendMail(emailQueue.rawrequest, emailQueue.content);
		}
	});
}

function sendEmail(queue, templateName, template, cb){
	console.log("Email Start Sending");
	var semaphore = 0, closed = false;
	function handleSemaphore() {
		if( semaphore <= 0 && closed) {
			queue.set('status', 'complete');
			queue.save(function(err){
				cb();
			});
		}
	}
	dust.loadSource(template);
	var stream = models.EmailJob
		.find({ 'queue':queue._id })
		.select('to data status')
		.where('status').ne('sent')
		.stream();
	function sendMail(job){

		dust.render(templateName,job.data, function(err, html) {
			if (err){
				console.log("dust is ill formed and cannot be rendered", err);
			}else{
				mail.sendMail({'to':job.to, 'from':queue.from, 'subject':queue.subject ,'html':html});
				job.status='sent';
				job.save(function(err){
					if ( err ) {
						return console.log("now this would be serious, it failed while updating status");
					}
					--semaphore;
					handleSemaphore();
				});
			}						
		});
	}
	stream.on('data', function(job){
		++semaphore;
		if ( job ) {
			sendMail(job);
		} else {
			console.log("couldnt find job");
			--semaphore;
		}
		handleSemaphore();
	}).on('error', function(err){
		console.log(err);
	}).on('close', function(){
		closed = true;
		handleSemaphore();
	});
}
