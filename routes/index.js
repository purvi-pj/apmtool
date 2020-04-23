'use strict';

var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const launcherController 	= require('../controllers/launcher'),
	  webhookController		= require('../controllers/webhook'),
	  historyController 	= require('../controllers/history');

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

	router.post('/getOrderStatus', launcherController.getOrder);

	router.post('/captureOrder', launcherController.captureOrder);

	router.get('/mockPaymentSchemeApproval', launcherController.mockApproval);

	router.get('/return', launcherController.handleReturn);

	router.post('/ppwebhook', webhookController.ppWebhook);

	router.get('/history', historyController.loadRecent);

	router.post('/history', historyController.loadRecord);

// };

module.exports = router;
