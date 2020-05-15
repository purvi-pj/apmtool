'use strict';

const mongoose = require('mongoose');

let ppWebhook = function() {

	const ppWebhookSchema = mongoose.Schema({
		INSERTION_DATE: { type: Date, default: Date.now },
		BODY: { type: mongoose.Schema.Types.Mixed, default: {} }
	});

	return mongoose.model('pp_webhook', ppWebhookSchema);
	
}

module.exports = new ppWebhook();