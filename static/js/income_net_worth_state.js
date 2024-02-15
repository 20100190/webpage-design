$(document).ready(() => {
    $("tbody").on("focusout", "input.number", function(event) {
        recalculateAndFormatForIncomeNetWorthState();
    });
    recalculateAndFormatForIncomeNetWorthState();
});

function addStateApportionedTaxableIncomeLossAdjustmentsForIncomeNetWorthState(name, value) {
    let button = $("button#income-net-worth-state-add-state-apportioned-taxable-income-loss-adjustments");
    addAdjustmentsRowForIncomeNetWorthState(button, "state-apportioned-taxable-income-loss-adjustments", name, value);
}

$("button#income-net-worth-state-add-state-apportioned-taxable-income-loss-adjustments").on("click", function(event) {
    addStateApportionedTaxableIncomeLossAdjustmentsForIncomeNetWorthState("", 0);
    event.preventDefault();
});

function addNolEligibleForApplicationAdjustmentsForIncomeNetWorthState(name, value) {
    let button = $("button#income-net-worth-state-add-nol-eligible-for-application-adjustments");
    addAdjustmentsRowForIncomeNetWorthState(button, "nol-eligible-for-application-adjustments", name, value);
}

$("button#income-net-worth-state-add-nol-eligible-for-application-adjustments").on("click", function(event) {
    addNolEligibleForApplicationAdjustmentsForIncomeNetWorthState("", 0);
    event.preventDefault();
});

function addIncomeTaxExpenseBenefitAdjustmentsForIncomeNetWorthState(name, value) {
    let button = $("button#income-net-worth-state-add-income-tax-expense-benefit-adjustments");
    addAdjustmentsRowForIncomeNetWorthState(button, "income-tax-expense-benefit-adjustments", name, value);
}

$("button#income-net-worth-state-add-income-tax-expense-benefit-adjustments").on("click", function(event) {
    addIncomeTaxExpenseBenefitAdjustmentsForIncomeNetWorthState("", 0);
    event.preventDefault();
});

function addNetWorthAdjustmentsForIncomeNetWorthState(name, value) {
    let button = $("button#income-net-worth-state-add-net-worth-adjustments");
    addAdjustmentsRowForIncomeNetWorthState(button, "net-worth-adjustments", name, value);
}

$("button#income-net-worth-state-add-net-worth-adjustments").on("click", function(event) {
    addNetWorthAdjustmentsForIncomeNetWorthState("", 0);
    event.preventDefault();
});

function addNetWorthApportionedToStateAdjustmentsForIncomeNetWorthState(name, value) {
    let button = $("button#income-net-worth-state-add-net-worth-apportioned-to-state-adjustments");
    addAdjustmentsRowForIncomeNetWorthState(button, "net-worth-apportioned-to-state-adjustments", name, value);
}

$("button#income-net-worth-state-add-net-worth-apportioned-to-state-adjustments").on("click", function(event) {
    addNetWorthApportionedToStateAdjustmentsForIncomeNetWorthState("", 0);
    event.preventDefault();
});

function addStateNetWorthFranchiseTaxAdjustmentsForIncomeNetWorthState(name, value) {
    let button = $("button#income-net-worth-state-add-state-net-worth-franchise-tax-adjustments");
    addAdjustmentsRowForIncomeNetWorthState(button, "state-net-worth-franchise-tax-adjustments", name, value);
}

$("button#income-net-worth-state-add-state-net-worth-franchise-tax-adjustments").on("click", function(event) {
    addStateNetWorthFranchiseTaxAdjustmentsForIncomeNetWorthState("", 0);
    event.preventDefault();
});

/**
 * Refresh table by recalculate and format.
 */
function recalculateAndFormatForIncomeNetWorthState() {
    _updateTableForIncomeNetWorthState();
    format_number_input();
}

/**
 * Get Income net worth state tax return data to be sent to the backend.
 */
