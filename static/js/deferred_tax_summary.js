$('#data-table').DataTable({
    "ordering": false,
    "paging": false,
    "info": false,
    "searching": false,
});

$('#data-table-summary-1').DataTable({
    "ordering": false,
    "paging": false,
    "info": false,
    "searching": false,
});

$('#data-table-summary-2').DataTable({
    "ordering": false,
    "paging": false,
    "info": false,
    "searching": false,
});

$('#data-table-summary-3').DataTable({
    "ordering": false,
    "paging": false,
    "info": false,
    "searching": false,
});

$('#data-table-summary-4').DataTable({
    "ordering": false,
    "paging": false,
    "info": false,
    "searching": false,
});

$('#data-table-summary-5').DataTable({
    "ordering": false,
    "paging": false,
    "info": false,
    "searching": false,
});

load_deferred_tax_summary(format_number_input);

// Update table 1-5
$("table[id^='data-table-summary-']").on('change', 'input', function() {
    set_deferred_tax_table();
    format_number_input();
});

// Valuation allowance: only allow positive numbers or zero.
$('[class^=valuation-allowance-]').on('change', function() {
    let val = $(this).val();
    if (val < 0) {
        toastr.error('The valuation allowance must be positive or zero.')
        $(this).val(0);
    }
})

// Save user input data
$('button#save-button').on('click', function() {
    save_deferred_tax_summary();
});

$('.py-fed-tax-rate, .py-state-tax-rate').on('change', function() {
    calculate_cy_py_effective_tax_rate_change(format_number_input);
});

