function grab_deferred_tax_detail_input_values() {
    let payload = {};
    let classes_number = [
        'deferred_tax_item',
        'deferred_tax_beginning',
        'py_true_up',
        'py_ending_balance',
        'increase_dta',     // debit_cy_activity
        'decrease_dta',     // credit_cy_activity
        'other_adjustment',
        'deferred_tax_ending',
        'fed_tax_rate',
        'state_tax_rate',];
    let classes_select = [
        'dta_dtl',
        'fed_state_special'];

    // HACK: not a pretty solution though, grub values setting the top half table and
    // the bottom half as .tbl-1 and .tbl-2 respectively.
    let table_rows_1 = $('#data-table tbody').find('tr.tbl-1');
    let table_rows_2 = $('#data-table tbody').find('tr.tbl-2');
    let structure = {"table-1": table_rows_1.length, "table-2": table_rows_2.length};
    payload['structure'] = structure;
    $.each([table_rows_1, table_rows_2], function(idxa, tbl_rows) {
        let tbl_number = idxa + 1;  // To distinguish tbl-1 (M1, Temp items) and tbl-2 (special items)
        if (![1, 2].includes(tbl_number)) {
            return true;
        }

        $.each(tbl_rows, function (idx, row) {
            let row_num = idx + 1;
            $.each(classes_number, function (idx_c, css_selector) {
                let key = css_selector + '-' + tbl_number + '-' + row_num;
                if (idx_c === 0) {
                    let v = grab_input2string(key);
                    payload[key] = v; // grab_input2string(key);
                    console.log(key, v);
                } else {
                    let v = grab_input2number(key);
                    payload[key] = v; // grab_input2number(key);
                    console.log(key, v);
                }

            });

            $.each(classes_select, function (idx_c, css_selector) {
                let key = css_selector + '-' + tbl_number + '-' + row_num;
                let value = $(row).find('select.' + key + ' option:selected').text();
                payload[key] = value;
            });
        });
    });

    // Finally create deferred_tax_item - deferred_tax_ending key-value pairs
    let deferred_tax_ending_pairs = {}
    $.each([table_rows_1, table_rows_2], function(idxa, tbl_rows) {
        let tbl_number = idxa + 1;  // To distinguish tbl-1 (M1, Temp items) and tbl-2 (special items)
        if (![1, 2].includes(tbl_number)) {
            return true;
        }

        $.each(tbl_rows, function (idx, row) {
            let row_num = idx + 1;
            let tbl_row_pair = tbl_number + '-' + row_num;
            let key_item = 'deferred_tax_item-' + tbl_row_pair;
            let value_item = $(row).find('select.' + key_item + ' option:selected').text();
            if (value_item.length > 0) {
                let key_val = 'deferred_tax_ending-' + tbl_number + '-' + row_num;
                deferred_tax_ending_pairs[tbl_row_pair] = grab_input2number(key_val);
            }
        });
    });
    payload['py_deferred_tax_ending'] = deferred_tax_ending_pairs;
    return payload;
}

function save_deferred_tax_detail() {
    $.ajax( {
        data: {'payload': JSON.stringify(grab_deferred_tax_detail_input_values())},
        type: 'POST',
        url: '/deferred_tax_detail/save'
    }).done(function(data) {
        if (data.error) {
            console.log('Error while saving deferred tax detail data.');
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved.');
        }
    });
}

function calculate_deferred_tax_detail() {
    // (Deferred Tax Beg) + (PY True up, sum() by deferred tax item) = (PY Ending balance)
    // (PY Ending balance) + (debit) + (credit) = (Deferred Tax Ending)
    // (Deferred Tax Ending) ==> Next year's (Deferred Tax Beginning)
    let table_rows_1 = $('#data-table tbody').find('tr.tbl-1');
    let table_rows_2 = $('#data-table tbody').find('tr.tbl-2');
    let tot_def_tax_beginning = 0;
    let tot_py_true_up = 0;
    let tot_py_ending_balance = 0;
    let tot_debit_cy_activity = 0;
    let tot_credit_cy_activity = 0;
    let tot_adjustments = 0;
    let tot_deferred_tax_ending = 0;
    $.each([table_rows_1, table_rows_2], function(idxa, tbl_rows) {
        let tbl_number = idxa + 1;  // To distinguish tbl-1 (M1, Temp items) and tbl-2 (special items)
        if (![1, 2].includes(tbl_number)) {
            return true;
        }

        $.each(tbl_rows, function (idx, row) {
            let row_num = idx + 1;
            let tbl_row_pair = tbl_number + '-' + row_num;
            let def_tax_beginning = grab_input2number('deferred_tax_beginning-' + tbl_row_pair);
            let py_true_up = grab_input2number('py_true_up-' + tbl_row_pair);
            let py_ending_balance = def_tax_beginning + py_true_up;
            set_number2input('py_ending_balance-' + tbl_row_pair, py_ending_balance, '');

            let debit_cy_activity = grab_input2number('increase_dta-' + tbl_row_pair);
            let credit_cy_activity = grab_input2number('decrease_dta-' + tbl_row_pair);
            let adjustments = grab_input2number('other_adjustment-' + tbl_row_pair);
            let deferred_tax_ending = -(py_ending_balance + debit_cy_activity + credit_cy_activity + adjustments);
            set_number2input('deferred_tax_ending-' + tbl_row_pair, deferred_tax_ending, '');

            tot_def_tax_beginning += def_tax_beginning;
            tot_py_true_up += py_true_up;
            tot_py_ending_balance += py_ending_balance;
            tot_debit_cy_activity += debit_cy_activity;
            tot_credit_cy_activity += credit_cy_activity;
            tot_adjustments += adjustments;
            tot_deferred_tax_ending += deferred_tax_ending;
        });
    });

    set_number2input("deferred_tax_beginning-3-1", tot_def_tax_beginning, "");
    set_number2input("py_true_up-3-1", tot_py_true_up, "");
    set_number2input("py_ending_balance-3-1", tot_py_ending_balance, "");
    set_number2input("increase_dta-3-1", tot_debit_cy_activity, "");
    set_number2input("decrease_dta-3-1", tot_credit_cy_activity, "");
    set_number2input("other_adjustment-3-1", tot_adjustments, "");
    set_number2input("deferred_tax_ending-3-1", tot_deferred_tax_ending, "");
}

function update_deferred_tax_dta(index_found, m1_debit, m1_credit, increase=true) {
    index_found += 1;
    let increase_dta = grab_input2number('increase_dta-1-' + index_found);
    let decrease_dta = grab_input2number('decrease_dta-1-' + index_found);
    if (increase) {
        increase_dta += m1_debit;
        decrease_dta += m1_credit;
    } else {
        increase_dta -= m1_debit;
        decrease_dta -= m1_credit;
    }
    set_number2input('increase_dta-1-' + index_found, increase_dta, '');
    set_number2input('decrease_dta-1-' + index_found, decrease_dta, '');
}