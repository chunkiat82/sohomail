var models = require('../models'),
    passport = require("passport"),
    login = require('connect-ensure-login');

exports.login = passport.authenticate('local', {
    successReturnToOrRedirect: '/', failureRedirect: '/login'
  });

exports.account = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render('account', { user: req.user });
  }
];

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
}

exports.loginForm = function(req, res) {
  res.render('login');
};
