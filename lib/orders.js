'use strict';

const paymentObjects	= require('../config/paymentObjects.json'),
	  PPOrder 			= require('../schemas/ppOrder'),
	  dbUtils 			= require('./db'),
	  util 				= require('util'),
	  moment 			= require('moment'),
	  request			= require('request'),
	  puiUtils 			= require('./puiUtils'),
  _ = require('underscore'),
 date = require('date-and-time');
    

require('request-debug')(request);	


/**
 * Call PayPal POST `/v2/checkout/orders` API to create new order
 * @param {Object} args - Object of function arguments
 * @param {string} args.accessToken - PayPal access token to pass in API
 * @param {string} args.environment - PayPal environment to use (SANDBOX|LIVE)
 * @param {string} args.name - Buyer name
 * @param {string} args.emailAddress - Buyer email address
 * @param {string} args.phoneNumber - Buyer phone number
 * @param {string} args.currency - Order currency
 * @param {string} args.amount - Order Amount
 * @param {string} args.countryCode - Order country code    
 * @param {string} args.scheme - Order payment scheme
 * @param {string} args.clientType - Client type to create order (WEBHOOK_CLIENT | POLLING_CLIENT)
 * @param {string} args.customClientId - Custom client id (if passed in)
 * @param {string} args.customClientSecret - Custom client secret (if passed in)
 * @returns {Promise} Promise object represents the PayPal API response
 */
function createOrder(args) {
	return new Promise((resolve, reject) => {

		const { accessToken, 
				environment, 
				name, 
				emailAddress,
				phoneNumber,
				currency,
				amount,
				countryCode,
				scheme,
				clientType,
				customClientId,
				customClientSecret } = args;

		const PAYPAL_ENDPOINT = environment === 'LIVE' ? 'https://api.paypal.com' : environment === 'STAGE' ? process.env.STAGE_URL : 'https://api.sandbox.paypal.com';		

		runRequest();

		function runRequest() {

			Promise.all([constructCreateOrderPayload(args),
						 determineClientId({ environment, clientType, customClientId, customClientSecret, scheme })])

			.then(([payload, clientDetails]) => {

				const options = {
					auth: {
						bearer: accessToken
					},
					method: 'POST',
					url: util.format('%s/v2/checkout/orders', PAYPAL_ENDPOINT),
					headers: {
						'Content-Type': 'application/json',
						'Prefer': 'return=representation'
					},
					followAllRedirects: true,
					followOriginalHttpMethod: true,
					removeRefererHeader: true,
					json: true,
					body: payload
				};

				if (puiUtils.isPUI(scheme)) {
					options.headers['PAYPAL-CLIENT-METADATA-ID'] = args.metadataId;
				}
				
				// Create new order model
				let ppOrder = new PPOrder({
					ENVIRONMENT: environment,
					CLIENT_TYPE: clientType,
					CLIENT_ID:  clientDetails.clientId,
					ACCESS_TOKEN: accessToken,
					PAYMENT_SCHEME: scheme,
					BUYER_NAME: name,
					BUYER_EMAIL: emailAddress,
					BUYER_COUNTRY: countryCode,
					AMOUNT: amount,
					CURRENCY: currency,
					CREATE_ORDER_API: {
						REQUEST_URL: options.url,
						REQUEST: payload
					}
				});						

				request(options, function (error, response, body) {

					if (error) {
						reject(error);

					} else if (response.statusCode < 400) {

						// Update ppOrder object with PayPal order id
						ppOrder.ORDER_ID = body.id;
						ppOrder.STATUS = body.status;
						ppOrder.CREATE_ORDER_API.RESPONSE = body;
						ppOrder.CREATE_ORDER_API.CORRELATION_ID = response.headers['paypal-debug-id'];

						// Check if order exists in local DB before saving
						dbUtils.doesOrderExist({ orderId: body.id })

						.then((exists) => {

							if (exists) {
								reject({ ERR: util.format('ORDER ID `%s` ALREADY EXISTS...', body.id)});
							} else {

								ppOrder.save();

								resolve({ 
										  statusCode: response.statusCode, 
										  orderId: body.id, 
										  request: payload, 
										  response: body, 
										  correlationIds: 
										  response.headers['paypal-debug-id'] 
								});								
							}

						}).catch((err) => {

							reject({ ERR: 'MONGO LOOKUP ERROR...'});

						});

					} else {
						resolve({ 
								 statusCode: response.statusCode, 
								 request: payload, 
								 response: body, 
								 correlationIds: response.headers['paypal-debug-id'] 
					  	});
					}
				});
			});		
		}

	});
}

