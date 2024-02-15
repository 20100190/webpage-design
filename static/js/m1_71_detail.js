$(document).ready( function () {
    $(".table.worksheet").DataTable({
        "ordering": false,
        "scrollCollapse": true,
        "paging": false,
        "searching": false,
        "info": false
    });

    $('#save-button').on('click', function(event) {
        event.preventDefault();
        if ($('#data-table-detail-fed').length > 0) {
            save_fixed_assets('fed');
        }
        if ($('#data-table-detail-state').length > 0) {
            save_fixed_assets('state');
        }
        update_m1_adjustments();
        if (typeof(saveFdiiDeduction) === "function") {
            saveFdiiDeduction();
        }
    })

    $('#m1a-save-button').on('click', function(event) {
        event.preventDefault();
        add_m1_adjustments();
    });

    $('table#summary-table-m1-adj tbody tr').on('click', 'button.m1-delete', function(event) {
        event.preventDefault();
        delete_row($(this));
    });

    $('#summary-table-tb select').change('', function(event) {
        event.preventDefault();
        let elem_id = $(this).attr('id').split('-').at(-1);
        let worksheet_number = window.location.pathname.split('/').at(-1);
        $.ajax({
            data: {
                'obj_id': elem_id,
                'ws_number': worksheet_number,
                'm1_number': $('#tb-applicable-m1-' + elem_id).val()
            },
            type: 'POST',
            url: '/trial_balance/7x/save'
        }).done(function(data) {
            if (data.error) {
                toastr.error('Error: unable to save the Trial Balance record, ' + data.error);
            } else {
                toastr.success('Updated');
            }
        })
    });

    $('#data-table-detail-fed input').change('', function() {
        calculate_m1_71_detail("fed");
        calculate_total_cy_activity("fed")
        format_number_input();
    });

    $('#data-table-detail-state input').change('', function() {
        calculate_m1_71_detail("state");
        calculate_total_cy_activity("state");
        format_number_input();
    });

    calculate_m1_71_detail("fed");
    calculate_m1_71_detail("state");
    calculate_total_cy_activity("fed")
    calculate_total_cy_activity("state");
    format_number_input();
});

function calculate_m1_71_detail(table_type) {
    let sections = ['tax', 'book', 'diff', 'capital'];
    let rows = ['costs', 'accmdepr'];
    $.each(sections, function(idx_i, section) {
        $.each(rows, function (idx_j, row){
            let val_begperprov = grab_input2number(table_type + '-' +
                section + '-' + row + '-' + 'begperprov');
            let val_begpertr = grab_input2number(table_type + '-' + section + '-' + row + '-' + 'begpertr');
            let val_trueup = val_begpertr - val_begperprov;
            set_number2input(table_type + '-' + section + '-' + row + '-trueup', val_trueup, '');

            let val_additions  = grab_input2number(table_type + '-' + section + '-' + row + '-additions');
            let val_deletions = grab_input2number(table_type + '-' + section + '-' + row + '-deletions');
            let val_otheradjustments = grab_input2number(table_type + '-' +
                section + '-' + row + '-otheradjustments');
            let val_ending = val_begpertr + val_additions + val_deletions + val_otheradjustments;
            set_number2input(table_type + '-' + section + '-' + row + '-ending', val_ending, '');
        });
    });

    // Difference: Tax (costs-tax) - Book (costs-tax), Tax (accm depr) - Book (accm depr)
    let cols = ['begperprov', 'trueup', 'begpertr', 'additions',
        'deletions', 'otheradjustments', 'ending'];
    $.each(cols, function(idx_c, col) {
        $.each(rows, function (idx_j, row) {
            let tax = grab_input2number(table_type + '-tax-' + row + '-' + col);
            let book = grab_input2number(table_type + '-book-' + row + '-' + col);
            let diff = tax - book;
            set_number2input(table_type + '-diff-' + row + '-' + col, diff, '');
        });
    });

    // NV
    let columns = ['begperprov', 'trueup', 'begpertr',
        'additions', 'deletions', 'otheradjustments', 'ending'];
    $.each(sections, function(idx_i, section) {
        $.each(columns, function(idx_c, column) {
            let val_nv = 0;
            $.each(rows, function (idx_r, row) {
                val_nv += grab_input2number(table_type + '-' + section + '-' + row + '-' + column);
            })
            let selector = table_type + '-' + section + '-nv-' + column;
            set_number2input(selector, val_nv, '');
        });
    });

    // DTA
    $.each(columns, function(idx_c, column) {
        let v_diff = grab_input2number( table_type + '-' + 'diff-nv-' + column);
        let v_capital = grab_input2number(table_type + '-' + 'capital-nv-' + column);
        let v_dta = v_diff - v_capital;
        let selector = table_type + '-dta-costs-' + column;
        set_number2input(selector, v_dta, '');
    });
}

