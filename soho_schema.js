var mongoose = require('mongoose')
, Schema = mongoose.Schema;

mongoose.connect('localhost', 'soho_mail');

exports.EmailJob = mongoose.model('EmailJob', new Schema({
	to:'String'
	,from:'String'
	,subject:'String'
	,status:'String'
	,dateCreated:{ type: Date, default: Date.now }
}), 'EmailJob');

exports.EmailQueue = mongoose.model('EmailQueue', new Schema({
	template:'string'
	, description:'string'
	, html:'string'
	, status:'string'
	, appName:''
	, dateCreated :{ type: Date, default: Date.now }
	, lastUpdated:{ type: Date, default: Date.now }
	, dateCompleted:{ type: Date, default: Date.now }
	, jobs:[{ type: Schema.Types.ObjectId, ref: 'EmailJob' }]
}), 'EmailQueue');

exports.EmailTemplate = mongoose.model('EmailTemplate', new Schema({
	name:'string'
	, content : 'string'
	, dateCreated :{ type: Date, default: Date.now }
}), 'EmailTemplate');


