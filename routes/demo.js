var models = require('../models');
exports.getTemplate= function(req, res){
	
  res.render('template', {
        //Local Variables for this view
        title: 'Template Creation Page'
  });
};

exports.post = function(req, res){
  var params = req.body;
  console.log(req.body);

  res.render('template', {
        //Local Variables for this view
        title: 'Template Creation Page'
        ,message: 'Template created with '+ JSON.stringify(params)
  });
};

exports.getEmail= function(req, res){
  
  res.render('email', {
        //Local Variables for this view
        title: 'Template Creation Page'
  });
};