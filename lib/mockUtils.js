'use strict';

const util 		= require('util'), 
	  request	= require('request');

function sendMockWebhook(orderId) {

	const MOCK_CHECKOUT_ORDER_APPROVED_WEBHOOK = {
	    "id": orderId,
	    "url": "https://example.com/example_webhook",
	    "event_types": [{
	        "name": "CHECKOUT.ORDER.APPROVED",
	        "description": "An order has been approved by buyer."
	    }],
	    "links": [{
	            "href": util.format("https://api.sandbox.paypal.com/v1/notifications/webhooks/%s", orderId),
	            "rel": "self",
	            "method": "GET"
	        },
	        {
	            "href": util.format("https://api.sandbox.paypal.com/v1/notifications/webhooks/%s", orderId),
	            "rel": "update",
	            "method": "PATCH"
	        },
	        {
	            "href": util.format("https://api.sandbox.paypal.com/v1/notifications/webhooks/%s", orderId),
	            "rel": "delete",
	            "method": "DELETE"
	        }
	    ]
	};

	const options = {
		method: 'POST',
		url: process.env.PP_MOCK_WEBHOOK_URL,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
		body: MOCK_CHECKOUT_ORDER_APPROVED_WEBHOOK
	};

	console.log('SENDING MOCK `CHECKOUT_ORDER_APPROVED` WEBHOOK...');

	request(options, function (error, response, body) {

		if (error) {
			console.log(error);
		} else {
			console.log(util.format('WEBHOOK SENT, RESPONSE...`%s`', body));
		}

	});



}

module.exports = {
	sendMockWebhook
}