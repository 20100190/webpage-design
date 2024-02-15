$(document).ready(recalculateAndFormat);
$("#9-4-pl-table input").change(recalculateAndFormat);

$(document).ready(function () {
  $("#save-button").click(saveProfitAndLoss);
});

function recalculateAndFormat() {
  convertCurrency();
  format_number_input();
}

function convertCurrency() {
  var exchangeRate = str2number($("#exchange-rate").val());
  var attrIds = [
    "gross-receipts-or-sales",
    "returns-and-allowances",
    "subtract-line1b-from-line1a",
    "cogs",
    "gross-profit",
    "dividends",
    "interest-5",
    "gross-rents",
    "gross-royalties-and-license-fees",
    "net-gain-or-loss-on-sale-of-capital-assets",
    "foreign-currency-transaction-gain-or-loss",
    "foreign-currency-transaction-gain-or-loss-realized",
    "other-income",
    "total-income",
    "compensation-not-deducted-elsewhere",
    "rents",
    "royalties-and-license-fee",
    "interest-13",
    "depreciation-not-deducted-elsewhere",
    "depletion",
    "taxes",
    "other-deductions",
    "total-deductions",
    "net-income-or-loss",
    "unusual-or-infrequently-occuring-items",
    "income-tax-expense-current",
    "income-tax-expense-deferred",
    "current-year-net-income-or-loss",
    "foreign-currency-translation-adjustments",
    "other",
    "income-tax-expense-other-comprehensive-income",
    "other-comprehensive-income",
  ];
  for (var i = 0; i < attrIds.length; i++) {
    var attrId = attrIds[i];
    var value = str2number($(`#${attrId}`).val());
    $(`#${attrId}-usd`).val(value * exchangeRate);
  }
}

function saveProfitAndLoss() {
  let payload = {
    gross_receipts_or_sales: str2number($("input#gross-receipts-or-sales").val()),
    returns_and_allowances: str2number($("input#returns-and-allowances").val()),
    subtract_line1b_from_line1a: str2number($("input#subtract-line1b-from-line1a").val()),
    cogs: str2number($("input#cogs").val()),
    gross_profit: str2number($("input#gross-profit").val()),
    dividends: str2number($("input#dividends").val()),
    interest_5: str2number($("input#interest-5").val()),
    gross_rents: str2number($("input#gross-rents").val()),
    gross_royalties_and_license_fees: str2number($("input#gross-royalties-and-license-fees").val()),
    net_gain_or_loss_on_sale_of_capital_assets: str2number($("input#net-gain-or-loss-on-sale-of-capital-assets").val()),
    foreign_currency_transaction_gain_or_loss: str2number($("input#foreign-currency-transaction-gain-or-loss").val()),
    foreign_currency_transaction_gain_or_loss_realized: str2number($("input#foreign-currency-transaction-gain-or-loss-realized").val()),
    other_income: str2number($("input#other-income").val()),
    total_income: str2number($("input#total-income").val()),
    compensation_not_deducted_elsewhere: str2number($("input#compensation-not-deducted-elsewhere").val()),
    rents: str2number($("input#rents").val()),
    royalties_and_license_fee: str2number($("input#royalties-and-license-fee").val()),
    interest_13: str2number($("input#interest-13").val()),
    depreciation_not_deducted_elsewhere: str2number($("input#depreciation-not-deducted-elsewhere").val()),
    depletion: str2number($("input#depletion").val()),
    taxes: str2number($("input#taxes").val()),
    other_deductions: str2number($("input#other-deductions").val()),
    total_deductions: str2number($("input#total-deductions").val()),
    net_income_or_loss: str2number($("input#net-income-or-loss").val()),
    unusual_or_infrequently_occuring_items: str2number($("input#unusual-or-infrequently-occuring-items").val()),
    income_tax_expense_current: str2number($("input#income-tax-expense-current").val()),
    income_tax_expense_deferred: str2number($("input#income-tax-expense-deferred").val()),
    current_year_net_income_or_loss: str2number($("input#current-year-net-income-or-loss").val()),
    foreign_currency_translation_adjustments: str2number($("input#foreign-currency-translation-adjustments").val()),
    other: str2number($("input#other").val()),
    income_tax_expense_other_comprehensive_income: str2number($("input#income-tax-expense-other-comprehensive-income").val()),
    other_comprehensive_income: str2number($("input#other-comprehensive-income").val()),
  };
  $.ajax({
    data: { payload: JSON.stringify(payload) },
    type: "POST",
    url: "/form_pl",
  }).done((data) => {
    if (data.error) {
      toastr.error("Failed to save Profit and Loss. Please try again later: " + data.error);
    } else {
      toastr.success("Successfully saved Profit and Loss");
    }
  });
}
