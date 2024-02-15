$(document).ready(() => {
    let dataTable = $("#data-table").DataTable({
        "ordering": false,
        "scrollCollapse": true,
        "paging": false,
        "searching": false,
        "info": false,
        "columnDefs": [{targets: 0, className: "text-nowrap"}],
    });

    setupTrashButton();
    recalculateAndFormat();
});

$("#data-table tbody").on("change", "input.number", recalculateAndFormat);
$("button#save-button").on("click", save);
$("button.trueup-add-column").on("click", addColumn);

/**
 * Add new column at the end of the table.
 */
function addColumn() {
    $("#data-table thead").find("tr").each((index, row) => {
        if ($(row).hasClass("button-row")) {
            $(row).append(`<th><button class="btn trueup-remove-column"><i class="fa fa-trash"></i></button></th>`);
        } else if ($(row).hasClass("perm-temp-row")) {
            $(row).append(`<th class="perm-temp"></th>`);
        } else if ($(row).hasClass("label-row")) {
            $(row).append(`
                <th class="col-user-input">
                <select name="selected-column" class="selectpicker string trueup-select" data-live-search="true">
                ${trueUpOptions.map((op) => '<option value="' + op.id + '">' + op.value + '</option>').join("")}
                </select>
                </th>
            `);
        }
    });
    $("#data-table tbody").find("tr").each((index, row) => {
        let name = $(row).find("td:first").text();
        if (name.match(/^\d/)) {
            // Row with Form 1120 item
            $(row).append(`<td><input class="number num-additional-entry" value="0"></td>`);
        } else if ($(row).hasClass("total-deductions-t") ||
                   $(row).hasClass("total-deductions-p") ||
                   name === "Taxable (income) loss" ||
                   name === "Income Tax Expense" ||
                   name === "Tax Rate") {
            // Total rows
            $(row).append(`<td><input class="number" value="0" readonly></td>`);
        } else {
            $(row).append(`<td></td>`);
        }
    });

    setupTrashButton()
    recalculateAndFormat();
}

/**
 * Update perm/temp label on the header based on the given select dropdown.
 */
function updatePermTemp(target) {
   let label = target.selectedOptions[0].text;
   let kind = label.match(/.*\((\w)\)$/)[1];
   let index = $(target).closest("th").index() + 1;
   $("tr.perm-temp-row").find("th:nth-child(" + index + ")").text(kind);
}

/**
 * Update perm/temp label on the header based on the given select dropdown.
 */
function setupTrueupSelect() {
    $("select.trueup-select").each((_i, target) => updatePermTemp(target));
    $(".trueup-select").on("change", (event) => {
        updatePermTemp(event.target);
        calculateTotal();
        format_number_input();
    });
}

/**
 * Update perm/temp label on the header based on the given select dropdown.
 */
function setupTrashButton() {
    $(".trueup-remove-column").on("click", (event) => {
        let index = $(event.target).closest("th").index() + 1;
        $("#data-table thead").find("tr th:nth-child(" + index + ")").each((i, e) => $(e).remove());
        $("#data-table tbody").find("tr td:nth-child(" + index + ")").each((i, e) => $(e).remove());
    });
}

/**
 * Calculate Difference column.
 */
function _calculateDifference() {
    $("tr.income, tr.deduction").find("input.num-difference").each((_i, target) => {
        let valProv = $(target).closest("tr").find("td input.num-balance-per-provision.number").val();
        let valRet = $(target).closest("tr").find("td input.num-balance-per-return.number").val();
        let diff = str2number(valRet) - str2number(valProv);
        $(target).val(diff);
    });
}

/**
 * Calculate Grand Total column.
 */
function _calculateGrandTotal() {
    $("input.num-grand-total").each((_i, target) => {
        let index = $(target).closest("td").index() + 1;
        let sum = $(target).closest("tr").find("td:gt(" + index + ") input.number")
            .map((_i, e) => str2number(e.value))
            .toArray()
            .reduce((a, b) => a + b, 0);
        $(target).val(sum);
    });
}

/**
 * Calculate Check column.
 */
function _calculateCheck() {
    $("input.num-check").each((_i, target) => {
        let valDiff = str2number($(target).closest("tr").find("td input.num-difference.number").val());
        let valGrandTotal = str2number($(target).closest("tr").find("td input.num-grand-total.number").val());
        let sum = valDiff + valGrandTotal;
        $(target).val(sum);
    });
}

/**
 * Calculate Total Income row.
 */
function _calculateTotalIncome() {
    let form2Index = $("td.form-1120-name[data-number=2]").closest("tr.income").index();
    // Total income adds from form 3
    $("tr.total-income td").each((i, target) => {
        let index = i + 1;
        let sum = $("tr.income:gt(" + form2Index + ") td:nth-child(" + index + ") input.number")
            .map((_i, e) => str2number(e.value))
            .toArray()
            .reduce((a, b) => a + b, 0);
        $(target).find("input.number").val(sum);
    });
}

/**
 * Calculate Total Deductions row.
 */
function _calculateTotalDeductions() {
    $("tr.total-deductions td").each((i, target) => {
        let index = i + 1;
        if (
            $("tr.perm-temp-row th:nth-child(" + index + ")").text().length > 0 &&
            !$(target).find("input.number").hasClass("num-balance-per-provision") &&
            !$(target).find("input.number").hasClass("num-balance-per-return") &&
            !$(target).find("input.number").hasClass("num-difference")
        ) {
            return;
        }
        let sum = $("tr.deduction td:nth-child(" + index + ") input.number")
            .map((_i, e) => str2number(e.value))
            .toArray()
            .reduce((a, b) => a + b, 0);
        $(target).find("input.number").val(sum);
    });
}

