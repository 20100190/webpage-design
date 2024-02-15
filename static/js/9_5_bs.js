$(document).ready(recalculateAndFormat);
$("#9-5-bs-table input").change(recalculateAndFormat);

$(document).ready(function () {
  $("#save-button").click(saveBalanceSheet);
});

function recalculateAndFormat() {
  calculateTotalAssets();
  calculateTotalLiabilitiesAndEquity();
  convertCurrency();
  format_number_input();
}

function convertCurrency() {
  var exchangeRate = str2number($("#exchange-rate").val());
  var attrIds = [
    "cash",
    "trade-notes-and-accounts-receivable",
    "less-allowance-for-bad-debts",
    "derivatives-assets",
    "inventories",
    "other-current-assets",
    "loans-to-shareholders-and-other-related-persons",
    "investment-in-subsidiaries",
    "other-investments",
    "buildings-and-other-depreciable-assets",
    "less-accumulated-depreciation",
    "depletable-assets",
    "less-accumulated-depletion",
    "land",
    "goodwill",
    "organization-costs",
    "other-intangible-assets",
    "less-accumulated-amortization",
    "other-assets",
    "total-assets",
    "accounts-payable",
    "other-current-libailities",
    "derivatives-liabilities",
    "loans-from-shareholders-and-other-related-persons",
    "other-liabilities",
    "perferred-stock",
    "common-stock",
    "paid-in-or-capital-sulprus",
    "retained-earnings",
    "less-cost-of-treasury-stock",
    "total-liabilities-and-equity",
  ];
  for (var i = 0; i < attrIds.length; i++) {
    var attrId = attrIds[i];
    var value = str2number($(`#${attrId}`).val());
    $(`#${attrId}-usd`).val(value * exchangeRate);
  }
}

function calculateTotalAssets() {
  var attrIds = [
    "cash",
    "trade-notes-and-accounts-receivable",
    "less-allowance-for-bad-debts",
    "derivatives-assets",
    "inventories",
    "other-current-assets",
    "loans-to-shareholders-and-other-related-persons",
    "investment-in-subsidiaries",
    "other-investments",
    "buildings-and-other-depreciable-assets",
    "less-accumulated-depreciation",
    "depletable-assets",
    "less-accumulated-depletion",
    "land",
    "goodwill",
    "organization-costs",
    "other-intangible-assets",
    "less-accumulated-amortization",
    "other-assets",
  ];
  var total = 0;
  for (var i = 0; i < attrIds.length; i++) {
    var attrId = attrIds[i];
    total += str2number($(`#${attrId}`).val());
  }
  $("#total-assets").val(total);
}

function calculateTotalLiabilitiesAndEquity() {
  var attrIds = [
    "accounts-payable",
    "other-current-libailities",
    "derivatives-liabilities",
    "loans-from-shareholders-and-other-related-persons",
    "other-liabilities",
    "perferred-stock",
    "common-stock",
    "paid-in-or-capital-sulprus",
    "retained-earnings",
    "less-cost-of-treasury-stock",
  ];
  var total = 0;
  for (var i = 0; i < attrIds.length; i++) {
    var attrId = attrIds[i];
    total += str2number($(`#${attrId}`).val());
  }
  $("#total-liabilities-and-equity").val(total);
}

function saveBalanceSheet() {
  let payload = {
    cash: str2number($("input#cash").val()),
    trade_notes_and_accounts_receivable: str2number($("input#trade-notes-and-accounts-receivable").val()),
    less_allowance_for_bad_debts: str2number($("input#less-allowance-for-bad-debts").val()),
    derivatives_assets: str2number($("input#derivatives-assets").val()),
    inventories: str2number($("input#inventories").val()),
    other_current_assets: str2number($("input#other-current-assets").val()),
    loans_to_shareholders_and_other_related_persons: str2number($("input#loans-to-shareholders-and-other-related-persons").val()),
    investment_in_subsidiaries: str2number($("input#investment-in-subsidiaries").val()),
    other_investments: str2number($("input#other-investments").val()),
    buildings_and_other_depreciable_assets: str2number($("input#buildings-and-other-depreciable-assets").val()),
    less_accumulated_depreciation: str2number($("input#less-accumulated-depreciation").val()),
    depletable_assets: str2number($("input#depletable-assets").val()),
    less_accumulated_depletion: str2number($("input#less-accumulated-depletion").val()),
    land: str2number($("input#land").val()),
    goodwill: str2number($("input#goodwill").val()),
    organization_costs: str2number($("input#organization-costs").val()),
    other_intangible_assets: str2number($("input#other-intangible-assets").val()),
    less_accumulated_amortization: str2number($("input#less-accumulated-amortization").val()),
    other_assets: str2number($("input#other-assets").val()),
    total_assets: str2number($("input#total-assets").val()),
    accounts_payable: str2number($("input#accounts-payable").val()),
    other_current_libailities: str2number($("input#other-current-libailities").val()),
    derivatives_liabilities: str2number($("input#derivatives-liabilities").val()),
    loans_from_shareholders_and_other_related_persons: str2number($("#loans-from-shareholders-and-other-related-persons").val()),
    other_liabilities: str2number($("input#other-liabilities").val()),
    perferred_stock: str2number($("input#perferred-stock").val()),
    common_stock: str2number($("input#common-stock").val()),
    paid_in_or_capital_sulprus: str2number($("input#paid-in-or-capital-sulprus").val()),
    retained_earnings: str2number($("input#retained-earnings").val()),
    less_cost_of_treasury_stock: str2number($("input#less-cost-of-treasury-stock").val()),
    total_liabilities_and_equity: str2number($("input#total-liabilities-and-equity").val()),
  };
  $.ajax({
    data: { payload: JSON.stringify(payload) },
    type: "POST",
    url: "/form_bs",
  }).done((data) => {
    if (data.error) {
      toastr.error("Failed to save Balance Sheet. Please try again later: " + data.error);
    } else {
      toastr.success("Successfully saved Balance Sheet");
    }
  });
}
