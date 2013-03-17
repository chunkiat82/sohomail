var models = require('./models'),
	async = require('async'),
	dust = require('dustjs-linkedin'),
	fs = require('fs'),
	formidable = require("formidable");
require("mongoose").connect('localhost', 'soho_mail');
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

	// console.log(stream.path);
	// fs.exists(stream.path,function(exists){console.log("it exists?", exists);});
		// rs.on('data', function(data){ console.log(data); })
		// 	.on('error', function(data, err){ console.log(data,err); })
		// 	.on('open', function(data,and){ console.log(data,and); })
		var form = new formidable.IncomingForm();
		// rs.headers = req.headers;
		form.on('field', function(name, value) {
			queue[name] = value;
		});
		form.on('error', function(err) {
			console.log(err);
		});
		var queueSaved = false, ended = 0, semaphore = 0;
		function removeRawAndPoll(){
			emailObj.remove(function(err){
				if ( err ) {
					logError("Failed to remove", err);
				}else{
					console.log("done sending queue "+queue);
				}
				pollRawEmailRequest();
			});
			if ( queue.statusUpdateURL ) {
				var url = require("url").parse(queue.statusUpdateURL);
				try {
				var req = require('http').request({
					hostname: url.hostname,
					port: url.port,
					path: url.path,
					method:'POST',
					agent: false
				});
				req.write(require('querystring').stringify({id:emailObj._id, status: queue.status}));
				req.end();
				} catch(err) {
					console.log("failed to update teh status, ignoring, add in retry next time")
				}
			}
		}
		form.onPart = function(part) {
		  if (part.name !== "emails[]") {

		  	// lets buid the queue first
		    // let formidable handle all non-file parts
		    form.handlePart(part); // let them handle everythign else
		  } else {
		  	if ( !queueSaved ) {
		  		form.pause();
		  		if ( !queue.templateName && queue.content ) {
		  			queue.content = dust.compile(queue.content, queue.rawrequest);
		  		}
		  		queue.save(function(err) {
		  			queueSaved = true;
			  		form.resume();
		  		});
		  	}
				var buffer = "";
		  	part.on('data', function(data){
		  		buffer += data.toString();
		  		console.log(data.toString());
		  	});
		  	part.on('end', function(){
		  		buffer = buffer.split("\n");
		  		var job = new models.EmailJob({queue: queue._id, to: buffer[0], data: JSON.parse(buffer[1])});
		  		++semaphore;
		  		job.save(function(err){
		  			if (0 >= --semaphore && ended) {
		  				queue.status = "active";
		  				queue.save(function(){
		  					removeRawAndPoll();
		  				});

		  			}
		  			if ( err ) {
		  				console.log(err);
		  				// now doing nothing but log, we sholud really do something about these error handling, like setting the whole queue to err, and job to err
		  			}
		  		});
		  	})
		  }
		}
		form.parse(rs);
		form.on('end', function(){
			ended = true;
			if (0 >= semaphore && ended) {
				queue.status = "active";
				queue.save(function(){
					removeRawAndPoll();
				});
			}
		})
		form.on('error', function(error){
			console.log("failed to parse multipart, with error: ", error); // we should store this somewhere so user cna retrieve again
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
		// 					console.log("template not found");
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
		// 				console.log("done sending queue "+queue);
		// 			}
		// 			pollRawEmailRequest();
		// 		});
		// 	});
		// });
	});
}