/**
 * Call PayPal GET `/v2/checkout/orders/{ORDER_ID}` API to get order status
 * @param {Object} args - Object of function arguments
 * @param {string} args.accessToken - PayPal access token to pass in API
 * @param {string} args.environment - PayPal environment to use (SANDBOX|LIVE)
 * @param {string} args.orderId - PayPal order id
 * @returns {Promise} Promise object represents the PayPal API response
 */
function getOrder(args) {
	return new Promise((resolve, reject) => {

		const { accessToken, orderId, environment } = args;

		const PAYPAL_ENDPOINT = environment === 'LIVE' ? 'https://api.paypal.com' : environment === 'STAGE' ? process.env.STAGE_URL : 'https://api.sandbox.paypal.com';		

		const options = {
			auth: {
				bearer: accessToken
			},
			method: 'GET',
			url: util.format('%s/v2/checkout/orders/%s', PAYPAL_ENDPOINT, orderId),
			headers: {
				'Content-Type': 'application/json',
			},
			followAllRedirects: true,
			followOriginalHttpMethod: true,
			removeRefererHeader: true
		};				

		// Confirm order exists in DB before proceeding
		dbUtils.getOrderByOrderId({ orderId }).then((record) => {		

			if (record) {

				record.GET_ORDER_API = {
					REQUEST_URL: options.url
				};		

				request(options, function (error, response, body) {

					if (error) {

						reject(error);

					} else if (response.statusCode < 400) {

						record.GET_ORDER_API.RESPONSE = JSON.parse(body);
						record.GET_ORDER_API.CORRELATION_ID = response.headers['paypal-debug-id'];			
						record.save();					

						resolve({ 
								statusCode: response.statusCode,
								status: JSON.parse(body).status,
								response: JSON.parse(body), 
								correlationIds: response.headers['paypal-debug-id'] 
						});
					} else {

						record.GET_ORDER_API.RESPONSE = JSON.parse(body);
						record.GET_ORDER_API.CORRELATION_ID = response.headers['paypal-debug-id'];			
						record.save();								

						resolve({ 
								statusCode: response.statusCode,
								response: JSON.parse(body), 
								correlationIds: response.headers['paypal-debug-id'] 
						});
					}
				});	

			} else {
        reject({ ERR: util.format('NO ORDER ID `%s` FOUND IN DB...', orderId) });
			}

		});
	});
}

/**
 * Call PayPal POST `/v2/checkout/orders/{ORDER_ID}/confirm-payment-source` API to confirm APM payment source
 * @param {Object} args - Object of function arguments
 * @param {string} args.accessToken - PayPal access token to pass in API
 * @param {string} args.environment - PayPal environment to use (SANDBOX|LIVE)
 * @param {string} args.orderId - PayPal order id
 * @returns {Promise} Promise object represents the PayPal API response
 */
function confirmPaymentSource(args) {
	return new Promise((resolve, reject) => {

		const { accessToken, orderId, environment } = args;

		const PAYPAL_ENDPOINT = environment === 'LIVE' ? 'https://api.paypal.com' : environment === 'STAGE' ? process.env.STAGE_URL : 'https://api.sandbox.paypal.com';		

		constructConfirmPaymentSourcePayload(args).then((payload) => {

			const options = {
				auth: {
					bearer: accessToken
				},
				method: 'POST',
				url: util.format('%s/v2/checkout/orders/%s/confirm-payment-source', PAYPAL_ENDPOINT, orderId),
				headers: {
					'Content-Type': 'application/json',
					'Prefer': 'return=representation',
				},
				followAllRedirects: true,
				followOriginalHttpMethod: true,
				removeRefererHeader: true,
				json: true,
				body: payload
			};

			// Confirm order exists in DB before proceeding
			dbUtils.getOrderByOrderId({ orderId }).then((record) => {

				if (record) {
					record.CONFIRM_PAYMENT_SOURCE_API = {
						REQUEST_URL: options.url,
						REQUEST: payload
					};

					request(options, function (error, response, body) {

						if (error) {
							reject(error);

						} else if (response.statusCode > 400) {

							record.CONFIRM_PAYMENT_SOURCE_API.RESPONSE = body;
							record.CONFIRM_PAYMENT_SOURCE_API.CORRELATION_ID = response.headers['paypal-debug-id'];			
							record.save();

							resolve({ 
									 statusCode: response.statusCode, 
									 request: payload, 
									 response: body, 
									 correlationIds: response.headers['paypal-debug-id'] 
						  	});							

						} else {

							record.STATUS = body.status;
							record.CONFIRM_PAYMENT_SOURCE_API.RESPONSE = body;
							record.CONFIRM_PAYMENT_SOURCE_API.CORRELATION_ID = response.headers['paypal-debug-id'];				

							record.save();

							resolve({ 
									 statusCode: response.statusCode, 
									 request: payload, 
									 response: body, 
									 correlationIds: response.headers['paypal-debug-id'] 
						  	});
						}

					});				

				} else {
					reject({ ERR: util.format('NO ORDER ID `%s` FOUND IN DB...', orderId)});
				}
			});	
		});
	});
}

