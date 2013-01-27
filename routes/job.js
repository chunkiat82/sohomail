var models = require('../soho_schema.js');
exports.list = function(req, res){
	res.locals.session = req.session;
  	var jobs = models.EmailJob.find().select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  		res.setHeader('Content-Type', 'application/json');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});
};
exports.get = function(req, res){
	var queues = models.EmailJob.findOne({'_id':req.param('id')}).select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  		res.setHeader('Content-Type', 'application/json');
  		res.setHeader('Content-Length', body.length);
  		res.end(body);	
	});
};