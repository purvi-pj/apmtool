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
	  sandboxController 	= require('../controllers/sandbox'),
	  spbController         = require('../controllers/spb');

    // Render SPB render form
    router.get('/spb', spbController.renderButtons);
    router.post('/spb', spbController.renderButtons);

	// Render create order form
	router.get('/', launcherController.startOrder);

	// PayPal API routes
	router.post('/create', urlencodedParser, launcherController.createOrder);
	router.post('/confirm', launcherController.confirmPaymentSource);
	router.post('/getOrder', launcherController.getOrder);
	router.post('/getOrderSummary', launcherController.getOrderSummary);
	router.post('/captureOrder', launcherController.captureOrder);	

	// Retrieve internal order status
	router.post('/getOrderStatus', launcherController.getOrderInternalStatus);

	// Merchant redirect URLs (after buyer approval)
	router.get('/return', launcherController.handleReturn);
	router.get('/cancel', launcherController.handleCancel);
	router.get('/fullPageReturn', launcherController.handleFullPageReturn);
	router.get('/fullPageCancel', launcherController.handleFullPageCancel);	

	// Mock payment scheme approval page (use for mocked APIs case)
	// router.get('/mockPaymentSchemeApproval', launcherController.mockApproval);

	// Transaction history
	router.get('/history', ensureLoggedIn('/login'), historyController.loadRecent);
	router.post('/history', historyController.loadRecord);

	// Authentication for site and /history access
	router.get('/user/create', sandboxController.createUser);
	router.get('/user/validate', sandboxController.validateUser);	
	router.post('/createUser', ensureLoggedIn('/login'), launcherController.createUser);
	router.get('/admin', ensureLoggedIn('/login'), launcherController.renderAdmin);
	router.get('/login', launcherController.renderLogin);
	router.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login?error=Invalid+username+or+password', failureFlash: true   }));	
	router.get('/logout', launcherController.logout);

	// Webhooks
	router.post('/ppwebhook', webhookController.ppWebhook);
	// router.get('/mockWebhook', sandboxController.mockWebhook);

module.exports = router;
