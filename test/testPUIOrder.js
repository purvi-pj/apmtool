'use strict';

const orders    = require('../lib/orders'),
      util	    = require('util'),
      assert    = require('chai').assert,
      nock      = require('nock'),
      mongoose  = require('mongoose'),
      { MongoMemoryServer } = require('mongodb-memory-server');



describe('lib/orders PUI Unit Tests', function () {

    let mongoServer;

    before(async () => {

        // Create in memory mongoDB for test purposes
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {useNewUrlParser: true});

    });

    beforeEach(async () => {

        process.env.PP_SANDBOX_CLIENT_ID_PRIMARY = '';
        process.env.PP_SANDBOX_CLIENT_SECRET_PRIMARY = '';
        
        // Mock PayPal access token API
        nock('https://api.sandbox.paypal.com')
            .post('/v1/oauth2/token')
            .reply(200, {"scope":"https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks","access_token":"A21AAIAXvsGmBi5A-cGMLqNmykrp44LjzMO2DPhAVM8Joj_5KF-CAKMRfYxPhWx1i7h8CwJN_z5cORHLeQm9qY2yc5WsSf2Eg","token_type":"Bearer","app_id":"APP-80W284485P519543T","expires_in":32103,"nonce":"2021-10-28T18:24:03Z3Jfvc1JWJ4c_o0IG6CUwqmKYeyPcZ0EAKd44bArqWNo"});

        // Mock PayPal create order API
        nock('https://api.sandbox.paypal.com')
            .post('/v2/checkout/orders')
            .reply(201, {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"CREATED","purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","tax_rate":"10.00","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"create_time":"2022-01-27T13:04:07Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"},{"href":"https://www.sandbox.paypal.com/checkoutnow?token=2W669649PJ909081C","rel":"approve","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"update","method":"PATCH"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C/capture","rel":"capture","method":"POST"}]}, { 'paypal-debug-id': 'b138de4ee3054' });

        // Mock PayPal get order API
        nock('https://api.sandbox.paypal.com')
            .get('/v2/checkout/orders/2W669649PJ909081C')
            .reply(200, {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"COMPLETED","payment_source":{"pay_upon_invoice":{"name":{"given_name":"Heinz","surname":"Steeger"},"birth_date":"1990-01-01","email":"test@test.com","phone":{"country_code":"49","national_number":"17744455553"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"payment_reference":"GD043941595","deposit_bank_details":{"bic":"BELADEBEXXX","bank_name":"Test Sparkasse - Berlin","iban":"DE12345678901234567890","account_holder_name":"Paypal - Ratepay GmbH - Test Bank Account"},"experience_context":{"brand_name":"Buy All The Things","locale":"de-DE","shipping_preference":"GET_FROM_FILE","return_url":"https://bron.com","cancel_url":"https://bron.com","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png","customer_service_instructions":["Rosenweg 20","12345 Berlin"]}}},"processing_instruction":"ORDER_COMPLETE_ON_PAYMENT_APPROVAL","purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","tax_rate":"10.00","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}},"payments":{"captures":[{"id":"7CT64336M3282510T","status":"COMPLETED","amount":{"currency_code":"EUR","value":"10.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"10.00"},"paypal_fee":{"currency_code":"EUR","value":"0.54"},"net_amount":{"currency_code":"EUR","value":"9.46"}},"invoice_id":"Invoice-12345","custom_id":"Custom-1234","links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/7CT64336M3282510T","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/7CT64336M3282510T/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"up","method":"GET"}],"create_time":"2022-01-27T13:04:15Z","update_time":"2022-01-27T13:04:15Z"}]}}],"create_time":"2022-01-27T13:04:07Z","update_time":"2022-01-27T13:04:15Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"}]}, { 'paypal-debug-id': '8ff17ad81cf5' });

        // Mock PayPal confirm payment source API
        nock('https://api.sandbox.paypal.com')
            .post('/v2/checkout/orders/2W669649PJ909081C/confirm-payment-source')
            .reply(200, {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"PENDING_APPROVAL","payment_source":{"pay_upon_invoice":{"name":{"prefix":"Mr","given_name":"Heinz","surname":"Steeger"},"birth_date":"1990-01-01","email":"test@test.com","phone":{"country_code":"49","national_number":"17744455553"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"experience_context":{"brand_name":"Buy All The Things","locale":"de-DE","shipping_preference":"GET_FROM_FILE","return_url":"https://bron.com","cancel_url":"https://bron.com","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png","customer_service_instructions":["Rosenweg 20","12345 Berlin"]}}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"}]}, {'paypal-debug-id': '296c5d3d5066a'} );

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

        // update args
        const args = {
            accessToken: 'UNIT_TEST_ACCESS_TOKEN',
            environment: 'SANDBOX',
            name: 'HeinzSteeger',
            emailAddress: 'test@test.com',
            currency: 'EUR',
            amount: '10.00',
            countryCode: 'DE',
            scheme: 'pay_upon_invoice',
            clientType: 'WEBHOOK_CLIENT',
            returnUrl: 'http://127.0.0.1:3000/return',
            cancelUrl: 'http://127.0.0.1:3000/cancel',
        };

        orders.createOrder(args).then((result) => {

            const expectedResult = {
                "statusCode": 201,
                "orderId": '2W669649PJ909081C',
                "request": {"intent":"CAPTURE","purchase_units":[{"invoice_id":"Invoice-12345","custom_id":"Custom-1234","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":8},"shipping":{"currency_code":"EUR","value":1},"tax_total":{"currency_code":"EUR","value":1}}},"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}},"items":[{"name":"DVD","category":"PHYSICAL_GOODS","quantity":"1","unit_amount":{"currency_code":"EUR","value":8},"tax":{"currency_code":"EUR","value":1},"tax_rate":"10.00"}]}]},
                "response": {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"CREATED","purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","tax_rate":"10.00","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"create_time":"2022-01-27T13:04:07Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"},{"href":"https://www.sandbox.paypal.com/checkoutnow?token=2W669649PJ909081C","rel":"approve","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"update","method":"PATCH"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C/capture","rel":"capture","method":"POST"}]},
                "correlationIds": 'b138de4ee3054'
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
            orderId: '2W669649PJ909081C',
            environment: 'SANDBOX'
        };

        orders.getOrder(args).then((result) => {

            const expectedResult = {
                statusCode: 200,
                status: 'COMPLETED',
                response: {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"COMPLETED","payment_source":{"pay_upon_invoice":{"name":{"given_name":"Heinz","surname":"Steeger"},"birth_date":"1990-01-01","email":"test@test.com","phone":{"country_code":"49","national_number":"17744455553"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"payment_reference":"GD043941595","deposit_bank_details":{"bic":"BELADEBEXXX","bank_name":"Test Sparkasse - Berlin","iban":"DE12345678901234567890","account_holder_name":"Paypal - Ratepay GmbH - Test Bank Account"},"experience_context":{"brand_name":"Buy All The Things","locale":"de-DE","shipping_preference":"GET_FROM_FILE","return_url":"https://bron.com","cancel_url":"https://bron.com","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png","customer_service_instructions":["Rosenweg 20","12345 Berlin"]}}},"processing_instruction":"ORDER_COMPLETE_ON_PAYMENT_APPROVAL","purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","tax_rate":"10.00","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}},"payments":{"captures":[{"id":"7CT64336M3282510T","status":"COMPLETED","amount":{"currency_code":"EUR","value":"10.00"},"final_capture":true,"seller_protection":{"status":"ELIGIBLE","dispute_categories":["ITEM_NOT_RECEIVED","UNAUTHORIZED_TRANSACTION"]},"seller_receivable_breakdown":{"gross_amount":{"currency_code":"EUR","value":"10.00"},"paypal_fee":{"currency_code":"EUR","value":"0.54"},"net_amount":{"currency_code":"EUR","value":"9.46"}},"invoice_id":"Invoice-12345","custom_id":"Custom-1234","links":[{"href":"https://api.sandbox.paypal.com/v2/payments/captures/7CT64336M3282510T","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/payments/captures/7CT64336M3282510T/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"up","method":"GET"}],"create_time":"2022-01-27T13:04:15Z","update_time":"2022-01-27T13:04:15Z"}]}}],"create_time":"2022-01-27T13:04:07Z","update_time":"2022-01-27T13:04:15Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"}]},
                correlationIds: '8ff17ad81cf5'
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
            environment: 'SANDBOX',
            orderId: '2W669649PJ909081C',
            currency: 'EUR',
            amount: '10.00',
            scheme: 'pay_upon_invoice',
            address_line_1: '84 Schönhauser Allee',
            address_city: 'Berlin',
            address_country_code: 'DE',
            address_postal_code: '10439',
            birthDate: '1990-01-01',
            prefix: 'Mr',
            firstName: 'Heinz',
            lastName: 'Steeger',
            phoneNumber: '17744455553',
            email: 'test@test.com',
            phonePrefix: '49',
            brandName: 'Buy All The Things',
            merchantLanguage: 'de',
            merchantCountryCode: 'DE',
            shippingPreference: 'GET_FROM_FILE',
            logoUrl: 'https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png',
            returnUrl: 'https://bron.com',
            cancelUrl: 'https://bron.com',
            customerServiceInstruction1: 'Rosenweg 20',
            customerServiceInstruction2: '12345 Berlin',
            accessToken: 'UNIT_TEST_ACCESS_TOKEN'
        };
        
        orders.confirmPaymentSource(args).then((result) => {

            const expectedResult = {
                statusCode: 200,
                request: {"processing_instruction":"ORDER_COMPLETE_ON_PAYMENT_APPROVAL","payment_source":{"pay_upon_invoice":{"birth_date":"1990-01-01","name":{"given_name":"Heinz","surname":"Steeger","prefix":"Mr"},"email":"test@test.com","phone":{"national_number":"17744455553","country_code":"49"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"experience_context":{"locale":"de-DE","return_url":"https://bron.com","cancel_url":"https://bron.com","customer_service_instructions":["Rosenweg 20","12345 Berlin"],"brand_name":"Buy All The Things","shipping_preference":"GET_FROM_FILE","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png"}}}},
                response: {"id":"2W669649PJ909081C","intent":"CAPTURE","status":"PENDING_APPROVAL","payment_source":{"pay_upon_invoice":{"name":{"prefix":"Mr","given_name":"Heinz","surname":"Steeger"},"birth_date":"1990-01-01","email":"test@test.com","phone":{"country_code":"49","national_number":"17744455553"},"billing_address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"},"experience_context":{"brand_name":"Buy All The Things","locale":"de-DE","shipping_preference":"GET_FROM_FILE","return_url":"https://bron.com","cancel_url":"https://bron.com","logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png","customer_service_instructions":["Rosenweg 20","12345 Berlin"]}}},"purchase_units":[{"reference_id":"default","amount":{"currency_code":"EUR","value":"10.00","breakdown":{"item_total":{"currency_code":"EUR","value":"8.00"},"shipping":{"currency_code":"EUR","value":"1.00"},"tax_total":{"currency_code":"EUR","value":"1.00"}}},"payee":{"email_address":"pui-client-02@paypal.de","merchant_id":"3XW33KVY8B838"},"custom_id":"Custom-1234","invoice_id":"Invoice-12345","items":[{"name":"DVD","unit_amount":{"currency_code":"EUR","value":"8.00"},"tax":{"currency_code":"EUR","value":"1.00"},"quantity":"1","category":"PHYSICAL_GOODS"}],"shipping":{"name":{"full_name":"HeinzSteeger"},"address":{"address_line_1":"84 Schönhauser Allee","admin_area_2":"Berlin","postal_code":"10439","country_code":"DE"}}}],"links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/2W669649PJ909081C","rel":"self","method":"GET"}]},
                correlationIds: '296c5d3d5066a'
            }

            assert.deepEqual(result, expectedResult, "Unexpected result");

            done();

        }).catch((err) => {
            console.log(err);
            done(err);
        });
    });        	   
});