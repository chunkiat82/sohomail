var _ = require("underscore");
var mail = require('../mailer');
var models = require('../models');
var dust = require('dustjs-linkedin')
	, cons = require('consolidate');
var async=require('async');

exports.post = function(req, res){
	console.log(req.query); 
	console.log(req.query.to);
	console.log(req.query.from);
	console.log(req.query.subject);
	console.log(req.query.templateName); 
	console.log(req.query.content); 
	var tos = req.query.to || [];
	var templateName = req.query.templateName || "";
	var content = req.query.content || "";
	var from = req.query.from || "noreply@soho.sg";
	var subject = req.query.subject || "<SOHO>";
	async.series({
		getInput:function(next){
			var input = [];
			if (_.isArray(tos)) 
				input = tos
			else{
				input.push(tos);å
			}
			var emailObj ={tos:input, content:content, templateName: templateName, from:from, subject:subject};

			next(null,emailObj);
		},
		templateRetrieve:function(next){
			var emailContent = content;
			if (templateName != ""){
				models.EmailTemplate.findOne({'name':templateName}).select().exec(function(err, results){
					handleError(err);				
					if (results){
						next(null,results);
					}
					else{
						next("template not found",null);					
					}
					
				});
			}
			else{
				next(null, null);
			}
		}
	},
	function(err,finalResults){
		var emailObj = finalResults.getInput; 

		if (_.size(tos) != 0 && !err && emailObj && emailObj.content != "" && emailObj.from && emailObj.subject ){
			startEmailProcess(emailObj);
			var body =  JSON.stringify({sent:tos});
	  		res.setHeader('Content-Type', 'application/json');
	  		res.setHeader('Content-Length', body.length);
	  		res.end(body);
		}else{
			handleError(err);
			illegalArugements(req,res);
		}
	});
};
function illegalArugements(req, res){
	var body =  JSON.stringify({req:req.query,response:'insufficient data'});
  	res.setHeader('Content-Type', 'application/json');
  	res.setHeader('Content-Length', body.length);
  	res.end(body);
}

function handleError(err,results){
	//notsure what to handle now
	if (err) {
		console.log('err='+err);		
	}

	if (results){
		console.log('results='+results);
	}
}

//TODO: So far only working for ideal scenario
function startEmailProcess(emailObj){

	async.parallel({
		jobs:function(next){
			var jobs = [];			
			_.each(emailObj.tos, function(value, key, list){
				var job = new models.EmailJob({
					to:value
					,from: emailObj.from
					,subject:emailObj.subject
					,status:'created'
				});
				job.save(handleError);
				jobs.push(job);
			});
			next(null,jobs);
		},
		emailContent:function(next){
			var emailContent = emailObj.content;
			if (emailObj.teplateName){
				models.EmailTemplate.findOne({'name':emailObj.templateName}).select().exec(function(err, results){
					handleError(err);				
					if (results){
						dust.loadSource(results.compiled);
						
						dust.render(results.name, {content: emailObj.content}, function(err, out) {
							if (err){
								handleError(err);
							}else{
								next(null,out);
							}						
						});
					}
					else{
						next("template not found",emailObj.content);
					}
					
				});
			}
			else{
				next(null,emailContent);
			}
		}
	},function(err,finalResults){
		handleError(err);
		var queue = new models.EmailQueue({
			template:'string'
			, description:'string'
			, html:finalResults.emailContent
			, status:'active'
			, dateCreated :new Date()
			, lastUpdated:new Date()
			, dateCompleted:new Date()
			, jobs:finalResults.jobs
		});

		queue.save(function(err,results){
			if (err){
				handleError(err);
			}else{
				sendEmail(queue);
			}
		});
	});

}

// either take in the queue or take in whats needed
// like the job and html
function sendEmail(queue){
	console.log("Email Start Sending");

	_.each(queue.jobs,function(value, key, list){
		models.EmailJob
			.findOne({ '_id':value })
			.select('to from subject status')
			.where('status').ne('sent')
			.exec(function(err,job){
				handleError(err);
				mail.sendMail({'to':job.to, 'from':job.from, 'subject':job.subject ,'html':queue.html});
				job.status='sent';
				job.save();
			});
	});
}
