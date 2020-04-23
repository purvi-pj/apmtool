$(function() {

	$(".orderSummary").click(function( event ) {

		var recordIndex = $(this).attr('itemid');

		var recordInsertionDate = new Date(recordValues[recordIndex].INSERTION_DATE);

		$( "#orderTitle" ).text(`${recordValues[recordIndex].ORDER_ID} (${recordValues[recordIndex].STATUS})`);
		$( "#orderDate" ).text(`${recordInsertionDate.toString()}`);
		$( "#orderPaymentScheme" ).text(`${recordValues[recordIndex].PAYMENT_SCHEME}`);
		$( "#orderPaymentEnvironment" ).text(`${recordValues[recordIndex].ENVIRONMENT}`);
		$( "#createOrderCorrelationIds" ).text(`${recordValues[recordIndex].CREATE_ORDER_API.CORRELATION_ID}`);
		$( "#createOrderRequest" ).text(`${recordValues[recordIndex].CREATE_ORDER_API.REQUESTJSON}`);
		$( "#createOrderResponse" ).text(`${recordValues[recordIndex].CREATE_ORDER_API.RESPONSEJSON}`);
		recordValues[recordIndex].CONFIRM_PAYMENT_SOURCE_API ? $( "#confirmPaymentSourceCorrelationIds" ).text(`${recordValues[recordIndex].CONFIRM_PAYMENT_SOURCE_API.CORRELATION_ID}`) : $( "#confirmPaymentSourceCorrelationIds" ).text('N/A');
		recordValues[recordIndex].CONFIRM_PAYMENT_SOURCE_API ? $( "#confirmPaymentSourceRequest" ).text(`${recordValues[recordIndex].CONFIRM_PAYMENT_SOURCE_API.REQUESTJSON}`) : $( "#confirmPaymentSourceRequest" ).text('{}');
		recordValues[recordIndex].CONFIRM_PAYMENT_SOURCE_API ? $( "#confirmPaymentSourceResponse" ).text(`${recordValues[recordIndex].CONFIRM_PAYMENT_SOURCE_API.RESPONSEJSON}`) : $( "#confirmPaymentSourceResponse" ).text('{}');
		recordValues[recordIndex].CAPTURE_ORDER_API ? $( "#captureOrderCorrelationIds" ).text(`${recordValues[recordIndex].CAPTURE_ORDER_API.CORRELATION_ID}`) : $( "#captureOrderCorrelationIds" ).text('N/A');
		recordValues[recordIndex].CAPTURE_ORDER_API ? $( "#captureOrderRequest" ).text(`${recordValues[recordIndex].CAPTURE_ORDER_API.REQUESTJSON}`) : $( "#captureOrderRequest" ).text('{}');
		recordValues[recordIndex].CAPTURE_ORDER_API ? $( "#captureOrderResponse" ).text(`${recordValues[recordIndex].CAPTURE_ORDER_API.RESPONSEJSON}`) : $( "#captureOrderResponse" ).text('{}');

	});

});