/**
 * Call PayPal POST `/v1/oauth2/token` API to generate access token for API calls
 * @param {Object} args - Object of function arguments
 * @param {string} args.environment - PayPal environment to use (SANDBOX|LIVE)
 * @param {string} args.clientType - Client type to create order (WEBHOOK_CLIENT | POLLING_CLIENT)
 * @param {string} args.customClientId - Custom client id to create order
 * @param {string} args.customClientSecret - Custom client secret to create order 
 * @returns {Promise} Promise object represents the PayPal API response
 */
function createAccessToken(args) {
	return new Promise((resolve, reject) => {

		const { environment, clientType, customClientId, customClientSecret, scheme } = args;

		const PAYPAL_ENDPOINT = environment === 'LIVE' ? 'https://api.paypal.com' : environment === 'STAGE' ? process.env.STAGE_TOKEN_URL : 'https://api.sandbox.paypal.com';		

		determineClientId({ environment, clientType, customClientId, customClientSecret, scheme })

		.then((clientDetails) => {

			const options = {
				auth: {
					// Retrieve API credentials from environmental config
					user: clientDetails.clientId,
					pass: clientDetails.clientSecret
				},
				method: 'POST',
				url: util.format('%s/v1/oauth2/token', PAYPAL_ENDPOINT),
				headers: {
					'Content-Type': 'application/json'
				},
				body: 'grant_type=client_credentials'
			}

			attemptRequest(1);

			// Retry up to designated max in case of PayPal non 200 responses
			function attemptRequest(retryCount) {

				request(options, function (error, response, body) {

					if (error) {
						if (retryCount > 4) {
							reject({ 
								 statusCode: response.statusCode, 
								 request: options.body, 
								 response: body, 
								 correlationIds: response.headers['paypal-debug-id'] 
						  	});
						} else {
							attemptRequest(retryCount + 1);
						}
					} else if (response.statusCode < 400) {

						resolve(JSON.parse(body));

					} else {
						if (retryCount > 4) {

							reject({ 
								 statusCode: response.statusCode, 
								 request: options.body, 
								 response: JSON.parse(body), 
								 correlationIds: response.headers['paypal-debug-id'] 
						  	});

						} else {
							attemptRequest(retryCount + 1);
						}
					}
				});			
			}			

		});

		
	});
}

/**
 * Call PayPal POST `/v2/checkout/orders/{ORDER_ID}/capture` API to capture payment
 * @param {Object} args - Object of function arguments
 * @param {string} args.accessToken - PayPal access token to pass in API
 * @param {string} args.orderId - PayPal order id
 * @returns {Promise} Promise object represents the PayPal API response
 */
