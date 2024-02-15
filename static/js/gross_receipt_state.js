$(document).ready(() => {
    if ($("td.type-1-gross-receipts-row-index").length == 0) {
        addGrossReceiptsRow($("button#gross-receipt-state-add-type-1-gross-receipts-row"), 1, 0, 1000000000);
    }
    if ($("td.type-2-gross-receipts-row-index").length == 0) {
        addGrossReceiptsRow($("button#gross-receipt-state-add-type-2-gross-receipts-row"), 2, 0, 1000000000);
    }

    $("tbody").on("focusout", "input.number", function(event) {
        recalculateAndFormatForGrossReceiptState();
    });
    recalculateAndFormatForGrossReceiptState();
});

$("button#gross-receipt-state-add-additional-entire-gross-receipts-type-1").on("click", function(event) {
    addAdditionalEntireGrossReceiptsType1Row($(this), "", 0);
    event.preventDefault();
});

$("button#gross-receipt-state-add-additional-entire-gross-receipts-type-2").on("click", function(event) {
    addAdditionalEntireGrossReceiptsType2Row($(this), "", 0);
    event.preventDefault();
});

$("button#gross-receipt-state-add-type-1-gross-receipts-row").on("click", function(event) {
    addGrossReceiptsRow($(this), 1, 0, 0);
    event.preventDefault();
});

$("button#gross-receipt-state-add-type-2-gross-receipts-row").on("click", function(event) {
    addGrossReceiptsRow($(this), 2, 0, 0);
    event.preventDefault();
});

/**
 * Refresh table by recalculate and format.
 */
function recalculateAndFormatForGrossReceiptState() {
    _updateTableForGrossReceiptState();
    format_number_input();
}

/**
 * Get gross receipts state tax return data to be sent to the backend.
 */
function getGrossReceiptsStateTaxReturn() {
    let result = {
        "entireGrossReceiptsType1": [],
        "entireGrossReceiptsType2": [],
    };
    $("table.gross-receipt-based-state-tax-return tr").each((idx, item) => {
        if ($(item).find("input.entire-gross-receipts-type-1-name").length > 0) {
            let name = $(item).find("input.entire-gross-receipts-type-1-name").val();
            let value = str2number($(item).find("input.entire-gross-receipts-type-1-value").val());
            result["entireGrossReceiptsType1"].push({"name": name, "value": value});
        } else if ($(item).find("input.entire-gross-receipts-type-2-name").length > 0) {
            let name = $(item).find("input.entire-gross-receipts-type-2-name").val();
            let value = str2number($(item).find("input.entire-gross-receipts-type-2-value").val());
            result["entireGrossReceiptsType2"].push({"name": name, "value": value});
        }
    });
    result["stateMinimumTaxExpense"] = str2number($("input#gross-receipt-state-state-minimum-tax-expense").val());
    return result;
}

/**
 * Get gross receipts tax table data to be sent to the backend.
 */
function getGrossReceiptsTaxTable() {
    let result = {"1": [], "2": []};
    [1, 2].forEach(type => {
        $("table.type-" + type + "-gross-receipts tr").each((idx, item) => {
            if ($(item).find("td.type-" + type + "-gross-receipts-row-index").length === 0) {
                return;
            }
            let taxRate = str2number($(item).find("input.tax-rate").val());
            let max =  str2number($(item).find("input.max").val());
            result[type].push({
                "tax-rate": taxRate,
                "max": max,
            });
        });
    });
    return result;
}

/**
 * Add a new row to the gross receipts tax table.
 */
function addGrossReceiptsRow(button, type, taxRate, maxValue) {
    let rowHtml = `
    <tr>
        <td style="min-width: 30px; padding: 0 !important;">
    `;
    if ($("td.type-" + type + "-gross-receipts-row-index").length != 0) {
        rowHtml += `<button class="gross-receipt-state-remove-row"><span class="bi bi-x-circle-fill" /></button>`;
    }
    rowHtml += `
        </td>
        <td class="type-${type}-gross-receipts-row-index" style="min-width: 30px;"></td>
        <td class="gross-receipts"><input class="number gross-receipts" value="0" data-digits="0" readonly></td>
        <td class="tax-rate"><input class="number percent tax-rate" value="${taxRate}" data-digits="2"></td>
        <td class="min"><input class="number min" value="0" data-digits="0" readonly></td>
        <td class="max"><input class="number max" value="${maxValue}" data-digits="0"></td>
        <td class="taxable-receipts"><input class="number taxable-receipts" value="0" data-digits="0" readonly></td>
        <td class="tax-expense"><input class="number type-${type}-tax-expense" value="0" data-digits="0" readonly></td>
    </tr>
    `;
    _addUserInputRowForGrossReceiptState(button, rowHtml);
}

/**
 * Add a new row for additional entire gross receipts type 1.
 */
