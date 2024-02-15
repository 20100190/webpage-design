$(document).ready(recalculateAndFormat);
$("#fdii-deduction-table input").change(recalculateAndFormat);

function recalculateAndFormat() {
    calculateForeignAllocableDeduction();
    calculateFddei();
    calculateDtir();
    calculateDeemedIntangibleIncome();
    calculateForeignDerivedIntangibleIncome();
    calculateLimitation();
    calculateFdiiDeduction();
    format_number_input();
}

function calculateForeignAllocableDeduction() {
    let foreignDerivedSales = str2number($("input#foreign-derived-sales").val());
    let netSales = str2number($("input#net-sales").val());
    let deductibleExpenses = str2number($("input#deductible-expenses").val());
    let foreignAllocableDeduction = foreignDerivedSales / netSales * deductibleExpenses;
    $("input#foreign-allocable-deduction").val(foreignAllocableDeduction);
}

function calculateFddei() {
    let foreignDerivedSales = str2number($("input#foreign-derived-sales").val());
    let foreignAllocableDeduction = str2number($("input#foreign-allocable-deduction").val());
    let fddei = foreignDerivedSales + foreignAllocableDeduction;
    $("input#fddei").val(fddei);
}

function calculateDtir() {
    let q1 = str2number($("input#q1").val());
    let q2 = str2number($("input#q2").val());
    let q3 = str2number($("input#q3").val());
    let q4 = str2number($("input#q4").val());
    let dtirRate = str2number($("input#dtir-rate").val());
    let dtir = (q1 + q2 + q3 + q4) / 4 * dtirRate;
    $("input#dtir").val(dtir);
}

function calculateDeemedIntangibleIncome() {
    let deductibleEligibleIncome = str2number($("input#deductible-eligible-income").val());
    let dtir = str2number($("input#dtir").val());
    let deemedIntangibleIncome = deductibleEligibleIncome + dtir;
    $("input#deemed-intangible-income").val(deemedIntangibleIncome);
}

function calculateForeignDerivedIntangibleIncome() {
    let deemedIntangibleIncome = str2number($("input#deemed-intangible-income").val());
    let fddei = str2number($("input#fddei").val());
    let deductibleEligibleIncome = str2number($("input#deductible-eligible-income").val());
    let foreignDerivedIntangibleIncome = deemedIntangibleIncome * fddei / deductibleEligibleIncome;
    $("input#foreign-derived-intangible-income").val(foreignDerivedIntangibleIncome);
}

function calculateLimitation() {
    let foreignDerivedIntangibleIncome = str2number($("input#foreign-derived-intangible-income").val());
    let adjustedTaxableIncome = str2number($("input#adjusted-taxable-income").val());
    let limitation = Math.min(0, foreignDerivedIntangibleIncome - adjustedTaxableIncome);
    $("input#limitation").val(limitation);
}

function calculateFdiiDeduction() {
    let limitation = str2number($("input#limitation").val());
    let foreignDerivedIntangibleIncome = str2number($("input#foreign-derived-intangible-income").val());
    let fdiiDeductionRate = str2number($("input#fdii-deduction-rate").val());
    let fdiiDeduction = (limitation - foreignDerivedIntangibleIncome) * fdiiDeductionRate;
    $("input#fdii-deduction").val(fdiiDeduction);
}

function saveFdiiDeduction() {
    let payload = {
        "foreign_derived_sales": str2number($("input#foreign-derived-sales").val()),
        "q1": str2number($("input#q1").val()),
        "q2": str2number($("input#q2").val()),
        "q3": str2number($("input#q3").val()),
        "q4": str2number($("input#q4").val())
    };
    $.ajax({
        data: {payload: JSON.stringify(payload)},
        type: "POST",
        url: "/m1_item_tab/7.17/fdii_deduction"
    }).done((data) => {
        if (data.error) {
            toastr.error("Failed to save FDII Deduction. Please try again later: " + data.error);
        } else {
            toastr.success("Successfully saved FDII Deduction");
        }
    })
}
