'use strict';

const dbUtils 		= require('../lib/db'),
	  util 			= require('util'),
      _				= require('underscore');

function loadRecent(req, res, next) {

	dbUtils.getRecentOrders({ limit: 10 })

	.then((records) => {

		records.forEach((element) => {
			element = convertRecordForDisplay(element);			
		})


		res.render("history", { records, user: req.user });

	});
}

function loadRecord(req, res, next) {

	if (req.body.orderId) {

		dbUtils.getOrderByOrderId({ orderId: req.body.orderId })

		.then((record) => {

			record = convertRecordForDisplay(record);			

			const records = [ record ];

			res.render("history", { records, orderId: req.body.orderId });

		}).catch((err) => {

			const records = [{ORDER_ID: 'NOT FOUND'}];

			res.render("history", { records, orderId: req.body.orderId, user: req.user });		

		});
	} else {
		loadRecent(req, res, next);
	}
}

function convertRecordForDisplay (record) {

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

	// Add JSON stringified versions of requests/responses with pretty print indentations
	record.SUMMARYJSON = JSON.stringify(summary, null, 2);
	record.CREATE_ORDER_API.REQUESTJSON = JSON.stringify(record.CREATE_ORDER_API.REQUEST, null, 2);
	record.CREATE_ORDER_API.RESPONSEJSON = JSON.stringify(record.CREATE_ORDER_API.RESPONSE, null, 2);
	record.CONFIRM_PAYMENT_SOURCE_API.REQUESTJSON = JSON.stringify(record.CONFIRM_PAYMENT_SOURCE_API.REQUEST, null, 2);
	record.CONFIRM_PAYMENT_SOURCE_API.RESPONSEJSON = JSON.stringify(record.CONFIRM_PAYMENT_SOURCE_API.RESPONSE, null, 2);	
	record.GET_ORDER_API.REQUESTJSON = JSON.stringify(record.GET_ORDER_API.REQUEST, null, 2);
	record.GET_ORDER_API.RESPONSEJSON = JSON.stringify(record.GET_ORDER_API.RESPONSE, null, 2);			
	record.CAPTURE_ORDER_API.REQUESTJSON = JSON.stringify(record.CAPTURE_ORDER_API.REQUEST, null, 2);
	record.CAPTURE_ORDER_API.RESPONSEJSON = JSON.stringify(record.CAPTURE_ORDER_API.RESPONSE, null, 2);	

	return record;	
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
	loadRecent,
	loadRecord
}