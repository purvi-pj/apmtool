$(function () {

  $('#processingModal').modal({
    keyboard: false,
    focus: true,
    show: true
  })

  var $form       = $("#fullPageReturnForm"),
    orderId       = $form.find("input[name='orderId']").val(),
    environment   = $form.find("input[name='environment']").val(),
    clientType    = $form.find("input[name='clientType']").val(),
    paymentscheme = $form.find( "input[name='paymentScheme']" ).val(),
    accessToken   = $form.find( "input[name='accessToken']" ).val();

  var captureStatus = "";

  // Define in context API locations
  var confirmPaymentSourceUrl = 'confirm',
    getOrderUrl = 'getOrder',
    getOrderSummaryUrl = 'getOrderSummary',
    getOrderInternalStatusUrl = 'getOrderStatus',
    captureOrderUrl = 'captureOrder';

  (function () {
    function getUrlParameter(name) {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
      var results = regex.exec(location.search);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    //example
    captureStatus = getUrlParameter('capturestatus');
    orderStatus = getUrlParameter('resourcestatus');
    if (orderStatus ==="completed" && captureStatus === "pending") {
      $("#progressUpdate").append(`<p>[${getTimeString()}] Order has already been completed...</p>`);
      $("#progressUpdate").append(`<p>[${getTimeString()}] This is a non instant payment which is captured using webhooks...</p>`);
      orderSuccess(orderId);
    }
  })();

  if (!captureStatus) {
    if (clientType == 'WEBHOOK_CLIENT') {
      pollInternalOrderStatus(orderId, 1);
    } else {
      pollPPOrderStatus(orderId, 1);
    }
  }

  // Poll PayPal order status for any status update (used for non webhook use case)
  function pollPPOrderStatus(orderId, retryAttempts) {

    var getOrderRequest = $.post(getOrderUrl, { environment, orderId, clientType, paymentscheme, accessToken });

    getOrderRequest.done(function (data) {

      // Set maximum attempts to poll
      if (retryAttempts > 12) {
        $("#progressUpdate").append(`<p>[${getTimeString()}] Polling stopped - PayPal status of '${data.status}'...</p>`);
        orderFailure(orderId);
      } else {

        // If existing status is already beyond `PAYER_ACTION_REQUIRED` state, do not overwrite and display existing state
        switch (data.status) {
          case 'COMPLETED':
            $("#progressUpdate").append(`<p>[${getTimeString()}] Order has already been captured...</p>`);
            orderSuccess(orderId);
            break;
          case 'VOIDED':
            $("#progressUpdate").append(`<p>[${getTimeString()}] Order has already been voided...</p>`);
            orderFailure(orderId);
            break;
          // case 'CANCELLED':
          // 	$( "#progressUpdate" ).append( '<p>Order has already been cancelled...</p>');
          // 	orderFailure(orderId);								
          // 	break;						
          case 'APPROVED':
            $("#progressUpdate").append(`<p>[${getTimeString()}] PayPal status updated to '${data.status}'...</p><p>Capturing Order...</p>`);
            captureOrder(orderId);
            break;
          case undefined:
            setTimeout(function () { pollPPOrderStatus(orderId, retryAttempts + 1) }, 5000);
            break;
          default:
            setTimeout(function () { pollPPOrderStatus(orderId, retryAttempts + 1) }, 5000);
            $("#progressUpdate").append(`<p>[${getTimeString()}] Polling - PayPal status is still '${data.status}'... </p>`);
        }
      }
    });
  }

  // Poll internal order status for cancelled, redirect return, or abandoned use cases
  function pollInternalOrderStatus(orderId, retryAttempts) {

    // Only poll 5 times and then mark this transaction as failed due to abandonement on pop up
    if (retryAttempts > 20) {
      $("#progressUpdate").append(`<p>[${getTimeString()}] Payment Authorization Unknown...</p>`);
      orderFailure(orderId);
    } else {

      $("#progressUpdate").append(`<p>[${getTimeString()}] Waiting for 'CHECKOUT.ORDER.APPROVED' webhook...</p>`);

      // Poll internal status for `CANCELLED` or `REDIRECT_RETURN`
      var getOrderInternalStatusRequest = $.post(getOrderInternalStatusUrl, { orderId });

      getOrderInternalStatusRequest.done(function (result) {

        switch (result.STATUS) {
          case 'CANCELLED':
          case 'FULL_PAGE_CANCELLED':
            $("#progressUpdate").append(`<p>[${getTimeString()}] Transaction Cancelled ...</p>`);
            orderFailure(orderId);
            break;
          case 'REDIRECT_RETURN':
          case 'FULL_PAGE_REDIRECT_RETURN':
            if (clientType === 'POLLING_CLIENT') {
              pollPPOrderStatus(orderId, 1);
            } else {
              setTimeout(function () { pollInternalOrderStatus(orderId, retryAttempts + 1) }, 10000);
            }
            break;
          case 'COMPLETED':
            $("#progressUpdate").append(`<p>[${getTimeString()}] Webhook received...</p><p>Order Captured...</p>`);
            orderSuccess(orderId);
            break;
          default:
            setTimeout(function () { pollInternalOrderStatus(orderId, retryAttempts + 1) }, 10000);

        }

      });
    }
  }

  // Call capture order API
  function captureOrder(orderId) {
    var captureOrderRequest = $.post(captureOrderUrl, { environment, orderId, clientType, accessToken });

    captureOrderRequest.done(function (data) {
      if (data.statusCode < 400) {
        $("#progressUpdate").append(`<p>[${getTimeString()}] Order Captured...</p>`);
        orderSuccess(orderId);
      } else {
        $("#progressUpdate").append(`<p>[${getTimeString()}] Order Capture Failed...</p>`);
        orderFailure(orderId);
      }
    });
  }

  // Update modal UI on successful order 
  function orderSuccess(orderId) {
    $("#modalFooter").removeClass('d-none');
    $("#txnprogress").css('width', '100%').removeClass('progress-bar-animated').addClass('bg-success').attr('aria-valuenow', 100);
    $("#progressUpdate").append('<hr/><p><svg class="bi bi-check-circle text-success mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M15.354 2.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L8 9.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M8 2.5A5.5 5.5 0 1013.5 8a.5.5 0 011 0 6.5 6.5 0 11-3.25-5.63.5.5 0 11-.5.865A5.472 5.472 0 008 2.5z" clip-rule="evenodd"/></svg>SUCCESS</p>');

    var getOrderSummaryRequest = $.post(getOrderSummaryUrl, { orderId });

    getOrderSummaryRequest.done(function (data) {

      $("#progressUpdate").append('<hr/<p><pre>' + JSON.stringify(data, null, 2) + '</pre></p>');
    });
  }

  // Update modal UI on failed order
  function orderFailure(orderId) {
    $("#modalFooter").removeClass('d-none');
    $("#txnprogress").removeClass('progress-bar-animated').addClass('bg-danger');
    $("#progressUpdate").append('<hr/><p><svg class="bi bi-x-circle text-danger mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>FAILURE</p>');

    if (orderId) {

      var getOrderSummaryRequest = $.post(getOrderSummaryUrl, { orderId });

      getOrderSummaryRequest.done(function (data) {

        $("#progressUpdate").append('<hr/<p><pre>' + JSON.stringify(data, null, 2) + '</pre></p>');
      });
    }
  }

  function getTimeString() {
    return new Date().toLocaleTimeString([], { hour12: false });
  }

});