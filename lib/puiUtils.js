const paymentObjects = require('../config/paymentObjects.json'),
    _ = require('underscore');

const PUI_APM = 'pay_upon_invoice';

const isPUI = (apm) => {
    return PUI_APM === apm;
};

const getPurchaseUnitAmounts = (amount) => {
    let amountValue = 0;
    let itemTotalValue = 0;
    let shippingValue = 0;
    let taxTotalValue = 0;
    let itemValue = 0;
    let itemTaxValue = 0;

    const shippingTax = 10;
    const itemTax = 10;
    let valueWithTax = 0
    // need to test for different values
    amountValue = amount;
    shippingValue = amountValue/100 * shippingTax; 
    valueWithTax = amountValue - shippingValue;
    itemValue = Number(((valueWithTax*100)/(itemTax+100)).toFixed());
    itemTaxValue = valueWithTax - itemValue;
    itemTotalValue = itemValue;
    taxTotalValue = itemTaxValue;
    shippingValue = amountValue - itemTotalValue - taxTotalValue;
    
    return {
        amountValue, itemTotalValue, shippingValue, 
        taxTotalValue, itemValue, itemTaxValue
    }
};

const getCreateOrderPayload = (args) => {
    const { currency, amount, name } = args;

    const { amountValue, itemTotalValue, shippingValue, taxTotalValue,
        itemValue, itemTaxValue } = getPurchaseUnitAmounts(amount);

    const payload = {
        'intent': 'CAPTURE',
        'purchase_units': [
            {
                'invoice_id': 'Invoice-12345',
                'custom_id': 'Custom-1234',
                'amount': {
                    'currency_code': currency,
                    'value': amountValue,
                    'breakdown': {
                        'item_total': {
                            'currency_code': currency,
                            'value': itemTotalValue
                        },
                        'shipping': {
                            'currency_code': currency,
                            'value': shippingValue
                        },
                        'tax_total': {
                            'currency_code': currency,
                            'value': taxTotalValue
                        }
                    }
                },
                'shipping': {
                    'name': {
                        'full_name': name
                    },
                    'address': {
                        'address_line_1': '84 Schönhauser Allee',
                        'admin_area_2': 'Berlin',
                        'postal_code': '10439',
                        'country_code': 'DE'
                    }
                },
                'items': [
                    {
                        'name': 'DVD',
                        'category': 'PHYSICAL_GOODS',
                        'quantity': '1',
                        'unit_amount': {
                            'currency_code': currency,
                            'value': itemValue
                        },
                        'tax': {
                            'currency_code': currency,
                            'value': itemTaxValue
                        },
                        'tax_rate': '10.00'
                    }
                ]
            }
        ]
    }

    return payload;
};

const getConfirmPaymentSourcePayLoad = (args) => {
    const { birthDate, prefix, firstName, lastName, email, phoneNumber, phonePrefix,
        address_line_1, address_city, address_country_code, address_postal_code,
        brandName, merchantLanguage, merchantCountryCode, shippingPreference, logoUrl,
        cancelUrl,returnUrl, customerServiceInstruction1, customerServiceInstruction2,
        scheme
    } = args;

    const paymentSourceSchema = paymentObjects[scheme].schema; 
	const requiredFields = paymentObjects[scheme].required;
	
    const payload = {
        processing_instruction: 'ORDER_COMPLETE_ON_PAYMENT_APPROVAL',
        payment_source : {}
    }
	payload["payment_source"][scheme] = paymentSourceSchema;
	
    _.each(requiredFields,  (value, key, list) => {
	
        switch(value) {

            case 'birth_date':
                payload["payment_source"][scheme][value] = birthDate;
                break;

            case 'name':
                payload["payment_source"][scheme][value] = {
                    prefix,
                    given_name: firstName,
                    surname: lastName
                };
                break;

            case 'email':
                payload["payment_source"][scheme][value] = email;
                break;

            case 'phone':
                payload["payment_source"][scheme][value] = {
                    national_number: phoneNumber,
                    country_code: phonePrefix
                };
                break;
            		
            case 'billing_address':
                payload["payment_source"][scheme][value] = {
                    address_line_1,
                    admin_area_2: address_city,
                    postal_code: address_postal_code,
                    country_code: address_country_code
                };
                break;
            
            case 'experience_context':
                payload["payment_source"][scheme][value] = {
                    brand_name: brandName,
                    locale: `${merchantLanguage}-${merchantCountryCode}`,
                    shipping_preference: shippingPreference,
                    return_url: returnUrl,
                    cancel_url: cancelUrl,
                    logo_url: logoUrl,
                    customer_service_instructions: [
                        customerServiceInstruction1,
                        customerServiceInstruction2
                    ]
                };
                break;
            default:
                break;
        }
	
	});
    
    return payload;
};