function getIncomeNetWorthStateTaxReturn() {
    let result = {
        "stateApportionedTaxableIncomeLossAdjustments": [],
        "nolEligibleForApplicationAdjustments": [],
        "incomeTaxExpenseBenefitAdjustments": [],
        "netWorthAdjustments": [],
        "netWorthApportionedToStateAdjustments": [],
        "stateNetWorthFranchiseTaxAdjustments": []
    };
    $("table.state-income-tax-calculation tr").each((idx, item) => {
        if ($(item).find("input.state-apportioned-taxable-income-loss-adjustments-name").length > 0) {
            let name = $(item).find("input.state-apportioned-taxable-income-loss-adjustments-name").val();
            let value = str2number($(item).find("input.state-apportioned-taxable-income-loss-adjustments-value").val());
            result["stateApportionedTaxableIncomeLossAdjustments"].push({"name": name, "value": value});
        } else if ($(item).find("input.nol-eligible-for-application-adjustments-name").length > 0) {
            let name = $(item).find("input.nol-eligible-for-application-adjustments-name").val();
            let value = str2number($(item).find("input.nol-eligible-for-application-adjustments-value").val());
            result["nolEligibleForApplicationAdjustments"].push({"name": name, "value": value});
        } else if ($(item).find("input.income-tax-expense-benefit-adjustments-name").length > 0) {
            let name = $(item).find("input.income-tax-expense-benefit-adjustments-name").val();
            let value = str2number($(item).find("input.income-tax-expense-benefit-adjustments-value").val());
            result["incomeTaxExpenseBenefitAdjustments"].push({"name": name, "value": value});
        }
    });
    $("table.state-franchise-tax-based-on-net-worth tr").each((idx, item) => {
        if ($(item).find("input.net-worth-adjustments-name").length > 0) {
            let name = $(item).find("input.net-worth-adjustments-name").val();
            let value = str2number($(item).find("input.net-worth-adjustments-value").val());
            result["netWorthAdjustments"].push({"name": name, "value": value});
        } else if ($(item).find("input.net-worth-apportioned-to-state-adjustments-name").length > 0) {
            let name = $(item).find("input.net-worth-apportioned-to-state-adjustments-name").val();
            let value = str2number($(item).find("input.net-worth-apportioned-to-state-adjustments-value").val());
            result["netWorthApportionedToStateAdjustments"].push({"name": name, "value": value});
        } else if ($(item).find("input.state-net-worth-franchise-tax-adjustments-name").length > 0) {
            let name = $(item).find("input.state-net-worth-franchise-tax-adjustments-name").val();
            let value = str2number($(item).find("input.state-net-worth-franchise-tax-adjustments-value").val());
            result["stateNetWorthFranchiseTaxAdjustments"].push({"name": name, "value": value});
        }
    });
    result["adjustmentsToNol"] = str2number($("input#income-net-worth-state-adjustments-to-nol").val());
    result["flatIncomeTaxRate"] = str2number($("input#income-net-worth-state-flat-income-tax-rate").val());
    result["stateNetWorthFranchiseTaxRate"] = str2number($("input#income-net-worth-state-state-net-worth-franchise-tax-rate").val());
    return result;
}

/**
 * Add a new row to the adjustments.
 */
function addAdjustmentsRowForIncomeNetWorthState(button, className, name, value, digits) {
    let rowHtml = `
    <tr>
        <td>
            <button class="income-net-worth-state-remove-row"><span class="bi bi-x-circle-fill" /></button>
            <input class="string ${className}-name" style="width: 80%" value="${name}">
        </td>
        <td><input class="number ${className}-value" value="${value}"></td>
    </tr>
    `
    _addUserInputRowForIncomeNetWorthState(button, rowHtml);
}

/**
 * Add given rowHTML to the row closest to the given button.
 */
function _addUserInputRowForIncomeNetWorthState(button, rowHtml) {
    $(button).closest("tr").before(rowHtml);
    $("button.income-net-worth-state-remove-row").on("click", function(event) {
        $(this).closest("tr").remove();
        event.preventDefault();
        recalculateAndFormatForIncomeNetWorthState();
    });
    recalculateAndFormatForIncomeNetWorthState();
}

/**
 * Recalculate numbers and update all tables.
 */
