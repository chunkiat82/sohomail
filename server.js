var express = require('express');
var app = express();
var nodemailer = require("nodemailer");
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var url = require('url') ;

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
});

connection.connect();

connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].solution);
});



app.get('/db', function(req, res){
  var db = mongoose.createConnection('localhost', 'test');

  var schema = mongoose.Schema({ name: 'string' });
  var Cat = db.model('Cat', schema);

  var kitty = new Cat({ name: 'Zildjian' });
  kitty.save(function (err) {
  if (err) // ...
    console.log('meow');
  });
  var body = 'Hello World';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

app.get('/api/send/:to/:from/:subject/:text', function(req,res){
  console.log(req.params);
  var body = "Hello World";
  //var queryObject = url.parse(req.url,true).query;
  //body = queryObject;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

app.get('/hello', function(req, res){
  var body = 'Hello World';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});
app.get('/hello/:txt', function(req, res) {
  //res.send({id:req.params.txt, name: "The Name", description: "description"});

  var nodemailer = require("nodemailer");
  var body = 'Hello '+req.params.txt;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});


app.get('/email/:txt', function(req, res) {
  var transport = nodemailer.createTransport("SMTP", {
    host: "smtp.gmail.com", // hostname
    secureConnection: true, // use SSL
    port: 465, // port for secure SMTP
    auth: {
        user: "business@soho.sg",
        pass: "82hck007"
    }
  });

  transport.sendMail({
    from: "raymond@soho.sg",
    to: "business@soho.sg",
    subject: "Hello", // Subject line
    text: "Hello world", // plaintext body
    html: "<b>Hello world ✔</b>" // html body
  });
  var body = 'Hello '+req.params.txt;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

app.listen(3000);
console.log('Listening on port 3000');
