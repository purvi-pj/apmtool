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


		res.render("history", { records });

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

			res.render("history", { records, orderId: req.body.orderId });		

		});
	} else {
		loadRecent(req, res, next);
	}
}

function convertRecordForDisplay (record) {

	// Add JSON stringified versions of requests/responses with pretty print indentations
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

module.exports = {
	loadRecent,
	loadRecord
}