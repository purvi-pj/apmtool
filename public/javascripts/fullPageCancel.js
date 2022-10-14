$(function() {

	$('#processingModal').modal({
	  keyboard: false,
	  focus: true,
	  show: true
	})

	var $form 			= $("#fullPageReturnForm" ),
		orderId 		= $form.find( "input[name='orderId']" ).val(),
		environment 	= $form.find( "input[name='environment']" ).val(),
		clientType		= $form.find( "input[name='clientType']" ).val(),
		paymentscheme	= $form.find( "input[name='paymentScheme']" ).val(),
		accessToken		= $form.find( "input[name='accessToken']" ).val();

	// Define in context API locations
	var confirmPaymentSourceUrl 	= 'confirm',
		getOrderUrl 				= 'getOrder',
		getOrderSummaryUrl 			= 'getOrderSummary',
		captureOrderUrl 			= 'captureOrder';		

	pollPPOrderStatus(orderId, 1);

	// Poll PayPal order status for any status update (used for non webhook use case)
	function pollPPOrderStatus(orderId, retryAttempts) {

		var getOrderRequest = $.post( getOrderUrl, { environment, orderId, clientType, paymentscheme, accessToken } );

		getOrderRequest.done(function( data ) {

			// If existing status is already beyond `PAYER_ACTION_REQUIRED` state, do not overwrite and display existing state
			switch(data.status) {
				case 'COMPLETED':
					$( "#progressUpdate" ).append(`<p>[${ getTimeString() }] Order has already been captured...</p>`);
					orderSuccess(orderId);					
					break;
				case 'VOIDED':
					$( "#progressUpdate" ).append(`<p>[${ getTimeString() }] Order has already been voided...</p>`);
					orderFailure(orderId);								
					break;
				// case 'CANCELLED':
				// 	$( "#progressUpdate" ).append( '<p>Order has already been cancelled...</p>');
				// 	orderFailure(orderId);								
				// 	break;		
				case 'APPROVED':
					$( "#progressUpdate" ).append(`<p>[${ getTimeString() }] PayPal status updated to '${ data.status }'...</p><p>If not captured, order will be auto refunded...</p>`);	
					orderFailure(orderId);								
					break;
				case undefined:
					orderFailure(orderId);
					break;
				default:
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

	function getTimeString() {
		return new Date().toLocaleTimeString([], { hour12: false });
	}		

});