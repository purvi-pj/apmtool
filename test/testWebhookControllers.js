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
			ACCESS_TOKEN: 'MOCK_ACCESS_TOKEN',
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

const createPUIOrderInDb = () => {
	return new Promise((resolve, reject) => {
		let ppOrder = new PPOrder(mockUtils.getPUIMockOrder());
		ppOrder.save();

		resolve();
	});
};

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
	            .reply(200, {"id":"5910681066059742U","intent":"CAPTURE","status":"APPROVED","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });

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
	
	it('should return 200 for `CHECKOUT.ORDER.COMPLETED` webhook', function(done) {

		createPUIOrderInDb().then((result) => {

	        // Mock PayPal access token API
			nock('https://api.sandbox.paypal.com')
				.post('/v1/oauth2/token')
				.reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

			// Mock PayPal create order API
			nock('https://api.sandbox.paypal.com')
				.post('/v2/checkout/orders')
				.reply(201, {"id":"6ST85138L8074944D","intent":"CAPTURE","status":"CREATED","purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","tax_rate":"10.00","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"create_time":"2022-01-27T13:04:07Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D","rel":"self","method":"GET"},{"href":"https://www.sandbox.paypal.com/checkoutnow?token=6ST85138L8074944D","rel":"approve","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D","rel":"update","method":"PATCH"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D/capture","rel":"capture","method":"POST"}]}, { 'paypal-debug-id': 'b138de4ee3054' });

			// Mock PayPal get order API
			nock('https://api.sandbox.paypal.com')
				.get('/v2/checkout/orders/6ST85138L8074944D')
				.reply(200, {"id":"6ST85138L8074944D","intent":"CAPTURE","status":"COMPLETED","payment_source":{"pay_upon_invoice":{"name":{"given_name":"Heinz","surname":"Steeger"},"birth_date":"1990-01-01","email":"test@test.com","phone":{"country_code":"49","national_number":"17744455553"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"payment_reference":"GD043941595","deposit_bank_details":{"bic":"BELADEBEXXX","bank_name":"Test Sparkasse - Berlin","iban":"DE12345678901234567890","account_holder_name":"Paypal - Ratepay GmbH - Test Bank Account"},"experience_context":{"brand_name":"Buy All The Things","locale":"de-DE","shipping_preference":"GET_FROM_FILE","return_url":"https://bron.com","cancel_url":"https://bron.com","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png","customer_service_instructions":["Rosenweg 20","12345 Berlin"]}}},"processing_instruction":"ORDER_COMPLETE_ON_PAYMENT_APPROVAL","purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","tax_rate":"10.00","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}},"payments":{"captures":[{"id":"7CT64336M3282510T","status":"COMPLETED","amount":{"currency_code":"EUR","value":"10.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"10.00"},"paypal_fee":{"currency_code":"EUR","value":"0.54"},"net_amount":{"currency_code":"EUR","value":"9.46"}},"invoice_id":"Invoice-12345","custom_id":"Custom-1234","links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/7CT64336M3282510T","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/7CT64336M3282510T/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D","rel":"up","method":"GET"}],"create_time":"2022-01-27T13:04:15Z","update_time":"2022-01-27T13:04:15Z"}]}}],"create_time":"2022-01-27T13:04:07Z","update_time":"2022-01-27T13:04:15Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '8ff17ad81cf5' });
	
			// Mock PayPal confirm payment source API
			nock('https://api.sandbox.paypal.com')
				.post('/v2/checkout/orders/6ST85138L8074944D/confirm-payment-source')
				.reply(200, {"id":"6ST85138L8074944D","intent":"CAPTURE","status":"PENDING_APPROVAL","payment_source":{"pay_upon_invoice":{"name":{"prefix":"Mr","given_name":"Heinz","surname":"Steeger"},"birth_date":"1990-01-01","email":"test@test.com","phone":{"country_code":"49","national_number":"17744455553"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"experience_context":{"brand_name":"Buy All The Things","locale":"de-DE","shipping_preference":"GET_FROM_FILE","return_url":"https://bron.com","cancel_url":"https://bron.com","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png","customer_service_instructions":["Rosenweg 20","12345 Berlin"]}}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D","rel":"self","method":"GET"}]}, {'paypal-debug-id': '296c5d3d5066a'} );

	    	const id = '6ST85138L8074944D';

	    	let payload = mockUtils.constructMockWebhookPayload(id, 'CHECKOUT.ORDER.COMPLETED');

			request(app)
				.post('/ppwebhook')
				.send(payload)
				.type('json')
				.expect(200)
				.end(function(err, res) {
					console.log({res})
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
	
	it('should return 404 for `CHECKOUT.ORDER.COMPLETED` webhook (order not found)', function(done) {

		// Mock PayPal access token API
		nock('https://api.sandbox.paypal.com')
			.post('/v1/oauth2/token')
			.reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

		// Mock PayPal create order API
		nock('https://api.sandbox.paypal.com')
			.post('/v2/checkout/orders')
			.reply(201, {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"CREATED","purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","tax_rate":"10.00","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"create_time":"2022-01-27T13:04:07Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"},{"href":"https://www.sandbox.paypal.com/checkoutnow?token=2W669649PJ909081C","rel":"approve","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"update","method":"PATCH"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C/capture","rel":"capture","method":"POST"}]}, { 'paypal-debug-id': 'b138de4ee3054' });

		// Mock PayPal confirm payment source API
		nock('https://api.sandbox.paypal.com')
			.post('/v2/checkout/orders/2W669649PJ909081C/confirm-payment-source')
			.reply(200, {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"PENDING_APPROVAL","payment_source":{"pay_upon_invoice":{"name":{"prefix":"Mr","given_name":"Heinz","surname":"Steeger"},"birth_date":"1990-01-01","email":"test@test.com","phone":{"country_code":"49","national_number":"17744455553"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"experience_context":{"brand_name":"Buy All The Things","locale":"de-DE","shipping_preference":"GET_FROM_FILE","return_url":"https://bron.com","cancel_url":"https://bron.com","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png","customer_service_instructions":["Rosenweg 20","12345 Berlin"]}}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"}]}, {'paypal-debug-id': '296c5d3d5066a'} );


    	const id = '0000000000000000A';

    	let payload = mockUtils.constructMockWebhookPayload(id, 'CHECKOUT.ORDER.COMPLETED');

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