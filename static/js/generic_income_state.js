$(document).ready(() => {
    if ($("td.generic-income-row-index").length == 0) {
        addGenericIncomeRowForGenericIncomeState($("button#generic-income-state-add-generic-income-row"), 0, 0, 1000000000);
    }

    $("tbody").on("focusout", "input.number", function(event) {
        recalculateAndFormatForGenericIncomeState();
    });
    recalculateAndFormatForGenericIncomeState();
});

$("button#generic-income-state-add-additional-taxable-income").on("click", function(event) {
    addAdditionalTaxableIncomeRowForGenericIncomeState($(this), "", 0);
    event.preventDefault();
});

$("button#generic-income-state-add-additional-nol").on("click", function(event) {
    addAdditionalNolRowForGenericIncomeState($(this), "", 0);
    event.preventDefault();
});

$("button#generic-income-state-add-generic-income-row").on("click", function(event) {
    addGenericIncomeRowForGenericIncomeState($(this), 0, 0, 0);
    event.preventDefault();
});

/**
 * Refresh table by recalculate and format.
 */
function recalculateAndFormatForGenericIncomeState() {
    // Update taxable income
    let netIncomeLossSum = str2number($(".group-net-income-loss-sum").val());
    $("input#generic-income-state-taxable-income").val(netIncomeLossSum);
    _updateTableForGenericIncomeState();
    format_number_input();
}

/**
 * Get Income based state tax return data to be sent to the backend.
 */
function getIncomeBasedStateTaxReturn() {
    let result = {
        "taxableIncomeAdjustment": [],
        "additionalNol": [],
    };
    $("table.income-based-state-tax-return tr").each((idx, item) => {
        if ($(item).find("input.taxable-income-adjustment-name").length > 0) {
            let name = $(item).find("input.taxable-income-adjustment-name").val();
            let value = str2number($(item).find("input.taxable-income-adjustment-value").val());
            result["taxableIncomeAdjustment"].push({"name": name, "value": value});
        } else if ($(item).find("input.additional-nol-name").length > 0) {
            let name = $(item).find("input.additional-nol-name").val();
            let value = str2number($(item).find("input.additional-nol-value").val());
            result["additionalNol"].push({"name": name, "value": value});
        }
    });
    result["stateMinimumTaxExpense"] = str2number($("input#generic-income-state-state-minimum-tax-expense").val());
    return result;
}

/**
 * Get Generic Income Tax data to be sent to the backend.
 */
function getGenericIncomeTaxStateTable() {
    let result = [];
    $("table.generic-income-tax-state tr").each((idx, item) => {
        if ($(item).find("td.generic-income-row-index").length === 0) {
            return;
        }
        let constant = str2number($(item).find("input.constant").val());
        let taxRate = str2number($(item).find("input.tax-rate").val());
        let max =  str2number($(item).find("input.max").val());
        result.push({
            "constant": constant,
            "tax-rate": taxRate,
            "max": max,
        });
    });
    return result;
}

/**
 * Add a new row to the generic income tax table.
 */
function addGenericIncomeRowForGenericIncomeState(button, constant, taxRate, maxValue) {
    let rowHtml = `
    <tr>
        <td style="min-width: 30px; padding: 0 !important;">
    `;
    if ($("td.generic-income-row-index").length != 0) {
        rowHtml += `<button class="remove-row"><span class="bi bi-x-circle-fill" /></button>`;
    }
    rowHtml += `
        </td>
        <td class="generic-income-row-index" style="min-width: 30px;"></td>
        <td class="taxable-income"><input class="number taxable-income" value="0" data-digits="0" readonly></td>
        <td class="constant"><input class="number constant" value="${constant}" data-digits="0"></td>
        <td class="tax-rate"><input class="number percent tax-rate" value="${taxRate}"></td>
        <td class="min"><input class="number min" value="0" data-digits="0" readonly></td>
        <td class="max"><input class="number max" value="${maxValue}" data-digits="0"></td>
        <td class="tax-expense"><input class="number tax-expense" value="0" data-digits="0" readonly></td>
    </tr>
    `;
    _addUserInputRowForGenericIncomeState(button, rowHtml);
}

/**
 * Add a new row for additional taxable income.
 */
