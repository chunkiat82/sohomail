var models = require('../models');
exports.list = function(req, res){
	res.locals.session = req.session;
  	var results = models.EmailTemplate.find().select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  	res.setHeader('Content-Type', 'application/json');
  	res.setHeader('Content-Length', body.length);
  	res.end(body);	
	});
};
exports.get = function(req, res){
	var results = models.EmailTemplate.findOne({'_id':req.param('id')}).select().exec(function(err, data){
		var body =  JSON.stringify(data,null, 4);
  	res.setHeader('Content-Type', 'application/json');
  	res.setHeader('Content-Length', body.length);
  	res.end(body);	
	});
};

exports.post = function(req, res){
  //TODO: input validation
  var name = req.body['name']
  var content = req.body['content'] 
  console.log(req.body);
  var modelInstance = new models.EmailTemplate({
    name:name
    ,content:content
  });
  modelInstance.save(function (err) {
    if (err) {
      console.log('EmailTemplate save error');
    }       
    else{
      console.log('EmailTemplate created');
      
    }
  });
  var body =  JSON.stringify(req.body,null, 4);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', body.length);
  res.end(body);

};