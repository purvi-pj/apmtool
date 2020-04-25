'use strict';

const ordersUtils 	= require('../lib/orders'),
	  PPOrder 		= require('../schemas/ppOrder'),
	  dbUtils 		= require('../lib/db'),
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
		shippingPreference: req.body.shippingpreference,
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

function getOrderInternalStatus(req, res, next) {
	const orderId = req.body.orderId;

	dbUtils.getOrderStatus({ orderId })

	.then((status) => {

		if (status) {
			res.json({ STATUS: status });
		} else {
			res.json({ STATUS: 'UNKNOWN' });
		}

	}).catch((err) => {

		console.log('ERROR ON CANCEL RETURN...');

		res.json({ STATUS: 'UNKNOWN' });

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
		returnUrl: util.format('%s?token=%s', process.env.RETURN_URL, req.query.token),
		cancelUrl: util.format('%s?token=%s', process.env.CANCEL_URL, req.query.token)
	};

	res.render('mockPaymentSchemeApproval', model);
}

function handleReturn(req, res, next) {

	console.log('RETURN REDIRECT FOR `%s`', req.query.token);

	dbUtils.getOrderByOrderId({ orderId: req.query.token })

	.then((record) => {

		if (record) {
			record.STATUS = 'REDIRECT_RETURN';
			record.save();

			res.render('return');
		}

	}).catch((err) => {

		console.log('ERROR ON RETURN...');

		res.render('return');

	});

}

function handleCancel(req, res, next) {

	console.log('CANCEL REDIRECT FOR `%s`', req.query.token);

	dbUtils.getOrderByOrderId({ orderId: req.query.token })

	.then((record) => {

		if (record) {
			record.STATUS = 'CANCELLED';
			record.save();

			res.render('return');
		}

	}).catch((err) => {

		console.log('ERROR ON CANCEL RETURN...');

		res.render('return');

	});

}

module.exports = {
	startOrder,
	createOrder,
	getOrder,
	getOrderInternalStatus,
	confirmPaymentSource,
	captureOrder,
	mockApproval,
	handleReturn,
	handleCancel
};