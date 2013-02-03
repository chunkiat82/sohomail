var _ = require("underscore");
var mail = require('../mailer');
var models = require('../models');

exports.post = function(req, res){
	console.log(req.query); 
	console.log(req.query.to); 

	//TODO: ideally a proper request from POST
	var tos = req.query.to || [];

	if (_.size(tos) != 0 ){
		creatingJobs(tos, res);

	}else{
		doNothing(res);
	}

	function doNothing(res){
		var body =  "Nothing to be done"
	  	res.setHeader('Content-Type', 'application/json');
	  	res.setHeader('Content-Length', body.length);
	  	res.end(body);
	}

	function sendEmail(queue){
		console.log("Email Start Sending");
		console.log("Queue="+queue);

		_.each(queue.jobs,function(value, key, list){
			console.log("jobid="+value);
			models.EmailJob
				.findOne({ '_id':value })
				.select('to from subject status')
				.where('status').ne('sent')
				.exec(function(err,job){
					if (err) return handleError(err);	
					console.log('job='+job);
					mail.sendMail({'to':job.to, 'from':job.from, 'subject':job.subject ,'html':queue.html});
					job.status='sent';
					job.save();
				});
		});
	}

	function creatingJobs(tos,res){

		var jobs = [];
		var input = [];
		if (_.isArray(tos)) 
			input = tos
		else
			input.push(tos);

		_.each(input, function(value, key, list){
			var job = new models.EmailJob({
				to:value
				,from: 'test@soho.sg'
				,subject:'test@soho.sg'
				,status:'created'
			});
			job.save(function (err) {
			  if (err) {
			  	console.log('job save error');
			  }		  	
			  else{
			  	console.log('job created');
			  	
			  }
			});
			jobs.push(job);
		});

		console.log("jobs="+jobs);
		var queue = new models.EmailQueue({
			template:'string'
			, description:'string'
			, html:'Hello World People!!!!'
			, status:'active'
			, dateCreated :new Date()
			, lastUpdated:new Date()
			, dateCompleted:new Date()
			, jobs:jobs});

		queue.save(function (err) {
			if (err){
				console.log('queue save error');
			}
			else{
				console.log('queue created');
			}
		  
		});
		
		//Delay and start the job non blocking
		setTimeout(function(){sendEmail(queue);}, 2000);

		var body =  JSON.stringify(tos);
	  	res.setHeader('Content-Type', 'application/json');
	  	res.setHeader('Content-Length', body.length);
	  	res.end(body);
	}
};


