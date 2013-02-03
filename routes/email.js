var _ = require("underscore");
var mail = require('../mailer');
var models = require('../models');
var dust = require('dustjs-linkedin')
	, cons = require('consolidate');

exports.post = function(req, res){
	console.log(req.query); 
	console.log(req.query.to);
	console.log(req.query.template); 
	console.log(req.query.content); 

	//TODO: ideally a proper request from POST
	var tos = req.query.to || [];
	var template = req.query.template || "";
	var content = req.query.content || "";

	if (_.size(tos) != 0 ){
		creatingJobs(res,tos,template,content);
		var body =  JSON.stringify(tos);
  		res.setHeader('Content-Type', 'application/json');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);
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

	//TODO: So far only working for ideal scenario
	function creatingJobs(res,tos,template,content){

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
			  	console.log('err='+err);
			  	console.log('job save error');
			  }		  	
			  else{
			  	console.log('job created');
			  	
			  }
			});
			jobs.push(job);
		});
		var results = models.EmailTemplate.findOne({'name':template}).select().exec(function(err, template){

			dust.loadSource(template.compiled);
			
			dust.render(template.name, {content: content}, function(err, out) {
				console.log("renderring error="+err);
  				var queue = new models.EmailQueue({
					template:'string'
					, description:'string'
					, html:out
					, status:'active'
					, dateCreated :new Date()
					, lastUpdated:new Date()
					, dateCompleted:new Date()
					, jobs:jobs
				});

				queue.save(function (err) {
					if (err){
						console.log('err='+err);
						console.log('queue save error');
					}
					else{
						sendEmail(queue);
						console.log('queue created');
					}
	  			});
			});
  			
		});
	}
};
