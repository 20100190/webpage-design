$(document).ready(function() {
    let data_table = $('#data-table').DataTable({
        "ordering": false,
        "paging": false,
        "info": false,
        "searching": false,
    });

    recalculateAndFormat()
});

$('button#save-button').on('click', function(event) {
    saveRateRec();
    event.preventDefault();
});

$('button#add-row').on('click', function(event) {
    addUserInputRow();
    event.preventDefault();
});

$('select.rate-selection').on('change', function(event) {
    calculateUserInputRow(this);
    recalculateAndFormat();
    event.preventDefault();
});

$('input#special_credits-tax-rate').on('change', function(event) {
    $('select.rate-selection').each((_, elem) => {
        if ($(elem).val() === 'special_credits') {
            calculateUserInputRow(elem);
        }
    });
    recalculateAndFormat();
});

function calculateUserInputRow(target) {
    let rateSelection = $(target).closest('tr').find('select.rate-selection').val();
    let taxRate = str2number($("input#" + rateSelection + "-tax-rate").val());
    $(target).closest('tr').find('input.tax-rate').val(taxRate);

    let grossAmounts = str2number($(target).closest('tr').find('input.gross-amounts').val());
    let taxEffectedDollar = grossAmounts * taxRate / 100;
    let elem = $(target).closest('tr').find('input.tax-effected-dollar')
    elem.val(taxEffectedDollar);
    elem.data("value", taxEffectedDollar)

    let baseGrossAmounts = str2number($('input[name="federal-income-tax-per-statutory-rate-taxes-gross-amounts"]').val());
    let taxEffectedPercent = 100 * taxEffectedDollar / baseGrossAmounts;
    $(target).closest('tr').find('input.tax-effected-percent').val(taxEffectedPercent);
}

/**
 * Add a new row for the user to enter the input.
 *
 * @param {Number} index Index to add row. By default, it appends the row at the end.
 * @param {String} id ID of the element if it's persisted in the database.
 * @param {String} name Arbitrary name of the entry.
 * @param {Number} grossAmounts Gross amounts of the entry.
 * @param {String} rateSelection Rate selection of the entry.
 * @param {Number} dollar Tax effected $$ of the entry.
 * @param {Number} percent Tax effected % of the entry.
 */
function addUserInputRow({index = -1, id = "", name = "", grossAmounts = 0, rateSelection = "federal_states", dollar = 0, percent = 0} = {}) {
    if (grossAmounts === "None" || grossAmounts === null) {
        return;
    }
    if (index === -1) {
        // Right above the Add button
        index = $('button#add-row').closest('tr').index();
    }
    let taxRate = str2number($("input#" + rateSelection + "-tax-rate").val());
    let rowHtml = `
    <tr class="user-inputs">
        <td>
            <input type="hidden" name="id" class="row-${index}" value="${id}">
            <input name="name" class="row-${index} string" value="${name}">
        </td>
        <td>
            <button class="remove-row"><nobr><span class="bi bi-x-circle-fill"> Remove</span></nobr></button>
        </td>
        <td>
            <input name="gross-amounts" class="row-${index} number gross-amounts" value="${grossAmounts}">
        </td>
        <td>
            <select class="rate-selection">
                <option value="federal" ${rateSelection === "federal" ? "selected" : ""}>Federal</option>
                <option value="states" ${rateSelection === "states" ? "selected" : ""}>States</option>
                <option value="federal_states" ${rateSelection === "federal_states" ? "selected" : ""}>Federal & States</option>
                <option value="effective_fed_states" ${rateSelection === "effective_fed_states" ? "selected" : ""}>Effective Fed & States</option>
                <option value="special_credits" ${rateSelection === "special_credits" ? "selected" : ""}>Special Credits</option>
            </select>
        </td>
        <td>
            <input readonly class="number percent tax-rate" value="${taxRate}">
        </td>
        <td>
            <input readonly class="number tax-effected-dollar" value="${dollar}" data-value="${dollar}">
        </td>
        <td>
            <input readonly class="number percent tax-effected-percent" value="${percent}">
        </td>
    </tr>`;
    $('#data-table > tbody > tr').eq(index).before(rowHtml);
    // Recalculate the $$ and % to make it look consistent
    calculateUserInputRow($('#data-table > tbody > tr').eq(index).find('input.gross-amounts'));

    $('button.remove-row').on('click', function(ev) {
        $(this).closest('tr').remove()
        ev.preventDefault();
    });

    $('input.gross-amounts').on('change', function(ev) {
        calculateUserInputRow(this);
        recalculateAndFormat();
    });

    $('select.rate-selection').on('change', function(ev) {
        calculateUserInputRow(this);
        recalculateAndFormat();
    });

    recalculateAndFormat();
}

