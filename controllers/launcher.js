'use strict';

const ordersUtils 	= require('../lib/orders'),
	  PPOrder 		= require('../schemas/ppOrder'),
	  util 			= require('util');

function startOrder(req, res, next) {

	// ordersUtils.createAccessToken({})

	// .then((result) => {

	// 	console.log(JSON.stringify(result, null, 2));

	// 	res.render('launcher', {});

	// });

	res.render('launcher', {});

}

function createOrder(req, res, next) {

	let args = {
		environment: req.body.environment,
		name: req.body.name,
		emailAddress: req.body.email,
		phoneNumber: req.body.phonenumber,
		currency: req.body.currency,
		amount: req.body.amount,
		countryCode: req.body.countrycode,
		scheme: req.body.paymentscheme,
		returnUrl: process.env.RETURN_URL,
		cancelUrl: process.env.CANCEL_URL
	};

	console.log(util.format('req.body = %s', JSON.stringify(args, null, 2)));

	ordersUtils.createAccessToken()

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.createOrder(args);

	}).then((result) => {

		console.log(JSON.stringify(result, null, 2));

		res.json(result);
	}).catch((err) => {

		console.log(err);

		res.json(err);

	});

}

function getOrder(req, res, next) {

	let args = {
		orderId: req.body.orderId
	};

	ordersUtils.createAccessToken()

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.getOrder(args);

	}).then((result) => {

		console.log(JSON.stringify(result, null, 2));

		res.json(result);
	});

}

function confirmPaymentSource(req, res, next) {

	let args = {
		orderId: req.body.orderId,
		name: req.body.name,
		emailAddress: req.body.email,
		phoneNumber: req.body.phonenumber,
		currency: req.body.currency,
		amount: req.body.amount,
		countryCode: req.body.countrycode,
		scheme: req.body.paymentscheme,
		returnUrl: process.env.RETURN_URL,
		cancelUrl: process.env.CANCEL_URL
	};

	ordersUtils.createAccessToken()

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.confirmPaymentSource(args);

	}).then((result) => {

		console.log(JSON.stringify(result, null, 2));

		res.json(result);
	});	

}

function captureOrder(req, res, next) {

	let args = {
		orderId: req.body.orderId
	};

	ordersUtils.createAccessToken()

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.captureOrder(args);

	}).then((result) => {

		console.log(JSON.stringify(result, null, 2));

		res.json(result);
	}).catch((err) => {
		console.log(util.format('ERR = %s', JSON.stringify(err, null, 2)));
	});	

}

function mockApproval(req, res, next) {

	const model = {
		// returnUrl: req.query.returnUrl,
		// cancelUrl: req.query.cancelUrl
		returnUrl: process.env.RETURN_URL,
		cancelUrl: process.env.CANCEL_URL
	};

	res.render('mockPaymentSchemeApproval', model);
}

function handleReturn(req, res, next) {
	res.render('return');
}

module.exports = {
	startOrder,
	createOrder,
	getOrder,
	confirmPaymentSource,
	captureOrder,
	mockApproval,
	handleReturn
};