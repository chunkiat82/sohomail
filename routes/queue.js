var models = require('../soho_schema.js');
var _ = require("underscore");

exports.list = function(req, res){
  res.locals.session = req.session;
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
};

exports.get = function(req, res){
  res.locals.session = req.session;
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
};