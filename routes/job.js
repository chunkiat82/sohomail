var models = require('../models');
exports.list = function(req, res){
	res.locals.session = req.session;
  	var results = models.EmailJob.find().select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  		res.setHeader('Content-Type', 'application/json');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});
};
exports.get = function(req, res){
	var results = models.EmailJob.findOne({'_id':req.param('id')}).select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  		res.setHeader('Content-Type', 'application/json');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});
};