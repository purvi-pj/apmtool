'use strict';

const mockUtils 			= require('../lib/mockUtils'),
      indexRouter 			= require('../routes/index'),
	  webhookController		= require('../controllers/webhook'),
	  orders 				= require('../lib/orders'),
	  PPOrder 				= require('../schemas/ppOrder'),
      util	    			= require('util'),
      assert    			= require('chai').assert,
      expect 				= require('chai').expect,
      moment    			= require('moment'),
      nock      			= require('nock'),
      request				= require('supertest'),
      express				= require('express'),
      mongoose  			= require('mongoose'),
      { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Create Order in memory DB
*/
function createOrderInDb() {
	return new Promise((resolve, reject) => {
		// Create new order model
		let ppOrder = new PPOrder({
			ORDER_ID: '5910681066059742U',
			STATUS: 'CREATED',
			ENVIRONMENT: 'SANDBOX',
			CLIENT_TYPE: 'WEBHOOK_CLIENT',
			CLIENT_ID:  'AVW9jGe1L0iEIZiL_AKUzgbX9zpCkYRvdoGtBHx9RuXXghVVTOedcme-DaqEcRnv6PhcoGZiufZJfh6u',
			PAYMENT_SCHEME: 'ideal',
			BUYER_NAME: 'Unit Test',
			BUYER_EMAIL: 'unit@test.com',
			BUYER_COUNTRY: 'NL',
			AMOUNT: '10.99',
			CURRENCY: 'EUR',
			CREATE_ORDER_API: {
				REQUEST_URL: 'https://api.sandbox.paypal.com/v2/checkout/orders',
				REQUEST: {
				  "intent": "CAPTURE",
				  "purchase_units": [
				    {
				      "amount": {
				        "currency_code": "EUR",
				        "value": "10.99"
				      }
				    }
				  ]
				},
				RESPONSE: {
				  "id": "5910681066059742U",
				  "intent": "CAPTURE",
				  "status": "CREATED",
				  "purchase_units": [
				    {
				      "reference_id": "default",
				      "amount": {
				        "currency_code": "EUR",
				        "value": "10.99"
				      },
				      "payee": {
				        "email_address": "sb-azvx28274010@business.example.com",
				        "merchant_id": "Y42LGQL8ZV7QS"
				      }
				    }
				  ],
				  "create_time": "2021-10-28T18:29:01Z",
				  "links": [
				    {
				      "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U",
				      "rel": "self",
				      "method": "GET"
				    },
				    {
				      "href": "https://www.sandbox.paypal.com/checkoutnow?token=5910681066059742U",
				      "rel": "approve",
				      "method": "GET"
				    },
				    {
				      "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U",
				      "rel": "update",
				      "method": "PATCH"
				    },
				    {
				      "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U/capture",
				      "rel": "capture",
				      "method": "POST"
				    }
				  ]
				},
				CORRELATION_ID: '272074f1d72ce'
			},
			CONFIRM_PAYMENT_SOURCE_API: {
				REQUEST_URL: 'https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U/confirm-payment-source',
				REQUEST: {
				  "payment_source": {
				    "ideal": {
				      "name": "Test User",
				      "country_code": "NL"
				    }
				  },
				  "application_context": {
				    "locale": "en-NL",
				    "return_url": "http://127.0.0.1:3000/return",
				    "cancel_url": "http://127.0.0.1:3000/cancel"
				  }
				},
				RESPONSE: {
				  "id": "5910681066059742U",
				  "intent": "CAPTURE",
				  "status": "PAYER_ACTION_REQUIRED",
				  "payment_source": {
				    "ideal": {
				      "name": "Test User",
				      "country_code": "NL"
				    }
				  },
				  "purchase_units": [
				    {
				      "reference_id": "default",
				      "amount": {
				        "currency_code": "EUR",
				        "value": "10.99"
				      },
				      "payee": {
				        "email_address": "sb-azvx28274010@business.example.com",
				        "merchant_id": "Y42LGQL8ZV7QS"
				      }
				    }
				  ],
				  "links": [
				    {
				      "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U",
				      "rel": "self",
				      "method": "GET"
				    },
				    {
				      "href": "https://sandbox.paypal.com/payment/ideal?token=5910681066059742U",
				      "rel": "payer-action",
				      "method": "GET"
				    }
				  ]
				},
				CORRELATION_ID: '4d22efc5ae4a4'
			}
		});		

		ppOrder.save();

		resolve();
	});
}

describe('controllers/webhook Unit Tests', function () {

	var app = express();
	
	app.use(express.json());

	app.use('/', indexRouter);

	let mongoServer;

    before(async () => {

        // Create in memory mongoDB for test purposes
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {useNewUrlParser: true});

        // Set environmental variables
		process.env.PP_SANDBOX_CLIENT_ID_PRIMARY = 'AVW9jGe1L0iEIZiL_AKUzgbX9zpCkYRvdoGtBHx9RuXXghVVTOedcme-DaqEcRnv6PhcoGZiufZJfh6u';
		process.env.PP_SANDBOX_CLIENT_SECRET_PRIMARY = 'ED5avbhyQeqEs5WtAyg641-_-10pdONDD5sNxuGxVXbd1oi-tOs7gLArTrNzK79oHe5l7ZSbSmJi-eti';

    });

    after(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });    	

    it('should return 200 for `CHECKOUT.ORDER.APPROVED` webhook', function(done) {

		createOrderInDb().then((result) => {

	        // Mock PayPal access token API
	        nock('https://api.sandbox.paypal.com')
	            .post('/v1/oauth2/token')
	            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

	        // Mock PayPal get order API
	        nock('https://api.sandbox.paypal.com')
	            .get('/v2/checkout/orders/5910681066059742U')
	            .reply(200, {"id":"5910681066059742U","intent":"CAPTURE","status":"PENDING","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });

	        // Mock PayPal capture order source API
	        nock('https://api.sandbox.paypal.com')
	            .post('/v2/checkout/orders/5910681066059742U/capture')
	            .reply(200, {"id":"5910681066059742U","status":"COMPLETED","payment_source":{"ideal":{"name":"TestUser","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, {'paypal-debug-id': '8eead21d239e6'} );

	    	const id = '5910681066059742U';

	    	let payload = mockUtils.constructMockWebhookPayload(id, 'CHECKOUT.ORDER.APPROVED');

			request(app)
				.post('/ppwebhook')
				.send(payload)
				.type('json')
				.expect(200)
				.end(function(err, res) {
					if (err) return done(err);
					return done();
				})
	

		});	
    });    

    it('should return 200 for `PAYMENT.CAPTURE.DENIED` webhook', function(done) {

		createOrderInDb().then((result) => {

	        // Mock PayPal access token API
	        nock('https://api.sandbox.paypal.com')
	            .post('/v1/oauth2/token')
	            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

	        // Mock PayPal get order API
	        nock('https://api.sandbox.paypal.com')
	            .get('/v2/checkout/orders/5910681066059742U')
	            .reply(200, {"id":"5910681066059742U","intent":"CAPTURE","status":"PENDING","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });

	        // Mock PayPal capture order source API
	        nock('https://api.sandbox.paypal.com')
	            .post('/v2/checkout/orders/5910681066059742U/capture')
	            .reply(200, {"id":"5910681066059742U","status":"COMPLETED","payment_source":{"ideal":{"name":"TestUser","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, {'paypal-debug-id': '8eead21d239e6'} );

	    	const id = '5910681066059742U';

	    	let payload = mockUtils.constructMockWebhookPayload(id, 'PAYMENT.CAPTURE.DENIED');

			request(app)
				.post('/ppwebhook')
				.send(payload)
				.type('json')
				.expect(200)
				.end(function(err, res) {
					if (err) return done(err);
					return done();
				})
		});	
    });    

    it('should return 200 for `PAYMENT.CAPTURE.PENDING` webhook', function(done) {

		createOrderInDb().then((result) => {

	    	const id = '5910681066059742U';

	    	let payload = mockUtils.constructMockWebhookPayload(id, 'PAYMENT.CAPTURE.PENDING');

			request(app)
				.post('/ppwebhook')
				.send(payload)
				.type('json')
				.expect(200)
				.end(function(err, res) {
					if (err) return done(err);
					return done();
				}) 		

		});	
    });   

    it('should return 200 for `PAYMENT.CAPTURE.COMPLETED` webhook', function(done) {

		createOrderInDb().then((result) => {

	        // Mock PayPal access token API
	        nock('https://api.sandbox.paypal.com')
	            .post('/v1/oauth2/token')
	            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

	        // Mock PayPal get order API
	        nock('https://api.sandbox.paypal.com')
	            .get('/v2/checkout/orders/5910681066059742U')
	            .reply(200, {"id":"5910681066059742U","intent":"CAPTURE","status":"PENDING","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });

	        // Mock PayPal capture order source API
	        nock('https://api.sandbox.paypal.com')
	            .post('/v2/checkout/orders/5910681066059742U/capture')
	            .reply(200, {"id":"5910681066059742U","status":"COMPLETED","payment_source":{"ideal":{"name":"TestUser","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, {'paypal-debug-id': '8eead21d239e6'} );

	    	const id = '5910681066059742U';

	    	let payload = mockUtils.constructMockWebhookPayload(id, 'PAYMENT.CAPTURE.COMPLETED');

			request(app)
				.post('/ppwebhook')
				.send(payload)
				.type('json')
				.expect(200)
				.end(function(err, res) {
					if (err) return done(err);
					return done();
				})
		});	
    });       

    it('should return 404 for `CHECKOUT.ORDER.APPROVED` webhook (order not found)', function(done) {

        // Mock PayPal access token API
        nock('https://api.sandbox.paypal.com')
            .post('/v1/oauth2/token')
            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

        // Mock PayPal get order API
        nock('https://api.sandbox.paypal.com')
            .get('/v2/checkout/orders/0000000000000000A')
            .reply(200, {"id":"0000000000000000A","intent":"CAPTURE","status":"PENDING","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });


    	const id = '0000000000000000A';

    	let payload = mockUtils.constructMockWebhookPayload(id, 'CHECKOUT.ORDER.APPROVED');

		request(app)
			.post('/ppwebhook')
			.send(payload)
			.type('json')
			.expect(404)
			.end(function(err, res) {
				if (err) return done(err);
				return done();
			})
    });

    it('should return 404 for `PAYMENT.CAPTURE.PENDING` webhook (order not found)', function(done) {

        // Mock PayPal access token API
        nock('https://api.sandbox.paypal.com')
            .post('/v1/oauth2/token')
            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

        // Mock PayPal get order API
        nock('https://api.sandbox.paypal.com')
            .get('/v2/checkout/orders/0000000000000000A')
            .reply(200, {"id":"0000000000000000A","intent":"CAPTURE","status":"PENDING","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });


    	const id = '0000000000000000A';

    	let payload = mockUtils.constructMockWebhookPayload(id, 'PAYMENT.CAPTURE.PENDING');

		request(app)
			.post('/ppwebhook')
			.send(payload)
			.type('json')
			.expect(404)
			.end(function(err, res) {
				if (err) return done(err);
				return done();
			})
    });

    it('should return 404 for `PAYMENT.CAPTURE.COMPLETED` webhook (order not found)', function(done) {

        // Mock PayPal access token API
        nock('https://api.sandbox.paypal.com')
            .post('/v1/oauth2/token')
            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

        // Mock PayPal get order API
        nock('https://api.sandbox.paypal.com')
            .get('/v2/checkout/orders/0000000000000000A')
            .reply(200, {"id":"0000000000000000A","intent":"CAPTURE","status":"PENDING","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });


    	const id = '0000000000000000A';

    	let payload = mockUtils.constructMockWebhookPayload(id, 'PAYMENT.CAPTURE.COMPLETED');

		request(app)
			.post('/ppwebhook')
			.send(payload)
			.type('json')
			.expect(404)
			.end(function(err, res) {
				if (err) return done(err);
				return done();
			})
    });

    it('should return 404 for `PAYMENT.CAPTURE.DENIED` webhook (order not found)', function(done) {

        // Mock PayPal access token API
        nock('https://api.sandbox.paypal.com')
            .post('/v1/oauth2/token')
            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

        // Mock PayPal get order API
        nock('https://api.sandbox.paypal.com')
            .get('/v2/checkout/orders/0000000000000000A')
            .reply(200, {"id":"0000000000000000A","intent":"CAPTURE","status":"PENDING","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });


    	const id = '0000000000000000A';

    	let payload = mockUtils.constructMockWebhookPayload(id, 'PAYMENT.CAPTURE.DENIED');

		request(app)
			.post('/ppwebhook')
			.send(payload)
			.type('json')
			.expect(404)
			.end(function(err, res) {
				if (err) return done(err);
				return done();
			})
    });            

});