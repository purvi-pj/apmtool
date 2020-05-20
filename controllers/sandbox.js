'use strict';

const util 			= require('util'),
      dbUtils 		= require('../lib/db'),
      mockUtils 	= require('../lib/mockUtils'),
      _				= require('underscore');

function createUser(req, res, next) {

	dbUtils.createUser({ username: 'eric', password: `paypal123`} )

	.then((result) => {
	
		res.send('OK');

	}).catch((err) => {

		res.send('USER ALREADY EXISTS');

	});

}

function validateUser(req, res, next) {

	dbUtils.validateUser({ username: 'eric', password: `abc123`} )

	.then((result) => {

		console.log(util.format('USER VALIDATED...\n%s', JSON.stringify(result, null, 2)));
	
		res.send('OK');

	}).catch((err) => {

		console.log("USER NOT VALIDATED...");

		res.send('NOK');

	});

}

function mockWebhook(req, res, next) {
	mockUtils.sendMockWebhook(req.query.token, req.query.webhook);

	res.send('OK');
}

module.exports = {
	createUser,
	validateUser,
	mockWebhook
}