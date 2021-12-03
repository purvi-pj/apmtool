# PayPal APM Orders API Demo

## Overview
Sample application to demonstrate PayPal Orders APIs for Alternative Payment Methods

## What is an Alternative Payment Method (APM)?
https://developer.paypal.com/docs/checkout/integration-features/alternative-payment-methods/

## Development Environment Instructions
### Prerequisites for starting app locally
* Node 10+
* NPM 6+
* Running instance of MongoDB

### Development Configurations
* Local environmental configs should be created at `.env`
```
MONGO_ATLAS_URI=
PP_SANDBOX_CLIENT_ID_PRIMARY=
PP_SANDBOX_CLIENT_ID_NO_WEBHOOK=
PP_SANDBOX_CLIENT_SECRET_PRIMARY=
PP_SANDBOX_CLIENT_SECRET_NO_WEBHOOK=
PP_LIVE_CLIENT_ID_PRIMARY=
PP_LIVE_CLIENT_ID_NO_WEBHOOK=
PP_LIVE_CLIENT_SECRET_PRIMARY=
PP_LIVE_CLIENT_SECRET_NO_WEBHOOK=
RETURN_URL='http://127.0.0.1:3000/return'
CANCEL_URL='http://127.0.0.1:3000/cancel'
PP_MOCK_APPROVAL_URL='http://127.0.0.1:3000/mockPaymentSchemeApproval'
SESSION_SECRET=
PP_MOCK_WEBHOOK_URL='http://127.0.0.1:3000/ppwebhook'
NODE_ENV=
```

### Node module dependencies
* mongoosejs (https://mongoosejs.com/)
* passport-local (http://www.passportjs.org/packages/passport-local/)

### Starting app on local development machine
1. git clone project
2. npm install
3. Update local configuration values at `.env`
4. npm start
5. Navigate to http://127.0.0.1:3000/