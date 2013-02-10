var _ = require("underscore");
var mail = require('../mailer');
var models = require('../models');
var dust = require('dustjs-linkedin')
	, cons = require('consolidate');
var async=require('async');

exports.post = function(req, res){
	console.log(req.body); 
	console.log(req.body.to);
	console.log(req.body.from);
	console.log(req.body.subject);
	console.log(req.body.templateName); 
	console.log(req.body.content); 
	var tos = req.body.to || [];
	var templateName = req.body.templateName || "";
	var content = req.body.content || "";
	var from = req.body.from || "noreply@soho.sg";
	var subject = req.body.subject || "<SOHO>";

	//need to use waterfall async instead
	async.waterfall([function(next){
			console.log("validation error33333333");
			var input = [];
			if (_.isArray(tos)) 
				input = tos = _.filter(tos, function(str){ return str != "" ; });
			else{
				input.push(tos);
			}
			var emailObj ={tos:input, content:content, templateName: templateName, from:from, subject:subject};

			next(null,emailObj);
		},
		function(arg1,next){
			var emailObj = arg1;
			if (_.size(emailObj.tos) != 0 && emailObj && emailObj.content != "" && emailObj.from && emailObj.subject ){
				next(null,arg1);
			}
			else{			
				console.log("validation error");
			 	next("validation error",arg1);
			}
		},
		function(arg1,next){
			var emailContent = arg1.content;
			if (arg1.templateName && arg1.templateName != ""){				
				models.EmailTemplate.findOne({'name':arg1.templateName}).select().exec(function(err, results){					
					handleError(err);				
					if (results){
						next(null,arg1);
					}
					else{					
						next("template not found",arg1);					
					}					
				});
			}
			else{
				next(null, arg1);
			}
		},
		function(arg1,next){
			try{
				JSON.parse(arg1.content);				
			}catch (err){
				next("content json error",arg1);
			}
			next(null,arg1);			
		}
	],
	function(err,emailObj){
		console.log("sdfasdfasdfasdfasdfasd="+JSON.stringify(emailObj));
		if (!err){
			startEmailProcess(emailObj);
			var body =  JSON.stringify({sent:emailObj.tos});
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
	var body =  JSON.stringify({req:req.body,response:'insufficient data'});
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

	async.series({
		jobs:function(next){
			var jobs = [];			
			_.each(emailObj.tos, function(value, key, list){
				var job = new models.EmailJob({
					to:value
					,from: emailObj.from
					,subject:emailObj.subject
					,status:'created'
				});
				job.save(function(err,result){
					handleError(err);
				});
				jobs.push(job);
			});
			next(null,jobs);
		},
		emailContent:function(next){
			var emailContent = emailObj.content;
			if (emailObj.templateName){
				models.EmailTemplate.findOne({'name':emailObj.templateName}).select().exec(function(err, results){
					handleError(err);				
					if (results){
						dust.loadSource(results.compiled);						
						dust.render(emailObj.templateName,JSON.parse(emailObj.content), function(err, out) {
							if (err){
								handleError(err);
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
		handleError(err);
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