/**
 * Ajax call to save the user inputs.
 */
function saveRateRec() {
    let values = {};
    // Tax rate
    let specialCreditsTaxRate = str2number($("input#special_credits-tax-rate").val());
    // Rate selections
    $("select.rate-selection").each((i, e) => {
        let idx = $(e).closest('tr').index();
        values[idx] = {'name': e.name, 'rate_selection': e.value};
    });
    // Iterate over input rows to construct the payload
    $('input[class^="row"]').each((i, e) => {
        let idx = e.className.match(/^row-(\d+)/)[1];
        if (!(idx in values)) {
            values[idx] = {};
        }
        if (e.name === 'id' && e.value === '') {
            // If ID is blank, ignore
            return;
        }
        if (e.name === 'gross-amounts') {
            let val = parseFloat(e.value);
            values[idx]['gross_amounts'] = isNaN(val) ? 0.0 : val;
            values[idx]['rate_selection'] = $(e).closest('tr').find('select').val();
        } else {
            values[idx][e.name] = e.value;
        }
    });

    let payload = {
        "taxRate": {
            "special_credits": specialCreditsTaxRate
        },
        "rows": values
    };

    $.ajax({
        data: {'payload': JSON.stringify(payload)},
        type: 'POST',
        url: '/rate_rec'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved');
            // Clean up and refresh the user input section
            $('tr.user-inputs').remove();
            data["success"].forEach(ele => {
                addUserInputRow(ele);
            });
            recalculateAndFormat();
        }
    });
}

/**
 * Calculate and update the total and difference.
 */
function calculateTotal() {
    var sum = 0;
    let base_gross_amounts = parseFloat($('input[name="federal-income-tax-per-statutory-rate-taxes-gross-amounts"]').data("value"));
    $('input.tax-effected-dollar').each(function(i, e) {
        if (e.name === 'other-unreconciled-difference-tax-effected-dollar') {
            let unreconciledDiff = parseFloat($('input[name="total-tax-effected-dollar"]').data("value")) - sum;
            $('input[name="other-unreconciled-difference-tax-effected-dollar"]')[0].value = unreconciledDiff;
            $('input[name="other-unreconciled-difference-tax-effected-percent"]')[0].value = 100 * unreconciledDiff / base_gross_amounts;
        } else if (e.name === 'total-tax-effected-dollar') {
            return; // This is static (RFD M31 + Q31)
        } else if (e.name === 'total-tax-provision-per-provision-wp-tax-effected-dollar') {
            return; // This is static (RFD M30 + Q30)
        } else if (e.name === 'unreconciled-difference-tax-effected-dollar') {
            return; // This is static (total - tax-provision-per-provision-wp)
        } else {
            let val = parseFloat($(e).data("value"));
            if (!isNaN(val)) {
                sum += val;
            }
        }
    });
}

/**
 * Recalculate fields and format. Additionally, for the last section in this page,
 * 0 is explicitly shown as opposed to "-".
 */
function recalculateAndFormat() {
    calculateTotal();
    format_number_input();
    if ("-" === $('input[name="unreconciled-difference-tax-effected-dollar"]')[0].value) {
        $('input[name="unreconciled-difference-tax-effected-dollar"]')[0].value = "0.00"
    }
    if ("-" === $('input[name="unreconciled-difference-tax-effected-percent"]')[0].value) {
        $('input[name="unreconciled-difference-tax-effected-percent"]')[0].value = "0.00%"
    }
 }