/**
 * Module dependencies.
 */
var passport = require('passport')
  , util = require('util');


/**
 * `ClientPasswordStrategy` constructor.
 *
 * @api protected
 */
function Strategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  if (!verify) throw new Error('Header strategy requires a verify function');
  
  passport.Strategy.call(this);
  this.name = 'header';
  this._verify = verify;
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on client credentials in the request body.
 *
 * @param {Object} req
 * @api protected
 */

Strategy.prototype.authenticate = function(req) {
  console.log(req.headers);
  var auth = req.headers['authorization'].trim().split(" ");
  if ( auth.length != 2 ) {
    return this.fail();
  }
  


  var clientId = auth[0];
  var clientSecret = auth[1];
  
  var self = this;
  
  function verified(err, client, info) {
    if (err) { return self.error(err); }
    if (!client) { return self.fail(); }
    self.success(client, info);
  }
  
  this._verify(clientId, clientSecret, verified);
}


/**
 * Expose `Strategy`.
 */ 
module.exports.Strategy = Strategy;