function _updateTableForIncomeNetWorthState() {
    // State Income Tax Calculation
    let netIncomeLoss = str2number($("input.group-net-income-loss-sum").val());
    $("input#income-net-worth-state-income-loss-after-state-adj").val(netIncomeLoss);

    let stateApportionedTaxableIncomeLoss = str2number($("input#income-net-worth-state-income-loss-after-state-adj").val()) * str2number($("input#income-net-worth-state-apportionment-to-state").val()) / 100;
    $("input#income-net-worth-state-state-apportioned-taxable-income-loss").val(stateApportionedTaxableIncomeLoss);

    let stateApportionedTaxableIncomeLossAfterAdj = stateApportionedTaxableIncomeLoss;
    $("input.state-apportioned-taxable-income-loss-adjustments-value").each((idx, item) => {
        stateApportionedTaxableIncomeLossAfterAdj += str2number($(item).val());
    });
    $("input#income-net-worth-state-state-apportioned-taxable-income-loss-after-adj").val(stateApportionedTaxableIncomeLossAfterAdj);

    let availableNolAfterAdjustment = str2number($("input#income-net-worth-state-available-nol").val()) + str2number($("input#income-net-worth-state-adjustments-to-nol").val());
    $("input#income-net-worth-state-available-nol-after-adjustment").val(availableNolAfterAdjustment);

    let nolEligibleForApplication = 0;
    if (stateApportionedTaxableIncomeLossAfterAdj <= 0) {
        if (- stateApportionedTaxableIncomeLossAfterAdj < availableNolAfterAdjustment) {
            nolEligibleForApplication = - stateApportionedTaxableIncomeLossAfterAdj;
        } else {
            nolEligibleForApplication = availableNolAfterAdjustment;
        }
    }
    $("input#income-net-worth-state-nol-eligible-for-application").val(nolEligibleForApplication);

    let nolElectedToBeUsed = nolEligibleForApplication;
    $("input.nol-eligible-for-application-adjustments-value").each((idx, item) => {
        nolElectedToBeUsed += str2number($(item).val());
    });
    $("input#income-net-worth-state-nol-elected-to-be-used").val(nolElectedToBeUsed);

    let stateTaxableIncomeLossAfterNol = stateApportionedTaxableIncomeLossAfterAdj + nolElectedToBeUsed;
    $("input#income-net-worth-state-state-taxable-income-loss-after-nol").val(stateTaxableIncomeLossAfterNol);

    let nolAvailableForFutureYears = availableNolAfterAdjustment - nolEligibleForApplication;
    $("input#income-net-worth-state-nol-available-for-future-years").val(nolAvailableForFutureYears);

    let flatIncomeTaxRate = str2number($("input#income-net-worth-state-flat-income-tax-rate").val());
    let incomeTaxExpenseBenefit = Math.round(- flatIncomeTaxRate * stateTaxableIncomeLossAfterNol) / 100;
    $("input#income-net-worth-state-income-tax-expense-benefit").val(incomeTaxExpenseBenefit);

    let incomeTaxExpenseBenefitAfterAdj = incomeTaxExpenseBenefit;
    $("input.income-tax-expense-benefit-adjustments-value").each((idx, item) => {
        incomeTaxExpenseBenefitAfterAdj += str2number($(item).val());
    });
    $("input#income-net-worth-state-income-tax-expense-benefit-after-adj").val(incomeTaxExpenseBenefitAfterAdj);

    // State Franchise Tax Based on Net Worth
    let netWorth = str2number($("input#income-net-worth-state-total-assets").val()) + str2number($("input#income-net-worth-state-total-liabilities").val());
    $("input#income-net-worth-state-net-worth").val(netWorth);

    let netWorthAfterAdjustments = netWorth;
    $("input.net-worth-adjustments-value").each((idx, item) => {
        netWorthAfterAdjustments += str2number($(item).val());
    });
    $("input#income-net-worth-state-net-worth-after-adjustments").val(netWorthAfterAdjustments);

    let netWorthApportionedToState = netWorthAfterAdjustments * str2number($("input#income-net-worth-state-franchise-tax-apportionment").val()) / 100;
    $("input#income-net-worth-state-net-worth-apportioned-to-state").val(netWorthApportionedToState);

    let stateNetWorthFranchiseTaxBase = netWorthApportionedToState;
    $("input.net-worth-apportioned-to-state-adjustments-value").each((idx, item) => {
        stateNetWorthFranchiseTaxBase += str2number($(item).val());
    });
    $("input#income-net-worth-state-state-net-worth-franchise-tax-base").val(stateNetWorthFranchiseTaxBase);

    let stateNetWorthFranchiseTax = stateNetWorthFranchiseTaxBase * str2number($("input#income-net-worth-state-state-net-worth-franchise-tax-rate").val()) / 100;
    $("input#income-net-worth-state-state-net-worth-franchise-tax").val(stateNetWorthFranchiseTax);

    let stateNetWorthFranchiseTaxExpenseAfterAdj = stateNetWorthFranchiseTax;
    $("input.state-net-worth-franchise-tax-adjustments-value").each((idx, item) => {
        stateNetWorthFranchiseTaxExpenseAfterAdj += str2number($(item).val());
    });
    $("input#income-net-worth-state-state-net-worth-franchise-tax-expense-after-adj").val(stateNetWorthFranchiseTaxExpenseAfterAdj);

    // State Tax Summary
    let stateIncomeTaxExpense = incomeTaxExpenseBenefitAfterAdj;
    $("input#income-net-worth-state-state-income-tax-expense").val(stateIncomeTaxExpense);

    let stateNetWorthFranchiseTaxExpense = stateNetWorthFranchiseTaxExpenseAfterAdj;
    $("input#income-net-worth-state-state-net-worth-franchise-tax-expense").val(stateNetWorthFranchiseTaxExpense);

    let totalTaxExpense = stateIncomeTaxExpense + stateNetWorthFranchiseTaxExpense;
    $("input#income-net-worth-state-total-tax-expense").val(totalTaxExpense);

    $("input#income-net-worth-state-regular-tax-rate").val(flatIncomeTaxRate);

    if (stateApportionedTaxableIncomeLossAfterAdj != 0) {
        $("input#income-net-worth-state-effective-state-tax-rate-before-nol").val(- totalTaxExpense / stateApportionedTaxableIncomeLossAfterAdj * 100);
    } else {
        $("input#income-net-worth-state-effective-state-tax-rate-before-nol").val(0);
    }

    if (stateTaxableIncomeLossAfterNol != 0) {
        $("input#income-net-worth-state-effective-state-tax-rate").val(- totalTaxExpense / stateTaxableIncomeLossAfterNol * 100);
    } else {
        $("input#income-net-worth-state-effective-state-tax-rate").val(0);
    }
}