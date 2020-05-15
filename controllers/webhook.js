'use strict';

const util 			= require('util'),
	  moment 		= require('moment'),
      ordersUtils 	= require('../lib/orders'),
      dbUtils 		= require('../lib/db'),
      PPWebhook 	= require('../schemas/ppWebhook'),
      _				= require('underscore');

function ppWebhook(req, res, next) {

	console.log(util.format('INCOMING PAYPAL WEBHOOK...\n%s', JSON.stringify(req.body, null, 2)));

	// Persist incoming webhook
	let ppWebhook = new PPWebhook({
		BODY: req.body
	});		

	ppWebhook.save();

	// Confirm that resource id exists
	if (req.body.resource && req.body.resource.id) {

		dbUtils.getOrderByOrderId({ orderId: req.body.resource.id })

		.then((record) => {

			if (record) {

				const webhookEvent = {
					RECEIVED_DATE: moment().format(),
					BODY: req.body
				};

				record.WEBHOOK.push(webhookEvent)

				record.save();

				ordersUtils.createAccessToken()

				.then((accessTokenResult) => {

					const args = {
						accessToken: accessTokenResult['access_token'],
						orderId: req.body.resource.id,
						environment: record.ENVIRONMENT
					};

					return ordersUtils.getOrder(args);

				}).then((result) => {

					res.status(200).send('OK');
					
				}).catch((err) => {

					console.log(err);

					res.status(500).send('NOK');

				});


			} else {

				console.log('INCOMING WEBHOOK ORDER NOT FOUND...');

				res.status(404).send('NOK');

			}

		}).catch((err) => {

			console.log('ERROR ON INCOMING WEBHOOK...');

			res.status(500).send('NOK');

		});
	} else {
		res.status(200).send('OK');
	}
}

module.exports = {
	ppWebhook
}