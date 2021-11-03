const lodash = require('lodash');

'use strict';

const util        = require('util'),
      moment      = require('moment'),
      ordersUtils = require('../lib/orders'),
      dbUtils     = require('../lib/db'),
      PPWebhook   = require('../schemas/ppWebhook'),
      _           = require('underscore');

function ppWebhook(req, res, next) {

   // Persist incoming webhook
   let ppWebhook = new PPWebhook({
      BODY: req.body
   });

   ppWebhook.save();

   // Determine webhook and route to appropriate handler
   const WEBHOOK_EVENT_TYPE = req.body.event_type;

   console.log(util.format('INCOMING PAYPAL `%s` WEBHOOK FOR `%s`...', WEBHOOK_EVENT_TYPE, getOrderDetailsFromWebHook(req.body)));

  switch (WEBHOOK_EVENT_TYPE) {
    case 'PAYMENT.CAPTURE.DENIED':
      handlePaymentCaptureDenied(req)
        .then((resp) => {
          res.status(resp.status).send(resp.content);
        }).catch((err) => {
          console.log(err);
          res.status(err.status).send(err.content);
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
          res.status(err.status).send(err.content);
        });
      break;
    case 'PAYMENT.CAPTURE.COMPLETED':
      handlePaymentCaptureCompleted(req)
        .then((resp) => {
          res.status(resp.status).send(resp.content);
        }).catch((err) => {
          console.log(err);
          res.status(err.status).send(err.content);
        });
      break;
    default:
      break;
  };
}

// Retrieve order id from webhook body
// The up HATEOAS link indicates the order associated
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

