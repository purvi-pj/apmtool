'use strict';

const ordersUtils 		= require('../lib/orders'),
	  PPOrder 			= require('../schemas/ppOrder'),
	  dbUtils 			= require('../lib/db'),
	  mockUtils 		= require('../lib/mockUtils'),
	  paymentObjects 	= require('../config/paymentObjects'),
	  util 				= require('util');

// Render form
function startOrder(req, res, next) {

	const { environment, clientType, approvalLinkBehavior, paymentscheme, amount, currency, countrycode, bic, name, email } = req.query;

	const prefillValue = {
		environment: environment || 'SANDBOX',
		clientType: clientType || 'WEBHOOK_CLIENT',
		approvalLinkBehavior: approvalLinkBehavior || 'POPUP',
		paymentscheme: paymentscheme || 'ideal',
		amount: amount || '1.00',
		currency: currency || 'EUR',
		countrycode: countrycode || 'NL',
		bic: bic || '',
		name: name || 'Test User',
		email: email || 'test@test.com'
	};

	const stageRadio = process.env.NODE_ENV === 'development';
	res.render('launcher', { user: req.user, schemesJSON: paymentObjects, prefillValue, stageRadio });

}

// Create Order
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
		clientType: req.body.clientType,
		returnUrl: process.env.RETURN_URL,
		cancelUrl: process.env.CANCEL_URL,
		metadataId: req.body.metadataId
	};

	if (req.body.bic) {
		args.bic = req.body.bic;
	}

	if (req.body.customClientId) {
		args.customClientId = req.body.customClientId;
		args.customClientSecret = req.body.customClientSecret;
	}

  ordersUtils.createAccessToken({
    environment: req.body.environment,
    clientType: req.body.clientType,
    scheme: args.scheme,
    customClientId: req.body.customClientId,
    customClientSecret: req.body.customClientSecret
  })

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.createOrder(args);

	}).then((result) => {

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

  ordersUtils.createAccessToken({
    environment: req.body.environment, 
    clientType: req.body.clientType,
    scheme: req.body.paymentscheme,
    customClientId: req.body.customClientId,
    customClientSecret: req.body.customClientSecret
  })

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.getOrder(args);

	}).then((result) => {

		res.json(result);

	}).catch((err) => {

		res.json(err);

	});
}

// Construct order summary JSON for UI display
function getOrderSummary(req, res, next) {

	const orderId = req.body.orderId;

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
				CLIENT_TYPE: record.CLIENT_TYPE,
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
    expiresInDays: req.body.expiresInDays,
    taxid: req.body.taxid,
    taxid_type: req.body.taxid_type,
    address_line_1: req.body.address_line_1,
    address_line_2: req.body.address_line_2,
    admin_area_1: req.body.admin_area_1,
    admin_area_2: req.body.admin_area_2,
    postal_code: req.body.postal_code,
		amount: req.body.amount,
		countryCode: req.body.countrycode,
		scheme: req.body.paymentscheme,
		bic: req.body.bic,
		returnUrl: req.body.approvalLinkBehavior == 'POPUP' ? process.env.RETURN_URL : process.env.FULL_PAGE_RETURN_URL,
		cancelUrl: req.body.approvalLinkBehavior == 'POPUP' ? process.env.CANCEL_URL : process.env.FULL_PAGE_CANCEL_URL
	};

  ordersUtils.createAccessToken({
    environment: req.body.environment,
    clientType: req.body.clientType,
    scheme: req.body.paymentscheme,
    customClientId: req.body.customClientId,
    customClientSecret: req.body.customClientSecret
  })

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.confirmPaymentSource(args);

	}).then((result) => {

		res.json(result);
	});	

}

function captureOrder(req, res, next) {

	let args = {
		orderId: req.body.orderId
	};

	ordersUtils.createAccessToken({ 
		environment: req.body.environment, 
		clientType: req.body.clientType,
    	customClientId: req.body.customClientId,
    	customClientSecret: req.body.customClientSecret,
		scheme: req.body.paymentscheme,
	})

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.captureOrder(args);

	}).then((result) => {

		res.json(result);
	}).catch((err) => {
		console.log(util.format('ERR = %s', JSON.stringify(err, null, 2)));
	});	

}

// function mockApproval(req, res, next) {

// 	const model = {
// 		returnUrl: util.format('%s?token=%s', process.env.RETURN_URL, req.query.token),
// 		cancelUrl: util.format('%s?token=%s', process.env.CANCEL_URL, req.query.token)
// 	};

// 	res.render('mockPaymentSchemeApproval', model);
// }

function handleReturn(req, res, next) {

	console.log('RETURN REDIRECT FOR `%s`', req.query.token);

	dbUtils.getOrderByOrderId({ orderId: req.query.token })

	.then((record) => {

		if (record) {

			// set internal order status only if STATUS is PAYER_ACTION_REQUIRED (prevent overwriting statues on multiple returns)
			if (record.STATUS == 'PAYER_ACTION_REQUIRED') {
				record.STATUS = 'REDIRECT_RETURN';
				record.save();
			}

			res.render('return');
		}

	}).catch((err) => {

		console.log('ERROR ON RETURN...');

		res.render('return');

	});

}

function handleFullPageReturn(req, res, next) {

	console.log('FULL PAGE RETURN REDIRECT FOR `%s`', req.query.token);

	dbUtils.getOrderByOrderId({ orderId: req.query.token })

	.then((record) => {

		if (record) {

			// set internal order status only if STATUS is PAYER_ACTION_REQUIRED (prevent overwriting statues on multiple returns)
			if (record.STATUS == 'PAYER_ACTION_REQUIRED') {
				record.STATUS = 'FULL_PAGE_REDIRECT_RETURN';
				record.save();
			}

			res.render('fullPageReturn', { order: record });
		}

	}).catch((err) => {

		console.log('ERROR ON FULL PAGE RETURN...');

		res.render('fullPageReturn', { });

	});

}

function handleCancel(req, res, next) {

	console.log('CANCEL REDIRECT FOR `%s`', req.query.token);

	dbUtils.getOrderByOrderId({ orderId: req.query.token })

	.then((record) => {

		if (record) {

			// set internal order status only if STATUS is PAYER_ACTION_REQUIRED (prevent overwriting statues on multiple returns)
			if (record.STATUS == 'PAYER_ACTION_REQUIRED') {
				record.STATUS = 'CANCELLED';
				record.save();
			}

			res.render('return');
		}

	}).catch((err) => {

		console.log('ERROR ON CANCEL RETURN...');

		res.render('return');

	});
}

function handleFullPageCancel(req, res, next) {

	console.log('FULL PAGE CANCEL REDIRECT FOR `%s`', req.query.token);

	dbUtils.getOrderByOrderId({ orderId: req.query.token })

	.then((record) => {

		if (record) {

			// set internal order status only if STATUS is PAYER_ACTION_REQUIRED (prevent overwriting statues on multiple returns)
			if (record.STATUS == 'PAYER_ACTION_REQUIRED') {
				record.STATUS = 'FULL_PAGE_CANCELLED';
				record.save();
			}

			res.render('fullPageCancel', { order: record });
		}

	}).catch((err) => {

		console.log('ERROR ON FULL PAGE CANCEL...');

		res.render('fullPageCancel', { });

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

// Mask value for client id
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
	// mockApproval,
	handleReturn,
	handleCancel,
	handleFullPageReturn,
	handleFullPageCancel,
	renderLogin,
	renderAdmin,
	createUser,
	logout
};