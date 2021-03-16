const lodash = require('lodash');

'use strict';

const util = require('util'),
  moment = require('moment'),
  ordersUtils = require('../lib/orders'),
  dbUtils = require('../lib/db'),
  PPWebhook = require('../schemas/ppWebhook'),
  _ = require('underscore');

function ppWebhook(req, res, next) {

  console.log(util.format('INCOMING PAYPAL WEBHOOK...\n%s', JSON.stringify(req.body, null, 2)));

  // Persist incoming webhook
  let ppWebhook = new PPWebhook({
    BODY: req.body
  });

  ppWebhook.save();

  const WEBHOOK_EVENT_TYPE = req.body.event_type;

  switch (WEBHOOK_EVENT_TYPE) {
    case 'PAYMENT.CAPTURE.DENIED':
      handlePaymentCaptureDenied(req)
        .then((resp) => {
          res.status(resp.status).send(resp.content);
        }).catch((err) => {
          console.log(err);
          res.status(500).send('NOK');
        });
      break;
    case 'CHECKOUT.ORDER.APPROVED':
      handleCheckoutOrderApprovedWebhook(req)
        .then((resp) => {
          res.status(resp.status).send(resp.content);
        }).catch((err) => {
          res.status(err.status).send(err.content);
        });
      break;
    case 'PAYMENT.CAPTURE.PENDING':
      handlePaymentCapturePending(req)
        .then((resp) => {
          res.status(resp.status).send(resp.content);
        }).catch((err) => {
          console.log(err);
          res.status(500).send('NOK');
        });
      break;
    case 'PAYMENT.CAPTURE.COMPLETED':
      handlePaymentCaptureCompleted(req)
        .then((resp) => {
          res.status(resp.status).send(resp.content);
        }).catch((err) => {
          console.log(err);
          res.status(500).send('NOK');
        });
      break;
    default:
      break;
  };
}

function getOrderDetailsFromWebHook(body) {
  var orderId = '';
  let links = lodash.get(body, 'resource.links', []);
  const upLink = links.find(link => link.rel === "up");
  if (upLink && upLink.href) {
    const splitLink = upLink.href.split('/');
    orderId = splitLink[splitLink.length - 1]
  }
  return orderId;
}

function handlePaymentCaptureDenied(req) {
  return new Promise((resolve, reject) => {
    dbUtils.getOrderByOrderId({ orderId: getOrderDetailsFromWebHook(req.body) })
      .then((record) => {
        if (record) {
          const webhookEvent = {
            RECEIVED_DATE: moment().format(),
            BODY: req.body
          };
          record.WEBHOOK.push(webhookEvent)
          record.save();
          ordersUtils.createAccessToken({ environment: record.ENVIRONMENT, clientType: record.CLIENT_TYPE })
            .then((accessTokenResult) => {
              const args = {
                accessToken: accessTokenResult['access_token'],
                orderId: record.ORDER_ID,
                environment: record.ENVIRONMENT
              };
              ordersUtils.getOrder(args)
                .then((result) => {
                  if (result.statusCode === 200) {
                    record.STATUS = lodash.get(result,'response.purchase_units[0].payments.captures[0].status',"")
                    record.save();
                    if (result.response.processing_instruction !== "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
                      ordersUtils.captureOrder(args)
                        .then((captureOrderResult) => {
                          if (captureOrderResult.statusCode < 400) {
                            // Response status code of capture order is successful
                            resolve({ status: 200, content: 'OK' });
                          } else {
                            reject({ status: 500, content: 'NOK' });
                          }
                        });
                    }
                  } else {
                    reject({ status: 500, content: 'NOK' });
                  }
                });
            }).catch((err) => {
              console.log(err);
              reject({ status: 500, content: 'NOK' });
            });
          resolve({ status: 200, content: 'OK' });
        } else {
          console.log('INCOMING WEBHOOK ORDER NOT FOUND...');
          reject({ status: 404, content: 'NOK' });
        }
      }).catch((err) => {
        console.log('ERROR ON INCOMING WEBHOOK...');
        reject({ status: 500, content: 'NOK' });
      });
  });
}

