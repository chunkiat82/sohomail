var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport("SMTP",{
	host:"soho.sg"
    ,secureConnection:true
    ,port:465
    ,auth: {
        user: "test@sporemail.com",
        pass: "1q2w3e4r%T"
    }
});
exports.sendMail = function(data){
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
	//console.log(mailOptions);
	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
	        console.log("error=");
	        console.log(error);
	        console.log(mailOptions);
	    }else{
	        console.log("Message sent("+to+"): " + response.message);
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    // // shut down the connection pool, no more messages
	});
	//smtpTransport.close();
};