function captureOrder(args) {
	return new Promise((resolve, reject) => {

		const { accessToken, orderId } = args;

		dbUtils.getOrderByOrderId({ orderId }).then((record) => {

			if (record) {

				// Retrieve capture link from previous create order API response
				const captureLink = record.CREATE_ORDER_API.RESPONSE.links.find(x => x.rel === 'capture').href;

				const options = {
					auth: {
						bearer: accessToken
					},
					method: 'POST',
					url: captureLink,
					headers: {
						'Content-Type': 'application/json',
					},
					followAllRedirects: true,
					followOriginalHttpMethod: true,
					removeRefererHeader: true,
					json: true,
					body: {}
				};						

				request(options, function (error, response, body) {

					if (error) {
						reject(error);
					} else {

						record.STATUS = body.status || 'CAPTURE_FAILED';
						record.CAPTURE_ORDER_API = {
							REQUEST_URL: options.url,
							REQUEST: {},
							RESPONSE: body,
							CORRELATION_ID: response.headers['paypal-debug-id'] 
						};	

						record.save();

						resolve({ 
								 statusCode: response.statusCode, 
								 request: {}, 
								 response: body, 
								 correlationIds: response.headers['paypal-debug-id'] 
					  	});
					}

				});						

			} else {
				reject({ ERR: util.format('NO ORDER ID `%s` FOUND IN DB...', orderId)});
			}

		}).catch((err) => {
			console.log(JSON.stringify(err, null, 2));
			reject({ ERR: err });
		});
	});
}

/**
 * Determine which client id to use based on environment and client type toggles
 * @param {Object} args - Object of function arguments 
 * @param {string} args.environment - PayPal environment to use (SANDBOX|LIVE) 
 * @param {string} args.clientType - Client type to create order (WEBHOOK_CLIENT | POLLING_CLIENT) 
 * @param {string} args.customClientId - Custom client id to create order
 * @param {string} args.customClientSecret - Custom client secret to create order 
 * @param {string}  args.scheme - Payment scheme selected (ideal, oxxo, etc.)
 * @returns {Promise} Promise object represents the client id and secret
*/
function determineClientId(args) {
	return new Promise((resolve, reject) => {

		const { environment, clientType, customClientId, customClientSecret, scheme } = args;

	    const IS_WEBHOOK_CLIENT = clientType == 'WEBHOOK_CLIENT' ? true : false;

	    const webHookClientTag = IS_WEBHOOK_CLIENT ? "PRIMARY" : "NO_WEBHOOK";

		let clientId, clientSecret
	    
	    // Check if custom client id was entered; if not, use default from environmental configs
	    if (!_.isEmpty(customClientId)) {
	    	resolve({clientId: customClientId, clientSecret: customClientSecret });
		} else {
			clientId = process.env[`PP_${environment}_CLIENT_ID_${scheme.toUpperCase()}`]
			clientSecret = process.env[`PP_${environment}_CLIENT_SECRET_${scheme.toUpperCase()}`]
			if (clientId && clientSecret) {
				resolve({ clientId, clientSecret });
			} else {
				resolve({
					clientId: process.env[`PP_${environment}_CLIENT_ID_${webHookClientTag}`],
					clientSecret: process.env[`PP_${environment}_CLIENT_SECRET_${webHookClientTag}`]
				  });
			};
		}

	});
}

/**
 * Construct payload for POST `/v2/checkout/orders` API
 * @param {Object} args - Object of function arguments
 * @param {string} args.name - Buyer name
 * @param {string} args.emailAddress - Buyer email address 
 * @param {string} args.phoneNumber - Buyer phone number
 * @param {string} args.returnUrl - Merchant return URL after buyer approval
 * @param {string} args.cancelUrl - Merchant cancel URL in case of authorization cancellation or error
 * @param {string} args.currency - Order currency
 * @param {string} args.amount - Order amount
 * @param {string} args.shippingPreference - Shipping preference to use (GET_FROM_FILE | NO_SHIPPING | SET_PROVIDED_ADDRESS)
 * @returns {Promise} Promise object represents the PayPal API response
 * @param {string} args.scheme - APM payment scheme
 */
function constructCreateOrderPayload(args) {
	return new Promise((resolve, reject) => {

		const { name, emailAddress, phoneNumber, returnUrl, cancelUrl, currency, amount, shippingPreference, scheme } = args;

		let createOrderPayload = {
			"intent": "CAPTURE",
			// "payer": {
			// 	"email_address": emailAddress,
			// 	"phone": {
			// 		"phone_type": "MOBILE",
			// 		"phone_number": {
			// 			"national_number": phoneNumber
			// 		}
			// 	}
			// },
			// "application_context": {
			// 	"shipping_preference": shippingPreference,
			// 	"return_url": returnUrl,
			// 	"cancel_url": cancelUrl
			// },
			"purchase_units": [
				{
					"amount": {
						"currency_code": currency,
						"value": amount
					}
			       //  "shipping": {
			       //  	"name": {
			       //  		"full_name": name
			       //  	},
				      //   "address": {
				      //     "address_line_1": "2211 N First Street",
				      //     "address_line_2": "Building 17",
				      //     "admin_area_2": "San Jose",
				      //     "admin_area_1": "CA",
				      //     "postal_code": "95131",
				      //     "country_code": "US"
				      // }
			       //  }
				}
			]
		};

		if (puiUtils.isPUI(scheme)) {
			createOrderPayload = puiUtils.getCreateOrderPayload(args);
		}
		resolve(createOrderPayload);

	});	
}