function handlePaymentCapturePending(req) {
  return new Promise((resolve, reject) => {
    dbUtils.getOrderByOrderId({ orderId: getOrderDetailsFromWebHook(req.body) })
      .then((record) => {
        if (record) {
          const webhookEvent = {
            RECEIVED_DATE: moment().format(),
            BODY: req.body
          };
          record.WEBHOOK.push(webhookEvent)
          record.save();
          resolve({ status: 200, content: 'OK' });
        } else {
          console.log('INCOMING WEBHOOK ORDER NOT FOUND...');
          reject({ status: 404, content: 'NOK' });
        }
      }).catch((err) => {
        console.log('ERROR ON INCOMING WEBHOOK...');
        reject({ status: 500, content: 'NOK' });
      });
  });
}

function handlePaymentCaptureCompleted(req) {
  return new Promise((resolve, reject) => {
    dbUtils.getOrderByOrderId({ orderId: getOrderDetailsFromWebHook(req.body) })
      .then((record) => {
        if (record) {
          const webhookEvent = {
            RECEIVED_DATE: moment().format(),
            BODY: req.body
          };
          record.WEBHOOK.push(webhookEvent)
          record.save();
          ordersUtils.createAccessToken({ environment: record.ENVIRONMENT, clientType: record.CLIENT_TYPE })
            .then((accessTokenResult) => {
              const args = {
                accessToken: accessTokenResult['access_token'],
                orderId: record.ORDER_ID,
                environment: record.ENVIRONMENT
              };
              ordersUtils.getOrder(args)
                .then((result) => {
                  if (result.statusCode === 200) {
                    record.STATUS = result.status;
                    record.save();
                    if (result.response.processing_instruction !== "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
                      ordersUtils.captureOrder(args)
                        .then((captureOrderResult) => {
                          if (captureOrderResult.statusCode < 400) {
                            // Response status code of capture order is successful
                            resolve({ status: 200, content: 'OK' });
                          } else {
                            reject({ status: 500, content: 'NOK' });
                          }
                        });
                    }
                  } else {
                    reject({ status: 500, content: 'NOK' });
                  }
                });
            }).catch((err) => {
              console.log(err);
              reject({ status: 500, content: 'NOK' });
            });
          resolve({ status: 200, content: 'OK' });
        } else {
          console.log('INCOMING WEBHOOK ORDER NOT FOUND...');
          reject({ status: 404, content: 'NOK' });
        }
      }).catch((err) => {
        console.log('ERROR ON INCOMING WEBHOOK...');
        reject({ status: 500, content: 'NOK' });
      });
  });
}

function handleCheckoutOrderApprovedWebhook(req) {
  return new Promise((resolve, reject) => {

    dbUtils.getOrderByOrderId({ orderId: req.body.resource.id })

      .then((record) => {

        if (record) {

          const webhookEvent = {
            RECEIVED_DATE: moment().format(),
            BODY: req.body
          };

          record.WEBHOOK.push(webhookEvent)

          record.save();

          // Call GET Order to confirm status, and then capture

          ordersUtils.createAccessToken({ environment: record.ENVIRONMENT, clientType: record.CLIENT_TYPE })

            .then((accessTokenResult) => {

              const args = {
                accessToken: accessTokenResult['access_token'],
                orderId: record.ORDER_ID,
                environment: record.ENVIRONMENT
              };

              ordersUtils.getOrder(args)

                .then((result) => {

                  if (result.statusCode === 200) {
                    if (result.response.processing_instruction !== "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
                      record.STATUS = result.status;
                    } else {
                    record.STATUS = lodash.get(result,'response.purchase_units[0].payments.captures[0].status',"")
                    }
                    record.save();
                    if (result.response.processing_instruction !== "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
                      ordersUtils.captureOrder(args)

                        .then((captureOrderResult) => {

                          if (captureOrderResult.statusCode < 400) {
                            // Response status code of capture order is successful
                            resolve({ status: 200, content: 'OK' });
                          } else {
                            reject({ status: 500, content: 'NOK' });
                          }

                        });
                    }
                  } else {
                    reject({ status: 500, content: 'NOK' });
                  }

                });

            }).catch((err) => {

              console.log(err);

              reject({ status: 500, content: 'NOK' });

            });

          // resolve({ status: 200, content: 'OK' });

        } else {
          console.log('INCOMING WEBHOOK ORDER NOT FOUND...');
          reject({ status: 404, content: 'NOK' });
        }
      }).catch((err) => {
        console.log('ERROR ON INCOMING WEBHOOK...');
        reject({ status: 500, content: 'NOK' });
      });
  });
}

module.exports = {
  ppWebhook
}