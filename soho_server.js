var express = require('express')
	,app = express();
var _ = require("underscore");
var Mail = require('./soho_mail.js');
var Models = require('./soho_schema.js');
var portNumber=3001;

//Temp hardcode FROM, SUBJECT and TEXT
var FROM ='chunkiat82@gmail.com'


app.get('/email', function(req, res){

	console.log(req.query); 
	console.log(req.query.to); 

	//TODO: ideally a proper request from POST
	var tos = req.query.to || [];

	if (_.size(tos) != 0 ){
		creatingJobs(tos, res);

	}else{
		doNothing(res);
	}
	
});

function creatingJobs(tos,res){

	var jobs = [];
	_.each(tos, function(value, key, list){
		var job = new Models.EmailJob({
			to:value
			,from:FROM
			,subject:FROM
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
	var queue = new Models.EmailQueue({
	template:'string'
	, description:'string'
	, html:'Hello World People!!!!'
	, status:'string'
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
	setTimeout(function(){sendEmail(queue);}, 2000);

	var body =  JSON.stringify(tos);
  	res.setHeader('Content-Type', 'application/json');
  	res.setHeader('Content-Length', body.length);
  	res.end(body);
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
		Models.EmailJob
			.findOne({ '_id':value })
			.select('to from subject status')
			.where('status').ne('sent')
			.exec(function(err,job){
				if (err) return handleError(err);	
				console.log('job='+job);
				Mail.sendMail({'to':job.to, 'from':job.from, 'subject':job.subject ,'html':queue.html});
				job.status='sent';
				job.save();
			});
	});
}

console.log("Listening Port = "+portNumber);
app.listen(portNumber);
