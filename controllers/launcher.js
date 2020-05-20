'use strict';

const ordersUtils 		= require('../lib/orders'),
	  PPOrder 			= require('../schemas/ppOrder'),
	  dbUtils 			= require('../lib/db'),
	  mockUtils 		= require('../lib/mockUtils'),
	  paymentObjects 	= require('../config/paymentObjects'),
	  util 				= require('util');

function startOrder(req, res, next) {

	console.log(JSON.stringify(req.user, null, 2));

	res.render('launcher', { user: req.user, schemesJSON: paymentObjects });

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

	if (req.body.bic) {
		args.bic = req.body.bic;
	}

	// console.log(util.format('req.body = %s', JSON.stringify(args, null, 2)));

	ordersUtils.createAccessToken({ environment: req.body.environment })

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.createOrder(args);

	}).then((result) => {

		// console.log(JSON.stringify(result, null, 2));

		res.json(result);
	}).catch((err) => {

		res.json(err);

	});

}

function getOrder(req, res, next) {

	let args = {
		environment: req.body.environment,
		orderId: req.body.orderId
	};

	ordersUtils.createAccessToken({ environment: req.body.environment })

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.getOrder(args);

	}).then((result) => {

		// console.log(JSON.stringify(result, null, 2));

		res.json(result);
	}).catch((err) => {

		res.json(err);

	});

}

function getOrderSummary(req, res, next) {

	const orderId = req.body.orderId;

	// console.log(util.format('getOrderSummary for `%s`', orderId));

	dbUtils.getOrderByOrderId({ orderId })

	.then((record) => {

		if (record) {

			// Create summary object
			let summary = {
				ORDER_ID: record.ORDER_ID,
				ORDER_CREATE_TIME: record.CREATE_ORDER_API.RESPONSE.create_time,
				PAYMENT_SCHEME: record.PAYMENT_SCHEME,
				STATUS: record.STATUS,
				ENVIRONMENT: record.ENVIRONMENT,
				CLIENT_ID: maskValue(record.CLIENT_ID),
				BUYER_NAME: record.BUYER_NAME,
				BUYER_EMAIL: record.BUYER_EMAIL,
				BUYER_COUNTRY: record.BUYER_COUNTRY,
				AMOUNT: record.AMOUNT,
				CURRENCY: record.CURRENCY,
				CORRELATION_IDS: [record.CREATE_ORDER_API.CORRELATION_ID]
			};

			if (record.CONFIRM_PAYMENT_SOURCE_API.CORRELATION_ID) {
				summary.CORRELATION_IDS.push(record.CONFIRM_PAYMENT_SOURCE_API.CORRELATION_ID);
			}

			if (record.CAPTURE_ORDER_API.CORRELATION_ID) {
				summary.CORRELATION_IDS.push(record.CAPTURE_ORDER_API.CORRELATION_ID);
			}

			res.json(summary);

		} else {
			res.json({});
		}
	}).catch((err) => {
		res.json({});
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
		environment: req.body.environment,
		orderId: req.body.orderId,
		name: req.body.name,
		emailAddress: req.body.email,
		phoneNumber: req.body.phonenumber,
		currency: req.body.currency,
		amount: req.body.amount,
		countryCode: req.body.countrycode,
		scheme: req.body.paymentscheme,
		bic: req.body.bic,
		returnUrl: process.env.RETURN_URL,
		cancelUrl: process.env.CANCEL_URL
	};

	ordersUtils.createAccessToken({ environment: req.body.environment })

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.confirmPaymentSource(args);

	}).then((result) => {

		// console.log(JSON.stringify(result, null, 2));

		res.json(result);
	});	

}

function captureOrder(req, res, next) {

	let args = {
		orderId: req.body.orderId
	};

	ordersUtils.createAccessToken({ environment: req.body.environment })

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.captureOrder(args);

	}).then((result) => {

		// console.log(JSON.stringify(result, null, 2));

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

			// TODO: remove stubbed logic
			// mockUtils.sendMockWebhook(req.query.token);

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

function renderLogin(req, res, next) {

	res.render('login', { error: req.query.error });
}

function logout(req, res, next) {
	  req.logout();
	  res.redirect('/');
}

function renderAdmin(req, res, next) {
	res.render('admin');
}

function createUser(req, res, next) {
	dbUtils.createUser({ username: req.body.username, password: req.body.password })

	.then((user) => {

		res.redirect('/history');

	}).catch((err) => {
		res.redirect('/login?error=Create+user+error');
	});
}

function maskValue (value) {
	if (value && value.length > 4) {
		const last4 = value.substring(value.length -4);

		return util.format('%s%s', value.substring(0, value.length - 4).replace(/[a-zA-Z0-9]/g, "*"), last4);
	} else {
		return 'N/A';
	}
}

module.exports = {
	startOrder,
	createOrder,
	getOrder,
	getOrderSummary,
	getOrderInternalStatus,
	confirmPaymentSource,
	captureOrder,
	mockApproval,
	handleReturn,
	handleCancel,
	renderLogin,
	renderAdmin,
	createUser,
	logout
};