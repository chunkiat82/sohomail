var models = require('../models');
var _ = require("underscore");
var passport = require('passport');
var states = {
  "active": 0,
  "inactive": -1,
  "completed": 1
};

function logger(data) {
  console.log("Queue : " + data);
}

exports.list = [
passport.authenticate(['basic', 'oauth2-client-password', 'header'], {
  session: false
}),

function(req, res) {
  var queues = models.EmailQueue.find().select().exec(function(err, data) {
    var body = JSON.stringify(data, function censor(key, values) {
      if (key == "jobs") {
        var finalValues = [];
        console.log(values);
        _.each(values, function(value, key, list) {
          value = '<a href=\'/job/' + value + '\'>' + value + '</a>';
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

exports.get = [
passport.authenticate(['basic', 'oauth2-client-password', 'header'], {
  session: false
}),

function(req, res) {
  if (req.param('queue') in states) {
    console.log("status");
    status(req, res);
  } else {
    console.log("get");
    get(req, res);
  }
}];

exports.progress = [
passport.authenticate(['basic', 'oauth2-client-password', 'header'], {
  session: false
}),

function(req, res) {
  var queueId = req.param('queue');
  //total
  models.EmailQueue.findOne({
    "rawrequest": queueId
  }).exec(function(err, data) {
    if (data) {
      models.EmailJob.count({
        "queue": data._id
      }, function(err, dataTotal) {
        logger("queueId:" + queueId);
        logger("dataTotal:" + dataTotal);
        logger("err:" + err);
        logger("data._id:" + data._id);
        if (dataTotal) {
          //sent total
          models.EmailJob.count({
            "queue": data._id,
            "status": "sent"
          }, function(err, dataSent) {
            var result = {
              progress: (dataSent / dataTotal),
              sent: dataSent,
              notSent: (dataTotal - dataSent), //calculated
              total: dataTotal
            };
            logger("result:" + result);
            return res.json(200, result);
          });
        } else {
          return res.json(500, {});
        }
      });
    } else {
      res.json(404, {});
    }
  });

}];

exports.report = [
passport.authenticate(['basic', 'oauth2-client-password', 'header'], {
  session: false
}),

function(req, res) {
  var queueId = req.param('queue');
  //queueId is rawrequest
  generateSentFailedReport(queueId, res);
}];


function generateSentFailedReport(queueId, res) {
  logger("result:" + queueId);
  models.EmailQueue.findOne({
    "rawrequest": queueId
  }).exec(function(err, data) {
    if (data) {
      models.EmailJob.count({
        "queue": data._id
      }, function(err, dataTotal) {
        logger("queueId:" + queueId);
        logger("dataTotal:" + dataTotal);
        logger("err:" + err);
        logger("data._id:" + data._id);
        if (dataTotal) {
          //sent total
          models.EmailJob.count({
            "queue": data._id,
            "status": "sent"
          }, function(err, dataSent) {
            var result = {
              sent: dataSent,
              notSent: (dataTotal - dataSent), //calculated
              total: dataTotal
            };
            logger("result:" + result);
            return res.json(200, result);
          });
        } else {
          return res.json(500, {});
        }
      });
    } else {
      res.json(404, {});
    }
  });
}

//this is not right need to rewrite because it is should be loading status it should be raw request

function status(req, res) {
  var queues = models.EmailQueue.find({
    'status': req.param('queue')
  }).select().exec(function(err, data) {
    var body = jsonJobFormatter(data);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);
  });
}

function get(req, res) {
  console.log("doing a get");
  var queues = models.EmailQueue.findOne({
    '_id': req.param('queue')
  }).select().exec(function(err, data) {
    console.log("doing a get1");
    var body = jsonJobFormatter(data);
    console.log("doing a get2");
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);
  });
}

function jsonJobFormatter(data) {
  return JSON.stringify(data, function censor(key, values) {
    if (key == "jobs") {
      var finalValues = [];
      console.log(values);
      _.each(values, function(value, key, list) {
        value = '<a href=\'/job/' + value + '\'>' + value + '</a>';
        finalValues.push(value);
      });
      return finalValues;
    }
    return values;
  }, 4);
}