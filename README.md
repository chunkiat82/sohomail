##Simple Mail Application to send emails out

###8 March
adding oauth2
adding registration under /signup
adding login under /login
adding logout under /logout
cahgning POST /emails to POST /jobs

####To try out
go to /signup and signup for an account
login with the emai land password
request for a secret key
example POST http://clientId:clientSecret@[host]/templates with name and body will create a template with a unique id
all the rest below are same as above for the clientid and clientsecret
GET /templates will return to you the templates you own
GET /templates/:id will return to you the template you created under that id


###18 Nov
* Added express and a simple restful call

###Links
* https://github.com/niftylettuce/node-email-templates
* https://github.com/andris9/nodemailer

###Scripts & Config
####startMongo.sh
mongod run --config /usr/local/etc/mongod.conf

####Mongo.conf
*#Store data in /usr/local/var/mongodb instead of the default /data/db*

dbpath = /usr/local/var/mongodb

*# Only accept local connections*

bind_ip = 127.0.0.1

