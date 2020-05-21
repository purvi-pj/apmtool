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

	const WEBHOOK_EVENT_TYPE = req.body.event_type;

	switch (WEBHOOK_EVENT_TYPE) {

		case 'CHECKOUT.ORDER.APPROVED':

			handleCheckoutOrderApprovedWebhook(req)

			.then((resp) => {

				res.status(resp.status).send(resp.content);

			}).catch ((err) => {
				res.status(err.status).send(err.content);
			});
		
			break;

		case 'PAYMENT.CAPTURE.COMPLETED':

			handlePaymentCaptureCompleted(req)

			.then((resp) => {

				res.status(resp.status).send(resp.content);

			}).catch ((err) => {
				console.log(err);
				res.status(500).send('NOK');
			});

			break;

		default:
			break;
	};
}

function handlePaymentCaptureCompleted(req) {
	return new Promise((resolve, reject) => {

		dbUtils.getOrderByCaptureId({ captureId: req.body.resource.id })

		.then((record) => {

			if (record) {

				const webhookEvent = {
					RECEIVED_DATE: moment().format(),
					BODY: req.body
				};

				record.WEBHOOK.push(webhookEvent)

				record.save();

				// ordersUtils.createAccessToken()

				// .then((accessTokenResult) => {

				// 	const args = {
				// 		accessToken: accessTokenResult['access_token'],
				// 		orderId: record.ORDER_ID,
				// 		environment: record.ENVIRONMENT
				// 	};

				// 	return ordersUtils.getOrder(args);

				// }).then((result) => {

				// 	resolve({ status: 200, content: 'OK' });
					
				// }).catch((err) => {

				// 	console.log(err);

				// 	reject({ status: 500, content: 'NOK' });

				// });

				resolve({ status: 200, content: 'OK' });

			} else {
				console.log('INCOMING WEBHOOK ORDER NOT FOUND...');
				reject({ status: 404, content: 'NOK' });
			}
		}).catch((err) => {
			console.log('ERROR ON INCOMING WEBHOOK...');
			reject({ status: 500, content: 'NOK' });
		});		
	});	
}

function handleCheckoutOrderApprovedWebhook(req) {
	return new Promise((resolve, reject) => {

		dbUtils.getOrderByOrderId({ orderId: req.body.resource.id })

		.then((record) => {

			if (record) {

				const webhookEvent = {
					RECEIVED_DATE: moment().format(),
					BODY: req.body
				};

				record.WEBHOOK.push(webhookEvent)

				record.save();

				// ordersUtils.createAccessToken()

				// .then((accessTokenResult) => {

				// 	const args = {
				// 		accessToken: accessTokenResult['access_token'],
				// 		orderId: req.body.resource.id,
				// 		environment: record.ENVIRONMENT
				// 	};

				// 	return ordersUtils.getOrder(args);

				// }).then((result) => {

				// 	resolve({ status: 200, content: 'OK' });
					
				// }).catch((err) => {

				// 	console.log(err);

				// 	reject({ status: 500, content: 'NOK' });

				// });

				resolve({ status: 200, content: 'OK' });

			} else {
				console.log('INCOMING WEBHOOK ORDER NOT FOUND...');
				reject({ status: 404, content: 'NOK' });
			}
		}).catch((err) => {
			console.log('ERROR ON INCOMING WEBHOOK...');
			reject({ status: 500, content: 'NOK' });
		});		
	});
}

module.exports = {
	ppWebhook
}