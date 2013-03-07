var requireDir = require('require-dir'),
    express = require('express'),
	app = express(),
    _ = require("underscore"),
    mail = require('./mailer'),
    models = require('./models'),
    routes = requireDir('./routes'),
    crud = require('crud'),
    dust = require('dustjs-linkedin'),
	cons = require('consolidate'),
    MongoStore = require('connect-mongo')(express),
    passport = require('passport'),
    auth = require("./auth"),
    oauthserver = require('./oauthserver');

require("mongoose").connect('localhost', 'soho_mail');

// assign the dust engine to .dust files
app.engine('dust', cons.dust);
app.configure(function(){
    app.set('port', process.env.SOHOMAILPORT || 3001);
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
    app.use(require('flashify'));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
 });

dust.makeBase({
    copy: '&copy; 2011 Nobody LLC'
});

//ACTION
app.get('/', routes.home.get);
// app.post('/email', routes.email.post);

//CRUD queue
app.get('/queues', routes.queue.list);
app.get('/queue/:queue', routes.queue.get);

//CRUD jobs
app.get('/jobs',routes.job.list);
app.get('/jobs/:id',routes.job.get);
app.post('/jobs', routes.email.post);

app.get('/templates',routes.template.list);
app.get('/templates/:id',routes.template.get);
app.post('/templates',routes.template.post);

app.get('/demo/template',routes.demo.getTemplate);
app.get('/demo/email',routes.demo.getEmail);

app.get('/users/new', routes.user.signupForm);
app.get('/signup', routes.user.signupForm);
app.post('/users', routes.user.signup);

app.get('/login', routes.site.loginForm);
app.post('/login', routes.site.login);
app.get('/logout', routes.site.logout);
app.get('/me', routes.site.account);
app.post('/me/secret', routes.user.create_secret);

app.get('/oauth/auth', oauthserver.authorization);
app.post('/oauth/auth', oauthserver.decision);
app.post('/oauth/token');

console.log("Listening Port = "+app.get('port'));
app.listen(app.get('port'));
