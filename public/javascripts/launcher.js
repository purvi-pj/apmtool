$(function() {

	$("#paymentscheme").change(function() {

		$("#bic_optional").addClass("d-none");

		var tag = $("#paymentscheme").val();

		if (tag) {

			// Determine mandatory fields and toggle display for fields
			var mandatoryFields = schemesJSON[tag].optional;
			$.each(mandatoryFields, function (index, value) {
				var fieldId = ("#" + value + "_optional").replace(/\./g, '\\\.');
				$(fieldId).removeClass("d-none");
			});
		}
	});		

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
	var mandatoryFields = schemesJSON[prefillScheme].optional;
	$.each(mandatoryFields, function (index, value) {
		var fieldId = ("#" + value + "_optional").replace(/\./g, '\\\.');
		$(fieldId).removeClass("d-none");
	});

	// Attach handler to button click event
	$( "#submitBtn" ).click(function( event ) {

		// Stop form from submitting normally
		event.preventDefault();

		// Extract values from form
		var $form 						= $("#createOrderForm" ),
			clientType					= $form.find( "input[name='clientType']:checked" ).val(),
			environment 				= $form.find( "input[name='environment']:checked" ).val(),
			approvalLinkBehavior		= $form.find( "input[name='approvalLinkBehavior']:checked" ).val(),
			paymentscheme 				= $form.find( "select[name='paymentscheme']" ).val(),
			amount 						= $form.find( "input[name='amount']" ).val(),
			currency 					= $form.find( "input[name='currency']" ).val(),
			countrycode 				= $form.find( "input[name='countrycode']" ).val(),
			name 						= $form.find( "input[name='name']" ).val(),
			email 						= $form.find( "input[name='email']" ).val(),
			phonenumber 				= $form.find( "input[name='phonenumber']" ).val(),
			bic 						= $form.find( "input[name='bic']" ).val(),
			shippingpreference 			= $form.find( "input[name='shippingpreference']:checked" ).val(),
			url 						= $form.attr( "action" );

		// Apply "sticky" selected settings to start over link
		$("#startOverLink").attr("href", `/?environment=${environment}&clientType=${clientType}&approvalLinkBehavior=${approvalLinkBehavior}&paymentscheme=${paymentscheme}&amount=${amount}&currency=${currency}&countrycode=${countrycode}&bic=${bic}&name=${name}&email=${email}`);

		// Define in context API locations
		var confirmPaymentSourceUrl 	= 'confirm',
			getOrderUrl 				= 'getOrder',
			getOrderSummaryUrl 			= 'getOrderSummary',
			getOrderInternalStatusUrl 	= 'getOrderStatus',
			captureOrderUrl 			= 'captureOrder',
			orderId 					= '';

		// Initiate create order
		var createOrderRequest = $.post( url, { environment, clientType, paymentscheme, amount, currency, countrycode, name, email, phonenumber, shippingpreference } );

		// On create order completion, update progress on parent page
		createOrderRequest.done(function( data ) {
			$( "#txnprogress").css('width', '25%').attr('aria-valuenow', 25);
			
			// On successful Create Order API
			if (data.statusCode < 400) {

				// Set order id from Create Order API response
				orderId = data.orderId;

				// Update modal on UI
				$( "#progressUpdate" ).empty().append( '<p>Created Order Id... ' + data.orderId  + '</p><p>Confirming Payment Source...</p>');

				// Call Confirm Payment Source API upon successful Create Order API
				var confirmPaymentSource = $.post( confirmPaymentSourceUrl, { environment, clientType, orderId, paymentscheme, amount, currency, countrycode, name, email, phonenumber, bic, approvalLinkBehavior } );

				confirmPaymentSource.done(function( data ) {

					/// On successful Confirm Payment API
					if (data.statusCode < 400) {

						// Update modal on UI
						$( "#txnprogress").css('width', '50%').attr('aria-valuenow', 50);
						$( "#progressUpdate" ).append( '<p>Payment Source confirmed...</p><p>Waiting for payment scheme approval...</p>');

						// Open approval URL returned from Confirm Payment API
						var approvalurl = data.response.links.find(x => x.rel === 'payer-action').href;
						openPopUp(approvalurl);

					} else {

						// On failed Confirm Payment API, update modal on UI with error
						$( "#progressUpdate" ).append( '<p>Confirm Payment Source Failed...</p>');
						$( "#progressUpdate" ).append( '<p><pre>' + JSON.stringify(data.response, null, 2) + '</pre></p>');
						orderFailure(orderId);
					}
				});
			} else {

				// On failed Create Order API, update modal on UI with error
				$( "#progressUpdate" ).empty().append( '<p>Order Creation Failed...</p>');
				$( "#progressUpdate" ).append( '<p><pre>' + JSON.stringify(data.response, null, 2) + '</pre></p>');
				orderFailure();
			}
		});

		// Open approval URL in pop up window for desktop experiences
		function openPopUp(approvalurl) {

			if (approvalLinkBehavior == 'POPUP') {
				windowObjectReference = window.open(approvalurl, "approvalPopUp", "width=1265,height=609,resizable,scrollbars,status");
				pollPopUp();
			} else {
				window.location = approvalurl;
			}

			// Parent window polls for child window to close
			function pollPopUp() {
				if (windowObjectReference.closed) {

					// On child window close, update modal on UI
					$( "#txnprogress").css('width', '75%').attr('aria-valuenow', 75);
					$( "#progressUpdate" ).append( '<p>Approval Closed...</p><p>Verifying Approval Status...</p>');	

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
				$( "#progressUpdate" ).append( '<p>Payment Authorization Unknown...</p>');
				orderFailure(orderId);
			} else {

				if (clientType === 'WEBHOOK_CLIENT') {
					$( "#progressUpdate" ).append( '<p>Waiting for `CHECKOUT.ORDER.APPROVED` webhook...</p>');
				}

				// Poll internal status for `CANCELLED` or `REDIRECT_RETURN`
				var getOrderInternalStatusRequest = $.post( getOrderInternalStatusUrl, { orderId } );

				getOrderInternalStatusRequest.done(function (result) {

					switch(result.STATUS) {
						case 'CANCELLED':
						case 'FULL_PAGE_CANCELLED':
							$( "#progressUpdate" ).append( '<p>Transaction Cancelled ...</p>');
							orderFailure(orderId);						
							break;
						case 'REDIRECT_RETURN':
						case 'FULL_PAGE_REDIRECT_RETURN':
							if (clientType === 'POLLING_CLIENT') {
								pollPPOrderStatus(orderId, 1);
							} else {
								setTimeout(function() { pollOrder(orderId, retryAttempts+1) }, 10000);
							}
							break;
						case 'COMPLETED':
							$( "#progressUpdate" ).append( '<p>Webhook received...</p><p>Order Captured...</p>');
							orderSuccess(orderId);
							break;
						default:
							setTimeout(function() { pollOrder(orderId, retryAttempts+1) }, 10000);

					}

				});
			}
		}

		// Poll PayPal order status for any status update (used for non webhook use case)
		function pollPPOrderStatus(orderId, retryAttempts) {

			if (retryAttempts > 12) {
				$( "#progressUpdate" ).append( '<p>PayPal Order Status Has Not Been Updated...</p>');
				orderFailure(orderId);				
			} else {

				var getOrderRequest = $.post( getOrderUrl, { environment, orderId, clientType } );

				getOrderRequest.done(function( data ) {

					// If existing status is already beyond `PAYER_ACTION_REQUIRED` state, do not overwrite and display existing state
					switch(data.status) {
						case 'COMPLETED':
							$( "#progressUpdate" ).append( '<p>Order has already been captured...</p>');
							orderSuccess(orderId);					
							break;
						case 'VOIDED':
							$( "#progressUpdate" ).append( '<p>Order has already been voided...</p>');
							orderFailure(orderId);								
							break;
						// case 'CANCELLED':
						// 	$( "#progressUpdate" ).append( '<p>Order has already been cancelled...</p>');
						// 	orderFailure(orderId);								
						// 	break;		
						case 'APPROVED':
							$( "#progressUpdate" ).append( '<p>PayPal status updated to `' + data.status + '`...</p><p>Capturing Order...</p>');	
							captureOrder(orderId);					
							break;
						case undefined:
							setTimeout(function() { pollPPOrderStatus(orderId, retryAttempts+1) }, 5000);
							break;
						default:
							setTimeout(function() { pollPPOrderStatus(orderId, retryAttempts+1) }, 5000);
							$( "#progressUpdate" ).append('<p>Polling - PayPal status is still `' + data.status + '`... </p>');
					}					
				});		
			}	
		}		

		// Call capture order API
		function captureOrder(orderId) {
			var captureOrderRequest = $.post( captureOrderUrl, { environment, orderId, clientType } );

			captureOrderRequest.done(function( data ) {
				if (data.statusCode < 400) {
					$( "#progressUpdate" ).append( '<p>Order Captured...</p>');
					orderSuccess(orderId);
				} else {
					$( "#progressUpdate" ).append( '<p>Order Capture Failed...</p>');
					orderFailure(orderId);
				}
			});
		}

		// Update modal UI on successful order 
		function orderSuccess(orderId) {
			$( "#modalFooter" ).removeClass('d-none');
			$( "#txnprogress").css('width', '100%').removeClass('progress-bar-animated').addClass('bg-success').attr('aria-valuenow', 100);
			$( "#progressUpdate" ).append('<hr/><p><svg class="bi bi-check-circle text-success mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M15.354 2.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L8 9.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M8 2.5A5.5 5.5 0 1013.5 8a.5.5 0 011 0 6.5 6.5 0 11-3.25-5.63.5.5 0 11-.5.865A5.472 5.472 0 008 2.5z" clip-rule="evenodd"/></svg>SUCCESS</p>');		

			var getOrderSummaryRequest = $.post( getOrderSummaryUrl, { orderId } );

			getOrderSummaryRequest.done(function( data ) {

				$( "#progressUpdate" ).append( '<hr/<p><pre>' + JSON.stringify(data, null, 2) + '</pre></p>');
			});
		}

		// Update modal UI on failed order
		function orderFailure(orderId) {
			$( "#modalFooter" ).removeClass('d-none');
			$( "#txnprogress").removeClass('progress-bar-animated').addClass('bg-danger');
			$( "#progressUpdate" ).append('<hr/><p><svg class="bi bi-x-circle text-danger mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>FAILURE</p>');						

			if (orderId) {

				var getOrderSummaryRequest = $.post( getOrderSummaryUrl, { orderId } );

				getOrderSummaryRequest.done(function( data ) {

					$( "#progressUpdate" ).append( '<hr/<p><pre>' + JSON.stringify(data, null, 2) + '</pre></p>');
				});
			}
		}
	});    
});