function grab_input_m1_71_detail(table_type) {
    let payload = {};
    let sections = ['tax', 'book', 'diff', 'capital', 'dta'];
    let rows = ['costs', 'accmdepr', 'nv'];
    $.each(sections, function(idx_i, section) {
        $.each(rows, function (idx_j, row){
            let val_begperprov = grab_input2number(table_type + '-' + section + '-' + row + '-begperprov');
            let val_begpertr = grab_input2number(table_type + '-' + section + '-' + row + '-begpertr');
            let val_trueup = val_begpertr - val_begperprov;
            let val_additions  = grab_input2number(table_type + '-' + section + '-' + row + '-additions');
            let val_deletions = grab_input2number(table_type + '-' +section + '-' + row + '-deletions');
            let val_otheradjustments = grab_input2number(table_type + '-' +
                section + '-' + row + '-otheradjustments');

            payload[table_type + '-' + section + '-' + row + '-begperprov'] = val_begperprov;
            payload[table_type + '-' + section + '-' + row + '-begpertr'] = val_begpertr;
            payload[table_type + '-' + section + '-' + row + '-trueup'] = val_trueup;
            payload[table_type + '-' + section + '-' + row + '-additions'] = val_additions;
            payload[table_type + '-' + section + '-' + row + '-deletions'] = val_deletions;
            payload[table_type + '-' + section + '-' + row + '-otheradjustments'] = val_otheradjustments;
            payload[table_type + '-' + section + '-' + row + '-note0'] = grab_input2string(table_type +
                '-' + section + '-' + row + '-note0');
            payload[table_type + '-' + section + '-' + row + '-note1'] = grab_input2string(table_type +
                '-' + section + '-' + row + '-note1');
            payload[table_type + '-' + section + '-' + row + '-note2'] = grab_input2string(table_type +
                '-' + section + '-' + row + '-note2');
            payload[table_type + '-' + section + '-' + row + '-note3'] = grab_input2string(table_type +
                '-' + section + '-' + row + '-note3');
            payload[table_type + '-' + section + '-' + row + '-note4'] = grab_input2string(table_type +
                '-' + section + '-' + row + '-note4');
        });
    });
    payload[table_type + '-capital-nv-ending'] = grab_input2number(table_type + '-capital-nv-ending');
    payload[table_type + '-dta-costs-begperprov'] = grab_input2number(table_type + '-dta-costs-begperprov');
    payload[table_type + '-dta-costs-ending'] = grab_input2number(table_type + '-dta-costs-ending');
    payload['table_type'] = table_type;
    return payload;
}

function calculate_total_cy_activity(table_type) {
    let diff_nv_additions = grab_input2number(table_type + '-diff-nv-additions');
    let diff_nv_deletions = grab_input2number(table_type + '-diff-nv-deletions');
    let capital_nv_additions = grab_input2number(table_type + '-capital-nv-additions');
    let capital_nv_deletions = grab_input2number(table_type + '-capital-nv-deletions');
    let total_cy_activity = diff_nv_deletions + diff_nv_additions - capital_nv_deletions - capital_nv_additions;
    set_number2input(table_type + '-total-cy-activity', total_cy_activity, '');
}

function save_fixed_assets(asset_type) {
    let fed_payload = grab_input_m1_71_detail(asset_type);
    $.ajax({
        data: {payload: JSON.stringify(fed_payload)},
        type: 'POST',
        dataType: 'json',
        url: '/fixed_assets/save'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Error: unable to save the M-1 Federal detail record: ' + data.error);
        } else {
            toastr.success('Saved');
        }
    })
}

function update_m1_adjustments() {
    let m1_adj_payload = []
    $('#summary-table-m1-adj tbody').find('tr').each(function() {
        let tds = $(this).children('td');
        if (tds.length === 0) {
            return;
        }

        let elem_id = tds.find('button').last().attr('id').split('-').at(-1);
        let row = grab_input_values(elem_id);
        m1_adj_payload.push(row);
    });

    $.ajax({
        data: {payload: JSON.stringify(m1_adj_payload)},
        type: 'POST',
        dataType: 'json',
        url: '/m1_adjustment/update'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Error: unable to save the M-1 adjustment record: ' + data.error);
        } else {
            toastr.success('Updated');
        }
    });
}

function add_m1_adjustments() {
    let m1_adj_payload = grab_input_values('new');
    $.ajax({
        data: {payload: JSON.stringify(m1_adj_payload)},
        type: 'POST',
        dataType: 'json',
        url: '/m1_adjustment/add'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Error: unable to save the M-1 adjustment record: ' + data.error);
        } else {
            toastr.success('Saved');
            if (data.new_m1a) {
                insert_new_row(data.new_m1a);
            }
        }
    });
}