function set_deferred_tax_table() {
    // Read summary table 0 (big one) and copy values to other tables.

    // Fed / State asset, liabilities total
    let value_n28 = grab_input2number('fed_assets_liabilities_total');
    let value_p28 = grab_input2number('state_assets_liabilities_total');

    // Set to #data-table-summary-1: Positive = DTA, Negative = DTL
    if (value_n28 > 0) {
        set_number2input('cy-bal-per-above-dta-federal', value_n28, '');
        set_number2input('cy-bal-per-above-dtl-federal', 0.0, '');
    } else {
        set_number2input('cy-bal-per-above-dta-federal', 0.0, '');
        set_number2input('cy-bal-per-above-dtl-federal', value_n28, '');
    }

    if (value_p28 >= 0) {
        set_number2input('cy-bal-per-above-dta-state', value_p28, '');
        set_number2input('cy-bal-per-above-dtl-state', 0.0, '');
    } else {
        set_number2input('cy-bal-per-above-dta-state', 0.0, '');
        set_number2input('cy-bal-per-above-dtl-state', value_p28, '');
    }

    // Set to #data-table-summary-3
    set_number2input('noncurrent-tax-asset-cy-federal', value_n28, '');
    set_number2input('noncurrent-tax-asset-cy-state', value_p28, '');

    // --------------------------
    // -----    Table 1     -----
    // --------------------------
    // CY Bal per above
    let value_o33 = grab_input2number('cy-bal-per-above-dta-federal');
    let value_p33 = grab_input2number('cy-bal-per-above-dta-state')
    let value_q33 = grab_input2number('cy-bal-per-above-dtl-federal')
    let value_r33 = grab_input2number('cy-bal-per-above-dtl-state')

    // CY Bal per above Total
    let value_s33 = value_o33 + value_p33 + value_q33 + value_r33;
    set_number2input('cy-bal-per-above-total', value_s33, '');

    // Valuation allowances
    let value_o34 = grab_input2number('valuation-allowance-dta-federal');
    let value_p34 = grab_input2number('valuation-allowance-dta-state')
    let value_q34 = grab_input2number('valuation-allowance-dtl-federal')
    let value_r34 = grab_input2number('valuation-allowance-dtl-state')

    // Valuation allowances Total
    let value_s34 = value_o34 + value_p34 + value_q34 + value_r34;
    set_number2input('valuation-allowance-total', value_s34, '');

    // Sum: DTA/DTL Net of Val. Allow.
    let value_o35 = value_o33 + value_o34;
    let value_p35 = value_p33 + value_p34;
    let value_q35 = value_q33 + value_q34;
    let value_r35 = value_r33 + value_r34;
    let value_s35 = value_s33 + value_s34;
    set_number2input('net-val-allow-dta-federal', value_o35, '');
    set_number2input('net-val-allow-dta-state', value_p35, '');
    set_number2input('net-val-allow-dtl-federal', value_q35, '');
    set_number2input('net-val-allow-dtl-state', value_r35, '');
    set_number2input('net-val-allow-total', value_s35, '');

    // --------------------------
    // -----    Table 2     -----
    // --------------------------
    // Valuation allowance CY
    set_number2input('valuation-allowance-cy-dta-federal', value_o34, '');
    set_number2input('valuation-allowance-cy-dta-state', value_p34, '');
    set_number2input('valuation-allowance-cy-dtl-federal', value_q34, '');
    set_number2input('valuation-allowance-cy-dtl-state', value_r34, '');
    set_number2input('valuation-allowance-cy-total',
        value_o34 + value_p34 + value_q34 + value_r34, '');

    // Valuation allowance PY
    let value_o40 = grab_input2number('valuation-allowance-py-dta-federal');
    let value_p40 = grab_input2number('valuation-allowance-py-dta-state')
    let value_q40 = grab_input2number('valuation-allowance-py-dtl-federal')
    let value_r40 = grab_input2number('valuation-allowance-py-dtl-state')
    set_number2input('valuation-allowance-py-total',
        value_o40 + value_p40 + value_q40 + value_r40, '');

    // (increase) decrease in allowance
    let value_o41 = value_o34 - value_o40;
    let value_p41 = value_p34 - value_p40;
    let value_q41 = value_q34 - value_q40;
    let value_r41 = value_r34 - value_r40;
    let value_s41 = value_o41 + value_p41 + value_q41 + value_r41;
    set_number2input('increase-in-allowance-dta-federal', value_o41, '');
    set_number2input('increase-in-allowance-dta-state', value_p41, '');
    set_number2input('increase-in-allowance-dtl-federal', value_q41, '');
    set_number2input('increase-in-allowance-dtl-state', value_r41, '');
    set_number2input('increase-in-allowance-total', value_s41, '');

    // --------------------------
    // -----    Table 3     -----
    // --------------------------
    let value_o45 = value_n28;
    let value_p45 = value_p28;
    let value_q45 = value_o45 + value_p45;
    let value_o46 = value_o45;
    let value_p46 = value_p45;
    let value_q46 = value_q45;
    set_number2input('noncurrent-tax-asset-cy-federal', value_o45, '');
    set_number2input('noncurrent-tax-asset-cy-state', value_p45, '');
    set_number2input('noncurrent-tax-asset-cy-total', value_q45, '');
    set_number2input('sum-noncurrent-tax-asset-cy-federal', value_o45, '');
    set_number2input('sum-noncurrent-tax-asset-cy-state', value_p45, '');
    set_number2input('sum-noncurrent-tax-asset-cy-total', value_q45, '');

    // --------------------------
    // -----    Table 4     -----
    // --------------------------
    let value_o50 = grab_input2number('noncurrent-tax-asset-py-federal');
    let value_p50 = grab_input2number('noncurrent-tax-asset-py-state');
    let value_q50 = value_o50 + value_p50;
    let value_o51 = value_o50;
    let value_p51 = value_p50;
    let value_q51 = value_q50;
    set_number2input('noncurrent-tax-asset-py-total', value_q50, '');
    set_number2input('sum-noncurrent-tax-asset-py-federal', value_o50, '');
    set_number2input('sum-noncurrent-tax-asset-py-state', value_p50, '');
    set_number2input('sum-noncurrent-tax-asset-py-total', value_q50, '');

    // --------------------------
    // -----    Table 5     -----
    // --------------------------
    let value_o55 = value_o46 - value_o51;
    let value_p55 = value_p46 - value_p51;
    let value_q55 = value_q46 - value_q51;
    set_number2input('py-noncurrent-tax-asset-federal', value_o55, '');
    set_number2input('py-noncurrent-tax-asset-state', value_p55, '');
    set_number2input('py-noncurrent-tax-asset-total', value_q55, '');
}

