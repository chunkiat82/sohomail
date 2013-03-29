var models = require('./models'),
	async = require('async'),
	dust = require('dustjs-linkedin'),
	fs = require('fs'),
	formidable = require("formidable");
require("mongoose").connect('localhost', 'soho_mail');
setTimeout(resetAndPollRawEmailRequest, 1000);
function log() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift((new Date()));
        console.log.apply(console, args);
}

function logError(comment, err) {
	log("You have a freaking error("+err+"): "+comment);
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
			logError("Unable to find one", err);
			return setTimeout(resetAndPollRawEmailRequest, 1000);
		}
		if ( !emailObj ) {
			return setTimeout(resetAndPollRawEmailRequest, 1000);
		}
		// parse
					// now lets write it to db
		var queue = new models.EmailQueue({rawrequest: emailObj._id});
		var rs = fs.createReadStream(emailObj.path);
		rs.headers = emailObj.headers;

	// log(stream.path);
	// fs.exists(stream.path,function(exists){log("it exists?", exists);});
		// rs.on('data', function(data){ log(data); })
		// 	.on('error', function(data, err){ log(data,err); })
		// 	.on('open', function(data,and){ log(data,and); })
		var form = new formidable.IncomingForm();
		// rs.headers = req.headers;
		form.on('field', function(name, value) {
			queue[name] = value;
		});
		form.on('error', function(err) {
			log(err);
		});
		var queueSaved = false, ended = 0, semaphore = 0;
		function removeRawAndPoll(){
			emailObj.remove(function(err){
				if ( err ) {
					logError("Failed to remove", err);
				}else{
					log("done sending queue "+queue);
				}
				pollRawEmailRequest();
			});
			if ( queue.statusUpdateURL ) {
				var url = require("url").parse(queue.statusUpdateURL);
				var req = require('http').request({
					hostname: url.hostname,
					port: url.port,
					path: url.path,
					method:'POST',
					agent: false
				});
				req.on('error', function(error){
					log("failed to notify, change this later to another queue service to resend");
				});
				req.write(require('querystring').stringify({id:emailObj._id, status: queue.status}));
				req.end();
			}
		}
		var jobsUnSaved = [], queueSaving = false, unsavedSemaphore=0;
		function handleJobSave(){
			if (queue.status !== "active" && 0 >= semaphore && ended && 0 >= unsavedSemaphore) {
				queue.status = "active";
				queue.save(function(){
					removeRawAndPoll();
				});
			}
		};
		form.onPart = function(part) {
		  if (part.name !== "emails[]") {

		  	// lets buid the queue first
		    // let formidable handle all non-file parts
		    form.handlePart(part); // let them handle everythign else
		  } else {
		  	log(queueSaved, queueSaving, part);
		  	if ( !(queueSaved || queueSaving) ) {
		  		form.pause();
		  		if ( !queue.templateName && queue.content ) {
		  			log("entering this place again");
		  			queue.content = dust.compile(queue.content, queue.rawrequest);
		  		}
		  		queueSaving = true;
		  		queue.save(function(err) {
		  			queueSaving = false;
		  			queueSaved = true;
			  		form.resume();
			  		for ( var i = 0; i < jobsUnSaved.length; ++i ) {
			  			++unsavedSemaphore;
			  			(function(job){
					  		job.queue = queue._id;
					  		job.save(function(err){
		  						if ( err ) {
										log(err);
										// now doing nothing but log, we sholud really do something about these error handling, like setting the whole queue to err, and job to err
									}
					  			--unsavedSemaphore;
					  			handleJobSave();
					  		});
			  			})(jobsUnSaved[i])
			  		}
		  		});
		  	}
				var buffer = "";
		  	part.on('data', function(data){
		  		buffer += data.toString();
		  		log(data.toString());
		  	});
		  	part.on('end', function(){
		  		buffer = buffer.split("\n");
		  		var job = new models.EmailJob({to: buffer[0], data: JSON.parse(buffer[1])});
		  		if ( queueSaved ) {
			  		++semaphore;
			  		job.queue = queue._id;
			  		job.save(function(err){
  						if ( err ) {
								log(err);
								// now doing nothing but log, we sholud really do something about these error handling, like setting the whole queue to err, and job to err
							}
			  			--semaphore;
			  			handleJobSave();
			  		});
			  	} else {
			  		jobsUnSaved.push(job);
			  	}
		  	})
		  }
		}
		form.parse(rs);
		form.on('end', function(){
			log("ended parsing form");
			ended = true;
			handleJobSave();
		})
		form.on('error', function(error){
			log("failed to parse multipart, with error: ", error); // we should store this somewhere so user cna retrieve again
			removeRawAndPoll();
		});
		// async.series({
		// 	jobs:function(next){
		// 		var jobs = [];	
		// 		var t_to, semaphore = 0; // start with one for locating email template
		// 		function handleSemaphore() {
		// 			if ( --semaphore <= 0 ) {
		// 				next(null, jobs);
		// 			}
		// 		}
		// 		for ( var i = 0; i < emailObj.tos.length; ++i ) {
		// 			t_to = emailObj.tos[i];
		// 			++semaphore;
		// 			var job = new models.EmailJob({
		// 				to:t_to
		// 				,from: emailObj.from
		// 				,subject:emailObj.subject
		// 				,status:'created',
		// 				owner: emailObj.owner
		// 			});
		// 			job.save(function(err) {
		// 				if ( err ) {
		// 					logError("failed to save email job", err);
		// 				}
		// 				handleSemaphore();
		// 			});
		// 			jobs.push(job);
		// 		}
		// 	},
		// 	emailContent:function(next){
		// 		var emailContent = emailObj.content;
		// 		if (emailObj.templateName){
		// 			models.EmailTemplate.findOne({'name':emailObj.templateName}).select().exec(function(err, results){
		// 				if ( err ) {
		// 					next(err);
		// 				}
		// 				if (results){
		// 					dust.loadSource(results.compiled);		
		// 					dust.render(emailObj.templateName,JSON.parse(emailObj.content), function(err, out) {
		// 						if (err){
		// 							next(err);
		// 						}else{
		// 							next(null,out);
		// 						}						
		// 					});
		// 				}
		// 				else{
		// 					log("template not found");
		// 					next("template not found",emailObj.content);
		// 				}
						
		// 			});
		// 		}
		// 		else{
		// 			next(null,emailContent);
		// 		}
		// 	}
		// },function(err,finalResults){
		// 	if ( err) {
		// 		return logError("Error damn it",err);
		// 	}
		// 	var queue = new models.EmailQueue({
		// 		template:finalResults.templateName
		// 		, tos: emailObj.tos
		// 		, from: emailObj.from
		// 		, content: emailObj.content
		// 		, statusUpdateURL: emailObj.statusUpdateURL
		// 		, description:''
		// 		, html:finalResults.emailContent
		// 		, status:'active'
		// 		, dateCreated :new Date()
		// 		, lastUpdated:new Date()
		// 		, dateCompleted:new Date()
		// 		, jobs:finalResults.jobs
		// 		, rawrequest: emailObj._id
		// 		, owner: emailObj.owner
		// 	});

		// 	queue.save(function(err,results){
		// 		if (err){
		// 			logError("Failed to save to email queue", err);
		// 		}
		// 		if ( emailObj.statusUpdateURL ) {
		// 			var url = require("url").parse(emailObj.statusUpdateURL);
		// 			var req = require('http').request({
		// 				hostname: url.host,
		// 				port: url.port,
		// 				path: url.path,
		// 				method:'POST',
		// 				agent: false
		// 			});
		// 			req.write(require('querystring').stringify({id:emailObj._id, status: queue.status}));
		// 			req.end();
		// 		}
		// 		emailObj.remove(function(err){
		// 			if ( err ) {
		// 				logError("Failed to remove", err);
		// 			}else{
		// 				log("done sending queue "+queue);
		// 			}
		// 			pollRawEmailRequest();
		// 		});
		// 	});
		// });
	});
}