'use strict';

const util    = require('util'),
      request = require('request');

/**
 * Create mock webhook payload
 * @param {string} id - Order ID to reference in payload
 * @param {string} webhookType - Type of webhook to mock (CHECKOUT.ORDER.APPROVED | PAYMENT.CAPTURE.COMPLETED | PAYMENT.CAPTURE.PENDING | PAYMENT.CAPTURE.DENIED)
 */
function constructMockWebhookPayload(id, webhookType) {
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
      "id": "WH-53W34588FG423192D-4JP29714N7885792F",
      "event_version": "1.0",
      "create_time": "2021-03-16T04:13:30.281Z",
      "resource_type": "capture",
      "resource_version": "2.0",
      "event_type": "PAYMENT.CAPTURE.COMPLETED",
      "summary": "Payment completed for MXN 1.0 MXN",
      "resource": {
        "amount": {
          "value": "1.00",
          "currency_code": "MXN"
        },
        "seller_protection": {
          "dispute_categories": [
            "ITEM_NOT_RECEIVED",
            "UNAUTHORIZED_TRANSACTION"
          ],
          "status": "ELIGIBLE"
        },
        "update_time": "2021-03-16T04:13:11Z",
        "create_time": "2021-03-16T04:12:14Z",
        "final_capture": true,
        "seller_receivable_breakdown": {
          "paypal_fee": {
            "value": "1.00",
            "currency_code": "MXN"
          },
          "gross_amount": {
            "value": "1.00",
            "currency_code": "MXN"
          },
          "net_amount": {
            "value": "0.00",
            "currency_code": "MXN"
          }
        },
        "links": [
          {
            "method": "GET",
            "rel": "self",
            "href": "https://api.sandbox.paypal.com/v2/payments/captures/0K1352960P423203C"
          },
          {
            "method": "POST",
            "rel": "refund",
            "href": "https://api.sandbox.paypal.com/v2/payments/captures/0K1352960P423203C/refund"
          },
          {
            "method": "GET",
            "rel": "up",
            "href": `https://api.sandbox.paypal.com/v2/checkout/orders/${id}`
          }
        ],
        "id": id,
        "status": "COMPLETED"
      },
      "links": [
        {
          "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-53W34588FG423192D-4JP29714N7885792F",
          "rel": "self",
          "method": "GET"
        },
        {
          "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-53W34588FG423192D-4JP29714N7885792F/resend",
          "rel": "resend",
          "method": "POST"
        }
      ]
    };

    const MOCK_PAYMENT_CAPTURE_PENDING_WEBHOOK = {
      "id": "WH-2PE07484MY3880928-1SL04823P6379870G",
      "event_version": "1.0",
      "create_time": "2021-03-16T04:12:33.808Z",
      "resource_type": "capture",
      "resource_version": "2.0",
      "event_type": "PAYMENT.CAPTURE.PENDING",
      "summary": "Payment pending for MXN 1.0 MXN",
      "resource": {
        "amount": {
          "value": "1.00",
          "currency_code": "MXN"
        },
        "seller_protection": {
          "dispute_categories": [
            "ITEM_NOT_RECEIVED",
            "UNAUTHORIZED_TRANSACTION"
          ],
          "status": "ELIGIBLE"
        },
        "update_time": "2021-03-16T04:12:14Z",
        "create_time": "2021-03-16T04:12:14Z",
        "final_capture": true,
        "links": [
          {
            "method": "GET",
            "rel": "self",
            "href": "https://api.sandbox.paypal.com/v2/payments/captures/0K1352960P423203C"
          },
          {
            "method": "POST",
            "rel": "refund",
            "href": "https://api.sandbox.paypal.com/v2/payments/captures/0K1352960P423203C/refund"
          },
          {
            "method": "GET",
            "rel": "up",
            "href": `https://api.sandbox.paypal.com/v2/checkout/orders/${id}`
          }
        ],
        "id": id,
        "status_details": {
          "reason": "OTHER"
        },
        "status": "PENDING"
      },
      "links": [
        {
          "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-2PE07484MY3880928-1SL04823P6379870G",
          "rel": "self",
          "method": "GET"
        },
        {
          "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-2PE07484MY3880928-1SL04823P6379870G/resend",
          "rel": "resend",
          "method": "POST"
        }
      ]
    };

    const MOCK_PAYMENT_CAPTURE_DENIED_WEBHOOK = {
      "id": "WH-1TW85072SJ7764036-40M00902YF732543P",
      "event_version": "1.0",
      "create_time": "2021-03-02T02:06:09.376Z",
      "resource_type": "capture",
      "resource_version": "2.0",
      "event_type": "PAYMENT.CAPTURE.DENIED",
      "summary": "Payment denied for MXN600.99 MXN",
      "resource": {
        "id": id,
        "amount": {
          "currency_code": "MXN",
          "value": "600.99"
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
            "currency_code": "MXN",
            "value": "600.99"
          },
          "net_amount": {
            "currency_code": "MXN",
            "value": "600.99"
          }
        },
        "invoice_id": "Invoice-12345",
        "custom_id": "Custom-1234",
        "status": "DECLINED",
        "create_time": "2021-03-02T01:56:42Z",
        "update_time": "2021-03-02T01:59:44Z",
        "links": [
          {
            "href": "https://msmaster2int.g.devqa.gcp.dev.paypalinc.com:25137/v2/payments/captures/76C42869PD241332K",
            "rel": "self",
            "method": "GET"
          },
          {
            "href": "https://msmaster2int.g.devqa.gcp.dev.paypalinc.com:25137/v2/payments/captures/76C42869PD241332K/refund",
            "rel": "refund",
            "method": "POST"
          },
          {
            "href": `https://api.sandbox.paypal.com/v2/checkout/orders/${id}`,
            "rel": "up",
            "method": "GET"
          }
        ]
      },
      "links": [
        {
          "href": "https://msmaster2int.g.devqa.gcp.dev.paypalinc.com:14084/v1/notifications/webhooks-events/WH-1TW85072SJ7764036-40M00902YF732543P",
          "rel": "self",
          "method": "GET"
        },
        {
          "href": "https://msmaster2int.g.devqa.gcp.dev.paypalinc.com:14084/v1/notifications/webhooks-events/WH-1TW85072SJ7764036-40M00902YF732543P/resend",
          "rel": "resend",
          "method": "POST"
        }
      ]
    };

    let MOCK_WEBHOOK = {};

    switch (webhookType) {

      case 'CHECKOUT.ORDER.APPROVED':
        MOCK_WEBHOOK = MOCK_CHECKOUT_ORDER_APPROVED_WEBHOOK;
        break;
      case 'PAYMENT.CAPTURE.COMPLETED':
        MOCK_WEBHOOK = MOCK_PAYMENT_CAPTURE_COMPLETED_WEBHOOK;
        break;
      case 'PAYMENT.CAPTURE.PENDING':
        MOCK_WEBHOOK = MOCK_PAYMENT_CAPTURE_PENDING_WEBHOOK;
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        MOCK_WEBHOOK = MOCK_PAYMENT_CAPTURE_DENIED_WEBHOOK;
        break;
      default:
        break;
    }  

    return MOCK_WEBHOOK;
  }

/**
 * Create mock webhook and send to `process.env.PP_MOCK_WEBHOOK_URL` endpoint
 * @param {string} id - Order ID to reference in payload
 * @param {string} webhookType - Type of webhook to mock (CHECKOUT.ORDER.APPROVED | PAYMENT.CAPTURE.COMPLETED | PAYMENT.CAPTURE.PENDING | PAYMENT.CAPTURE.DENIED)
 */
function sendMockWebhook(id, webhookType) {

  let MOCK_WEBHOOK = constructMockWebhookPayload(id, webhookType);

  const options = {
    method: 'POST',
    url: process.env.PP_MOCK_WEBHOOK_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
    body: MOCK_WEBHOOK
  };

  console.log(util.format('SENDING MOCK `%s` WEBHOOK...', webhookType));

  request(options, function (error, response, body) {

    if (error) {
      console.log(error);
    } else {
      console.log(util.format('WEBHOOK SENT, RESPONSE...`%s`', body));
    }

  });

}

module.exports = {
  constructMockWebhookPayload,
  sendMockWebhook
}