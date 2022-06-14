$(function() {

	// On click of order, update details on UI accordingly
	$(".orderSummary").click(function( event ) {

		var webhookIndex = $(this).attr('itemid');

		var webhookInsertionDate = new Date(webhookValues[webhookIndex].INSERTION_DATE);

		$("#orderTitle").html(`${webhookValues[webhookIndex].BODY.id} <br />(${webhookValues[webhookIndex].BODY.event_type})`);
		$("#orderDate").text(`${webhookInsertionDate.toString()}`);
        $("#webhookDetails").text(`${webhookValues[webhookIndex].bodyJSON}`)


	});

  var clipboard = new ClipboardJS(document.getElementById('clipboardCopy'));
});