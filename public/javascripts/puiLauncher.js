$(function () {

    $("input[name='isDefaultClientCredentials']").change(function() {
      $("input[name='customClientId']").val("");
      $("input[name='customClientSecret']").val("");
      $("#client_credential_fields").toggleClass("d-none");
    });

    // toggle for custom or default email values
    $("input[name='emailType']").change(function() {
      $("#custom_email_type").toggleClass("d-none");
      $("#default_email_type").toggleClass("d-none");
    });

    $("#webhookClient").prop("checked", true);
    
    // Prefill values
    preFillValues();

    // Attach handler to button click event
    $("#submitBtn").click(function (event) {
  
      // Stop form from submitting normally
      event.preventDefault();

      // Extract values from form
      var $form = $("#createOrderForm"),
        clientType = $form.find("input[name='clientType']:checked").val(),
        environment = $form.find("input[name='environment']:checked").val(),
        customClientId = $form.find("input[name='customClientId']").val(),
        customClientSecret = $form.find("input[name='customClientSecret']").val(),
        paymentscheme = $form.find("select[name='paymentscheme']").val(),
        amount = $form.find("input[name='amount']").val(),
        currency = $form.find("input[name='currency']").val(),
        countrycode = $form.find("input[name='countrycode']").val(),
        address_line_1 = $form.find("input[name='address_line_1']").val(),
        address_city = $form.find("input[name='address_city']").val(),
        address_country_code = $form.find("input[name='address_country_code']").val(),
        address_postal_code = $form.find("input[name='address_postal_code']").val(),
        birthDate = $form.find("input[name='birthDate']").val(),
        prefix = $form.find("input[name='prefix']").val(),
        firstName = $form.find("input[name='firstName']").val(),
        lastName = $form.find("input[name='lastName']").val(),
        phoneNumber = $form.find("input[name='phoneNumber']").val(),
        email = $form.find("input[name='email']").val(),
        phonePrefix = $form.find("input[name='phonePrefix']").val(),
        brandName = $form.find("input[name='brand_name']").val(),
        merchantLanguage = $form.find("input[name='merchant_language']").val(),
        merchantCountryCode = $form.find("input[name='merchant_country_code']").val(),
        shippingPreference = $form.find("input[name='shipping_preference']").val(),
        logoUrl = $form.find("input[name='logo_url']").val(),
        returnUrl = $form.find("input[name='return_url']").val(),
        cancelUrl = $form.find("input[name='cancel_url']").val(),
        customerServiceInstruction1 = $form.find("input[name='customer_service_instruction1']").val(),
        customerServiceInstruction2 = $form.find("input[name='customer_service_instruction2']").val(),

        url = $form.attr("action");
        
      // Apply "sticky" selected settings to start over link
      $("#startOverLink").attr("href", `pui?clientType=${clientType}&environment=${environment}&paymentscheme=${paymentscheme}&amount,
        currency=${amount}&countrycode=${countrycode}&address_line_1=${address_line_1}&address_city=${address_city}&address_country_code=${address_country_code}&address_postal_code=${address_postal_code}&
        birthDate=${birthDate}&prefix=${prefix}&firstName=${firstName}&lastName=${lastName}&phoneNumber=${phoneNumber}&email=${email}&phonePrefix=${phonePrefix}&brandName=${brandName}&merchantLanguage=${merchantLanguage}&
        merchantCountryCode=${merchantCountryCode}&shippingPreference=${shippingPreference}&logoUrl=${logoUrl}&returnUrl=${returnUrl}&cancelUrl=${cancelUrl}&customerServiceInstruction1=${customerServiceInstruction1}&
        customerServiceInstruction2=${customerServiceInstruction2}`);
  
        var name = firstName + lastName;
      // Define in context API locations
      var confirmPaymentSourceUrl = 'pui/confirm',
        getOrderSummaryUrl = 'getOrderSummary',
        getOrderInternalStatusUrl = 'getOrderStatus',
        orderId = '';

      // Initiate create order
      var createOrderRequest = $.post(url, { environment, clientType, customClientId, customClientSecret, paymentscheme, amount, currency, countrycode, name, email, phoneNumber });
  
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
            environment, clientType, customClientId, customClientSecret, orderId, paymentscheme, amount, currency,
            birthDate, prefix, firstName, lastName, email, phoneNumber, phonePrefix, address_line_1, address_city, 
            address_country_code, address_postal_code, brandName, merchantLanguage, merchantCountryCode, 
            shippingPreference, logoUrl, cancelUrl,returnUrl, customerServiceInstruction1, customerServiceInstruction2
          });
  
          confirmPaymentSource.done(function (data) {
  
            // On successful Confirm Payment API
            if (data.statusCode < 400) {
              $("#txnprogress").css('width', '50%').attr('aria-valuenow', 50);

              $("#progressUpdate").append(`<p>[${getTimeString()}] Payment Source confirmed...</p>`);

              $("#txnprogress").css('width', '75%').attr('aria-valuenow', 75);

              getOrderStatus(orderId, 1)
              
            } else {
  
              // On failed Confirm Payment API, update modal on UI with error
              $("#progressUpdate").append(`<p>[${getTimeString()}] Confirm Payment Source Failed...</p>`);
              $("#progressUpdate").append('<p><pre>' + JSON.stringify(data.response, null, 2) + '</pre></p>');
              // orderFailure(orderId);
            }
          }); 
        } else {
  
          // On failed Create Order API, update modal on UI with error
          $("#progressUpdate").empty().append(`<p>[${getTimeString()}] Order Creation Failed...</p>`);
          $("#progressUpdate").append('<p><pre>' + JSON.stringify(data.response, null, 2) + '</pre></p>');
          orderFailure();
        }
      });

      function getOrderStatus(orderId, retryAttempts) {

        // Only poll 5 times and then mark this transaction as failed due to abandonement on pop up
        if (retryAttempts > 20) {
          $("#progressUpdate").append(`<p>[${getTimeString()}] Payment Authorization Unknown...</p>`);
          orderFailure(orderId);
        } else {
  
          if (clientType === 'WEBHOOK_CLIENT') {
            $("#progressUpdate").append(`<p>[${getTimeString()}] Waiting for 'CHECKOUT.ORDER.COMPLETED' webhook...</p>`);
          }
  
          // Poll internal status for `CANCELLED` or `REDIRECT_RETURN`
          var getOrderInternalStatusRequest = $.post(getOrderInternalStatusUrl, { orderId });
  
          getOrderInternalStatusRequest.done(function (result) {
  
            switch (result.STATUS) {
              case 'CANCELLED':
                $("#progressUpdate").append(`<p>[${getTimeString()}] Transaction Cancelled ...</p>`);
                orderFailure(orderId);
                break;
              
              case 'COMPLETED':
                $("#progressUpdate").append(`<p>[${getTimeString()}] Webhook received...</p>`);
                $("#progressUpdate").append(`<p>[${getTimeString()}] Order status COMPLETED...</p>`);
                orderSuccess(orderId);
                break;
              default:
                setTimeout(function () { getOrderStatus(orderId, retryAttempts + 1) }, 10000);
  
            }
  
          });
        }
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

    function preFillValues() {
      $("#createOrderForm").find("input[name='environment']").val([prefillJSON.environment]);
      $("#createOrderForm").find("input[name='clientType']").val([prefillJSON.clientType]);
      $("#createOrderForm").find("input[name='customClientId']").val([prefillJSON.customClientId]);
      $("#createOrderForm").find("input[name='customClientSecret']").val([prefillJSON.customClientSecret]);
      $("#createOrderForm").find("select[name='paymentscheme']").val([prefillJSON.paymentscheme]);
      $("#createOrderForm").find("input[name='amount']").val([prefillJSON.amount]);
      $("#createOrderForm").find("input[name='currency']").val([prefillJSON.currency]);
      $("#createOrderForm").find("input[name='countrycode']").val([prefillJSON.countrycode]);
      $("#createOrderForm").find("input[name='address_line_1']").val([prefillJSON.address_line_1]);
      $("#createOrderForm").find("input[name='address_city']").val([prefillJSON.address_city]);
      $("#createOrderForm").find("input[name='address_country_code']").val([prefillJSON.address_country_code]);
      
      $("#createOrderForm").find("input[name='address_postal_code']").val([prefillJSON.address_postal_code]);
      $("#createOrderForm").find("input[name='birthDate']").val([prefillJSON.birthDate]);
      $("#createOrderForm").find("select[name='prefix']").val([prefillJSON.prefix]);
      $("#createOrderForm").find("input[name='firstName']").val([prefillJSON.firstName]);
      $("#createOrderForm").find("input[name='lastName']").val([prefillJSON.lastName]);
      $("#createOrderForm").find("input[name='phoneNumber']").val([prefillJSON.phone]);
      $("#createOrderForm").find("input[name='email']").val([prefillJSON.email]);
      $("#createOrderForm").find("input[name='phonePrefix']").val([prefillJSON.phonePrefix]);
      $("#createOrderForm").find("input[name='brandName']").val([prefillJSON.brandName]);

      $("#createOrderForm").find("input[name='merchantLanguage']").val([prefillJSON.merchantLanguage]);
      $("#createOrderForm").find("input[name='merchantCountryCode']").val([prefillJSON.merchantCountryCode]);
      $("#createOrderForm").find("input[name='shippingPreference']").val([prefillJSON.shippingPreference]);
      $("#createOrderForm").find("select[name='logoUrl']").val([prefillJSON.logoUrl]);
      $("#createOrderForm").find("input[name='returnUrl']").val([prefillJSON.returnUrl]);
      $("#createOrderForm").find("input[name='cancelUrl']").val([prefillJSON.cancelUrl]);
      $("#createOrderForm").find("input[name='customerServiceInstruction1']").val([prefillJSON.customerServiceInstruction1]);
      $("#createOrderForm").find("input[name='customerServiceInstruction2']").val([prefillJSON.customerServiceInstruction2]);
    
    }
  
    function getTimeString() {
      return new Date().toLocaleTimeString([], { hour12: false });
    }
  });