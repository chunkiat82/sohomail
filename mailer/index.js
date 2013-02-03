var nodemailer = require("nodemailer");
exports.sendMail = function(data){
	var smtpTransport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: "test@soho.sg",
	        pass: "1q2w3e4r%T"
	    }
	});
	
	// setup e-mail data with unicode symbols

	var to = data.to;
	var from = data.from;
	var subject = data.title || data.subject || "";
	var html= data.html || "";
	var mailOptions = {
	    from: from, // sender address
	    to: to, // list of receivers
	    subject:subject, // Subject line
	    html: html // html body
	}
	console.log(mailOptions);
	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
	        console.log(error);
	    }else{
	        console.log("Message sent: " + response.message);
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    //smtpTransport.close(); // shut down the connection pool, no more messages
	});
};