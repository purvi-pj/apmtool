'use strict';

const util = require('util');

function renderButtons(req, res, next) {

    const SDK_ENV = req.body['environment'] || 'CUSTOM';
    const SDK_CURRENCY = req.body['currency'] || 'EUR';
    const SDK_BUYER_COUNTRY = req.body['buyerCountry'] || 'NL';

    // Construct SDK URL
    const SDK_HOST = {
        LOCAL: 'http://localhost.paypal.com:8000',
        STAGE:  'https://www.msmaster.qa.paypal.com',
        LIVE:   'https://www.paypal.com',
        CUSTOM: req.body['host'] || 'https://te-apm-logo-updates.qa.paypal.com'
    };
    const SDK_PATH = '/sdk/js';
    const CLIENT_ID = {
        LOCAL:   'AZCjUMsPNzueEuqm2URngrs3LmVxfMQlFD2w3H3BNdo8f4g1Nbg0DEio_WrEpCBis7KPtw2l8OLVRiTS',
        STAGE:   'AZCjUMsPNzueEuqm2URngrs3LmVxfMQlFD2w3H3BNdo8f4g1Nbg0DEio_WrEpCBis7KPtw2l8OLVRiTS',
        LIVE:    'AaXaDMFBQrXnmaEnnaDJaGze0SHvrWrtCTaKPizp6WWgbblSmMTtkYSuDTWoZ5fjN1oQfJHflrl69V2x',
        CUSTOM:  'AZCjUMsPNzueEuqm2URngrs3LmVxfMQlFD2w3H3BNdo8f4g1Nbg0DEio_WrEpCBis7KPtw2l8OLVRiTS'
    };

    const SDK_URL = util.format('%s%s?client-id=%s%s%s%s&debug=true',
        SDK_HOST[SDK_ENV],
        SDK_PATH,
        CLIENT_ID[SDK_ENV],
        '&components=buttons,marks,funding-eligibility',
//        '&enable-funding=bancontact,eps,giropay,ideal,mybank,sofort,p24,blik,trustly,oxxo,boleto,wechatpay,mercadopago');
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
		paymentscheme: req.body['paymentscheme'] || 'ideal',
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
        sdkUrl: SDK_URL,
        buttonStyle: BUTTON_STYLE,
        prefillValue: prefillValue
    };

    res.render('spb', model);

}

module.exports = {
    renderButtons
};