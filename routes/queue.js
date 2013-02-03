var models = require('../models');
var _ = require("underscore");
var states = {"active":0, "inactive":-1, "completed":1};

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
  if (req.param('queue') in states){
    console.log("status");
    status(req, res);
  }
  else{
    console.log("get");
    get(req, res);
  } 
};

function status(req, res){
  var queues = models.EmailQueue.find({'status':req.param('queue')}).select().exec(function(err, data){
    var body =  jobFormatter(data);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);  
  });
}

function get(req, res){
  console.log("doing a get");
  var queues = models.EmailQueue.findOne({'_id':req.param('queue')}).select().exec(function(err, data){
    console.log("doing a get1");
    var body =  jobFormatter(data);
    console.log("doing a get2");
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);  
  });
}

function jobFormatter(data){
  return JSON.stringify(data,function censor(key, values) {
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
}

