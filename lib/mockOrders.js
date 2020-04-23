'use strict';

const util = require('util');

function createOrder() {
	const MOCK_RESPONSE = {
	  "id": "34H41386LX6498925",
	  "intent": "CAPTURE",
	  "purchase_units": [
	    {
	      "reference_id": "default",
	      "amount": {
	        "currency_code": "EUR",
	        "value": "10.00"
	      },
	      "payee": {
	        "email_address": "_sys_ocean-487568640987143@paypal.com",
	        "merchant_id": "B4P8VXM65PD5W"
	      },
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
	      }
	    }
	  ],
	  "payer": {
	    "email_address": "eriyu@paypal.com",
	    "phone": {
	      "phone_type": "MOBILE",
	      "phone_number": {
	        "national_number": "14085551234"
	      }
	    }
	  },
	  "create_time": "2020-04-13T20:56:44Z",
	  "links": [
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925",
	      "rel": "self",
	      "method": "GET"
	    },
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com/checkoutnow?token=34H41386LX6498925",
	      "rel": "approve",
	      "method": "GET"
	    },
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925",
	      "rel": "update",
	      "method": "PATCH"
	    },
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925/capture",
	      "rel": "capture",
	      "method": "POST"
	    },
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925/confirm-payment-source",
	      "rel": "confirm",
	      "method": "POST"
	    }
	  ],
	  "status": "CREATED"
	};

	return MOCK_RESPONSE;
}

function confirmPaymentSource() {
	const MOCK_RESPONSE = {
	  "id": "34H41386LX6498925",
	  "intent": "CAPTURE",
	  "payment_source": {
	    "ideal": {
	      "name": "Test Test",
	      "country_code": "NL"
	    }
	  },
	  "links": [
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925",
	      "rel": "self",
	      "method": "GET"
	    },
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:20915/payment/ideal?token=34H41386LX6498925",
	      "rel": "approve",
	      "method": "GET"
	    }
	  ],
	  "status": "PAYER_AUTHENTICATION_REQUIRED"
	};

	return MOCK_RESPONSE;
}

function getOrder() {
	const MOCK_RESPONSE = {
	  "id": "34H41386LX6498925",
	  "intent": "CAPTURE",
	  "payment_source": {
	    "ideal": {
	      "name": "Test Test",
	      "country_code": "NL",
	      "bic": "ABNANL2A",
	      "iban_last_chars": "9820"
	    }
	  },
	  "purchase_units": [
	    {
	      "reference_id": "default",
	      "amount": {
	        "currency_code": "EUR",
	        "value": "10.00"
	      },
	      "payee": {
	        "email_address": "_sys_ocean-487568640987143@paypal.com",
	        "merchant_id": "B4P8VXM65PD5W"
	      },
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
	      }
	    }
	  ],
	  "payer": {
	    "name": {
	      "given_name": "",
	      "surname": ""
	    },
	    "payer_id": "ETZVQC6RZ8LWC",
	    "address": {
	      "country_code": "NL"
	    }
	  },
	  "create_time": "2020-04-13T20:56:44Z",
	  "links": [
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925",
	      "rel": "self",
	      "method": "GET"
	    },
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925",
	      "rel": "update",
	      "method": "PATCH"
	    },
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925/capture",
	      "rel": "capture",
	      "method": "POST"
	    }
	  ],
	  "status": "APPROVED"
	};

	return MOCK_RESPONSE;
}

function captureOrder() {
	const MOCK_RESPONSE = {
	  "id": "34H41386LX6498925",
	  "payment_source": {
	    "ideal": {
	      "name": "Test Test",
	      "country_code": "NL",
	      "bic": "ABNANL2A",
	      "iban_last_chars": "9820"
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
	            "id": "3JH00386PU4087002",
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
	                "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/payments/captures/3JH00386PU4087002",
	                "rel": "self",
	                "method": "GET"
	              },
	              {
	                "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/payments/captures/3JH00386PU4087002/refund",
	                "rel": "refund",
	                "method": "POST"
	              },
	              {
	                "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925",
	                "rel": "up",
	                "method": "GET"
	              }
	            ],
	            "create_time": "2020-04-13T20:57:26Z",
	            "update_time": "2020-04-13T20:57:26Z"
	          }
	        ]
	      }
	    }
	  ],
	  "payer": {
	    "payer_id": "ETZVQC6RZ8LWC",
	    "address": {
	      "country_code": "NL"
	    }
	  },
	  "links": [
	    {
	      "href": "https://te-apm-unbranded-e2e.qa.paypal.com:18824/v2/checkout/orders/34H41386LX6498925",
	      "rel": "self",
	      "method": "GET"
	    }
	  ],
	  "status": "COMPLETED"
	};

	return MOCK_RESPONSE;
}