function grab_input_values(elem_id) {
    let worksheet_number = window.location.pathname.split('/').at(-1);
    let memo_field = $('#m1-memo-' + elem_id).val().trim();
    if ((memo_field.length == 0) | (memo_field == '')) {
        toastr.error('Memo field is empty.');
        $('#m1-memo-' + elem_id).css({'background-color': '#f8bbd0'});
        return [];
    }
    let debit = str2number($('#m1-adj-dr-balance-' + elem_id).val());
    let credit = str2number($('#m1-adj-cr-balance-' + elem_id).val());
    if (debit < 0) {
        toastr.error('Debit must be positive or 0');
        return [];
    }
    if (credit > 0) {
        toastr.error('Credit must be negative or 0.');
        return [];
    }

    return {
        ws_number: worksheet_number,
        m1_number: $('#m1-number-' + elem_id).val(),
        m1_adj_dr_balance: debit,
        m1_adj_dr: $('#m1-adj-dr-' + elem_id).val(),
        m1_adj_cr_balance: credit,
        m1_adj_cr: $('#m1-adj-cr-' + elem_id).val(),
        m1_item_name: $('#m1-item-name-' + elem_id).val(),
        m1_tax_chart_of_account_name: $('#m1-tax-chart-of-account-name-' + elem_id).val(),
        m1_memo: memo_field,
        obj_id: elem_id
    };
}

function insert_new_row(new_m1a) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/m1_adjustment/options'
    }).done(function(data){
        if (data) {
            let m1_items = data.m1_items;
            let txcas = data.tax_chart_of_accounts;
            let new_row_html = '<tr>'
            new_row_html += '<td><input id="m1-number-' + new_m1a.obj_id + '" name="m1-number-' +
                new_m1a.obj_id + '" type="text" value="' + new_m1a.m1_number + '" readonly></td>';
            new_row_html += '<td><input id="m1-adj-dr-balance-' + new_m1a.obj_id +
                '" class="number debit" name="m1-adj-dr-balance-' + new_m1a.obj_id +
                '" value="' + new_m1a.m1_adj_dr_balance + '" type="text"></td>';
            new_row_html += '<td><select id="m1-adj-dr-' + new_m1a.obj_id + '" name="m1-adj-dr-' +
                new_m1a.obj_id + '">';
            if (new_m1a.m1_adj_dr === 'CY') {
                new_row_html += '<option value="CY" selected>CY</option>' +
                    '<option value="PY">PY</option></select></td>'
            } else {
                new_row_html += '<option value="CY">CY</option>' +
                    '<option value="PY" selected>PY</option></select></td>'
            }
            new_row_html += '<td><input id="m1-adj-cr-balance-' + new_m1a.obj_id +
                '" class="number credit" name="m1-adj-cr-balance-' + new_m1a.obj_id +
                '" value="' + new_m1a.m1_adj_cr_balance + '" type="text"></td>';
            new_row_html += '<td><select id="m1-adj-cr-' + new_m1a.obj_id + '" name="m1-adj-cr-' +
                new_m1a.obj_id + '">';
            if (new_m1a.m1_adj_cr === 'CY') {
                new_row_html += '<option value="CY" selected>CY</option>' +
                    '<option value="PY">PY</option></select></td>';
            } else {
                new_row_html += '<option value="CY">CY</option>' +
                    '<option value="PY" selected>PY</option></select></td>';
            }
            new_row_html += '<td><select class="selectpicker" data-live-search="true" id="m1-item-name-' +
                new_m1a.obj_id + '" name="m1-item-name-' + new_m1a.obj_id + '">';
            for (let i = 0; i < m1_items.length; i++) {
                if (m1_items[i].name === new_m1a.m1_item_name) {
                    new_row_html += '<option value="' + m1_items[i].name + '" selected>' +
                        m1_items[i].name + '(' + m1_items[i].perm_temp + ')</option>';
                } else {
                    new_row_html += '<option value="' + m1_items[i].name + '">' +
                        m1_items[i].name + '(' + m1_items[i].perm_temp + ')</option>';
                }
            }
            new_row_html += '</select></td>';
            new_row_html += '<td><select class="selectpicker" data-live-search="true" id="m1-tax-chart-of-account-name-' +
                new_m1a.obj_id + '" name="m1-tax-chart-of-account-name-' + new_m1a.obj_id + '">';
            for (let i = 0; i < txcas.length; i++) {
                if (txcas[i] === new_m1a.m1_tax_chart_of_account_name) {
                    new_row_html += '<option value="' + txcas[i] + '" selected>' + txcas[i] + '</option>';
                } else {
                    new_row_html += '<option value="' + txcas[i] + '">' + txcas[i] + '</option>';
                }
            }
            new_row_html += '</select></td>';
            new_row_html += '<td><input id="m1-memo-' + new_m1a.obj_id + '" name="m1-memo-' +
                new_m1a.obj_id + '" value="' + new_m1a.m1_memo + '" type="text"></td>';
            new_row_html += '<td><button id="delete-btn-' + new_m1a.obj_id +
                '" class="btn btn-secondary m1-delete" onclick="delete_row($(this))">Delete</button></td>';
            $('#summary-table-m1-adj tbody').append(new_row_html);
            format_number_input();
            $('.selectpicker').selectpicker('render');
        }
    });
}

function delete_row(element) {
    let obj_id = element.attr('id').split("-")[2];
    let idx = element.closest('tr').index();
    $.ajax({
        data: {'obj_id': obj_id},
        type: 'POST',
        url: '/m1_adjustment/delete'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Error: unable to delete the M-1 record');
        } else {
            $("table#summary-table-m1-adj tbody tr").eq(idx).remove();
            toastr.success('Deleted');
        }
    });
}
