'use strict';

const util 			= require('util'),
      ordersUtils 	= require('../lib/orders'),
      _				= require('underscore');

function ppWebhook(req, res, next) {

	console.log(util.format('INCOMING PAYPAL WEBHOOK...\n%s', JSON.stringify(req.body, null, 2)));

	// Trigger get order to retrieve latest status
	// Retrieve get order URL from webhook
	const selfLink = _.findWhere(req.body.links, { rel: 'self' }).href;

	ordersUtils.createAccessToken()

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.getOrder(args);

	}).then((result) => {

		console.log(JSON.stringify(result, null, 2));

		res.json(result);
		
	}).catch((err) => {

		console.log(err);

		res.json(err);

	});



	res.status(200).send('OK');
}

module.exports = {
	ppWebhook
}