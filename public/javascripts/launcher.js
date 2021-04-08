$(function () {

  function isNonInstantApm(apm) {
    return ['oxxo', 'multibanco', 'boletobancario'].some(val => val === apm);
  }

  $("#paymentscheme").change(function () {
    $("#bic_optional").addClass("d-none");

    var tag = $("#paymentscheme").val();

    if (tag) {

      // Determine mandatory fields and toggle display for fields
      var mandatoryFields = schemesJSON[tag].optional;
      $.each(mandatoryFields, function (index, value) {
        var fieldId = ("#" + value + "_optional").replace(/\./g, '\\\.');
        $(fieldId).removeClass("d-none");
      });
      prePopulateNonInstantFields(tag);
    }
  });

  function prePopulateNonInstantFields(apmTag) {
    function defaultSettings(country, currency, showExpiryField) {
      $("#createOrderForm").find("input[name='countrycode']").val(country);
      $("#createOrderForm").find("input[name='currency']").val(currency);
      if (showExpiryField) {
        $("#expires_optional").removeClass("d-none");
      } else {
        $("#expires_optional").addClass("d-none");
      }
    }
    if (isNonInstantApm(apmTag)) {
      $("#pollingClientGrp").hide();
      $("#webhookClient").prop("checked", true);
    } else {
      $("#pollingClientGrp").show();
    }
    $('#boleto_fields').addClass('d-none');
    switch (apmTag) {
      case 'oxxo':
        defaultSettings("MX", "MXN", true)
        break;
      case 'multibanco':
        defaultSettings("PT", "EUR", false)
        break;
      case 'boletobancario':
        defaultSettings("BR", "BRL", true)
        $('#boleto_fields').removeClass('d-none');
        break;
      case 'ideal':
        defaultSettings("NL", "EUR", false)
        break;
      case 'sofort':
        defaultSettings("NL", "EUR", false)
        break;
      case 'mybank':
        defaultSettings("IT", "EUR", false)
        break;
      case 'eps':
        defaultSettings("AT", "EUR", false)
        break;
      case 'giropay':
        defaultSettings("DE", "EUR", false)
        break;
      case 'bancontact':
        defaultSettings("BE", "EUR", false)
        break;
      case 'p24':
        defaultSettings("PL", "EUR", false)
        break;
      case 'alipay':
        defaultSettings("CN", "EUR", false)
        break;
      case 'wechatpay':
        defaultSettings("CN", "EUR", false)
        break;
      case 'verkkopankki':
        defaultSettings("FI", "EUR", false)
        break;
      case 'blik':
        defaultSettings("PL", "PLN", false)
        break;
      case 'payu':
        defaultSettings("CZ", "CZK", false)
        break;
      case 'poli':
        defaultSettings("PL", "PLN", false)
        break;
      case 'trustly':
        defaultSettings("FI", "EUR", false)
        break;
      default:
        defaultSettings("", "", false)
    }
  }

  // Prefill values
  $("#createOrderForm").find("input[name='environment']").val([prefillJSON.environment]);
  $("#createOrderForm").find("input[name='clientType']").val([prefillJSON.clientType]);
  $("#createOrderForm").find("input[name='approvalLinkBehavior']").val([prefillJSON.approvalLinkBehavior]);
  $("#createOrderForm").find("select[name='paymentscheme']").val([prefillJSON.paymentscheme]);
  $("#createOrderForm").find("input[name='amount']").val([prefillJSON.amount]);
  $("#createOrderForm").find("input[name='currency']").val([prefillJSON.currency]);
  $("#createOrderForm").find("input[name='countrycode']").val([prefillJSON.countrycode]);
  $("#createOrderForm").find("input[name='bic']").val([prefillJSON.bic]);
  $("#createOrderForm").find("input[name='name']").val([prefillJSON.name]);
  $("#createOrderForm").find("input[name='email']").val([prefillJSON.email]);

  // After prefill, determine whether to show bic
  var prefillScheme = $("#paymentscheme").val();
  prePopulateNonInstantFields(prefillScheme);
  var mandatoryFields = schemesJSON[prefillScheme].optional;
  $.each(mandatoryFields, function (index, value) {
    var fieldId = ("#" + value + "_optional").replace(/\./g, '\\\.');
    $(fieldId).removeClass("d-none");
  });

  

  // Attach handler to button click event
  $("#submitBtn").click(function (event) {

    // Stop form from submitting normally
    event.preventDefault();

    // Extract values from form
    var $form = $("#createOrderForm"),
      clientType = $form.find("input[name='clientType']:checked").val(),
      environment = $form.find("input[name='environment']:checked").val(),
      approvalLinkBehavior = $form.find("input[name='approvalLinkBehavior']:checked").val(),
      paymentscheme = $form.find("select[name='paymentscheme']").val(),
      amount = $form.find("input[name='amount']").val(),
      currency = $form.find("input[name='currency']").val(),
      countrycode = $form.find("input[name='countrycode']").val(),
      expiresInDays = $form.find("input[name='expiresInDays']").val(),
      taxid = $form.find("input[name='taxid']").val(),
      taxid_type = $form.find("input[name='taxid_type']").val(),
      address_line_1 = $form.find("input[name='address_line_1']").val(),
      address_line_2 = $form.find("input[name='address_line_2']").val(),
      admin_area_2 = $form.find("input[name='admin_area_2']").val(),
      admin_area_1 = $form.find("input[name='admin_area_1']").val(),
      postal_code = $form.find("input[name='postal_code']").val(),
      name = $form.find("input[name='name']").val(),
      email = $form.find("input[name='email']").val(),
      phonenumber = $form.find("input[name='phonenumber']").val(),
      bic = $form.find("input[name='bic']").val(),
      shippingpreference = $form.find("input[name='shippingpreference']:checked").val(),
      url = $form.attr("action");

    // Apply "sticky" selected settings to start over link
    $("#startOverLink").attr("href", `/?environment=${environment}&clientType=${clientType}&approvalLinkBehavior=${approvalLinkBehavior}&paymentscheme=${paymentscheme}&amount=${amount}&currency=${currency}&countrycode=${countrycode}&bic=${bic}&name=${name}&email=${email}`);

    // Define in context API locations
    var confirmPaymentSourceUrl = 'confirm',
      getOrderUrl = 'getOrder',
      getOrderSummaryUrl = 'getOrderSummary',
      getOrderInternalStatusUrl = 'getOrderStatus',
      captureOrderUrl = 'captureOrder',
      orderId = '';

    // Initiate create order
    var createOrderRequest = $.post(url, { environment, clientType, paymentscheme, amount, currency, countrycode, name, email, phonenumber, shippingpreference, expiresInDays });

    // On create order completion, update progress on parent page
    createOrderRequest.done(function (data) {
      $("#txnprogress").css('width', '25%').attr('aria-valuenow', 25);

      // On successful Create Order API
      if (data.statusCode < 400) {

        // Set order id from Create Order API response
        orderId = data.orderId;

        // Update modal on UI
        $("#progressUpdate").empty().append(`<p>[${getTimeString()}] Created Order Id... ${data.orderId}</p><p>[${getTimeString()}] Confirming Payment Source...</p>`);

        // Call Confirm Payment Source API upon successful Create Order API
        var confirmPaymentSource = $.post(confirmPaymentSourceUrl, {
          environment, clientType, orderId, paymentscheme, amount, currency,
          countrycode, name, email, phonenumber, bic, approvalLinkBehavior, expiresInDays,
          taxid,taxid_type, address_line_1,address_line_2,admin_area_1,admin_area_2,postal_code,
        });

        confirmPaymentSource.done(function (data) {

          /// On successful Confirm Payment API
          if (data.statusCode < 400) {
            $("#txnprogress").css('width', '50%').attr('aria-valuenow', 50);
            var approvalurl = data.response.links.find(x => x.rel === 'payer-action').href;

            if (isNonInstantApm(paymentscheme)) {
              $("#progressUpdate").append(`<p>[${getTimeString()}] Payment Source confirmed...</p>`);

              openNonInstantApmPopUp(approvalurl)

            } else {
              // Update modal on UI
              $("#progressUpdate")
                .append(`<p>[${getTimeString()}] Payment Source confirmed...</p>
            <p>[${ getTimeString()}] Waiting for payment scheme approval...</p>`);

              // Open approval URL returned from Confirm Payment API
              openPopUp(approvalurl);
            }

          } else {

            // On failed Confirm Payment API, update modal on UI with error
            $("#progressUpdate").append(`<p>[${getTimeString()}] Confirm Payment Source Failed...</p>`);
            $("#progressUpdate").append('<p><pre>' + JSON.stringify(data.response, null, 2) + '</pre></p>');
            orderFailure(orderId);
          }
        });
      } else {

        // On failed Create Order API, update modal on UI with error
        $("#progressUpdate").empty().append(`<p>[${getTimeString()}] Order Creation Failed...</p>`);
        $("#progressUpdate").append('<p><pre>' + JSON.stringify(data.response, null, 2) + '</pre></p>');
        orderFailure();
      }
    });

    // Open approval URL in pop up window for desktop experiences
    function openNonInstantApmPopUp(approvalurl) {

      var windowObjectReference;

      if (approvalLinkBehavior == 'POPUP') {
        windowObjectReference = window.open(approvalurl, "PdfPopUp", "width=1265,height=609,resizable,scrollbars,status");
        pollNonInstantPopUp();
      } else {
        window.location = approvalurl;
      }

      // Parent window polls for child window to close
      function pollNonInstantPopUp() {
        if (!windowObjectReference || windowObjectReference.closed) {

          // On child window close, update modal on UI
          $("#txnprogress").css('width', '75%').attr('aria-valuenow', 75);
          if (environment === "LIVE") {
            $("#progressUpdate").append(`<p>Action required from buyer(offline payment)</p>`)
          }
          $("#txnprogress").css('width', '100%').removeClass('progress-bar-animated').addClass('bg-success').attr('aria-valuenow', 100);

          $("#modalFooter").removeClass('d-none');
          $.post(getOrderUrl, { environment, orderId, clientType, paymentscheme });

          // getOrderRequest.done(function (result) {
          //   debugger;
          //   switch (result.status) {
          //     case 'COMPLETED':
          //       $("#progressUpdate").append(`<p>[${getTimeString()}] Order status COMPLETED...</p>`);
          //       $("#progressUpdate").append(`<p>[${getTimeString()}] Capture status PENDING...</p>`);
          //       break;
          //     default:
          //       $("#progressUpdate").append(`<p>[${getTimeString()}] Order Failed...</p>`);
          //       $("#txnprogress").css('width', '100%').removeClass('progress-bar-animated').addClass('bg-success').attr('aria-valuenow', 100);
          //       $("#modalFooter").removeClass('d-none');
          //       //$("#progressUpdate").append(`<p>[${getTimeString()}] Capture status PENDING...</p>`);
          //       break;
          //   }

          //   if (result.status === 'COMPLETED') {
          //     if (clientType === 'WEBHOOK_CLIENT') {
          //       setTimeout(() => {
          //         if (environment === "LIVE") {
          //           $("#progressUpdate").append(`<p>Action required from buyer(offline payment)</p>`)
          //         }
          //         $("#txnprogress").css('width', '100%').removeClass('progress-bar-animated').addClass('bg-success').attr('aria-valuenow', 100);

          //         $("#modalFooter").removeClass('d-none');
          //       }, 2000);
          //     } else {
          // let retries = 0;
          // let intervalId = setInterval(() => {
          //   retries += 1;
          //   var getOrderRequest = $.post(getOrderUrl, { environment, orderId, clientType });

          //   getOrderRequest.done(function (result) {
          //     
          //     if(result.status === "COMPLETED"){
          //     var captureStatus = result.response.purchase_units[0].payments.captures[0].status;
          //       if (captureStatus === 'COMPLETED') {
          //         $("#progressUpdate").append(`<p>[${getTimeString()}] Capture status COMPLETED...</p>`);
          //       }
          //   clearInterval(intervalId);

          //     } else {
          //       $("#progressUpdate").append(`<p>[${getTimeString()}] waiting for capture status to be COMPLETED...</p>`); 
          //     }
          //   });
          //   if (retries === 20) {
          //     clearInterval(intervalId);
          //   }
          // }, 3000);

          //   }
          // }
          //});

        } else {
          // If window hasn't closed, wait 5 seconds and check again
          setTimeout(pollNonInstantPopUp, 5000);
        }
      }
    }

    // Open approval URL in pop up window for desktop experiences
    function openPopUp(approvalurl) {

      var windowObjectReference;

      if (approvalLinkBehavior == 'POPUP') {
        windowObjectReference = window.open(approvalurl, "approvalPopUp", "width=1265,height=609,resizable,scrollbars,status");
        pollPopUp();
      } else {
        window.location = approvalurl;
      }

      // Parent window polls for child window to close
      function pollPopUp() {
        if (!windowObjectReference || windowObjectReference.closed) {

          // On child window close, update modal on UI
          $("#txnprogress").css('width', '75%').attr('aria-valuenow', 75);
          $("#progressUpdate").append(`<p>[${getTimeString()}] Approval Closed...</p><p>[${getTimeString()}] Verifying Approval Status...</p>`);

          // On child window close, poll internal DB for status change (triggered by incoming webhook from PayPal)
          pollOrder(orderId, 1);

        } else {

          // If window hasn't closed, wait 5 seconds and check again
          setTimeout(pollPopUp, 5000);
        }
      }
    }

    // Poll internal order status for cancelled, redirect return, or abandoned use cases
    function pollOrder(orderId, retryAttempts) {

      // Only poll 5 times and then mark this transaction as failed due to abandonement on pop up
      if (retryAttempts > 20) {
        $("#progressUpdate").append(`<p>[${getTimeString()}] Payment Authorization Unknown...</p>`);
        orderFailure(orderId);
      } else {

        if (clientType === 'WEBHOOK_CLIENT') {
          $("#progressUpdate").append(`<p>[${getTimeString()}] Waiting for 'CHECKOUT.ORDER.APPROVED' webhook...</p>`);
        }

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
                setTimeout(function () { pollOrder(orderId, retryAttempts + 1) }, 10000);
              }
              break;
            case 'COMPLETED':
              $("#progressUpdate").append(`<p>[${getTimeString()}] Webhook received...</p><p[${getTimeString()}] Order Captured...</p>`);
              orderSuccess(orderId);
              break;
            default:
              setTimeout(function () { pollOrder(orderId, retryAttempts + 1) }, 10000);

          }

        });
      }
    }

    // Poll PayPal order status for any status update (used for non webhook use case)
    function pollPPOrderStatus(orderId, retryAttempts) {

      if (retryAttempts > 12) {
        $("#progressUpdate").append(`<p>[${getTimeString()}] PayPal Order Status Has Not Been Updated...</p>`);
        orderFailure(orderId);
      } else {

        var getOrderRequest = $.post(getOrderUrl, { environment, orderId, clientType });

        getOrderRequest.done(function (data) {

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
              $("#progressUpdate").append(`<p>[${getTimeString()}] PayPal status updated to '${data.status}'...</p><p>[${getTimeString()}] Capturing Order...</p>`);
              captureOrder(orderId);
              break;
            case undefined:
              setTimeout(function () { pollPPOrderStatus(orderId, retryAttempts + 1) }, 5000);
              break;
            default:
              setTimeout(function () { pollPPOrderStatus(orderId, retryAttempts + 1) }, 5000);
              $("#progressUpdate").append(`<p>[${getTimeString()}] Polling - PayPal status is still '${data.status}'... </p>`);
          }
        });
      }
    }

    // Call capture order API
    function captureOrder(orderId) {
      var captureOrderRequest = $.post(captureOrderUrl, { environment, orderId, clientType });

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
  });

  function getTimeString() {
    return new Date().toLocaleTimeString([], { hour12: false });
  }
});