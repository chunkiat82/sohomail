var mongoose = require('mongoose')
, Schema = mongoose.Schema;

var AccessTokenSchema = new Schema({
	token: String,
	created: {type: Date, default: Date.now, expires: /* set to 5mins first, its in seconds*/ 60*5},
	user: {type: Schema.Types.ObjectId, ref:'User'},
	client: {type: Schema.Types.ObjectId, ref: 'User'}
});

var AuthorizationCode = new Schema({
	code: String,
	created: {type: Date, default: Date.now, expires: /*set it to 10min*/ 60*10},
	user: {type: Schema.Types.ObjectId, ref: 'User'},
	client: {type: Schema.Types.ObjectId, ref: 'User'}
});

exports.AccessToken = mongoose.model('AccessToken', AccessTokenSchema, 'access_token');

exports.User = mongoose.model('User', new Schema({
	email: {type: String,required: true, index: { unique: true }},
	password: {type: String, required:true},
	client: {type: Boolean, default: true}, // for now, lets make all who registers clients
	api_secret: String,
	contacts: {},
	templates: [{type: Schema.Types.ObjectId, ref: 'EmailTemplate'}]
}), 'user');