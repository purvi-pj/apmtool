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
    
    amountValue = amount;
    shippingValue = amountValue/100 * shippingTax; 
    valueWithTax = amountValue - shippingValue;
    itemValue = (((valueWithTax*100)/(itemTax+100)));
    itemTaxValue = valueWithTax - itemValue;
    itemTotalValue = itemValue;
    taxTotalValue = itemTaxValue;
    shippingValue = amountValue - itemTotalValue - taxTotalValue;
    
    return {
        amountValue: Number(amountValue).toFixed(2), 
        itemTotalValue: itemTotalValue.toFixed(2), 
        shippingValue: shippingValue.toFixed(2), 
        taxTotalValue: taxTotalValue.toFixed(2), 
        itemValue: itemValue.toFixed(2), 
        itemTaxValue: itemTaxValue.toFixed(2)
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
                payload["payment_source"][scheme][value].given_name = firstName;
                payload["payment_source"][scheme][value].surname = lastName;

                if (prefix) {
                    payload["payment_source"][scheme][value]['prefix'] = prefix;
                }
                break;

            case 'email':
                payload["payment_source"][scheme][value] = email;
                break;

            case 'phone':
                payload["payment_source"][scheme][value].national_number = phoneNumber;
                payload["payment_source"][scheme][value].country_code = phonePrefix;
                break;
            		
            case 'billing_address':
                payload["payment_source"][scheme][value].address_line_1 = address_line_1;
                payload["payment_source"][scheme][value].admin_area_2 = address_city;
                payload["payment_source"][scheme][value].postal_code = address_postal_code;
                payload["payment_source"][scheme][value].country_code = address_country_code;

                break;
            
            case 'experience_context':
                payload["payment_source"][scheme][value].locale = `${merchantLanguage}-${merchantCountryCode}`;
                payload["payment_source"][scheme][value].return_url = returnUrl;
                payload["payment_source"][scheme][value].cancel_url = cancelUrl;
                payload["payment_source"][scheme][value].customer_service_instructions = [
                    customerServiceInstruction1,
                    customerServiceInstruction2
                ];
                
                if (brandName) {
                    payload["payment_source"][scheme][value]['brand_name'] = brandName;
                }
                if (shippingPreference) {
                    payload["payment_source"][scheme][value]['shipping_preference'] = shippingPreference;
                }
                if (logoUrl) {
                    payload["payment_source"][scheme][value]['logo_url'] = logoUrl;
                }
                
                break;
            default:
                break;
        }
	
	});
    
    return payload;
};



module.exports = {
    isPUI,
    getCreateOrderPayload,
    getConfirmPaymentSourcePayLoad
}