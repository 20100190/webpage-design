$(document).ready(() => {
    $("tbody").on("focusout", "input.number", function(event) {
        recalculateAndFormatForGenericAllManual();
    });
    recalculateAndFormatForGenericAllManual();
});

function addTaxableIncomeAdjustmentsForGenericAllManual(name, value) {
    let button = $("button#generic-all-manual-add-taxable-income-adjustments");
    addAdjustmentsRowForGenericAllManual(button, "taxable-income-adjustments", name, value);
}

$("button#generic-all-manual-add-taxable-income-adjustments").on("click", function(event) {
    addTaxableIncomeAdjustmentsForGenericAllManual("", 0);
    event.preventDefault();
});

function addAvailableNolAdjustmentsForGenericAllManual(name, value) {
    let button = $("button#generic-all-manual-add-available-nol-adjustments");
    addAdjustmentsRowForGenericAllManual(button, "available-nol-adjustments", name, value);
}

$("button#generic-all-manual-add-available-nol-adjustments").on("click", function(event) {
    addAvailableNolAdjustmentsForGenericAllManual("", 0);
    event.preventDefault();
});

/**
 * Refresh table by recalculate and format.
 */
function recalculateAndFormatForGenericAllManual() {
    _updateTableForGenericAllManual();
    format_number_input();
}

/**
 * Get generic all manual tax return data to be sent to the backend.
 */
function getGenericAllManualTaxReturn() {
    let result = {
        "taxableIncomeAdjustments": [],
        "availableNolAdjustments": [],
    };
    $("table.income-based-state-tax-return tr").each((idx, item) => {
        if ($(item).find("input.taxable-income-adjustments-name").length > 0) {
            let name = $(item).find("input.taxable-income-adjustments-name").val();
            let value = str2number($(item).find("input.taxable-income-adjustments-value").val());
            result["taxableIncomeAdjustments"].push({"name": name, "value": value});
        } else if ($(item).find("input.available-nol-adjustments-name").length > 0) {
            let name = $(item).find("input.available-nol-adjustments-name").val();
            let value = str2number($(item).find("input.available-nol-adjustments-value").val());
            result["availableNolAdjustments"].push({"name": name, "value": value});
        }
    });
    result["stateIncomeTaxExpense"] = str2number($("input#generic-all-manual-state-income-tax-expense").val());
    result["regularTaxRate"] = str2number($("input#generic-all-manual-regular-tax-rate").val());
    return result;
}

/**
 * Add a new row to the adjustments.
 */
function addAdjustmentsRowForGenericAllManual(button, className, name, value, digits) {
    let rowHtml = `
    <tr>
        <td>
            <button class="generic-all-manual-remove-row"><span class="bi bi-x-circle-fill" /></button>
            <input class="string ${className}-name" style="width: 80%" value="${name}">
        </td>
        <td><input class="number ${className}-value" value="${value}"></td>
    </tr>
    `
    _addUserInputRowForGenericAllManual(button, rowHtml);
}

/**
 * Add given rowHTML to the row closest to the given button.
 */
function _addUserInputRowForGenericAllManual(button, rowHtml) {
    $(button).closest("tr").before(rowHtml);
    $("button.generic-all-manual-remove-row").on("click", function(event) {
        $(this).closest("tr").remove();
        event.preventDefault();
        recalculateAndFormatForGenericAllManual();
    });
    recalculateAndFormatForGenericAllManual();
}

/**
 * Recalculate numbers and update all tables.
 */
function _updateTableForGenericAllManual() {
    // State Income Tax Calculation
    let netIncomeLoss = str2number($("input.group-net-income-loss-sum").val());
    $("input#generic-all-manual-taxable-income").val(netIncomeLoss);

    let adjustedTaxableIncome = netIncomeLoss;
    $("input.taxable-income-adjustments-value").each((idx, item) => {
        adjustedTaxableIncome += str2number($(item).val());
    });
    $("input#generic-all-manual-adjusted-taxable-income").val(adjustedTaxableIncome);

    let apportionedTaxableIncome = adjustedTaxableIncome * str2number($("input#generic-all-manual-apportionment").val()) / 100;
    $("input#generic-all-manual-apportioned-taxable-income").val(apportionedTaxableIncome);

    let availableNol = str2number($("input#generic-all-manual-available-nol").val());
    let adjustedTaxableIncomeAfterNol = apportionedTaxableIncome + availableNol;
    $("input.available-nol-adjustments-value").each((idx, item) => {
        adjustedTaxableIncomeAfterNol += str2number($(item).val());
    });
    $("input#generic-all-manual-adjusted-taxable-income-after-nol").val(adjustedTaxableIncomeAfterNol);

    let stateIncomeTaxExpense = str2number($("input#generic-all-manual-state-income-tax-expense").val());
    $("input#generic-all-manual-effective-state-tax-rate-before-nol").val(- 100 * stateIncomeTaxExpense / apportionedTaxableIncome);
    $("input#generic-all-manual-effective-state-tax-rate").val(- 100 * stateIncomeTaxExpense / adjustedTaxableIncomeAfterNol);
}