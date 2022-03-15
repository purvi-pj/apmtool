$(function () {

    // Prefill
    $("#buttonOptionForm").find("select[name='environment']").val([prefillJSON.environment]);
    $("#buttonOptionForm").find("input[name='host']").val([prefillJSON.host]);
    $("#buttonOptionForm").find("input[name='currency']").val([prefillJSON.currency]);
    $("#buttonOptionForm").find("input[name='buyerCountry']").val([prefillJSON.buyerCountry]);
    $("#buttonOptionForm").find("select[name='paymentscheme']").val([prefillJSON.paymentscheme]);
    $("#buttonOptionForm").find("select[name='buttonColor']").val([prefillJSON.buttonColor]);
    $("#buttonOptionForm").find("select[name='buttonShape']").val([prefillJSON.buttonShape]);
    $("#buttonOptionForm").find("select[name='buttonLabel']").val([prefillJSON.buttonLabel]);

    if (prefillJSON.environment == 'CUSTOM') {
      $("#hostFormGroup").removeClass("d-none");
    }

    $("#verticalButtonWidthUpdate").click(function() {
        $("#paypal-button-container").width($("#verticalButtonWidth").val());
    });

    $("#standaloneButtonWidthUpdate").click(function() {
        $("#paypal-standalone-button-container").width($("#standaloneButtonWidth").val());
    });

  $("#environment").change(function () {

    var environment = $("#environment").val();

    if (environment == 'CUSTOM') {
      $("#hostFormGroup").removeClass("d-none");
    } else {
      $("#hostFormGroup").addClass("d-none");
    }
  });

  $("#paymentscheme").change(function () {

    var tag = $("#paymentscheme").val();
    if (tag) {
      populateForm(tag);
    }
  });

  function populateForm(apmTag) {

    function setBuyerOptions(country, currency) {
      $("#buttonOptionForm").find("input[name='buyerCountry']").val(country);
      $("#buttonOptionForm").find("input[name='currency']").val(currency);
    }

    switch (apmTag) {
//      case 'alipay':
//        setBuyerOptions("CN", "EUR")
//        break;
      case 'bancontact':
        setBuyerOptions("BE", "EUR")
        break;
      case 'blik':
        setBuyerOptions("PL", "PLN")
        break;
      case 'boletobancario':
        setBuyerOptions("BR", "BRL")
        break;
      case 'eps':
        setBuyerOptions("AT", "EUR")
        break;
      case 'giropay':
        setBuyerOptions("DE", "EUR")
        break;
      case 'ideal':
        setBuyerOptions("NL", "EUR")
        break;
      case 'mercadopago':
        setBuyerOptions("BR", "BRL")
        break;
      case 'multibanco':
        setBuyerOptions("PT", "EUR")
        break;
      case 'mybank':
        setBuyerOptions("IT", "EUR")
        break;
      case 'oxxo':
        setBuyerOptions("MX", "MXN")
        break;
      case 'p24':
        setBuyerOptions("PL", "EUR")
        break;
      case 'payu':
        setBuyerOptions("CZ", "CZK")
        break;
//      case 'poli':
//        setBuyerOptions("AU", "AUD")
//        break;
//      case 'safetypay':
//        setBuyerOptions("NL", "EUR")
//        break;
//      case 'satispay':
//        setBuyerOptions("IT", "EUR")
//        break;
      case 'sofort':
        setBuyerOptions("NL", "EUR")
        break;
      case 'trustly':
        setBuyerOptions("FI", "EUR")
        break;
      case 'trustpay':
        setBuyerOptions("CZ", "CZK")
        break;
      case 'verkkopankki':
        setBuyerOptions("FI", "EUR")
        break;
      case 'wechatpay':
        setBuyerOptions("CN", "EUR")
        break;
      default:
        setBuyerOptions("", "")
    }

  }

});