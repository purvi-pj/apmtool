'use strict';

const util = require('util');

function renderButtons(req, res, next) {

    const SDK_ENV = req.body['environment'] || 'CUSTOM';
    const SDK_CURRENCY = req.body['currency'] || 'EUR';
    const SDK_BUYER_COUNTRY = req.body['buyerCountry'] || 'NL';
    const SELECTED_PAYMENT_SCHEME = req.body['paymentscheme'] || 'ideal';

    // Construct SDK URL
    const SDK_HOST = {
        LOCAL: 'http://localhost.paypal.com:8000',
        STAGE:  'https://www.msmaster.qa.paypal.com',
        SANDBOX:   'https://www.paypal.com',
        LIVE:   'https://www.paypal.com',
        CUSTOM: req.body['host'] || 'https://te-apm-logo-updates.qa.paypal.com'
    };
    const SDK_PATH = '/sdk/js';
    const CLIENT_ID = {
        LOCAL: {
            ROW: 'AZCjUMsPNzueEuqm2URngrs3LmVxfMQlFD2w3H3BNdo8f4g1Nbg0DEio_WrEpCBis7KPtw2l8OLVRiTS',
            OXXO: 'B_AmTklS604kjzhCGju0rjjhoY-iXBS9A0mX1sl2GrJ7cZwT4F7-0EaCK3VEBUvuhnVZtSUrzdYsJEeaj8',
            BOLETOBANCARIO: 'AWlIT0NTvtIe8FEoLoVz9N1DjFwY3SJZ8gF-Q6w4UjbwXsB6bfFlMAJUlab6AeTMfErhsTL7PRYCk88w'
        },
        STAGE: {
            ROW: 'AZCjUMsPNzueEuqm2URngrs3LmVxfMQlFD2w3H3BNdo8f4g1Nbg0DEio_WrEpCBis7KPtw2l8OLVRiTS',
            OXXO: 'B_AmTklS604kjzhCGju0rjjhoY-iXBS9A0mX1sl2GrJ7cZwT4F7-0EaCK3VEBUvuhnVZtSUrzdYsJEeaj8',
            BOLETOBANCARIO: 'AWlIT0NTvtIe8FEoLoVz9N1DjFwY3SJZ8gF-Q6w4UjbwXsB6bfFlMAJUlab6AeTMfErhsTL7PRYCk88w'
        },
        SANDBOX: {
            ROW: 'AXx6Sso7aff9cazBQ6WZq8kxFYEaMZk6VdRPnG3oi14fmhLLggN30PNuGl55fZABaI08qR4vjbdBkZo7'
        },
        LIVE: {
            ROW: 'AaXaDMFBQrXnmaEnnaDJaGze0SHvrWrtCTaKPizp6WWgbblSmMTtkYSuDTWoZ5fjN1oQfJHflrl69V2x'
        },
        CUSTOM: {
            ROW: 'AZCjUMsPNzueEuqm2URngrs3LmVxfMQlFD2w3H3BNdo8f4g1Nbg0DEio_WrEpCBis7KPtw2l8OLVRiTS',
            OXXO: 'B_AmTklS604kjzhCGju0rjjhoY-iXBS9A0mX1sl2GrJ7cZwT4F7-0EaCK3VEBUvuhnVZtSUrzdYsJEeaj8',
            BOLETOBANCARIO: 'AWlIT0NTvtIe8FEoLoVz9N1DjFwY3SJZ8gF-Q6w4UjbwXsB6bfFlMAJUlab6AeTMfErhsTL7PRYCk88w'
        }
    };

    const BRANDED_SDK_URL = util.format('%s%s?client-id=%s%s%s%s&debug=true',
        SDK_HOST[SDK_ENV],
        SDK_PATH,
        CLIENT_ID[SDK_ENV][SELECTED_PAYMENT_SCHEME.toUpperCase()] ? CLIENT_ID[SDK_ENV][SELECTED_PAYMENT_SCHEME.toUpperCase()] : CLIENT_ID[SDK_ENV]['ROW'],
        '&components=buttons,funding-eligibility',
        util.format('&currency=%s', SDK_CURRENCY),
        util.format('&buyer-country=%s', SDK_BUYER_COUNTRY));

    const UNBRANDED_SDK_URL = util.format('%s%s?client-id=%s%s%s%s&debug=true',
        SDK_HOST[SDK_ENV],
        SDK_PATH,
        CLIENT_ID[SDK_ENV][SELECTED_PAYMENT_SCHEME.toUpperCase()] ? CLIENT_ID[SDK_ENV][SELECTED_PAYMENT_SCHEME.toUpperCase()] : CLIENT_ID[SDK_ENV]['ROW'],
        '&components=buttons,payment-fields,marks,funding-eligibility',
        util.format('&currency=%s', SDK_CURRENCY),
        util.format('&buyer-country=%s', SDK_BUYER_COUNTRY));

    const BUTTON_STYLE = {
        COLOR: req.body['buttonColor'] || '',
        SHAPE: req.body['buttonShape'] || 'rect',
        LABEL: req.body['buttonLabel'] || '',
        HEIGHT: req.body['buttonHeight'] || ''
    };

	const prefillValue = {
	    environment: SDK_ENV,
	    host: SDK_HOST[SDK_ENV],
		paymentscheme: SELECTED_PAYMENT_SCHEME,
		currency: SDK_CURRENCY,
		buyerCountry: SDK_BUYER_COUNTRY,
        buttonColor: BUTTON_STYLE.COLOR,
        buttonShape: BUTTON_STYLE.SHAPE,
        buttonLabel: BUTTON_STYLE.LABEL,
        buttonHeight: BUTTON_STYLE.HEIGHT
	};

    const model = {
        currency: SDK_CURRENCY,
        buyerCountry: SDK_BUYER_COUNTRY,
        brandedSdkUrl: BRANDED_SDK_URL,
        unbrandedSdkUrl: UNBRANDED_SDK_URL,
        buttonStyle: BUTTON_STYLE,
        prefillValue: prefillValue
    };

    res.render('spb', model);

}

module.exports = {
    renderButtons
};