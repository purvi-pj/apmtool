var createError = require('http-errors');
var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var path = require('path');
var adaro = require('adaro');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var flash = require('connect-flash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var dbUtils = require('./lib/db');

require('dotenv').config();

passport.use(new Strategy(
	function(username, password, cb) {
		dbUtils.verifyPassword({username, password})

		.then((user) => {
			cb(null, user);
		}).catch((err) => {
			cb(null, false);
		});
	}));

passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});

passport.deserializeUser(function(id, cb) {

	dbUtils.findUserById({ id })	

	.then((user) => {
		cb(null, user);
	}).catch((err) => {
		cb(err);
	});

  // db.users.findById(id, function (err, user) {
  //   if (err) { return cb(err); }
  //   cb(null, user);
  // });
});

var app = express();

app.use(require('express-session')({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

// view engine setup
app.engine('dust', adaro.dust());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'dust');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

mongoose.connect(process.env.MONGO_ATLAS_URI, {useNewUrlParser: true, ssl: true, sslValidate: false});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('db connected...');
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