/**
 * Construct payload for POST `/v2/checkout/orders/{ORDER_ID}/confirm-payment-source` API
 * @param {Object} args - Object of function arguments
 * @param {string} args.returnUrl - Merchant return URL after buyer approval
 * @param {string} args.cancelUrl - Merchant cancel URL in case of authorization cancellation or error
 * @param {string} args.scheme - APM payment scheme
 * @param {string} args.name - Buyer name
 * @param {string} args.emailAddress - Buyer email address
 * @param {string} args.countryCode - Buyer country code
 * @param {string} args.bic - Bank identification code (optional to be passed in for select APMs)
 * @returns {Promise} Promise object represents the PayPal API response
 */
function constructConfirmPaymentSourcePayload(args) {
	return new Promise((resolve, reject) => {

		// console.log(util.format('constructConfirmPaymentSourcePayload args = `%s`', JSON.stringify(args, null, 2)));

    let { returnUrl, cancelUrl, scheme, name, emailAddress, countryCode, bic, expiresInDays,
      taxid,taxid_type, address_line_1,address_line_2,admin_area_1,admin_area_2,postal_code,
    } = args;

		let confirmPaymentSourcePayload = {
		    "payment_source": {
		        // "ideal": {
		        //     "country_code": "NL",
		        //     "name": "Test Test"
		        // }
		    },
		    "application_context": {
		        "locale": util.format('en-%s', countryCode),
		        "return_url": returnUrl,
		        "cancel_url": cancelUrl
		    }
		};

		if (puiUtils.isPUI(scheme)) {
			confirmPaymentSourcePayload = puiUtils.getConfirmPaymentSourcePayLoad(args);
		} else {

			const paymentSourceSchema = paymentObjects[scheme].schema; 
			const requiredFields = paymentObjects[scheme].required;
	
			confirmPaymentSourcePayload["payment_source"][scheme] = paymentSourceSchema;
	
			_.each(requiredFields, function (value, key, list) {
	
				switch(value) {
					case 'name':
						confirmPaymentSourcePayload["payment_source"][scheme][value] = name;
						break;
					case 'country_code':
						confirmPaymentSourcePayload["payment_source"][scheme][value] = countryCode;
						break;
					case 'email':
						confirmPaymentSourcePayload["payment_source"][scheme][value] = emailAddress;
						  break;
					case 'expiry_date':
						  expiresInDays = parseInt(expiresInDays);
						  expiresInDays = !isNaN(expiresInDays) ? expiresInDays : 1;
						confirmPaymentSourcePayload["payment_source"][scheme][value] = date.format(date.addDays(new Date(),expiresInDays),'YYYY-MM-DD');
					default:
						break;
				}
	
			});		
	
			if (bic) {
				confirmPaymentSourcePayload["payment_source"][scheme]['bic'] = bic;
			} else {
				delete confirmPaymentSourcePayload["payment_source"][scheme]['bic'];
			}
	
			if (scheme === "boletobancario") {
				confirmPaymentSourcePayload["payment_source"][scheme]["tax_info"] = {
					"tax_id": taxid,
					"tax_id_type": taxid_type
				};
				confirmPaymentSourcePayload["payment_source"][scheme]["billing_address"] = {
					"address_line_1": address_line_1,
					"address_line_2": address_line_2,
					"admin_area_2": admin_area_2,
					"admin_area_1": admin_area_1,
					"postal_code": postal_code
				};
			}
			
			if (isAutoCapture(scheme)) {
				confirmPaymentSourcePayload["processing_instruction"] = "ORDER_COMPLETE_ON_PAYMENT_APPROVAL";
			}
		}
		
		resolve(confirmPaymentSourcePayload);

	});
}

function isAutoCapture(apm) {
	return paymentObjects[apm].autoCapture;
}

module.exports = {
	createOrder,
	confirmPaymentSource,
	constructConfirmPaymentSourcePayload,
	captureOrder,
	createAccessToken,
	getOrder
};