/**
 * Calculate Sum of P and Sum of T rows.
 */
function _calculateTotalDeductionsPermTemp() {
    ["p", "t"].forEach((permTemp) => {
        $("tr.total-deductions-" + permTemp + " td").each((i, target) => {
            let index = i + 1;
            if ($("tr.perm-temp-row th:nth-child(" + index + ")").text().length === 0) {
                return;
            } else if ($("tr.perm-temp-row th:nth-child(" + index + ")").text() !== permTemp.toUpperCase()) {
                $(target).find("input.number").val(0);
                return;
            }
            let sum = $("tr td:nth-child(" + index + ") input.number:not([readonly])")
                .map((_i, e) => str2number(e.value))
                .toArray()
                .reduce((a, b) => a + b, 0);
            $(target).find("input.number").val(sum);
        });
    });
}

/**
 * Calculate Taxable (income) loss row.
 */
function _calculateTaxableIncomeLoss() {
    $("tr.taxable-income-loss td").each((i, target) => {
        let index = i + 1;
        if ($(target).find("input.number").hasClass("num-grand-total")) {
            // Grand total is calculated separately
            return;
        } else if ($("tr.perm-temp-row th:nth-child(" + index + ")").text().length === 0) {
            let income = $("tr.total-income td:nth-child(" + index + ") input.number").val()
            let deduction = $("tr.total-deductions td:nth-child(" + index + ") input.number").val();
            let total = str2number(income) - str2number(deduction);
            $(target).find("input.number").val(total);
        } else {
            let valP = $("tr.total-deductions-p td:nth-child(" + index + ") input.number").val();
            let valT = $("tr.total-deductions-t td:nth-child(" + index + ") input.number").val();
            let total = str2number(valP) + str2number(valT);
            $(target).find("input.number").val(total);
        }
    });
}

/**
 * Calculate Income Tax Expense row.
 */
function _calculateIncomeTaxExpense() {
    let balancePerProvision = str2number($("#taxable-income-loss-balance-per-provision").val())
        * str2number($("#tax-rate-balance-per-provision").val()) / 100;
    let balancePerReturn = str2number($("#taxable-income-loss-balance-per-return").val())
        * str2number($("#tax-rate-balance-per-return").val()) / 100;
    $("#income-tax-expense-balance-per-provision").val(balancePerProvision);
    $("#income-tax-expense-balance-per-return").val(balancePerReturn);
    $("#income-tax-expense-difference").val(balancePerProvision - balancePerReturn);

    let startIndex = $("tr.income-tax-expense input.num-check").closest("td").index() + 1;
    $("tr.income-tax-expense td").each((i, target) => {
        let index = i + 1;
        if (index <= startIndex) {
            return;
        }
        let taxableIncomeLoss = str2number($("tr.taxable-income-loss td:nth-child(" + index + ") input.number").val());
        let taxRate = str2number($("#tax-rate-balance-per-return").val()) / 100;
        let incomeTaxExpense = taxableIncomeLoss * taxRate;
        $(target).find("input.number").val(incomeTaxExpense);

        if ($("tr.perm-temp-row th:nth-child(" + index + ")").text() === "P") {
            $("tr.perm-only td:nth-child(" + index + ") input.number").val(incomeTaxExpense);
        }
    });
}

/**
 * Calculate cells based on user input.
 */
function calculateTotal() {
    _calculateDifference();
    _calculateTotalIncome();
    _calculateTotalDeductions();
    _calculateTotalDeductionsPermTemp();
    _calculateTaxableIncomeLoss();
    _calculateIncomeTaxExpense();
    _calculateGrandTotal();
    _calculateCheck();
}

/**
 * Recalculate and format everything.
 */
function recalculateAndFormat() {
    setupTrueupSelect();
    $(".selectpicker").selectpicker("render");
    calculateTotal();
    format_number_input();
}

/**
 * Get user input and format as JS object.
 */
function _getUserInputs() {
    let result = [];
    $("th.col-user-input").each((_i, th) => {
        let index = $(th).index() + 1;
        let resultCol = {};
        if ($(th).find("select.trueup-select").length > 0) {
            resultCol["tax_trueup_id"] = parseInt($(th).find("select.trueup-select").val());
        } else {
            resultCol["category"] = $(th).text();
        }
        $("tr.income td:nth-child(" + index + "), tr.deduction td:nth-child(" + index + ")").each((_i, td) => {
            let form1120_number = $(td).closest("tr").find("td.form-1120-name").data("number").toString();
            resultCol["form_" + form1120_number] = str2number($(td).find("input.number").val());
        });
        result.push(resultCol);
    });
    return result;
}

/**
 * Save user input by calling the API.
 */
function save() {
    let data = _getUserInputs();
    $.ajax({
        data: {"payload": JSON.stringify(data)},
        type: "POST",
        url: "/true_up"
    }).done((data) => {
        if (data.error) {
            console.log("Error while saving True-up data.");
            toastr.error("Unable to save. " + data.error);
        } else {
            toastr.success("Saved");
        }
    });
}