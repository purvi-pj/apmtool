'use strict';

const indexRouter 			= require('../routes/index'),
	  launcherController	= require('../controllers/launcher'),
      util	    			= require('util'),
      assert    			= require('chai').assert,
      expect 				= require('chai').expect,
      moment    			= require('moment'),
      nock      			= require('nock'),
      request				= require('supertest'),
      express				= require('express'),
      adaro		 			= require('adaro'),
      path 					= require('path'),
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
      },
      GET_ORDER_API: {
        REQUEST_URL: 'https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U',
        RESPONSE: {
          "id": "5910681066059742U",
          "intent": "CAPTURE",
          "status": "COMPLETED",
          "payment_source": {
            "ideal": {
              "name": "Test User",
              "country_code": "NL",
              "bic": "ABNANL2A",
              "iban_last_chars": "2435"
            }
          },
          "purchase_units": [
            {
              "reference_id": "default",
              "amount": {
                "currency_code": "EUR",
                "value": "1.00"
              },
              "payee": {
                "email_address": "sb-azvx28274010@business.example.com",
                "merchant_id": "Y42LGQL8ZV7QS"
              },
              "payments": {
                "captures": [
                  {
                    "id": "6PB66769NX536002G",
                    "status": "COMPLETED",
                    "amount": {
                      "currency_code": "EUR",
                      "value": "1.00"
                    },
                    "final_capture": true,
                    "seller_protection": {
                      "status": "ELIGIBLE",
                      "dispute_categories": [
                        "ITEM_NOT_RECEIVED",
                        "UNAUTHORIZED_TRANSACTION"
                      ]
                    },
                    "seller_receivable_breakdown": {
                      "gross_amount": {
                        "currency_code": "EUR",
                        "value": "1.00"
                      },
                      "paypal_fee": {
                        "currency_code": "EUR",
                        "value": "0.44"
                      },
                      "net_amount": {
                        "currency_code": "EUR",
                        "value": "0.56"
                      }
                    },
                    "links": [
                      {
                        "href": "https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G",
                        "rel": "self",
                        "method": "GET"
                      },
                      {
                        "href": "https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund",
                        "rel": "refund",
                        "method": "POST"
                      },
                      {
                        "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U",
                        "rel": "up",
                        "method": "GET"
                      }
                    ],
                    "create_time": "2021-10-28T18:29:38Z",
                    "update_time": "2021-10-28T18:29:38Z"
                  }
                ]
              }
            }
          ],
          "create_time": "2021-10-28T18:29:01Z",
          "update_time": "2021-10-28T18:29:38Z",
          "links": [
            {
              "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U",
              "rel": "self",
              "method": "GET"
            }
          ]
        },
        CORRELATION_ID: '4d22efc5ae4a4'
      },
      CAPTURE_ORDER_API: {
        REQUEST_URL: 'https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U/capture',
        REQUEST: {

        },
        RESPONSE: {
          "name": "UNPROCESSABLE_ENTITY",
          "details": [
            {
              "issue": "ORDER_ALREADY_CAPTURED",
              "description": "Order already captured.If 'intent=CAPTURE' only one capture per order is allowed."
            }
          ],
          "message": "The requested action could not be performed, semantically incorrect, or failed business validation.",
          "debug_id": "508b173b37237",
          "links": [
            {
              "href": "https://developer.paypal.com/docs/api/orders/v2/#error-ORDER_ALREADY_CAPTURED",
              "rel": "information_link",
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

describe('controllers/launcher Unit Tests', function () {

	var app = express();

	app.engine('dust', adaro.dust());
	app.set('views', 'views');
	app.set('view engine', 'dust');	
	
	app.use(express.json());

	app.use('/', indexRouter);

	let mongoServer;

    before(async () => {

        // Create in memory mongoDB for test purposes
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {useNewUrlParser: true});

        createOrderInDb();

    });

    beforeEach(async () => {
        process.env.PP_SANDBOX_CLIENT_ID_PRIMARY = 'AVW9jGe1L0iEIZiL_AKUzgbX9zpCkYRvdoGtBHx9RuXXghVVTOedcme-DaqEcRnv6PhcoGZiufZJfh6u';
        process.env.PP_SANDBOX_CLIENT_ID_NO_WEBHOOK = 'AY2ioV5g6x49dgiegt6GI_XB-Nl9xCwYaHbDdIUqIBz7KA-fmWqA50Q20DWa9RLtld8Ox6YTEVsvKO7F';
        process.env.PP_SANDBOX_CLIENT_SECRET_PRIMARY = 'ED5avbhyQeqEs5WtAyg641-_-10pdONDD5sNxuGxVXbd1oi-tOs7gLArTrNzK79oHe5l7ZSbSmJi-eti';
        process.env.PP_SANDBOX_CLIENT_SECRET_NO_WEBHOOK = 'EIi-FZREjcOGHQxDW3glcrA4F9pBCmaOx-lzt9cccqEu9zH4EG5dR0zm5Wyn4o9QgINPkaiP795Lx-z2';

        // Mock PayPal access token API
        nock('https://api.sandbox.paypal.com')
            .post('/v1/oauth2/token')
            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});


        // Mock PayPal create order API
        nock('https://api.sandbox.paypal.com')
            .post('/v2/checkout/orders')
            .reply(201, {"id": "5910681066059742U","intent": "CAPTURE","status": "CREATED","purchase_units": [{"reference_id": "default","amount": {"currency_code": "EUR","value": "1.00"},"payee": {"email_address": "sb-azvx28274010@business.example.com","merchant_id": "Y42LGQL8ZV7QS"}}],"create_time": "2021-10-28T18:29:01Z","links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel": "self","method": "GET"},{"href": "https://www.sandbox.paypal.com/checkoutnow?token=5910681066059742U","rel": "approve","method": "GET"},{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel": "update","method": "PATCH"},{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U/capture","rel": "capture","method": "POST"}]}, { 'paypal-debug-id': '272074f1d72ce' });

        // Mock PayPal get order API
        nock('https://api.sandbox.paypal.com')
            .get('/v2/checkout/orders/5910681066059742U')
            .reply(200, {"id":"5910681066059742U","intent":"CAPTURE","status":"COMPLETED","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '4212092ea5991' });

        // Mock PayPal confirm payment source API
        nock('https://api.sandbox.paypal.com')
            .post('/v2/checkout/orders/5910681066059742U/confirm-payment-source')
            .reply(200, {"id":"5910681066059742U","intent":"CAPTURE","status":"PAYER_ACTION_REQUIRED","payment_source":{"ideal":{"name":"TestUser","country_code":"NL"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"},{"href":"https://sandbox.paypal.com/payment/ideal?token=5910681066059742U","rel":"payer-action","method":"GET"}]}, {'paypal-debug-id': '4d22efc5ae4a4'} );

        // Mock PayPal capture order source API
        nock('https://api.sandbox.paypal.com')
            .post('/v2/checkout/orders/5910681066059742U/capture')
            .reply(200, {"id":"5910681066059742U","status":"COMPLETED","payment_source":{"ideal":{"name":"TestUser","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]}, {'paypal-debug-id': '8eead21d239e6'} );

    });

    after(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });    	

    it('should return 200 for start page', function(done) {

		request(app)
			.get('/')
			.expect(200)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });    

    it('should return 200 for /create', function(done) {

		request(app)
			.post('/create')
			.send({ environment: 'SANDBOX', 
					clientType: 'WEBHOOK_CLIENT', 
					customClientId: 'MOCK_CUSTOM_CLIENT_ID', 
					customClientSecret: 'MOCK_CUSTOM_SECRET', 
					paymentscheme: 'ideal', 
					amount: '10.99', 
					currency: 'EUR', 
					countrycode: 'NL',
					bic: 'MOCK_BIC', 
					name: 'Unit Test', 
					email: 'unit@test.com', 
					phonenumber: '14085551234', 
					shippingpreference: 'NO_SHIPPING', 
					expiresInDay: '' })
			.expect(200)
			.type('json')
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });       

    it('should return 200 for /getOrder', function(done) {

		request(app)
			.post('/getOrder')
			.send({ orderId: '5910681066059742U',
					environment: 'SANDBOX', 
					clientType: 'WEBHOOK_CLIENT', 
					customClientId: 'MOCK_CUSTOM_CLIENT_ID', 
					customClientSecret: 'MOCK_CUSTOM_SECRET', 
					paymentscheme: 'ideal', 
					amount: '10.99', 
					currency: 'EUR', 
					countrycode: 'NL',
					bic: 'MOCK_BIC', 
					name: 'Unit Test', 
					email: 'unit@test.com', 
					phonenumber: '14085551234', 
					shippingpreference: 'NO_SHIPPING', 
					expiresInDay: '' })
			.expect(200)
			.type('json')
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });      

    it('should return 200 for /getOrderSummary', function(done) {

		request(app)
			.post('/getOrderSummary')
			.send({ orderId: '5910681066059742U' })
			.expect(200)
			.type('json')
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });        

    it('should return 200 for /getOrderStatus', function(done) {

		request(app)
			.post('/getOrderStatus')
			.send({ orderId: '5910681066059742U' })
			.expect(200)
			.type('json')
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });          

    it('should return 200 for /confirm', function(done) {

		request(app)
			.post('/confirm')
			.send({ orderId: '5910681066059742U',
					environment: 'SANDBOX', 
					clientType: 'WEBHOOK_CLIENT', 
					customClientId: 'MOCK_CUSTOM_CLIENT_ID', 
					customClientSecret: 'MOCK_CUSTOM_SECRET', 
					paymentscheme: 'ideal', 
					amount: '10.99', 
					currency: 'EUR', 
					countrycode: 'NL',
					bic: 'MOCK_BIC', 
					name: 'Unit Test', 
					email: 'unit@test.com', 
					phonenumber: '14085551234', 
					shippingpreference: 'NO_SHIPPING', 
					expiresInDay: '',
					approvalLinkBehavior: 'POPUP' })
			.expect(200)
			.type('json')
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });        

    it('should return 200 for /captureOrder', function(done) {

		request(app)
			.post('/captureOrder')
			.send({ orderId: '5910681066059742U',
					environment: 'SANDBOX', 
					clientType: 'WEBHOOK_CLIENT', 
					customClientId: 'MOCK_CUSTOM_CLIENT_ID', 
					customClientSecret: 'MOCK_CUSTOM_SECRET', 
					paymentscheme: 'ideal', 
					amount: '10.99', 
					currency: 'EUR', 
					countrycode: 'NL',
					bic: 'MOCK_BIC', 
					name: 'Unit Test', 
					email: 'unit@test.com', 
					phonenumber: '14085551234', 
					shippingpreference: 'NO_SHIPPING', 
					expiresInDay: '',
					approvalLinkBehavior: 'POPUP' })
			.expect(200)
			.type('json')
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });     

    it('should return 200 for /return', function(done) {

		request(app)
			.get('/return?token=5910681066059742U')
			.expect(200)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });          

    it('should return 200 for /cancel', function(done) {

		request(app)
			.get('/cancel?token=5910681066059742U')
			.expect(200)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });      

    it('should return 200 for /fullPageReturn', function(done) {

		request(app)
			.get('/fullPageReturn?token=5910681066059742U')
			.expect(200)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });         

    it('should return 200 for /fullPageCancel', function(done) {

		request(app)
			.get('/fullPageCancel?token=5910681066059742U')
			.expect(200)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });            

    it('should return 200 for /login', function(done) {

		request(app)
			.get('/login')
			.expect(200)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });         

    it('should return 302 for /logout', function(done) {

		request(app)
			.get('/logout')
			.expect(302)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });       

    it('should return 302 for /admin', function(done) {

		request(app)
			.get('/admin')
			.expect(302)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });          

    it('should return 302 for /createUser', function(done) {

		request(app)
			.post('/createUser')
			.send({ username: 'USER',
					passowrd: 'TEST' })
			.type('json')
			.expect(302)
			.end(function(err, res) {
				// console.log(JSON.stringify(res, null, 2));
				if (err) return done(err);
				return done();
			})
    });       

});