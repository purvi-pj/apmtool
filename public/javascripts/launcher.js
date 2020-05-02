$(function() {

	// Attach handler to button click event
	$( "#submitBtn" ).click(function( event ) {

		// Stop form from submitting normally
		event.preventDefault();

		// Extract values from form
		var $form 						= $("#createOrderForm" ),
			environment 				= $form.find( "input[name='environment']:checked" ).val(),
			paymentscheme 				= $form.find( "select[name='paymentscheme']" ).val(),
			amount 						= $form.find( "input[name='amount']" ).val(),
			currency 					= $form.find( "input[name='currency']" ).val(),
			countrycode 				= $form.find( "input[name='countrycode']" ).val(),
			name 						= $form.find( "input[name='name']" ).val(),
			email 						= $form.find( "input[name='email']" ).val(),
			phonenumber 				= $form.find( "input[name='phonenumber']" ).val(),
			shippingpreference 			= $form.find( "input[name='shippingpreference']:checked" ).val(),
			url 						= $form.attr( "action" ),
			confirmPaymentSourceUrl 	= 'confirm',
			getOrderUrl 				= 'getOrder',
			getOrderSummaryUrl 			= 'getOrderSummary',
			getOrderInternalStatusUrl 	= 'getOrderStatus',
			captureOrderUrl 			= 'captureOrder',
			orderId 					= '';

		// Initiate create order
		var createOrderRequest = $.post( url, { environment, paymentscheme, amount, currency, countrycode, name, email, phonenumber, shippingpreference } );

		// On create order completion, update progress on parent page
		createOrderRequest.done(function( data ) {
			$( "#txnprogress").css('width', '25%').attr('aria-valuenow', 25);
			
			// Check if response had any errors
			if (data.statusCode < 400) {

				orderId = data.orderId;

				$( "#progressUpdate" ).empty().append( '<p>Created Order Id... ' + data.orderId  + '</p><p>Confirming Payment Source...</p>');
				var confirmPaymentSource = $.post( confirmPaymentSourceUrl, { environment, orderId, paymentscheme, amount, currency, countrycode, name, email, phonenumber } );

				// Confirm payment source after successful order creation
				confirmPaymentSource.done(function( data ) {

					$( "#txnprogress").css('width', '50%').attr('aria-valuenow', 50);
					$( "#progressUpdate" ).append( '<p>Payment Source confirmed...</p><p>Waiting for payment scheme approval...</p>');

					var approvalurl = data.response.links.find(x => x.rel === 'approve').href;

					openPopUp(approvalurl);

				});

			} else {

				$( "#progressUpdate" ).empty().append( '<p>Order Creation Failed...</p>');
				$( "#progressUpdate" ).append( '<p><pre>' + JSON.stringify(data.response, null, 2) + '</pre></p>');
			}

		});

		function openPopUp(approvalurl) {

			windowObjectReference = window.open(approvalurl, "approvalPopUp", "width=1265,height=609,resizable,scrollbars,status");

			pollPopUp();

			function pollPopUp() {
				if (windowObjectReference.closed) {

					$( "#txnprogress").css('width', '75%').attr('aria-valuenow', 75);
					$( "#progressUpdate" ).append( '<p>Approval Closed...</p><p>Verifying Transaction Status...</p>');	

					pollOrder(orderId, 1);

				} else {

					setTimeout(pollPopUp, 5000);

				}
			}

		}

		function pollOrder(orderId, retryAttempts) {
			// var getOrderRequest = $.post( getOrderUrl, { environment, orderId } );

			// getOrderRequest.done(function( data ) {
			// 	if (data.statusCode < 400) {
			// 		$( "#progressUpdate" ).append( '<p>Transaction Status Verified...</p><p>Capturing Order...</p>');	
			// 		captureOrder(orderId);
			// 	} else {
			// 		$( "#progressUpdate" ).append('<hr/><p><svg class="bi bi-x-circle text-danger mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>FAILURE</p>');										
			// 	}
			// });

			if (retryAttempts > 5) {
				$( "#progressUpdate" ).append( '<p>Payment Authorization Unknown...</p>');
				orderFailure(orderId);
			} else {

				var getOrderInternalStatusRequest = $.post( getOrderInternalStatusUrl, { orderId } );

				getOrderInternalStatusRequest.done(function (result) {

					if (result.STATUS === 'CANCELLED') {
						$( "#progressUpdate" ).append( '<p>Transaction Cancelled ...</p>');
						orderFailure(orderId);
					} else if (result.STATUS === 'REDIRECT_RETURN') {
						getPPOrderStatus(orderId);
					} else {
						setTimeout(function() { pollOrder(orderId, retryAttempts+1) }, 10000);
					}

				});

			}
		}

		function getPPOrderStatus(orderId) {
			var getOrderRequest = $.post( getOrderUrl, { environment, orderId } );

			getOrderRequest.done(function( data ) {
				if (data.statusCode < 400) {
					$( "#progressUpdate" ).append( '<p>Transaction Status Verified...</p><p>Capturing Order...</p>');	
					captureOrder(orderId);
				} else {
					$( "#progressUpdate" ).append('<hr/><p><svg class="bi bi-x-circle text-danger mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>FAILURE</p>');										
				}
			});			
		}

		function captureOrder(orderId) {
			var captureOrderRequest = $.post( captureOrderUrl, { environment, orderId } );

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

		function orderSuccess(orderId) {
			$( "#modalFooter" ).removeClass('d-none');
			$( "#txnprogress").css('width', '100%').removeClass('progress-bar-animated').addClass('bg-success').attr('aria-valuenow', 100);
			$( "#progressUpdate" ).append('<hr/><p><svg class="bi bi-check-circle text-success mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M15.354 2.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L8 9.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M8 2.5A5.5 5.5 0 1013.5 8a.5.5 0 011 0 6.5 6.5 0 11-3.25-5.63.5.5 0 11-.5.865A5.472 5.472 0 008 2.5z" clip-rule="evenodd"/></svg>SUCCESS</p>');		

			var getOrderSummaryRequest = $.post( getOrderSummaryUrl, { orderId } );

			getOrderSummaryRequest.done(function( data ) {

				$( "#progressUpdate" ).append( '<hr/<p><pre>' + JSON.stringify(data, null, 2) + '</pre></p>');
			});
		}

		function orderFailure(orderId) {
			$( "#modalFooter" ).removeClass('d-none');
			$( "#txnprogress").removeClass('progress-bar-animated').addClass('bg-danger');
			$( "#progressUpdate" ).append('<hr/><p><svg class="bi bi-x-circle text-danger mx-2" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>FAILURE</p>');						

			var getOrderSummaryRequest = $.post( getOrderSummaryUrl, { orderId } );

			getOrderSummaryRequest.done(function( data ) {

				$( "#progressUpdate" ).append( '<hr/<p><pre>' + JSON.stringify(data, null, 2) + '</pre></p>');
			});
		}

	});    

});