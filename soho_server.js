var express = require('express')
	,app = express();
var _ = require("underscore");
var mail = require('./soho_mail.js');
var models = require('./soho_schema.js');
var routes = require('./routes');
var portNumber=3001;

var dust = require('dustjs-linkedin')
	, cons = require('consolidate');

var MongoStore = require('connect-mongo')(express);
// assign the dust engine to .dust files
app.engine('dust', cons.dust);
app.configure(function(){
    app.set('view engine', 'dust');
    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname + '/public', {redirect: false}));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
    	secret: 'foo',
    	store: new MongoStore({
      		db: 'sohomail'
    	})
  	}));
    app.use(app.router);
 });

//Temp hardcode FROM, SUBJECT and TEXT
var FROM ='chunkiat82@gmail.com'

app.get('/', routes.index);

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

//CRUD queue
app.get('/queue',function(req,res){
	var queues = models.EmailQueue.find().select().exec(function(err, data){
		var body =  JSON.stringify(data,function censor(key, values) {
  			if (key == "jobs") {
  				var finalValues = [];
  				console.log(values);
				_.each(values, function(value, key, list){
					value = '<a href=\'/job/'+value+'\'>'+value+'</a>';
					finalValues.push(value);
				});
    			return finalValues;
  			}
  			return values;
		}, '');
  		res.setHeader('Content-Type', 'text/html');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});

});

app.get('/queue/:id',function(req,res){
	//console.log("id="+req.param('id'));
	var queues = models.EmailQueue.findOne({'_id':req.param('id')}).select().exec(function(err, data){
		var body =  JSON.stringify(data,function censor(key, values) {
  			if (key == "jobs") {
  				var finalValues = [];
  				console.log(values);
				_.each(values, function(value, key, list){
					value = '<a href=\'/job/'+value+'\'>'+value+'</a>';
					finalValues.push(value);
				});
    			return finalValues;
  			}
  			return values;
		}, 4);
  		res.setHeader('Content-Type', 'text/html');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});
});


//CRUD jobs

app.get('/job',function(req,res){
	var jobs = models.EmailJob.find().select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  		res.setHeader('Content-Type', 'application/json');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});
});

app.get('/job/:id',function(req,res){
	//console.log("id="+req.param('id'));
	var queues = models.EmailJob.findOne({'_id':req.param('id')}).select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  		res.setHeader('Content-Type', 'application/json');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});
});
/////////////////////////////////////////////////////////////////////////////
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
	var queue = new models.EmailQueue({
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
	
	//Delay and start the job non blocking
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

console.log("Listening Port = "+portNumber);
app.listen(portNumber);
