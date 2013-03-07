var models = require('../models');
var dust = require('dustjs-linkedin')
  , cons = require('consolidate'),
    passport = require('passport');

exports.list = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  function(req, res){
    models.EmailTemplate.find({
        _id: {
          $in: req.user.templates
        }
      }, "name", function(err, templates) {
        if ( err ) {
          res.json(500, {});
        }
        res.json(templates);
      });
  }
]

exports.get = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  function(req, res){
    models.EmailTemplate.findOne({'_id':req.param('id'), owner: req.user._id}, function(err, data){
      if ( err ) {
        return res.json(500, {});
      }
      if(!data) {
        return res.json(404, {});
      }
      res.json(data);
    });
  }
]

exports.post = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  function(req, res){
    var name = req.body.name,
        content = req.body.content,
        compiled = dust.compile(content, name),
        template = new models.EmailTemplate({name: name, content: content, compiled: compiled, owner:req.user._id});

    template.save(function(err) {
      if ( err) {
        return res.json(400, err); // fix this to make it less with server information
      }
      res.json(200,{id: template._id});
    });
  }
]