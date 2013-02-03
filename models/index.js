var mongoose = require('mongoose')
, Schema = mongoose.Schema;

mongoose.connect('localhost', 'soho_mail');

exports.EmailJob = mongoose.model('EmailJob', new Schema({
	to: String
	,from: String
	,subject: String
	,status:{type: String, enum: ['created', 'sent', 'failed']}
	,dateCreated:{ type: Date, default: Date.now }
}), 'email_job');

exports.EmailQueue = mongoose.model('EmailQueue', new Schema({
	template: String
	, description: String
	, html: String
	, status:{type: String, enum: ['active', 'inactive', 'error']}
	, appName:''
	, dateCreated :{ type: Date, default: Date.now }
	, lastUpdated:{ type: Date, default: Date.now }
	, dateCompleted:{ type: Date, default: Date.now }
	, jobs:[{ type: Schema.Types.ObjectId, ref: 'EmailJob' }]
}), 'email_queue');

exports.EmailTemplate = mongoose.model('EmailTemplate', new Schema({
	name:String
	, content : String
	, compiled : String
	, dateCreated :{ type: Date, default: Date.now }
}), 'email_template');


