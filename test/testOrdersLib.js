'use strict';

const orders    = require('../lib/orders'),
      util	    = require('util'),
      assert    = require('chai').assert,
      moment    = require('moment'),
      nock      = require('nock'),
      mongoose  = require('mongoose'),
      { MongoMemoryServer } = require('mongodb-memory-server');



describe('lib/orders Unit Tests', function () {

    let mongoServer;

    before(async () => {

        // Create in memory mongoDB for test purposes
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {useNewUrlParser: true});

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
        nock.cleanAll();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should successfully return a PayPal access token', function(done) {

        const args = {
            environment: 'SANDBOX',
            clientType: 'WEBHOOK_CLIENT'
        };

        orders.createAccessToken(args).then((result) => {

            const expectedResult = {
                "scope": "https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks",
                "access_token": "A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg",
                "token_type": "Bearer",
                "app_id": "APP-80W284485P519543T",
                "expires_in": 32103,
                "nonce": "2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"
            };

            assert.deepEqual(result, expectedResult, "Unexpected access token");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });

    });

    it('should successfully create a PayPal order', function(done) {

        const args = {
            accessToken: 'UNIT_TEST_ACCESS_TOKEN',
            environment: 'SANDBOX',
            name: 'Unit Test',
            emailAddress: 'unit@test.com',
            phoneNumber: '14085551234',
            currency: 'EUR',
            amount: '10.99',
            countryCode: 'NL',
            scheme: 'ideal',
            clientType: 'WEBHOOK_CLIENT'
        };

        orders.createOrder(args).then((result) => {

            const expectedResult = {
                "statusCode": 201,
                "orderId": '5910681066059742U',
                "request": {"intent":"CAPTURE","purchase_units":[{"amount":{"currency_code":"EUR","value":"10.99"}}]},
                "response": {"id": "5910681066059742U","intent": "CAPTURE","status": "CREATED","purchase_units": [{"reference_id": "default","amount": {"currency_code": "EUR","value": "1.00"},"payee": {"email_address": "sb-azvx28274010@business.example.com","merchant_id": "Y42LGQL8ZV7QS"}}],"create_time": "2021-10-28T18:29:01Z","links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel": "self","method": "GET"},{"href": "https://www.sandbox.paypal.com/checkoutnow?token=5910681066059742U","rel": "approve","method": "GET"},{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel": "update","method": "PATCH"},{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U/capture","rel": "capture","method": "POST"}]},
                "correlationIds": '272074f1d72ce'
            };

            assert.deepEqual(result, expectedResult, "Unexpected result");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });

    });    

    it('should successfully get a PayPal order', function(done) {

        const args = {
            accessToken: 'UNIT_TEST_ACCESS_TOKEN',
            orderId: '5910681066059742U',
            environment: 'SANDBOX'
        };

        orders.getOrder(args).then((result) => {

            const expectedResult = {
                statusCode: 200,
                status: 'COMPLETED',
                response: {"id":"5910681066059742U","intent":"CAPTURE","status":"COMPLETED","payment_source":{"ideal":{"name":"Test User","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"},"payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"create_time":"2021-10-28T18:29:01Z","update_time":"2021-10-28T18:29:38Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]},
                correlationIds: '4212092ea5991'
            }

            assert.deepEqual(result, expectedResult, "Unexpected result");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });

    });    

    it('should successfully confirm a payment source for a PayPal order', function(done) {

        const args = {
            accessToken: 'UNIT_TEST_ACCESS_TOKEN',
            orderId: '5910681066059742U',
            environment: 'SANDBOX',
            name: 'Unit Test',
            emailAddress: 'unit@test.com',
            phoneNumber: '14085551234',
            currency: 'EUR',
            amount: '10.99',
            countryCode: 'NL',
            scheme: 'ideal',
            returnUrl: 'http://127.0.0.1:3000/return',
            cancelUrl: 'http://127.0.0.1:3000/cancel'
        };

        orders.confirmPaymentSource(args).then((result) => {

            const expectedResult = {
                statusCode: 200,
                request: {
                    "payment_source": {
                        [args.scheme]: {
                            "country_code": args.countryCode,
                            "name": args.name
                        }
                    },
                    "application_context": {
                        "locale": util.format("en-%s", args.countryCode),
                        "return_url": args.returnUrl,
                        "cancel_url": args.cancelUrl
                    }
                },
                response: {"id":"5910681066059742U","intent":"CAPTURE","status":"PAYER_ACTION_REQUIRED","payment_source":{"ideal":{"name":"TestUser","country_code":"NL"}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"1.00"},"payee":{"email_address":"sb-azvx28274010@business.example.com","merchant_id":"Y42LGQL8ZV7QS"}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"},{"href":"https://sandbox.paypal.com/payment/ideal?token=5910681066059742U","rel":"payer-action","method":"GET"}]},
                correlationIds: '4d22efc5ae4a4'
            }

            assert.deepEqual(result, expectedResult, "Unexpected result");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });

    });        

    it('should successfully capture a PayPal order', function(done) {

        const args = {
            accessToken: 'UNIT_TEST_ACCESS_TOKEN',
            orderId: '5910681066059742U',
            environment: 'SANDBOX'
        };

        orders.captureOrder(args).then((result) => {

            const expectedResult = {
                statusCode: 201,
                request: {},
                response: {"id":"5910681066059742U","status":"COMPLETED","payment_source":{"ideal":{"name":"TestUser","country_code":"NL","bic":"ABNANL2A","iban_last_chars":"2435"}},"purchase_units":[{"reference_id":"default","payments":{"captures":[{"id":"6PB66769NX536002G","status":"COMPLETED","amount":{"currency_code":"EUR","value":"1.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"1.00"},"paypal_fee":{"currency_code":"EUR","value":"0.44"},"net_amount":{"currency_code":"EUR","value":"0.56"}},"links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/6PB66769NX536002G/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"up","method":"GET"}],"create_time":"2021-10-28T18:29:38Z","update_time":"2021-10-28T18:29:38Z"}]}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/5910681066059742U","rel":"self","method":"GET"}]},
                correlationIds: '8eead21d239e6'

            };

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });

    });  

    it('should return back valid instant scheme (ideal) confirm payment source payload', function(done) {

        const args = {
            returnUrl: 'http://127.0.0.1:3000/return',
            cancelUrl: 'http://127.0.0.1:3000/cancel',
            scheme: 'ideal',
            name: 'Unit Test',
            emailAddress: 'unit@test.com',
            countryCode: 'NL',
            bic: ''
        };

        orders.constructConfirmPaymentSourcePayload(args).then((result) => {

            const expectedResult = {
                "payment_source": {
                    [args.scheme]: {
                        "country_code": args.countryCode,
                        "name": args.name
                    }
                },
                "application_context": {
                    "locale": util.format("en-%s", args.countryCode),
                    "return_url": args.returnUrl,
                    "cancel_url": args.cancelUrl
                }
            };

            assert.deepEqual(result, expectedResult, "Unexpected confirm payment source schema");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });
    });

    it('should return back valid Oxxo confirm payment source payload', function(done) {

        const args = {
            returnUrl: 'http://127.0.0.1:3000/return',
            cancelUrl: 'http://127.0.0.1:3000/cancel',
            scheme: 'oxxo',
            name: 'Unit Test',
            emailAddress: 'unit@test.com',
            countryCode: 'MX',
            expiresInDays: '2'
        };

        orders.constructConfirmPaymentSourcePayload(args).then((result) => {

            const expectedResult = {
                "payment_source": {
                    [args.scheme]: {
                        "name": args.name,
                        "country_code": args.countryCode,
                        "expiry_date": moment().add(args.expiresInDays, 'days').format('YYYY-MM-DD'),
                        "email": args.emailAddress
                    }
                },
                "application_context": {
                    "locale": util.format("en-%s", args.countryCode),
                    "return_url": args.returnUrl,
                    "cancel_url": args.cancelUrl
                },
                "processing_instruction": "ORDER_COMPLETE_ON_PAYMENT_APPROVAL"
            };

            assert.deepEqual(result, expectedResult, "Unexpected confirm payment source schema");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });
    });	

    it('should return back valid Boleto confirm payment source payload', function(done) {

        const args = {
            returnUrl: 'http://127.0.0.1:3000/return',
            cancelUrl: 'http://127.0.0.1:3000/cancel',
            scheme: 'boletobancario',
            name: 'Unit Test',
            emailAddress: 'unit@test.com',
            countryCode: 'BR',
            expiresInDays: '2',
            taxid: '71265469000109',
            taxid_type: 'BR_CNPJ',
            address_line_1: '1048 - Bela Vista',
            address_line_2: '13º e 14º, Av. Paulista',
            admin_area_1: 'SP',
            admin_area_2: 'São Paulo',
            postal_code: '01310-100'
        };

        orders.constructConfirmPaymentSourcePayload(args).then((result) => {

            const expectedResult = {
                "payment_source": {
                    [args.scheme]: {
                        "name": args.name,
                        "country_code": args.countryCode,
                        "expiry_date": moment().add(args.expiresInDays, 'days').format('YYYY-MM-DD'),
                        "email": args.emailAddress,
                        "tax_info": {
                            "tax_id": args.taxid,
                            "tax_id_type": args.taxid_type
                        },
                        "billing_address": {
                            "address_line_1": args.address_line_1,
                            "address_line_2": args.address_line_2,
                            "admin_area_2": args.admin_area_2,
                            "admin_area_1": args.admin_area_1,
                            "postal_code": args.postal_code
                        }
                    }
                },
                "application_context": {
                    "locale": util.format("en-%s", args.countryCode),
                    "return_url": args.returnUrl,
                    "cancel_url": args.cancelUrl
                },
                "processing_instruction": "ORDER_COMPLETE_ON_PAYMENT_APPROVAL"
            };

            assert.deepEqual(result, expectedResult, "Unexpected confirm payment source schema");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });
    });     
});