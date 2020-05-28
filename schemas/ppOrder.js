'use strict';

const mongoose = require('mongoose');

let ppOrder = function() {

	const ppOrderSchema = mongoose.Schema({
		INSERTION_DATE: { type: Date, default: Date.now },
		ENVIRONMENT: String,
		CLIENT_TYPE: String,
		CLIENT_ID: String,
		ORDER_ID: String,
		PAYMENT_SCHEME: String,
		STATUS: String,
		BUYER_NAME: String,
		BUYER_EMAIL: String,
		BUYER_COUNTRY: String,
		AMOUNT: String,
		CURRENCY: String,
		CREATE_ORDER_API: mongoose.Schema.Types.Mixed,
		CONFIRM_PAYMENT_SOURCE_API: { type: mongoose.Schema.Types.Mixed, default: {} },
		// {
		// 	REQUEST: mongoose.Schema.Types.Mixed,
		// 	RESPONSE: mongoose.Schema.Types.Mixed,
		// 	CORRELATION_ID: String
		// }
		GET_ORDER_API: { type: mongoose.Schema.Types.Mixed, default: {} },
		CAPTURE_ORDER_API: { type: mongoose.Schema.Types.Mixed, default: {} },
		WEBHOOK: [mongoose.Schema.Types.Mixed]
	});

	return mongoose.model('pp_order', ppOrderSchema);
	
}

module.exports = new ppOrder();