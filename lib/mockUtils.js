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

    const MOCK_CHECKOUT_ORDER_COMPLETED_WEBHOOK = {
      "id": "WH-3424333048889453R-0VU42175S8743431E",
      "event_version": "1.0",
      "create_time": "2021-11-09T16:58:03.342Z",
      "resource_type": "checkout-order",
      "resource_version": "2.0",
      "event_type": "CHECKOUT.ORDER.COMPLETED",
      "summary": "An order has been completed",
      "resource": {
        "update_time": "2021-11-09T16:57:42Z",
        "create_time": "2021-11-09T16:57:22Z",
        "purchase_units": [
          {
            "reference_id": "default",
            "amount": {
              "currency_code": "EUR",
              "value": "236.55",
              "breakdown": {
                "item_total": {
                  "currency_code": "EUR",
                  "value": "213.60"
                },
                "shipping": {
                  "currency_code": "EUR",
                  "value": "5.10"
                },
                "tax_total": {
                  "currency_code": "EUR",
                  "value": "17.85"
                }
              }
            },
            "payee": {
              "email_address": "DE-Biz-1597412389343119@paypal.com",
              "merchant_id": "F7G47L89KT6VU"
            },
            "custom_id": "Custom-1234",
            "invoice_id": "Invoice-12345",
            "items": [
              {
                "name": "DVD",
                "unit_amount": {
                  "currency_code": "EUR",
                  "value": "12.05"
                },
                "tax": {
                  "currency_code": "EUR",
                  "value": "2.29"
                },
                "quantity": "2",
                "category": "PHYSICAL_GOODS"
              },
              {
                "name": "handbag",
                "unit_amount": {
                  "currency_code": "EUR",
                  "value": "189.50"
                },
                "tax": {
                  "currency_code": "EUR",
                  "value": "13.27"
                },
                "quantity": "1",
                "description": "Black handbag.",
                "sku": "product34",
                "category": "PHYSICAL_GOODS"
              }
            ],
            "shipping": {
              "name": {
                "full_name": "Heinz Steeger"
              },
              "address": {
                "address_line_1": "84 Schönhauser Allee",
                "admin_area_2": "Berlin",
                "postal_code": "10439",
                "country_code": "DE"
              }
            },
            "payments": {
              "captures": [
                {
                  "id": "70D60084DH109732J",
                  "status": "COMPLETED",
                  "amount": {
                    "currency_code": "EUR",
                    "value": "236.55"
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
                      "value": "236.55"
                    },
                    "paypal_fee": {
                      "currency_code": "EUR",
                      "value": "7.30"
                    },
                    "net_amount": {
                      "currency_code": "EUR",
                      "value": "229.25"
                    }
                  },
                  "invoice_id": "Invoice-12345",
                  "links": [
                    {
                      "href": `https://api.sandbox.paypal.com/v2/payments/captures/${id}`,
                      "rel": "self",
                      "method": "GET"
                    },
                    {
                      "href": `https://api.sandbox.paypal.com/v2/payments/captures/${id}/refund`,
                      "rel": "refund",
                      "method": "POST"
                    },
                    {
                      "href": `https://api.sandbox.paypal.com/v2/checkout/orders/${id}`,
                      "rel": "up",
                      "method": "GET"
                    }
                  ],
                  "create_time": "2021-11-09T16:57:42Z",
                  "update_time": "2021-11-09T16:57:42Z"
                }
              ]
            }
          }
        ],
        "links": [
          {
            "href": util.format("https://api.paypal.com/v2/checkout/orders/%s", id),
            "rel": "self",
            "method": "GET"
          }
        ],
        "id": id,
        "payment_source": {},
        "intent": "CAPTURE",
        "status": "COMPLETED"
      },
      "links": [
        {
          "href": "https://api.paypal.com/v1/notifications/webhooks-events/WH-3424333048889453R-0VU42175S8743431E",
          "rel": "self",
          "method": "GET"
        },
        {
          "href": "https://api.paypal.com/v1/notifications/webhooks-events/WH-3424333048889453R-0VU42175S8743431E/resend",
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
      case 'CHECKOUT.ORDER.COMPLETED':
        MOCK_WEBHOOK = MOCK_CHECKOUT_ORDER_COMPLETED_WEBHOOK;
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

const getPUIMockOrder = () => {
  const mockOrder = {
    "ENVIRONMENT":"SANDBOX",
    "CLIENT_TYPE":"WEBHOOK_CLIENT",
    "CLIENT_ID":"ASvB3_xCct_71h7H3H1NMMM1KxfjuZnt0w_m1x0iS4-ztcw2GnPMzoG81Kts0EaBI08b3WPqr4b-zqTO",
    "ACCESS_TOKEN":"A21AALGMnLMgV7O6ugGEEt2O--5-ss4wGqNk_x-1s1zc7nOzcr47ajhIwO7s0mU1kG-2wd7Oygg3i7zRMqWU3BKANCT86g0vw",
    "PAYMENT_SCHEME":"pay_upon_invoice",
    "BUYER_NAME":"HeinzSteeger",
    "BUYER_EMAIL":"test@test.com",
    "BUYER_COUNTRY":"DE",
    "AMOUNT":"10.00",
    "CURRENCY":"EUR",
    "CREATE_ORDER_API":{
      "REQUEST_URL":"https://api.sandbox.paypal.com/v2/checkout/orders",
      "REQUEST":{
        "intent":"CAPTURE",
        "purchase_units":[
          {
            "invoice_id":"Invoice-12345",
            "custom_id":"Custom-1234",
            "amount":{
              "currency_code":"EUR",
              "value":"10.00",
              "breakdown":{
                "item_total":{
                  "currency_code":"EUR",
                  "value":8
                },
                "shipping":{
                  "currency_code":"EUR",
                  "value":1
                },
                "tax_total":{
                  "currency_code":"EUR",
                  "value":1
                }
              }
            },
            "shipping":{
            "name":{
            "full_name":"HeinzSteeger"
            },
            "address":{
            "address_line_1":"84 Schönhauser Allee",
            "admin_area_2":"Berlin",
            "postal_code":"10439",
            "country_code":"DE"
            }
            },
            "items":[
            {
            "name":"DVD",
            "category":"PHYSICAL_GOODS",
            "quantity":"1",
            "unit_amount":{
            "currency_code":"EUR",
            "value":8
            },
            "tax":{
            "currency_code":"EUR",
            "value":1
            },
            "tax_rate":"10.00"
            }
            ]
          }
        ]
      },
      "RESPONSE":{
        "id":"6ST85138L8074944D",
        "intent":"CAPTURE",
        "status":"CREATED",
        "purchase_units":[
          {
            "reference_id":"default",
            "amount":{
              "currency_code":"EUR",
              "value":"10.00",
              "breakdown":{
                "item_total":{
                "currency_code":"EUR",
                "value":"8.00"
                },
                "shipping":{
                  "currency_code":"EUR",
                  "value":"1.00"
                },
                "tax_total":{
                  "currency_code":"EUR",
                  "value":"1.00"
                }
              }
            },
            "payee":{
              "email_address":"pui-client-02@paypal.de",
              "merchant_id":"3XW33KVY8B838"
            },
            "custom_id":"Custom-1234",
            "invoice_id":"Invoice-12345",
            "items":[
              {
              "name":"DVD",
              "unit_amount":{
                "currency_code":"EUR",
                "value":"8.00"
              },
              "tax":{
                "currency_code":"EUR",
                "value":"1.00"
              },
              "quantity":"1",
                "tax_rate":"10.00",
                "category":"PHYSICAL_GOODS"
              }
            ],
            "shipping":{
              "name":{
                "full_name":"HeinzSteeger"
              },
              "address":{
                "address_line_1":"84 Schönhauser Allee",
                "admin_area_2":"Berlin",
                "postal_code":"10439",
                "country_code":"DE"
              }
            }
          }
        ],
        "create_time":"2022-02-01T02:53:13Z",
        "links":[
          {
            "href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D",
            "rel":"self",
            "method":"GET"
          },
          {
            "href":"https://www.sandbox.paypal.com/checkoutnow?token=6ST85138L8074944D",
            "rel":"approve",
            "method":"GET"
          },
          {
            "href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D",
            "rel":"update",
            "method":"PATCH"
          },
          {
            "href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D/capture",
            "rel":"capture",
            "method":"POST"
          }
        ]
      },
      "CORRELATION_ID":"ad05d0d451e25"
    },
    "INSERTION_DATE":"2022-02-01T02:53:12.442Z",
    "ORDER_ID":"6ST85138L8074944D",
    "STATUS":"COMPLETED",
    "CONFIRM_PAYMENT_SOURCE_API":{
      "REQUEST_URL":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D/confirm-payment-source",
      "REQUEST":{
        "processing_instruction":"ORDER_COMPLETE_ON_PAYMENT_APPROVAL",
        "payment_source":{
          "pay_upon_invoice":{
            "birth_date":"1990-01-01",
            "name":{
              "given_name":"Heinz",
              "surname":"Steeger",
              "prefix":"Mr"
            },
            "email":"test@test.com",
            "phone":{
              "national_number":"17744455553",
              "country_code":"49"
            },
            "billing_address":{
              "address_line_1":"84 Schönhauser Allee",
              "admin_area_2":"Berlin",
              "postal_code":"10439",
              "country_code":"DE"
            },
            "experience_context":{
              "locale":"de-DE",
              "return_url":"https://bron.com",
              "cancel_url":"https://bron.com",
              "customer_service_instructions":[
                "Rosenweg 20",
                "12345 Berlin"
              ],
              "brand_name":"Buy All The Things",
              "shipping_preference":"GET_FROM_FILE",
              "logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png"
            }
          }
        }
      },
      "RESPONSE":{
        "id":"6ST85138L8074944D",
        "intent":"CAPTURE",
        "status":"PENDING_APPROVAL",
        "payment_source":{
          "pay_upon_invoice":{
            "name":{
              "prefix":"Mr",
              "given_name":"Heinz",
              "surname":"Steeger"
            },
            "birth_date":"1990-01-01",
            "email":"test@test.com",
            "phone":{
              "country_code":"49",
              "national_number":"17744455553"
            },
            "billing_address":{
              "address_line_1":"84 Schönhauser Allee",
              "admin_area_2":"Berlin",
              "postal_code":"10439",
              "country_code":"DE"
            },
            "experience_context":{
              "brand_name":"Buy All The Things",
              "locale":"de-DE",
              "shipping_preference":"GET_FROM_FILE",
              "return_url":"https://bron.com",
              "cancel_url":"https://bron.com",
              "logo_url":"https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png",
              "customer_service_instructions":[
                "Rosenweg 20",
                "12345 Berlin"
              ]
            }
          }
        },
        "purchase_units":[
          {
            "reference_id":"default",
            "amount":{
              "currency_code":"EUR",
              "value":"10.00",
              "breakdown":{
                "item_total":{
                  "currency_code":"EUR",
                  "value":"8.00"
                },
                "shipping":{
                  "currency_code":"EUR",
                  "value":"1.00"
                },
                "tax_total":{
                  "currency_code":"EUR",
                  "value":"1.00"
                }
              }
            },
            "payee":{
              "email_address":"pui-client-02@paypal.de",
              "merchant_id":"3XW33KVY8B838"
            },
            "custom_id":"Custom-1234",
            "invoice_id":"Invoice-12345",
            "items":[
              {
                "name":"DVD",
                "unit_amount":{
                "currency_code":"EUR",
                "value":"8.00"
              },
              "tax":{
                "currency_code":"EUR",
                "value":"1.00"
              },
              "quantity":"1",
              "category":"PHYSICAL_GOODS"
              }
            ],
            "shipping":{
              "name":{
                "full_name":"HeinzSteeger"
              },
              "address":{
                "address_line_1":"84 Schönhauser Allee",
                "admin_area_2":"Berlin",
                "postal_code":"10439",
                "country_code":"DE"
              }
            }
          }
        ],
        "links":[
          {
            "href":"https://api.sandbox.paypal.com/v2/checkout/orders/6ST85138L8074944D",
            "rel":"self",
            "method":"GET"
          }
        ]
      },
      "CORRELATION_ID":"8c6281a144638"
    },
  };

  return mockOrder;
}

module.exports = {
  constructMockWebhookPayload,
  sendMockWebhook,
  getPUIMockOrder
}