function addAdditionalEntireGrossReceiptsType1Row(button, name, value) {
    let rowHtml = `
    <tr>
        <td>
            <button class="gross-receipt-state-remove-row"><span class="bi bi-x-circle-fill" /></button>
            <input class="string entire-gross-receipts-type-1-name" style="width: 70%" value="${name}">
        </td>
        <td><input class="number entire-gross-receipts-type-1-value" value="${value}" data-digits="0"></td>
        <td></td>
    </tr>
    `
    _addUserInputRowForGrossReceiptState(button, rowHtml);
}

/**
 * Add a new row for additional entire gross receipts type 2.
 */
function addAdditionalEntireGrossReceiptsType2Row(button, name, value) {
    let rowHtml = `
    <tr>
        <td>
            <button class="gross-receipt-state-remove-row"><span class="bi bi-x-circle-fill" /></button>
            <input class="string entire-gross-receipts-type-2-name" style="width: 70%" value="${name}">
        </td>
        <td></td>
        <td><input class="number entire-gross-receipts-type-2-value" value="${value}" data-digits="0"></td>
    </tr>
    `
    _addUserInputRowForGrossReceiptState(button, rowHtml);
}

/**
 * Add given rowHTML to the row closest to the given button.
 */
function _addUserInputRowForGrossReceiptState(button, rowHtml) {
    $(button).closest("tr").before(rowHtml);
    $("button.gross-receipt-state-remove-row").on("click", function(event) {
        $(this).closest("tr").remove();
        event.preventDefault();
        recalculateAndFormatForGrossReceiptState();
    });
    recalculateAndFormatForGrossReceiptState();
}

/**
 * Recalculate numbers and update all tables.
 */
function _updateTableForGrossReceiptState() {
    // Calculate adjusted gross receipts value
    let adjustedGrossReceipts = str2number($("input#gross-receipt-state-entire-gross-receipts-type-1").val());
    $("input.entire-gross-receipts-type-1-value").each((idx, item) => { adjustedGrossReceipts += str2number($(item).val()) });
    $("input#gross-receipt-state-adjusted-gross-receipts").val(adjustedGrossReceipts);
    $("table.type-1-gross-receipts").find("input.gross-receipts").val(adjustedGrossReceipts);
    let entireGrossReceiptsType2 = 0;
    $("input.entire-gross-receipts-type-2-value").each((idx, item) => { entireGrossReceiptsType2 += str2number($(item).val()) });
    $("input#gross-receipt-state-entire-gross-receipts-type-2").val(entireGrossReceiptsType2);
    $("table.type-2-gross-receipts").find("input.gross-receipts").val(entireGrossReceiptsType2);

    // Update generic income tax table
    [1, 2].forEach(type => {
        let prevMax = 0;
        let grossReceipts = 0;
        let taxableReceipts = 0;
        $("td.type-" + type + "-gross-receipts-row-index").each((idx, item) => {
            // Update row index
            $(item).html(idx + 1)

            // Update min
            if (idx !== 0 && !isNaN(prevMax)) {
                $(item).siblings(".min").find("input").val(prevMax);
            }
            prevMax = str2number($(item).siblings(".max").find("input").val());

            // Update taxable receipt and tax expense
            if (idx == 0) {
                grossReceipts = str2number($(item).siblings(".gross-receipts").find("input").val());
            } else {
                grossReceipts = grossReceipts - taxableReceipts;
                $(item).siblings(".gross-receipts").find("input").val(grossReceipts);
            }
            let taxRate = str2number($(item).siblings(".tax-rate").find("input").val());
            let min = str2number($(item).siblings(".min").find("input").val());
            let max = str2number($(item).siblings(".max").find("input").val());
            taxableReceipts = Math.min(max - min, grossReceipts);
            $(item).siblings(".taxable-receipts").find("input").val(taxableReceipts);
            let taxExpense = taxableReceipts * taxRate / 100;
            $(item).siblings(".tax-expense").find("input").val(- taxExpense); // Use negative number
        });
    });

    // Calculate total tax expense
    let type1TaxExpense = 0;
    $("input.type-1-tax-expense").each((idx, item) => { type1TaxExpense += str2number($(item).val()) });
    $("input#gross-receipt-state-type-1-total-tax-expense").val(type1TaxExpense);
    let type2TaxExpense = 0;
    $("input.type-2-tax-expense").each((idx, item) => { type2TaxExpense += str2number($(item).val()) });
    $("input#gross-receipt-state-type-2-total-tax-expense").val(type2TaxExpense);

    let totalTaxExpense = type1TaxExpense + type2TaxExpense;
    $("input#gross-receipt-state-state-income-tax-expense").val(totalTaxExpense);
    let calculatedTaxExpense = Math.max(totalTaxExpense, str2number($("input#gross-receipt-state-state-minimum-tax-expense").val()))
    $("input#gross-receipt-state-higher-of-calculated-tax-expense-or-minimum").val(calculatedTaxExpense);
}