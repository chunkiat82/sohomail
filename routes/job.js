
var models = require('../models'),
    passport = require("passport");

exports.list = [
  passport.authenticate(['basic', 'oauth2-client-password', 'header'], { session: false }),
  function(req, res){
		models.EmailQueue.find({owner:req.user._id}, "status rawrequest").lean(true).exec(function(err, data){
      if ( err ) {
        return res.json(500, err);
      }
      models.EmailRawRequest.find({owner:req.user._id}, "_id").lean(true).exec(function(err, raw) {
        if ( err ) {
          return res.json(500, err);
        }
        data.map(function(d){
          d._id = d.rawrequest;
          delete d.rawrequest;
          return d;
        });
        raw.map(function(r){
          r.status = "processing";
          return r;
        });
        Array.prototype.push.apply(raw, data)
        res.json(raw);
      });
  	});
  }
]
exports.get = [
  passport.authenticate(['basic', 'oauth2-client-password', 'header'], { session: false }),
  function(req, res){
    models.EmailQueue.find({owner:req.user._id, _id:req.param('id')}, "tos from subject content template").lean(true).exec(function(err, data){
      if ( err ) {
        return res.json(500, err);
      }
      if ( !data ) {
        return models.EmailRawRequest.find({owner:req.user._id}, "-_id").lean(true).exec(function(err, raw) {
          if ( err ) {
            return res.json(500, err);
          }
          if ( !data ) {
            return res.json(404, {});
          }
          res.json(raw);
        });
      }
      res.json(data);
    });
  }
]