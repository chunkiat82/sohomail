var requireDir = require('require-dir');
var express = require('express')
	,app = express();
var _ = require("underscore");
var mail = require('./soho_mail.js');
var models = require('./soho_schema.js');
var routes = requireDir('./routes');

var crud = require('crud');

var portNumber=3001;

var dust = require('dustjs-linkedin')
	, cons = require('consolidate');

var MongoStore = require('connect-mongo')(express);
// assign the dust engine to .dust files
app.engine('dust', cons.dust);
app.configure(function(){
    app.set('view engine', 'dust');
    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname + '/public', {redirect: false}));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
    	secret: 'foo',
    	store: new MongoStore({
      		db: 'soho_mail'
    	})
  	}));
    app.use(app.router);
 });

//ACTION
app.get('/', routes.home.get);
app.get('/email', routes.email.post);

//CRUD queue
app.get('/queue', routes.queue.list);
app.get('/queue/:id', routes.queue.get);

//CRUD jobs
app.get('/job',routes.job.list);
app.get('/job/:id',routes.job.get);


app.get('/template',routes.template.list);
app.get('/template/:id',routes.template.get);
app.post('/template',routes.template.post);

console.log("Listening Port = "+portNumber);
app.listen(portNumber);
