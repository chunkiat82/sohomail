var models = require('../models');
var _ = require("underscore");
var passport = require('passport');
var states = {"active":0, "inactive":-1, "completed":1};

function logger(data){
  console.log("Queue : "+data);
}

exports.list =  [
  passport.authenticate(['basic', 'oauth2-client-password', 'header'], { session: false }),
  function(req, res){
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
}];

exports.get =  [
  passport.authenticate(['basic', 'oauth2-client-password', 'header'], { session: false }),
  function(req, res){
  if (req.param('queue') in states){
    console.log("status");
    status(req, res);
  }
  else{
    console.log("get");
    get(req, res);
  } 
}];

exports.progress =  [
  passport.authenticate(['basic', 'oauth2-client-password', 'header'], { session: false }),
  function(req, res){
  var queueId = req.param('queue');

  //total
  models.EmailQueue.find({"queue":queueId}).count().exec(function (err,dataTotal){    
    if (data) {
      //sent total
      models.EmailQueue.find({"queue":queueId, "status":"sent" }).count().exec(function (err,dataSent){          
        return res.json(200, {progress: (dataSent/dataTotal)});
      });
    }
    else{
      return res.json(500, {});
    }
  });

  

}];

//this is not right need to rewrite because it is should be loading status it should be raw request
function status(req, res){
  var queues = models.EmailQueue.find({'status':req.param('queue')}).select().exec(function(err, data){
    var body =  jsonJobFormatter(data);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);  
  });
}

function get(req, res){
  console.log("doing a get");
  var queues = models.EmailQueue.findOne({'_id':req.param('queue')}).select().exec(function(err, data){
    console.log("doing a get1");
    var body =  jsonJobFormatter(data);
    console.log("doing a get2");
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);  
  });
}

function jsonJobFormatter(data){
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

