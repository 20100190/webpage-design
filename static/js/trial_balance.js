// 1.1 Trial Balance, update the existing TB record.
function save_trial_balance(selected_element) {
    let obj_id = selected_element.attr('id').split('-').at(-1);
    let account_number = $('#tb-pbcs-account-number-' + obj_id).val();
    let description = $('#tb-pbcs-description-' + obj_id).val();
    let balance = $('#tb-pbcs-balance-' + obj_id).val();
    let tcoa = $('#tb-pbcs-tax-chart-of-account-' + obj_id).val();
    let client_classification = $('#tb-pbcs-client-classification-' + obj_id).val();
    let m1_tab = $('#tb-pbcs-m1-tab-' + obj_id).val();
    let m1_check = $('#tb-pbcs-m1-check-' + obj_id).val();
    if ((m1_check !== "No") && (m1_check !== "-")) {
        m1_check = "Yes";
    }
    let selected_tr = selected_element.closest('tr');

    // If the "tr' has "no-m1-item" class, don't allow to select m1_tab and m1_check.
    let tr_classes = selected_tr.attr('class');

    $.ajax({
        data: {
            obj_id: obj_id,
            account_number: account_number,
            description: description,
            balance: balance,
            tcoa: tcoa,
            client_classification: client_classification,
            m1_tab: m1_tab,
            m1_check: m1_check,
        },
        type: 'POST',
        url: '/trial_balance/save'
    }).done(function(data) {
        if (data.error) {
            toastr.error(data.error);
        } else {
            toastr.success('Saved.');
            // change color if "yes-m1-item" class.
            if (~tr_classes.indexOf('yes-m1-item')) {
                selected_tr.removeClass();
                if (m1_tab === '-') {
                    let m1_checked_option = selected_tr.find('td').last().find('select').first();
                    m1_checked_option.val('-');
                    selected_tr.addClass('yes-m1-item cell-pink-1');
                } else {
                    // M-1 tab selected.
                    if (m1_check === '-') {
                        selected_tr.addClass('yes-m1-item cell-pink-1');
                    } else {
                        // Yes or No
                        selected_tr.addClass('yes-m1-item cell-yellow-1');
                    }
                }
            } else {
                // toastr.warn("NOT SAVING SINCE this is not M-1 item.");
                selected_tr.removeClass();
                if (m1_tab === '-') {
                    let m1_checked_option = selected_tr.find('td').last().find('select').first();
                    m1_checked_option.val('-');
                    selected_tr.addClass('no-m1-item cell-white-1');
                } else {
                    // M-1 tab selected.
                    if (m1_check === '-') {
                        selected_tr.addClass('no-m1-item cell-white-1');
                    } else {
                        // Yes or No
                        selected_tr.addClass('no-m1-item cell-yellow-1');
                    }
                }
            }
        }
    })
}

function filter_trial_balance(table, color) {
    $.fn.dataTable.ext.search.pop();
    if (color !== 'all') {
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                return $(table.row(dataIndex).node()).hasClass('cell-' + color + '-1');
            }
        );
    }
    table.draw();
}