function calculate_cy_py_effective_tax_rate_change() {
    let cy_fed_tax_rate = grab_input2number('cy-fed-tax-rate');
    let py_fed_tax_rate = grab_input2number('py-fed-tax-rate');
    let cy_state_tax_rate = grab_input2number('cy-state-tax-rate');
    let py_state_tax_rate = grab_input2number('py-state-tax-rate');
    let diff_fed_tax_rate = cy_fed_tax_rate - py_fed_tax_rate;
    let diff_state_tax_rate = cy_state_tax_rate - py_state_tax_rate;
    let diff_total_tax_rate = py_fed_tax_rate + py_state_tax_rate - cy_fed_tax_rate - cy_state_tax_rate;

    set_number2input('fed-tax-rate-change', diff_fed_tax_rate, '%');
    set_number2input('state-tax-rate-change', diff_state_tax_rate, '%');
    set_number2input('total-tax-rate-change', diff_total_tax_rate, '%');

    let change_grand_total = 0;
    let num_rows = $('#data-table tbody').find('tr').length - 1;
    for (let i = 1; i <= num_rows; i++) {
        let fed_state_spe = $('.py_rates_change_' + i).val();
        let py_balance = grab_input2number('deferred_tax_beginning_' + i);

        let total;
        switch (fed_state_spe) {
            case 'Fed':
                total = diff_fed_tax_rate * py_balance / 100.0;
                break;
            case 'State':
                total = diff_state_tax_rate * py_balance / 100.0;
                break;
            default:
                total = diff_total_tax_rate * py_balance / 100.0;
                break;
        }
        change_grand_total += total;
        set_number2input('py_rates_total_' + i, total, '');
    }
    set_number2input('py_rates_total_total', change_grand_total, '');
}

function load_deferred_tax_summary(post_http_hook) {
    // load the user-input values and set them to <input></input>.
    $.ajax( {
        data: {'payload': JSON.stringify({})},
        type: 'GET',
        url: '/deferred_tax/load'
    }).done(function(data) {
        if (data.error) {
            console.log('Error while loading deferred tax data.');
            toastr.error('Unable to load.');
        } else {
            for (let key in data['payload']) {
                let value = data['payload'][key];
                set_number2input(key.replaceAll("_", "-"), parseFloat(value), '');
            }

            // Then set values to <input>
            set_deferred_tax_table();

            calculate_cy_py_effective_tax_rate_change();

            if (post_http_hook) {
                post_http_hook()
            }
        }
    });
}

function save_deferred_tax_summary() {
    // PY Fed & State tax rate
    let py_fed_tax_rate = grab_input2number("py-fed-tax-rate");
    let py_state_tax_rate = grab_input2number("py-state-tax-rate");

    // Valuation allowances
    let value_o34 = grab_input2number('valuation-allowance-dta-federal');
    let value_p34 = grab_input2number('valuation-allowance-dta-state')
    let value_q34 = grab_input2number('valuation-allowance-dtl-federal')
    let value_r34 = grab_input2number('valuation-allowance-dtl-state')

    // Valuation allowance PY
    let value_o40 = grab_input2number('valuation-allowance-py-dta-federal');
    let value_p40 = grab_input2number('valuation-allowance-py-dta-state')
    let value_q40 = grab_input2number('valuation-allowance-py-dtl-federal')
    let value_r40 = grab_input2number('valuation-allowance-py-dtl-state')

    // Noncurrent tax asset
    let value_o50 = grab_input2number('noncurrent-tax-asset-py-federal');
    let value_p50 = grab_input2number('noncurrent-tax-asset-py-state');

    let payload = {
        'py_fed_tax_rate': py_fed_tax_rate,
        'py_state_tax_rate': py_state_tax_rate,
        'valuation_allowance_dta_federal': value_o34,
        'valuation_allowance_dta_state': value_p34,
        'valuation_allowance_dtl_federal': value_q34,
        'valuation_allowance_dtl_state': value_r34,
        'valuation_allowance_py_dta_federal': value_o40,
        'valuation_allowance_py_dta_state': value_p40,
        'valuation_allowance_py_dtl_federal': value_q40,
        'valuation_allowance_py_dtl_state': value_r40,
        'noncurrent_tax_asset_py_federal': value_o50,
        'noncurrent_tax_asset_py_state': value_p50,
    }

    $.ajax( {
        data: {'payload': JSON.stringify(payload)},
        type: 'POST',
        url: '/deferred_tax/save'
    }).done(function(data) {
        if (data.error) {
            console.log('Error while saving deferred tax data.');
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved.');
        }
    });
}
