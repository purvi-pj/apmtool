'use strict';

const indexRouter 			= require('../routes/index'),
	    historyController	= require('../controllers/history'),
      PPOrder         = require('../schemas/ppOrder'),
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

describe('controllers/history Unit Tests', function () {

	var app = express();

	app.engine('dust', adaro.dust());
	app.set('views', 'views');
	app.set('view engine', 'dust');	
	
	app.use(express.json());

	app.use('/', indexRouter);

	let mongoServer;

    before(async () => {

        process.env.PP_SANDBOX_CLIENT_ID_PRIMARY = 'AVW9jGe1L0iEIZiL_AKUzgbX9zpCkYRvdoGtBHx9RuXXghVVTOedcme-DaqEcRnv6PhcoGZiufZJfh6u';
        process.env.PP_SANDBOX_CLIENT_ID_NO_WEBHOOK = 'AY2ioV5g6x49dgiegt6GI_XB-Nl9xCwYaHbDdIUqIBz7KA-fmWqA50Q20DWa9RLtld8Ox6YTEVsvKO7F';
        process.env.PP_SANDBOX_CLIENT_SECRET_PRIMARY = 'ED5avbhyQeqEs5WtAyg641-_-10pdONDD5sNxuGxVXbd1oi-tOs7gLArTrNzK79oHe5l7ZSbSmJi-eti';
        process.env.PP_SANDBOX_CLIENT_SECRET_NO_WEBHOOK = 'EIi-FZREjcOGHQxDW3glcrA4F9pBCmaOx-lzt9cccqEu9zH4EG5dR0zm5Wyn4o9QgINPkaiP795Lx-z2';	

        // Create in memory mongoDB for test purposes
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {useNewUrlParser: true});

          createOrderInDb();

    });

    after(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });    	

    it('should return 200 for POST /history', function(done) {

  		request(app)
  			.post('/history')
        .send({ orderId: '5910681066059742U'})
        .type('json')
  			.expect(200)
  			.end(function(err, res) {
  				// console.log(JSON.stringify(res, null, 2));
  				if (err) return done(err);
  				return done();
  			})
    });        

});