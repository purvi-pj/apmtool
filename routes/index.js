'use strict';

var express = require('express');
var passport = require('passport');
var router = express.Router();
var bodyParser = require('body-parser');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const launcherController 	= require('../controllers/launcher'),
	  webhookController		= require('../controllers/webhook'),
	  historyController 	= require('../controllers/history'),
	  sandboxController 	= require('../controllers/sandbox');

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = function (router) {

/* GET home page. */
	// router.get('/', function(req, res, next) {
	//   res.render('index', { title: 'Express' });
	// });	

	router.get('/', launcherController.startOrder);

	router.post('/create', urlencodedParser, launcherController.createOrder);

	router.post('/confirm', launcherController.confirmPaymentSource);

	router.post('/getOrder', launcherController.getOrder);

	router.post('/getOrderStatus', launcherController.getOrderInternalStatus);

	router.post('/captureOrder', launcherController.captureOrder);

	router.get('/mockPaymentSchemeApproval', launcherController.mockApproval);

	router.get('/return', launcherController.handleReturn);

	router.get('/cancel', launcherController.handleCancel);

	router.post('/ppwebhook', webhookController.ppWebhook);

	router.get('/history', ensureLoggedIn('/login'), historyController.loadRecent);

	router.post('/history', historyController.loadRecord);

	router.get('/user/create', sandboxController.createUser);

	router.get('/user/validate', sandboxController.validateUser);

	router.get('/login', launcherController.renderLogin);

	router.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login?error=Invalid', failureFlash: true   }));

	router.get('/logout', launcherController.logout);

	router.get('/admin', ensureLoggedIn('/login'), launcherController.renderAdmin);

	router.post('/createUser', ensureLoggedIn('/login'), launcherController.createUser);

// };

module.exports = router;
