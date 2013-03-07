var User = require('../models/user').User,
		login = require('connect-ensure-login');
exports.signupForm = function(req, res){
	res.render('signup');
}

exports.signup = function(req, res){
	var user = new User({email:req.body.email, password: req.body.password});
	user.save(function(err){
		if ( err ) {
			console.log(err);
			req.flash('error in creating user: '+err);
			return res.render('signup');
		}
		res.redirect('/login');
	})
}

exports.create_secret = [
	login.ensureLoggedIn(),
	function(req, res){
		User.findOne({_id: req.user._id}, function(err, user){
			if ( err ) {
				req.flash("failed to create, try again");
				return res.redirect('/me');
			}
			user.api_secret = require("node-uuid").v4();
			user.save(function(err){
				if ( err) {
					req.flash("failed to create, try again");
					return res.redirect('/me');
				}
				res.redirect('/me');
			});
		});
	}
]