function addAdditionalTaxableIncomeRowForGenericIncomeState(button, name, value) {
    let rowHtml = `
    <tr>
        <td>
            <button class="generic-income-state-remove-row"><span class="bi bi-x-circle-fill" /></button>
            <input class="string taxable-income-adjustment-name" style="width: 80%" value="${name}">
        </td>
        <td><input class="number taxable-income-adjustment-value" value="${value}" data-digits="0"></td>
    </tr>
    `
    _addUserInputRowForGenericIncomeState(button, rowHtml);
}

/**
 * Add a new row for additional NOL.
 */
function addAdditionalNolRowForGenericIncomeState(button, name, value) {
    let rowHtml = `
    <tr>
        <td>
            <button class="generic-income-state-remove-row"><span class="bi bi-x-circle-fill" /></button>
            <input class="string additional-nol-name" style="width: 80%" value="${name}">
        </td>
        <td><input class="number additional-nol-value" value="${value}" data-digits="0"></td>
    </tr>
    `
    _addUserInputRowForGenericIncomeState(button, rowHtml);
}

/**
 * Add given rowHTML to the row closest to the given button.
 */
function _addUserInputRowForGenericIncomeState(button, rowHtml) {
    $(button).closest("tr").before(rowHtml);
    $("button.generic-income-state-remove-row").on("click", function(event) {
        $(this).closest("tr").remove();
        event.preventDefault();
        recalculateAndFormatForGenericIncomeState();
    });
    recalculateAndFormatForGenericIncomeState();
}

/**
 * Recalculate numbers and update all tables.
 */
function _updateTableForGenericIncomeState() {
    // Calculate adjusted taxable income
    let adjustedTaxableIncome = str2number($("input#generic-income-state-taxable-income").val());
    $("input.taxable-income-adjustment-value").each((idx, item) => {
        adjustedTaxableIncome += str2number($(item).val());
    });
    $("input#generic-income-state-adjusted-taxable-income").val(adjustedTaxableIncome);

    // Calculate apportioned taxable income
    $("input#generic-income-state-apportioned-taxable-income").val(
        str2number($("input#generic-income-state-adjusted-taxable-income").val()) * str2number($("input#generic-income-state-apportionment").val()) / 100
    );

    // Calculate adjusted taxable income after NOL
    let adjustedTaxableIncomeAfterNol = str2number($("input#generic-income-state-apportioned-taxable-income").val());
    $("input.additional-nol-value").each((idx, item) => {
        adjustedTaxableIncomeAfterNol += str2number($(item).val());
    });
    $("input#generic-income-state-adjusted-taxable-income-after-nol").val(adjustedTaxableIncomeAfterNol);
    $("input.taxable-income").val(adjustedTaxableIncomeAfterNol);

    // Update generic income tax table
    var prevMax = 0;
    $("td.generic-income-row-index").each((idx, item) => {
        // Update row index
        $(item).html(idx + 1)

        // Update min
        if (idx !== 0 && !isNaN(prevMax)) {
            $(item).siblings(".min").find("input").val(prevMax + 1);
        }
        prevMax = str2number($(item).siblings(".max").find("input").val());

        // Update tax expense
        let taxableIncome = - str2number($(item).siblings(".taxable-income").find("input").val());
        let constant = str2number($(item).siblings(".constant").find("input").val());
        let taxRate = str2number($(item).siblings(".tax-rate").find("input").val());
        let min = str2number($(item).siblings(".min").find("input").val());
        let max = str2number($(item).siblings(".max").find("input").val());
        let taxExpense = 0;
        if (max <= taxableIncome) {
            taxExpense = constant + (max - min) * (taxRate / 100);
        } else if (min <= taxableIncome) {
            taxExpense = constant + (taxableIncome - min) * (taxRate / 100);
        }
        $(item).siblings(".tax-expense").find("input").val(taxExpense);
    });

    // Calculate total tax expense
    let taxExpense = 0;
    $("input.tax-expense").each((idx, item) => {
        taxExpense += str2number($(item).val());
    });
    $("input#generic-income-state-total-tax-expense").val(taxExpense);
    $("input#generic-income-state-state-income-tax-expense").val(taxExpense);
    let calculatedTaxExpense = Math.max(taxExpense, str2number($("input#generic-income-state-state-minimum-tax-expense").val()))
    $("input#generic-income-state-higher-of-calculated-tax-expense-or-minimum").val(calculatedTaxExpense);
}