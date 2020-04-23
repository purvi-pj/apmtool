'use strict';

const paymentObjects	= require('../config/paymentObjects.json'),
	  PPOrder 			= require('../schemas/ppOrder'),
	  dbUtils 			= require('./db'),
	  util 				= require('util'),
	  moment 			= require('moment'),
	  request			= require('request'),
	  _					= require('underscore');

require('request-debug')(request);	

function createOrder(args) {
	return new Promise((resolve, reject) => {

		// ***************** MOCK RESPONSE START ********************

		// const MOCK_RESPONSE = {
		//   "id": "9N578587PB332660R",
		//   "intent": "CAPTURE",
		//   "purchase_units": [
		//     {
		//       "reference_id": "default",
		//       "amount": {
		//         "currency_code": "EUR",
		//         "value": "10.00"
		//       },
		//       "payee": {
		//         "email_address": "_sys_ocean-487568640987143@paypal.com",
		//         "merchant_id": "B4P8VXM65PD5W"
		//       },
		//       "shipping": {
		//         "name": {
		//           "full_name": "Test Test"
		//         },
		//         "address": {
		//           "address_line_1": "2211 N First Street",
		//           "address_line_2": "Building 17",
		//           "admin_area_2": "San Jose",
		//           "admin_area_1": "CA",
		//           "postal_code": "95131",
		//           "country_code": "US"
		//         }
		//       }
		//     }
		//   ],
		//   "payer": {
		//     "email_address": "eriyu@paypal.com",
		//     "phone": {
		//       "phone_type": "MOBILE",
		//       "phone_number": {
		//         "national_number": "14085551234"
		//       }
		//     }
		//   },
		//   "create_time": "2020-04-14T23:02:45Z",
		//   "links": [
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
		//       "rel": "self",
		//       "method": "GET"
		//     },
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com/checkoutnow?token=9N578587PB332660R",
		//       "rel": "approve",
		//       "method": "GET"
		//     },
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
		//       "rel": "update",
		//       "method": "PATCH"
		//     },
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R/capture",
		//       "rel": "capture",
		//       "method": "POST"
		//     },
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R/confirm-payment-source",
		//       "rel": "confirm",
		//       "method": "POST"
		//     }
		//   ],
		//   "status": "CREATED"
		// };

		// resolve({ request: {}, response: MOCK_RESPONSE, statusCode: 200, correlationIds: "CORRELATION_ID_MOCK" } );

		// ***************** MOCK RESPONSE END ********************

		const { accessToken, environment } = args;

		const PAYPAL_ENDPOINT = environment === 'LIVE' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

		runRequest();

		function runRequest() {

			constructCreateOrderPayload(args).then((payload) => {

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

				// Create new order model
				let ppOrder = new PPOrder({
					ENVIRONMENT: args.environment,
					PAYMENT_SCHEME: args.scheme,
					BUYER_NAME: args.name,
					BUYER_EMAIL: args.emailAddress,
					AMOUNT: args.amount,
					CURRENCY: args.currency,
					CREATE_ORDER_API: {
						REQUEST: payload
					}
				});						

				request(options, function (error, response, body) {

					console.log(JSON.stringify(response, null, 2));

					if (error) {
						reject(error);
					// } else if (response.statusCode === 404 || response.statusCode === 500) {

					// 	runRequest();

					} else if (response.statusCode < 400) {

						// Update ppOrder object with PayPal order id
						ppOrder.ORDER_ID = body.id;
						ppOrder.STATUS = body.status;
						ppOrder.CREATE_ORDER_API.RESPONSE = body;
						ppOrder.CREATE_ORDER_API.CORRELATION_ID = response.headers['paypal-debug-id'];

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

function getOrder(args) {
	return new Promise((resolve, reject) => {

		// ***************** MOCK RESPONSE START ********************

		// const MOCK_RESPONSE = {
		//   "id": "9N578587PB332660R",
		//   "intent": "CAPTURE",
		//   "payment_source": {
		//     "ideal": {
		//       "name": "Test Test",
		//       "country_code": "NL",
		//       "bic": "ABNANL2A",
		//       "iban_last_chars": "5521"
		//     }
		//   },
		//   "purchase_units": [
		//     {
		//       "reference_id": "default",
		//       "amount": {
		//         "currency_code": "EUR",
		//         "value": "10.00"
		//       },
		//       "payee": {
		//         "email_address": "_sys_ocean-487568640987143@paypal.com",
		//         "merchant_id": "B4P8VXM65PD5W"
		//       },
		//       "shipping": {
		//         "name": {
		//           "full_name": "Test Test"
		//         },
		//         "address": {
		//           "address_line_1": "2211 N First Street",
		//           "address_line_2": "Building 17",
		//           "admin_area_2": "San Jose",
		//           "admin_area_1": "CA",
		//           "postal_code": "95131",
		//           "country_code": "US"
		//         }
		//       }
		//     }
		//   ],
		//   "payer": {
		//     "name": {
		//       "given_name": "",
		//       "surname": ""
		//     },
		//     "payer_id": "JJN3WS3LPTVPQ",
		//     "address": {
		//       "country_code": "NL"
		//     }
		//   },
		//   "create_time": "2020-04-14T23:02:45Z",
		//   "links": [
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
		//       "rel": "self",
		//       "method": "GET"
		//     },
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
		//       "rel": "update",
		//       "method": "PATCH"
		//     },
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R/capture",
		//       "rel": "capture",
		//       "method": "POST"
		//     }
		//   ],
		//   "status": "APPROVED"
		// };

		// resolve({ request: {}, response: MOCK_RESPONSE, statusCode: 200, correlationIds: "CORRELATION_ID_MOCK" } );

		// ***************** MOCK RESPONSE END ********************

		const { accessToken, orderId, environment } = args;

		const PAYPAL_ENDPOINT = environment === 'LIVE' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

		// runRequest();

		// const { selfLink, host, orderId } = args;

		const options = {
			auth: {
				bearer: accessToken
			},
			method: 'GET',
			url: util.format('%s/v2/checkout/orders/%s', PAYPAL_ENDPOINT, orderId),
			// url: selfLink,
			headers: {
				'Content-Type': 'application/json',
			},
			followAllRedirects: true,
			followOriginalHttpMethod: true,
			removeRefererHeader: true
		};				

		request(options, function (error, response, body) {

			console.log(JSON.stringify(response, null, 2));

			if (error) {

				reject(error);

			} else if (response.statusCode < 400) {

				resolve({ 
						statusCode: response.statusCode,
						response: JSON.parse(body), 
						correlationIds: response.headers['paypal-debug-id'] 
				});

			} else {

				resolve({ 
						statusCode: response.statusCode,
						response: JSON.parse(body), 
						correlationIds: response.headers['paypal-debug-id'] 
				});

			}

		});	


	});
}

function confirmPaymentSource(args) {
	return new Promise((resolve, reject) => {

		const { accessToken, orderId } = args;

		// ***************** MOCK RESPONSE START ********************

		constructConfirmPaymentSourcePayload(args).then((payload) => {

			const options = {
				auth: {
					bearer: accessToken
				},
				method: 'POST',
				url: util.format('https://api.sandbox.paypal.com/v2/checkout/orders/%s/confirm-payment-source', orderId),
				// url: confirmLink,
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


			dbUtils.getOrderByOrderId({ orderId }).then((record) => {

				if (record) {
					record.CONFIRM_PAYMENT_SOURCE_API = {
						REQUEST: payload
					};

					const MOCK_RESPONSE = {
					  "id": "9N578587PB332660R",
					  "intent": "CAPTURE",
					  "payment_source": {
					    "ideal": {
					      "name": "Test Test",
					      "country_code": "NL"
					    }
					  },
					  "links": [
					    {
					      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
					      "rel": "self",
					      "method": "GET"
					    },
					    {
					      "href": "http://localhost.paypal.com:3000/mockPaymentSchemeApproval",
					      "rel": "approve",
					      "method": "GET"
					    }
					  ],
					  "status": "PAYER_AUTHENTICATION_REQUIRED"
					};

					record.STATUS = MOCK_RESPONSE.status;
					record.CONFIRM_PAYMENT_SOURCE_API.RESPONSE = MOCK_RESPONSE;
					record.CONFIRM_PAYMENT_SOURCE_API.CORRELATION_ID = 'MOCK1234';

					record.save();

					resolve({ request: {}, response: MOCK_RESPONSE, statusCode: 200, correlationIds: "CORRELATION_ID_MOCK" } );

				} else {
					reject({ ERR: util.format('NO ORDER ID `%s` FOUND IN DB...', orderId)});
				}

			});	
		});

		
		// ***************** MOCK RESPONSE END ********************

		// runRequest();

		// function runRequest() {		

		// 	const { confirmLink, host, securityContext } = args;

		// 	constructConfirmPaymentSourcePayload(args).then((payload) => {

		// 		const options = {
		// 			auth: {
		// 				user: 'AQWWeM4N26XL41lUYhn9EZFZFg7VXjteSUNFsUW1VT5r_PfNfbpArGm56au9uMxdh5yr52Mt3PFdSWu5',
		// 				pass: 'EBLxVQNN9nqkszbw2DFNgJ5-fCsUifg4SdVmK--9M2wKpDJ28gTCl73OgBMArsMEubZIqzzzqfFpOFHY'
		// 			},
		// 			method: 'POST',
		// 			url: util.format('%s/v2/checkout/orders/%s/confirm-payment-source', host, args.orderId),
		// 			// url: confirmLink,
		// 			headers: {
		// 				'Content-Type': 'application/json',
		// 				'Prefer': 'return=representation',
		// 				'X-PAYPAL-SECURITY-CONTEXT': securityContext
		// 			},
		// 			followAllRedirects: true,
		// 			followOriginalHttpMethod: true,
		// 			removeRefererHeader: true,
		// 			json: true,
		// 			body: payload
		// 		};		

		// 		request(options, function (error, response, body) {

		// 			console.log(JSON.stringify(response, null, 2));

		// 			if (error) {
		// 				reject(error);
		// 			} else if (response.statusCode === 404) {
		// 				runRequest();
		// 			// } else if (response.statusCode < 400) {

		// 			// 	resolve({ statusCode: response.statusCode, response: body, correlationIds: response.headers['paypal-debug-id'] });

		// 			} else {
		// 				resolve({ request: payload, statusCode: response.statusCode, response: body, correlationIds: response.headers['paypal-debug-id'] });
		// 			}

		// 		});	

		// 	});
		// }

	});
}

function createAccessToken(args) {
	return new Promise((resolve, reject) => {

		const options = {
			auth: {
				user: 'AV_M_RJVpm7ZdF1v1lKZQI-DH827URLWkUkjdE-JFiVuTzfymVff58soeeRNBipDfn3NfUTzcOGZjo4Y',
				pass: 'EJiiefVQEAeaO8RyA7-oiOpdHt_gl7iObAkJVAnKM8lODSBjd1WG1BMfiQb8nQhQhpJoIKjQmxpp3oqA'
			},
			method: 'POST',
			url: 'https://api.sandbox.paypal.com/v1/oauth2/token',
			headers: {
				'Content-Type': 'application/json'
			},
			body: 'grant_type=client_credentials'
		}

		request(options, function (error, response, body) {

			console.log(JSON.stringify(response, null, 2));

			if (error) {
				reject(error);
			} else if (response.statusCode < 400) {

				resolve(JSON.parse(body));

			} else {
				reject(body);
			}

		});			

	});
}

function captureOrder(args) {
	return new Promise((resolve, reject) => {

		const { accessToken, orderId } = args;

		dbUtils.getOrderByOrderId({ orderId }).then((record) => {

			if (record) {

				console.log(util.format('record=%s', JSON.stringify(record, null, 2)));

				// Retrieve capture link
				// const captureLink = record.CREATE_ORDER_API.RESPONSE.links.find(x => x.rel === 'capture').href;

				const options = {
					auth: {
						bearer: accessToken
					},
					method: 'POST',
					// url: captureLink,
					headers: {
						'Content-Type': 'application/json',
					},
					followAllRedirects: true,
					followOriginalHttpMethod: true,
					removeRefererHeader: true,
					json: true,
					body: {}
				};						

				const MOCK_RESPONSE = {
				  "id": "9N578587PB332660R",
				  "payment_source": {
				    "ideal": {
				      "name": "Test Test",
				      "country_code": "NL",
				      "bic": "ABNANL2A",
				      "iban_last_chars": "5521"
				    }
				  },
				  "purchase_units": [
				    {
				      "reference_id": "default",
				      "shipping": {
				        "name": {
				          "full_name": "Test Test"
				        },
				        "address": {
				          "address_line_1": "2211 N First Street",
				          "address_line_2": "Building 17",
				          "admin_area_2": "San Jose",
				          "admin_area_1": "CA",
				          "postal_code": "95131",
				          "country_code": "US"
				        }
				      },
				      "payments": {
				        "captures": [
				          {
				            "id": "3TY926042S008591T",
				            "status": "PENDING",
				            "status_details": {
				              "reason": "RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTION"
				            },
				            "amount": {
				              "currency_code": "EUR",
				              "value": "10.00"
				            },
				            "final_capture": true,
				            "seller_protection": {
				              "status": "ELIGIBLE",
				              "dispute_categories": [
				                "ITEM_NOT_RECEIVED",
				                "UNAUTHORIZED_TRANSACTION"
				              ]
				            },
				            "links": [
				              {
				                "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/payments/captures/3TY926042S008591T",
				                "rel": "self",
				                "method": "GET"
				              },
				              {
				                "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/payments/captures/3TY926042S008591T/refund",
				                "rel": "refund",
				                "method": "POST"
				              },	
				              {
				                "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
				                "rel": "up",
				                "method": "GET"
				              }
				            ],
				            "create_time": "2020-04-14T23:03:38Z",
				            "update_time": "2020-04-14T23:03:38Z"
				          }
				        ]
				      }
				    }
				  ],
				  "payer": {
				    "payer_id": "JJN3WS3LPTVPQ",
				    "address": {
				      "country_code": "NL"
				    }
				  },
				  "links": [
				    {
				      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
				      "rel": "self",
				      "method": "GET"
				    }
				  ],
				  "status": "COMPLETED"
				};

				record.STATUS = MOCK_RESPONSE.status;
				record.CAPTURE_ORDER_API = {
					REQUEST: {},
					RESPONSE: MOCK_RESPONSE,
					CORRELATION_ID: 'MOCK1234'
				};

				record.save();			

				resolve({ request: {}, response: MOCK_RESPONSE, statusCode: 200, correlationIds: "CORRELATION_ID_MOCK" } );
			} else {
				reject({ ERR: util.format('NO ORDER ID `%s` FOUND IN DB...', orderId)});
			}


		}).catch((err) => {
			console.log(JSON.stringify(err, null, 2));
			reject({ ERR: err });
		});

		// Retrieve orderId record from DB

		// ***************** MOCK RESPONSE START ********************

		// const MOCK_RESPONSE = {
		//   "id": "9N578587PB332660R",
		//   "payment_source": {
		//     "ideal": {
		//       "name": "Test Test",
		//       "country_code": "NL",
		//       "bic": "ABNANL2A",
		//       "iban_last_chars": "5521"
		//     }
		//   },
		//   "purchase_units": [
		//     {
		//       "reference_id": "default",
		//       "shipping": {
		//         "name": {
		//           "full_name": "Test Test"
		//         },
		//         "address": {
		//           "address_line_1": "2211 N First Street",
		//           "address_line_2": "Building 17",
		//           "admin_area_2": "San Jose",
		//           "admin_area_1": "CA",
		//           "postal_code": "95131",
		//           "country_code": "US"
		//         }
		//       },
		//       "payments": {
		//         "captures": [
		//           {
		//             "id": "3TY926042S008591T",
		//             "status": "PENDING",
		//             "status_details": {
		//               "reason": "RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTION"
		//             },
		//             "amount": {
		//               "currency_code": "EUR",
		//               "value": "10.00"
		//             },
		//             "final_capture": true,
		//             "seller_protection": {
		//               "status": "ELIGIBLE",
		//               "dispute_categories": [
		//                 "ITEM_NOT_RECEIVED",
		//                 "UNAUTHORIZED_TRANSACTION"
		//               ]
		//             },
		//             "links": [
		//               {
		//                 "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/payments/captures/3TY926042S008591T",
		//                 "rel": "self",
		//                 "method": "GET"
		//               },
		//               {
		//                 "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/payments/captures/3TY926042S008591T/refund",
		//                 "rel": "refund",
		//                 "method": "POST"
		//               },
		//               {
		//                 "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
		//                 "rel": "up",
		//                 "method": "GET"
		//               }
		//             ],
		//             "create_time": "2020-04-14T23:03:38Z",
		//             "update_time": "2020-04-14T23:03:38Z"
		//           }
		//         ]
		//       }
		//     }
		//   ],
		//   "payer": {
		//     "payer_id": "JJN3WS3LPTVPQ",
		//     "address": {
		//       "country_code": "NL"
		//     }
		//   },
		//   "links": [
		//     {
		//       "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/9N578587PB332660R",
		//       "rel": "self",
		//       "method": "GET"
		//     }
		//   ],
		//   "status": "COMPLETED"
		// };

		// resolve({ request: {}, response: MOCK_RESPONSE, statusCode: 200, correlationIds: "CORRELATION_ID_MOCK" } );

		// ***************** MOCK RESPONSE END ********************

		// runRequest();

		// function runRequest() {		

		// 	const { host, orderId, captureLink, securityContext } = args;

		// 	const options = {
		// 		auth: {
		// 			user: 'AQWWeM4N26XL41lUYhn9EZFZFg7VXjteSUNFsUW1VT5r_PfNfbpArGm56au9uMxdh5yr52Mt3PFdSWu5',
		// 			pass: 'EBLxVQNN9nqkszbw2DFNgJ5-fCsUifg4SdVmK--9M2wKpDJ28gTCl73OgBMArsMEubZIqzzzqfFpOFHY'
		// 		},
		// 		method: 'POST',
		// 		url: util.format('%s/v2/checkout/orders/%s/capture', host, orderId),
		// 		// url: captureLink,
		// 		headers: {
		// 			'Content-Type': 'application/json',
		// 			'X-PAYPAL-SECURITY-CONTEXT': securityContext
		// 		},
		// 		followAllRedirects: true,
		// 		followOriginalHttpMethod: true,
		// 		removeRefererHeader: true,
		// 		json: true,
		// 		body: {}
		// 	};				

		// 	request(options, function (error, response, body) {

		// 		console.log(JSON.stringify(response, null, 2));

		// 		if (error) {
		// 			reject(error);

		// 		} else if (response.statusCode === 404) {

		// 			runRequest();

		// 		// } else if (response.statusCode < 400) {

		// 		// 	resolve({ response: body, correlationIds: response.headers['paypal-debug-id'] });

		// 		} else {
		// 			resolve({ request: {}, statusCode: response.statusCode, response: body, correlationIds: response.headers['paypal-debug-id'] });
		// 		}

		// 	});	
		// }
	});
}

function constructCreateOrderPayload(args) {
	return new Promise((resolve, reject) => {

		const { name, emailAddress, phoneNumber, returnUrl, cancelUrl, currency, amount } = args;

		const createOrderPayload = {
			"intent": "CAPTURE",
			"payer": {
				"email_address": emailAddress,
				"phone": {
					"phone_type": "MOBILE",
					"phone_number": {
						"national_number": phoneNumber
					}
				}
			},
			"application_context": {
				"return_url": returnUrl,
				"cancel_url": cancelUrl
			},
			"purchase_units": [
				{
					"amount": {
						"currency_code": currency,
						"value": amount
					},
			        "shipping": {
			        	"name": {
			        		"full_name": name
			        	},
				        "address": {
				          "address_line_1": "2211 N First Street",
				          "address_line_2": "Building 17",
				          "admin_area_2": "San Jose",
				          "admin_area_1": "CA",
				          "postal_code": "95131",
				          "country_code": "US"
				      }
			        }
				}
			]
		};

		resolve(createOrderPayload);

	});	
}

function constructConfirmPaymentSourcePayload(args) {
	return new Promise((resolve, reject) => {

		console.log(util.format('args = `%s`', JSON.stringify(args, null, 2)));

		const { returnUrl, cancelUrl, scheme, name, emailAddress, countryCode } = args;

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
				default:
					break;
			}

		});		

		resolve(confirmPaymentSourcePayload);

	});
}

module.exports = {
	createOrder,
	confirmPaymentSource,
	captureOrder,
	createAccessToken,
	getOrder
};