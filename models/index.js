var mongoose = require('mongoose')
, Schema = mongoose.Schema;

exports.EmailRawRequest = mongoose.model('EmailRawRequest', new Schema({
	tos: [String]
	,from: String
	,subject: String
	,templateName: String
	,content: String
	,statusUpdateURL: String
	, owner: {type: Schema.Types.ObjectId, ref: 'User'}
	, queue: {type:Schema.Types.ObjectId, ref: 'EmailQueue'}
}), 'email_raw_request');

exports.EmailJob = mongoose.model('EmailJob', new Schema({
	to: String
	,from: String
	,subject: String
	,status:{type: String, enum: ['created', 'sent', 'failed']}
	,dateCreated:{ type: Date, default: Date.now }
	, owner: {type: Schema.Types.ObjectId, ref: 'User'}
}), 'email_job');

exports.EmailQueue = mongoose.model('EmailQueue', new Schema({
	template: String
	, tos: [String]
	, subject: String
	, from: String
	, content: String
	,statusUpdateURL: String
	, description: String
	, html: String
	, status:{type: String, enum: ['active', 'complete', 'error']}
	, appName:''
	, dateCreated :{ type: Date, default: Date.now }
	, lastUpdated:{ type: Date, default: Date.now }
	, dateCompleted:{ type: Date, default: Date.now }
	, jobs:[{ type: Schema.Types.ObjectId, ref: 'EmailJob' }]
	, rawrequest: {type:Schema.Types.ObjectId, ref: 'EmailRawRequest'}
	, owner: {type: Schema.Types.ObjectId, ref: 'User'}
}), 'email_queue');

exports.EmailTemplate = mongoose.model('EmailTemplate', new Schema({
	name:String
	, content : String
	, compiled : String
	, dateCreated :{ type: Date, default: Date.now }
	, owner: {type: Schema.Types.ObjectId, ref: 'User'}
}), 'email_template');


