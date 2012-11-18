##Simple Mail Application to send emails out

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

