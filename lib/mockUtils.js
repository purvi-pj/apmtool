'use strict';

const util 		= require('util'), 
	  request	= require('request');

function sendMockWebhook(id, webhookType) {

	const MOCK_CHECKOUT_ORDER_APPROVED_WEBHOOK = {
        "id": "WH-COC11055RA711503B-4YM959094A144403T",
        "create_time": "2018-04-16T21:21:49.000Z",
        "event_type": "CHECKOUT.ORDER.APPROVED",
        "resource_type": "checkout-order",
        "resource_version": "2.0",
        "summary": "An order has been approved by buyer",
        "resource": {
            "id": id,
            "status": "APPROVED",
            "intent": "CAPTURE",
            "payer": {
                "name": {
                    "given_name": "John",
                    "surname": "Doe"
                },
                "email_address": "customer@example.com",
                "payer_id": "QYR5Z8XDVJNXQ"
            },
            "purchase_units": [
                {
                    "reference_id": "d9f80740-38f0-11e8-b467-0ed5f89f718b",
                    "amount": {
                        "currency_code": "USD",
                        "value": "100.00"
                    },
                    "payee": {
                        "email_address": "merchant@example.com"
                    },
                    "shipping": {
                        "method": "United States Postal Service",
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
            ],
            "create_time": "2018-04-01T21:18:49Z",
            "update_time": "2018-04-01T21:20:49Z",
            "links": [
                {
                    "href": util.format("https://api.paypal.com/v2/checkout/orders/%s", id),
                    "rel": "self",
                    "method": "GET"
                },
                {
                    "href": util.format("https://api.paypal.com/v2/checkout/orders/%s/capture", id),
                    "method": "POST"
                }
            ]
        },
        "links": [
            {
                "href": "https://api.paypal.com/v1/notifications/webhooks-events/WH-COC11055RA711503B-4YM959094A144403T",
                "rel": "self",
                "method": "GET"
            },
            {
                "href": "https://api.paypal.com/v1/notifications/webhooks-events/WH-COC11055RA711503B-4YM959094A144403T/resend",
                "rel": "resend",
                "method": "POST"
            }
        ],
        "event_version": "1.0"
    };

	const MOCK_PAYMENT_CAPTURE_COMPLETED_WEBHOOK = {
        "id": "WH-6AS38756DJ6997156-8S840474F1364642T",
        "event_version": "1.0",
        "create_time": "2020-05-20T00:33:49.335Z",
        "resource_type": "capture",
        "resource_version": "2.0",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "summary": "Payment completed for EUR 2.65 EUR",
        "resource": {
            "id": id,
            "amount": {
                "currency_code": "EUR",
                "value": "2.65"
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
                    "value": "2.65"
                },
                "paypal_fee": {
                    "currency_code": "EUR",
                    "value": "0.43"
                },
                "net_amount": {
                    "currency_code": "EUR",
                    "value": "2.22"
                }
            },
            "status": "COMPLETED",
            "create_time": "2020-05-20T00:33:43Z",
            "update_time": "2020-05-20T00:33:43Z",
            "links": [
                {
                    "href": util.format("https://api.paypal.com/v2/payments/captures/%s", id),
                    "rel": "self",
                    "method": "GET"
                },
                {
                    "href": util.format("https://api.paypal.com/v2/payments/captures/%s/refund", id),
                    "rel": "refund",
                    "method": "POST"
                },
                {
                    "href": "https://api.paypal.com/v2/checkout/orders/16B03454EE973522T",
                    "rel": "up",
                    "method": "GET"
                }
            ]
        },
        "links": [
            {
                "href": "https://api.paypal.com/v1/notifications/webhooks-events/WH-6AS38756DJ6997156-8S840474F1364642T",
                "rel": "self",
                "method": "GET"
            },
            {
                "href": "https://api.paypal.com/v1/notifications/webhooks-events/WH-6AS38756DJ6997156-8S840474F1364642T/resend",
                "rel": "resend",
                "method": "POST"
            }
        ]
    }

    let MOCK_WEBHOOK = MOCK_CHECKOUT_ORDER_APPROVED_WEBHOOK;

    switch (webhookType) {

        case 'CHECKOUT.ORDER.APPROVED':
            MOCK_WEBHOOK = MOCK_CHECKOUT_ORDER_APPROVED_WEBHOOK;
            break;
        case 'PAYMENT.CAPTURE.COMPLETED':
            MOCK_WEBHOOK = MOCK_PAYMENT_CAPTURE_COMPLETED_WEBHOOK;
            break;

    }

	const options = {
		method: 'POST',
		url: process.env.PP_MOCK_WEBHOOK_URL,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
		body: MOCK_WEBHOOK
	};

	console.log('SENDING MOCK `CHECKOUT_ORDER_APPROVED` WEBHOOK...');

	request(options, function (error, response, body) {

		if (error) {
			console.log(error);
		} else {
			console.log(util.format('WEBHOOK SENT, RESPONSE...`%s`', body));
		}

	});



}

module.exports = {
	sendMockWebhook
}