$(function() {

	$('#processingModal').modal({
	  keyboard: false,
	  focus: true,
	  show: true
	})

	var $form 		= $("#fullPageReturnForm" ),
		orderId 	= $form.find( "input[name='orderId']" ).val(),
		environment = $form.find( "input[name='environment']:checked" ).val();

	// Define in context API locations
	var confirmPaymentSourceUrl 	= 'confirm',
		getOrderUrl 				= 'getOrder',
		getOrderSummaryUrl 			= 'getOrderSummary',
		captureOrderUrl 			= 'captureOrder';		

	orderFailure(orderId);

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