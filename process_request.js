var models = require('./models'),
	async = require('async');
setTimeout(resetAndPollRawEmailRequest, 1000);
function logError(comment, err) {
	console.log("You have a freaking error("+err+"): "+comment);
}
var last_time;

function resetAndPollRawEmailRequest() {
	last_time = Date.now();
	pollRawEmailRequest();
}
function pollRawEmailRequest(){
	if ( Date.now() - last_time > 1000 ) {
		return setTimeout(resetAndPollRawEmailRequest, 30);
	}
	models.EmailRawRequest.findOne({}).exec(function(err, emailObj) {
		if ( err ) {
			return logError("Unable to find one", err);
		}
		if ( !emailObj ) {
			console.log("queue empty");
			return setTimeout(resetAndPollRawEmailRequest, 1000);
		}
		async.series({
			jobs:function(next){
				var jobs = [];	
				var t_to, semaphore = 0; // start with one for locating email template
				function handleSemaphore() {
					if ( --semaphore <= 0 ) {
						next(null, jobs);
					}
				}
				for ( var i = 0; i < emailObj.tos.length; ++i ) {
					t_to = emailObj.tos[i];
					++semaphore;
					var job = new models.EmailJob({
						to:t_to
						,from: emailObj.from
						,subject:emailObj.subject
						,status:'created'
					});
					job.save(function(err) {
						if ( err ) {
							logError("failed to save email job", err);
						}
						handleSemaphore();
					});
					jobs.push(job);
				}
			},
			emailContent:function(next){
				var emailContent = emailObj.content;
				if (emailObj.templateName){
					models.EmailTemplate.findOne({'name':emailObj.templateName}).select().exec(function(err, results){
						logError("Error damn it",err);				
						if (results){
							dust.loadSource(results.compiled);						
							dust.render(emailObj.templateName,JSON.parse(emailObj.content), function(err, out) {
								if (err){
									logError("Error damn it",err);
								}else{
									next(null,out);
								}						
							});
						}
						else{
							console.log("template not found");
							next("template not found",emailObj.content);
						}
						
					});
				}
				else{
					next(null,emailContent);
				}
			}
		},function(err,finalResults){
			if ( err) {
				logError("Error damn it",err);
			}
			var queue = new models.EmailQueue({
				template:finalResults.templateName
				, description:''
				, html:finalResults.emailContent
				, status:'active'
				, dateCreated :new Date()
				, lastUpdated:new Date()
				, dateCompleted:new Date()
				, jobs:finalResults.jobs
			});

			queue.save(function(err,results){
				if (err){
					logError("Failed to save to email queue", err);
				}
				emailObj.remove(function(err){
					if ( err ) {
						logError("Failed to remove", err);
					}else{
						console.log("done sending queue "+queue);
					}
					pollRawEmailRequest();
				});
			});
		});
	});
}