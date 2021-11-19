'use strict';

const ordersUtils 		= require('../lib/orders'),
	  paymentObjects 	= require('../config/paymentObjects');

// Render form
function startOrder(req, res, next) {

	const { clientType, environment, customClientId, customClientSecret, paymentscheme, amount,
        currency, countrycode, address_line_1, address_city, address_country_code, address_postal_code,
        birthDate, prefix, firstName, lastName, phone, email, phonePrefix, brandName, merchantLanguage, 
        merchantCountryCode, shippingPreference, logoUrl, returnUrl, cancelUrl, customerServiceInstruction1,
        customerServiceInstruction2 } = req.query;

	const prefillValue = {
		environment: environment || 'SANDBOX',
		clientType: clientType || 'WEBHOOK_CLIENT',
        customClientId: customClientId || '',
        customClientSecret: customClientSecret || '',
        paymentscheme: paymentscheme || 'pay_upon_invoice',
        amount: amount || '10.00',
        currency: currency || 'EUR',
        countrycode: countrycode || 'DE',
        address_line_1: address_line_1 || '84 Schönhauser Allee',
        address_city: address_city || 'Berlin',
        address_country_code: address_country_code || 'DE',
        address_postal_code: address_postal_code || '10439',
        birthDate: birthDate || '1990-01-01',
        prefix: prefix || 'Mr',
        firstName: firstName || 'Heinz',
        lastName: lastName || 'Steeger',
        phone: phone || '17744455553',
        email: email || 'test@test.com',
        phonePrefix: phonePrefix || '49',
        brandName: brandName || 'Buy All The Things',
        merchantLanguage: merchantLanguage || 'de',
        merchantCountryCode: merchantCountryCode || 'DE',
        shippingPreference: shippingPreference || 'GET_FROM_FILE',
        logoUrl: logoUrl || 'https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_76x48.png',
        returnUrl: returnUrl || 'https://bron.com',
        cancelUrl: cancelUrl || 'https://bron.com',
        customerServiceInstruction1: customerServiceInstruction1 || 'Rosenweg 20',
        customerServiceInstruction2: customerServiceInstruction2 || '12345 Berlin'
	};

	res.render('puiLauncher', { user: req.user, schemesJSON: paymentObjects, prefillValue });

}

function confirmPaymentSource(req, res, next) {

	let args = {
		environment: req.body.environment,
		orderId: req.body.orderId,
		currency: req.body.currency,
		amount: req.body.amount,
		countryCode: req.body.countrycode,
		scheme: req.body.paymentscheme,
		address_line_1: req.body.address_line_1,
		address_city: req.body.address_city,
		address_country_code: req.body.address_country_code,
		address_postal_code: req.body.address_postal_code,
		birthDate: req.body.birthDate,
		prefix: req.body.prefix,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		phoneNumber: req.body.phonenumber,
		email: req.body.email,
		phonePrefix: req.body.phonePrefix,
		brandName: req.body.brandName,
		merchantLanguage: req.body.merchantLanguage,
		merchantCountryCode: req.body.merchantCountryCode,
		shippingPreference: req.body.shippingPreference,
		logoUrl: req.body.logoUrl,
		returnUrl: req.body.returnUrl,
		cancelUrl: req.body.cancelUrl,
		customerServiceInstruction1: req.body.customerServiceInstruction1,
		customerServiceInstruction2: req.body.customerServiceInstruction2
	};

	ordersUtils.createAccessToken({
		environment: req.body.environment,
		clientType: req.body.clientType,
		scheme: req.body.paymentscheme,
		customClientId: req.body.customClientId,
		customClientSecret: req.body.customClientSecret
	})

	.then((accessTokenResult) => {

		args.accessToken = accessTokenResult['access_token'];

		return ordersUtils.confirmPaymentSource(args);

	}).then((result) => {

		res.json(result);
	});	

}

module.exports = {
	startOrder,
	confirmPaymentSource
};