const mockConfirmPaymentSourceResponse = () => {
    const response = {
        statusCode : 200,
        headers: {
            'paypal-debug-id': '098a44488df1762728'
        },
        body : {
            'id': '6VS085897D116680G',
            'status': 'PENDING_APPROVAL',
            'payment_source': {
                'pay_upon_invoice': {
                    'name': {
                        'prefix': 'Mr',
                        'given_name': 'Heinz',
                        'surname': 'Steeger'
                    },
                    'birth_date': '1990-01-01',
                    'email': 'altpay-order-1576716714@paypal.com',
                    'phone': {
                        'country_code': '49',
                        'national_number': '17744455553'
                    },
                    'billing_address': {
                        'address_line_1': '84 Schönhauser Allee',
                        'admin_area_2': 'Berlin',
                        'postal_code': '10439',
                        'country_code': 'DE'
                    },
                    'experience_context': {
                        'brand_name': 'Buy All The Things',
                        'locale': 'de-DE',
                        'shipping_preference': 'GET_FROM_FILE',
                        'return_url': 'https://bron.com',
                        'cancel_url': 'https://bron.com',
                        'logo_url': 'https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png',
                        'customer_service_instructions': [
                            'Rosenweg 20',
                            '12345 Berlin'
                        ]
                    }
                }
            },
            'links': [
                {
                    'href': 'https://te-altpay-instant-ppro.qa.paypal.com:18824/v2/checkout/orders/6VS085897D116680G',
                    'rel': 'self',
                    'method': 'GET'
                }
            ]
        }
    }

    return response;
}

const mockGetPaymentResponse = () => {
    const response = {
        statusCode : 200,
        headers: {
            'paypal-debug-id': '098a44488df1762728'
        },
        body: `{
            "id": "6VS085897D116680G",
            "intent": "CAPTURE",
            "status": "COMPLETED",
            "payment_source": {
                "pay_upon_invoice": {
                    "name": {
                        "given_name": "Heinz",
                        "surname": "Steeger"
                    },
                    "birth_date": "1990-01-01",
                    "email": "altpay-order-1576716714@paypal.com",
                    "phone": {
                        "country_code": "49",
                        "national_number": "17744455553"
                    },
                    "billing_address": {
                        "address_line_1": "84 Schönhauser Allee",
                        "admin_area_2": "Berlin",
                        "postal_code": "10439",
                        "country_code": "DE"
                    },
                    "experience_context": {
                        "brand_name": "Buy All The Things",
                        "locale": "de-DE",
                        "shipping_preference": "GET_FROM_FILE",
                        "return_url": "https://bron.com",
                        "cancel_url": "https://bron.com",
                        "logo_url": "https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png",
                        "customer_service_instructions": [
                            "Rosenweg 20",
                            "12345 Berlin"
                        ]
                    }
                }
            },
            "processing_instruction": "ORDER_COMPLETE_ON_PAYMENT_APPROVAL",
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
                            "tax_rate": "7.00",
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
                            "tax_rate": "7.00",
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
                    }
                }
            ],
            "create_time": "2021-11-16T14:49:22Z",
            "links": [
                {
                    "href": "https://te-altpay-instant-ppro.qa.paypal.com:18824/v2/checkout/orders/6VS085897D116680G",
                    "rel": "self",
                    "method": "GET"
                },
                {
                    "href": "https://te-altpay-instant-ppro.qa.paypal.com:18824/v2/checkout/orders/6VS085897D116680G",
                    "rel": "update",
                    "method": "PATCH"
                },
                {
                    "href": "https://te-altpay-instant-ppro.qa.paypal.com:18824/v2/checkout/orders/6VS085897D116680G/capture",
                    "rel": "capture",
                    "method": "POST"
                }
            ]
        }`
    }

    return response;
}


module.exports = {
    isPUI,
    getCreateOrderPayload,
    getConfirmPaymentSourcePayLoad,
    mockConfirmPaymentSourceResponse,
    mockGetPaymentResponse
}