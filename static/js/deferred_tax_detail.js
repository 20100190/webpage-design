$(document).ready(() => {
    let data_table = $("#data-table").DataTable({
        "ordering": false,
        "paging": false,
        "info": false,
        "searching": false,
    });

    calculateDeferredTaxDetail()
});

$("#data-table tbody").on("change", "input", calculateDeferredTaxDetail);
$("button#save-button").on("click", (event) => saveDeferredTaxDetail());

function getDeferredTaxDetailInputValues() {
    let payload = [];
    $("#data-table tbody tr.user-inputs").each((_, elem) => {
        payload.push({
            "item": $(elem).find("input.deferred-tax-item").val(),
            "deferred_tax_beginning": str2number($(elem).find("input.deferred-tax-beginning").val()),
            "other_adjustments": str2number($(elem).find("input.other-adjustments").val()),
            "fed_state_special": $(elem).find("select.fed-state-special").val(),
            "special_fed_tax_rate": str2number($(elem).find("input.special-fed-tax-rate").val()),
            "special_state_tax_rate": str2number($(elem).find("input.special-state-tax-rate").val()),
            "fixed_assets": ($(elem).find("input.fixed-assets").val().toLowerCase() === "true")
        });
    });
    return payload;
}

function saveDeferredTaxDetail() {
    $.ajax( {
        data: {"payload": JSON.stringify(getDeferredTaxDetailInputValues())},
        type: "POST",
        url: "/deferred_tax_detail/save"
    }).done(function(data) {
        if (data.error) {
            console.log("Error while saving deferred tax detail data.");
            toastr.error("Unable to save.");
        } else {
            toastr.success("Saved.");
        }
    });
}

function calculateDeferredTaxDetail() {
    // (Deferred Tax Beg) + (PY True up, sum() by deferred tax item) = (PY Ending balance)
    // (PY Ending balance) + (debit) + (credit) = (Deferred Tax Ending)
    // (Deferred Tax Ending) ==> Next year"s (Deferred Tax Beginning)
    let rows = $("#data-table tbody tr.user-inputs");
    let totalDeferredTaxBeginning = 0;
    let totalPyTrueUp = 0;
    let totalPyEndingBalance = 0;
    let totalIncreaseDta = 0;
    let totalDecreaseDta = 0;
    let totalOtherAdjustments = 0;
    let totalDeferredTaxEnding = 0;
    $.each(rows, (idx, row) => {
        let deferredTaxBeginning = str2number($(row).find("input.deferred-tax-beginning").val());
        let pyTrueUp = str2number($(row).find("input.py-true-up").val());
        let pyEndingBalance = deferredTaxBeginning + pyTrueUp;
        $(row).find("input.py-ending-balance").val(pyEndingBalance);

        let increaseDta = str2number($(row).find("input.increase-dta").val());
        let decreaseDta = str2number($(row).find("input.decrease-dta").val());
        let otherAdjustments = str2number($(row).find("input.other-adjustments").val());
        let deferredTaxEnding = -(pyEndingBalance + increaseDta + decreaseDta + otherAdjustments);
        $(row).find("input.deferred-tax-ending").val(deferredTaxEnding);

        totalDeferredTaxBeginning += deferredTaxBeginning;
        totalPyTrueUp += pyTrueUp;
        totalPyEndingBalance += pyEndingBalance;
        totalIncreaseDta += increaseDta;
        totalDecreaseDta += decreaseDta;
        totalOtherAdjustments += otherAdjustments;
        totalDeferredTaxEnding += deferredTaxEnding;
    });

    $("#data-table tbody tr.total-row-bottom").find("input.deferred-tax-beginning").val(totalDeferredTaxBeginning);
    $("#data-table tbody tr.total-row-bottom").find("input.py-true-up").val(totalPyTrueUp);
    $("#data-table tbody tr.total-row-bottom").find("input.py-ending-balance").val(totalPyEndingBalance);
    $("#data-table tbody tr.total-row-bottom").find("input.increase-dta",).val(totalIncreaseDta);
    $("#data-table tbody tr.total-row-bottom").find("input.decrease-dta",).val(totalDecreaseDta);
    $("#data-table tbody tr.total-row-bottom").find("input.other-adjustments",).val(totalOtherAdjustments);
    $("#data-table tbody tr.total-row-bottom").find("input.deferred-tax-ending").val(totalDeferredTaxEnding);
    format_number_input();
}

function updateDeferredTaxDta(indexFound, m1Debit, m1Credit, increase=true) {
    let increaseDta = str2number($("#data-table tbody tr:eq(" + indexFound + ")").find("input.increase-dta").val());
    let decreaseDta = str2number($("#data-table tbody tr:eq(" + indexFound + ")").find("input.decrease-dta").val());
    let sign = (increase ? 1 : -1);
    $("#data-table tbody tr:eq(" + indexFound + ")").find("input.increase-dta").val(increaseDta + (sign * m1Debit));
    $("#data-table tbody tr:eq(" + indexFound + ")").find("input.decrease-dta").val(decreaseDta + (sign * m1Credit));
    format_number_input();
}