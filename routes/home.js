var models = require('../models');
exports.get = function(req, res){
	res.locals.session = req.session;

	var queues = models.EmailQueue.find().select().exec(function(err, data){
        res.render('index', { title: 'Mail @ SOHO', queues:data});
    }, '');
  	
};