// Handle PAYMENT.CAPTURE_DENIED webhook
// Add webhook to order details
// Get latest status of order capture (DENIED) from GET Order API and save to record
function handlePaymentCaptureDenied(req) {
   return new Promise((resolve, reject) => {

      // Retrieve order details from DB
      dbUtils.getOrderByOrderId({ orderId: getOrderDetailsFromWebHook(req.body) }).then((record) => {

         // If order record exists
         if (record) {

            // Persist webhook to order record
            const webhookEvent = {
               RECEIVED_DATE: moment().format(),
               BODY: req.body
            };
            record.WEBHOOK.push(webhookEvent)

            // Set arguments for GET order call
            const args = {
               accessToken: record.ACCESS_TOKEN,
               orderId: record.ORDER_ID,
               environment: record.ENVIRONMENT
            };

            ordersUtils.getOrder(args).then((result) => {
               if (result.statusCode === 200) {
                  record.STATUS = lodash.get(result,'response.purchase_units[0].payments.captures[0].status',"")
                  record.save();

                  // TODO: If payment capture is denied, do we need to retry capture?
                  // if (result.response.processing_instruction !== "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
                  //    ordersUtils.captureOrder(args)
                  //       .then((captureOrderResult) => {
                  //          if (captureOrderResult.statusCode < 400) {
                  //             // Response status code of capture order is successful
                  //             resolve({ status: 200, content: 'OK' });
                  //          } else {
                  //             reject({ status: 500, content: 'NOK' });
                  //          }
                  //       });
                  // }
               } else {
                  record.save();
                  reject({ status: 500, content: 'NOK' });
               }
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

// Handle PAYMENT.CAPTURE.PENDING webhook
// Add webhook to order details
function handlePaymentCapturePending(req) {
   return new Promise((resolve, reject) => {

      // Retrieve order details from DB
      dbUtils.getOrderByOrderId({ orderId: getOrderDetailsFromWebHook(req.body) }).then((record) => {

         // If order record exists   
         if (record) {

            // Persist webhook to order record
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

// Handle PAYMENT.CAPTURE.COMPLETED webhook
// Add webhook to order details
// Get latest status of order capture (COMPLETED) from GET Order API and save to record
function handlePaymentCaptureCompleted(req) {
   return new Promise((resolve, reject) => {

      // Retrieve order details from DB
      dbUtils.getOrderByOrderId({ orderId: getOrderDetailsFromWebHook(req.body) }).then((record) => {

         // If order record exists      
         if (record) {

            // Persist webhook to order record
            const webhookEvent = {
               RECEIVED_DATE: moment().format(),
               BODY: req.body
            };
            record.WEBHOOK.push(webhookEvent)

            // Set arguments for GET order call
            const args = {
               accessToken: record.ACCESS_TOKEN,
               orderId: record.ORDER_ID,
               environment: record.ENVIRONMENT
            };

            ordersUtils.getOrder(args).then((result) => {
               if (result.statusCode === 200) {
                  record.STATUS = lodash.get(result,'response.purchase_units[0].payments.captures[0].status',"")
                  record.save();
                  resolve({ status: 200, content: 'OK' });
               } else {
                  record.save();
                  reject({ status: 500, content: 'NOK' });
               }
            });            

            // TODO: If webhook indicates that payment capture has already been completed, why are we trying to capture it again?

            // ordersUtils.createAccessToken({ environment: record.ENVIRONMENT, clientType: record.CLIENT_TYPE })
            //   .then((accessTokenResult) => {
            //     const args = {
            //       accessToken: accessTokenResult['access_token'],
            //       orderId: record.ORDER_ID,
            //       environment: record.ENVIRONMENT
            //     };
            //     ordersUtils.getOrder(args)
            //       .then((result) => {
            //         if (result.statusCode === 200) {
            //           record.STATUS = result.status;
            //           record.save();
            //           if (result.response.processing_instruction !== "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
            //             ordersUtils.captureOrder(args)
            //               .then((captureOrderResult) => {
            //                 if (captureOrderResult.statusCode < 400) {
            //                   // Response status code of capture order is successful
            //                   resolve({ status: 200, content: 'OK' });
            //                 } else {
            //                   reject({ status: 500, content: 'NOK' });
            //                 }
            //               });
            //           }
            //         } else {
            //           reject({ status: 500, content: 'NOK' });
            //         }
            //       });
            //   }).catch((err) => {
            //     console.log(err);
            //     reject({ status: 500, content: 'NOK' });
            //   });

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

// Handle CHECKOUT.ORDER.APPROVED webhook
// Add webhook to order details
// For manual capture, get latest status of order status (APPROVED) from GET Order API and save to record
// For non-instant auto capture, get capture status (PENDING) from GET Order API and save to record
// If order status is approved, call POST Capture Order API
function handleCheckoutOrderApprovedWebhook(req) {
   return new Promise((resolve, reject) => {

      // Retrieve order details from DB
      dbUtils.getOrderByOrderId({ orderId: req.body.resource.id }).then((record) => {

         // If order record exists 
         if (record) {

            // Persist webhook to order record
            const webhookEvent = {
               RECEIVED_DATE: moment().format(),
               BODY: req.body
            };
            record.WEBHOOK.push(webhookEvent)

            // Set arguments for GET order and capture order
            const args = {
               accessToken: record.ACCESS_TOKEN,
               orderId: record.ORDER_ID,
               environment: record.ENVIRONMENT
            };

            ordersUtils.getOrder(args).then((result) => {

               if (result.statusCode === 200) {
                  if (result.response.processing_instruction === "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
                     record.STATUS = lodash.get(result,'response.purchase_units[0].payments.captures[0].status',"");
                  } else {
                     record.STATUS = result.status;
                  }

                  record.save();

                  // Only capture if order is in APPROVED status and not set for auto capture (ORDER_COMPLETE_ON_PAYMENT_APPROVAL)
                  if (result.status === 'APPROVED' && result.response.processing_instruction !== "ORDER_COMPLETE_ON_PAYMENT_APPROVAL") {
                  
                     ordersUtils.captureOrder(args).then((captureOrderResult) => {

                        // Consider any 2xx and 3xx as successful capture
                        if (captureOrderResult.statusCode < 400) {
                           resolve({ status: 200, content: 'OK' });
                        } else {
                           reject({ status: 500, content: 'NOK' });
                        }
                     });

                  // If order is already completed, response with OK
                  } else {
                     resolve({ status: 200, content: 'OK' });
                  }
               } else {
                  reject({ status: 500, content: 'NOK' });
               }
            });
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