var passport = require("passport"),
		User = require("./models/user.js").User,
		LocalStrategy = require('passport-local').Strategy,
		BasicStrategy = require('passport-http').BasicStrategy,
		ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,
		BearerStrategy = require('passport-http-bearer').Strategy,
    HeaderStrategy = require("./header_strategy.js").Strategy,
		AccessToken = require("./models/user.js").AccessToken;


// alot of these taken from the oauth2orize examples
passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log(username, password);
    User.findOne({email: username}, function(err, user) {

      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (user.password != password) { return done(null, false); }
      console.log(user);
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({_id: id}, function (err, user) {
    done(err, user);
  });
});
/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */

passport.use(new BasicStrategy(
  function(clientId, clientSecret, done) {
    User.findOne({_id: clientId, client: true}, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.api_secret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
  	User.findOne({_id: clientId, client: true}, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.api_secret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new HeaderStrategy(
  function(clientId, clientSecret, done) {
    User.findOne({_id: clientId, client: true}, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.api_secret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function(accessToken, done) {
    AccessToken
    	.findOne({token: accessToken})
    	.populate('user')
    	.exec(function(err, token) {
	      if (err) { return done(err); }
	      if (!token) { return done(null, false); }
	      if (!token.user) {return done(null, false);}
	      var info = {scope: '*'};
	      done(null, token.user, info);
	    });
  }));