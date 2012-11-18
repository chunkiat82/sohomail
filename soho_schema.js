var mongoose = require('mongoose')
, Schema = mongoose.Schema;

mongoose.connect('localhost', 'nodesohomail');

exports.EmailJob = mongoose.model('EmailJob', new Schema({
	to:'String'
	,from:'String'
	,subject:'String'
	,status:'String'
}), 'EmailJob');

exports.EmailQueue = mongoose.model('EmailQueue', new Schema({
	template:'string'
	, description:'string'
	, html:'string'
	, status:'string'
	, dateCreated :'date'
	, lastUpdated:'date'
	, dateCompleted:'date'
	, jobs:[{ type: Schema.Types.ObjectId, ref: 'EmailJob' }]
}), 'EmailQueue');



