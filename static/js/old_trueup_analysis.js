$(document).ready( function () {
    let dataTable = $('#data-table').DataTable({
        "ordering": false,
        "scrollCollapse": true,
        "paging": false,
        "searching": false,
        "info": false,
        "columnDefs": [{targets: 0, className: "text-nowrap"}],
    });

    calculate_trueup_analysis();
    format_number_input();
});

$('#data-table tbody').on('change', 'input.new-label', function() {
    update_css_classnames($(this));
});

$('#data-table tbody').on('change', 'input.number', function() {
    calculate_trueup_analysis();
    format_number_input();
});

$('button#save-button').on('click', function(event) {
    save_trueup_analysis();
});

$('#data-table thead').on('change', 'select', function(event) {
    update_perm_temp_status();
    calculate_trueup_analysis();
    format_number_input();
});

function calculate_trueup_analysis() {
    update_perm_temp_status();
    calculate_perm_temp_trueup_total();
    calculate_grand_total();
    calculate_trueup_difference();
    calculate_check_amount();
    calculate_default_trueup_analysis();
}

$('#data-table thead').on('click', 'button.trueup-remove-column', function(event) {
    let idx = $(this).closest('th').index();
    $('#data-table').find('tr').each(function() {
        $(this).find('td:eq(' + idx + ')').remove();
        $(this).find('th:eq(' + idx + ')').remove();
    });
});

function get_trueup_headers() {
    let headers = [];
    $('#data-table th.column-index').each(function() {
        let column_tag = string2tag($(this).html());
        if (column_tag !== 'form-1120') {
            headers.push(column_tag)
        }
    });
    return headers;
}

function get_trueup_custom_headers() {
    let headers = [];
    $('#data-table thead').find('select').each(function() {
        let new_col_id = $(this).attr('class').split(' ')[0].split('-').slice(-1)[0]
        headers.push(new_col_id);
    });
    return headers;
}

function update_perm_temp_status() {
    $('#data-table thead select').each(function() {
        let selected_option = $(this).find('option:selected').text();
        let perm_temp = selected_option.charAt(selected_option.length - 2);
        let idx = $(this).closest('th').index();
        $('#data-table thead tr.perm-temp-row th').eq(idx).html(perm_temp);
    });
}

function get_row_indexes() {
    // Grabs the form number from the table
    // and returns a list of form numbers in the Form 1120,
    // "1", "1b", "2", ...., "29"
    let indexes = [];
    $('#data-table td.row-index').each(function() {
        let index_num = $(this).html().split(' ')[0];
        indexes.push(index_num)
    });
    return indexes;
}

function calculate_trueup_difference() {
    let row_indexes = get_row_indexes();
    $.each(row_indexes, function(i, row_index) {
        let prov = grab_input2number(row_index + '-balances-per-py-tax-provision');
        let retn = grab_input2number(row_index + '-balances-per-py-tax-return');
        let diff = retn - prov;
        set_number2input(row_index + '-difference', diff, '');
    });
}

/**
 * Calculate the Grand Total column, which sums horizontally.
 * grand_total = sum(Penalty, Meals, Reclass and additional True-up items)
 */
function calculate_grand_total() {
    let headers = get_trueup_headers();
    let headers_custom = get_trueup_custom_headers();
    headers = headers.concat(headers_custom);
    let row_indexes = get_row_indexes();
    let additional_indexes = ['total-deductions', 'empty-row-30',
        'taxable-income-loss', 'income-tax-expense', 'tax-rate'];
    row_indexes = row_indexes.concat(additional_indexes);
    $.each(row_indexes, function(i, row_index) {
        let grand_total = 0;
        $.each(headers, function(j, header) {
            if (j > 4) {
                let css_selector = row_index + '-' + header;
                grand_total += grab_input2number(css_selector);
            }
        })
        set_number2input(row_index + '-grand-total', grand_total, '');
    })
}

/**
 * Calculate the Check column, which is a sum of Difference and Grand Total.
 */
function calculate_check_amount() {
    let row_indexes = get_row_indexes();
    $.each(row_indexes, function(i, row_index) {
        let diff = grab_input2number(row_index + '-difference');
        let grand_total = grab_input2number(row_index + '-grand-total');
        let check = diff + grand_total;
        set_number2input(row_index + '-check', check, '');
    });
}

/**
 * Return "P", "T" or "R" from the 1st row of the table header.
 * @param selector, column name
 * @returns {*|jQuery}
 */
function get_perm_temp_status(selector) {
    // P , T, or R selector = 5-digit id
    let perm_temp = $('#data-table thead').find('.perm-temp-' + selector).html();
    return perm_temp;
}

/**
 * Return a list of column name for Tax True-Up List.
 * @returns {string[]}
 */
function get_extra_trueup_column_selectors() {
    let selectors = ['penalty', 'meals'];
    $('#data-table thead').find('select').each(function() {
        let new_col_id = $(this).attr('class').split(' ')[0].split('-').slice(-1)[0]
        selectors.push(new_col_id);
    });
    return selectors;
}

function calculate_perm_temp_trueup_total() {
    let indexes = ['1', '1b', '2', '3', '4', '5', '6', '7', '8', '9', '10',
        '12', '13', '14', '15', '16', '17', '18', '19', '20',
        '21', '22', '23', '24', '25', '26', '29b'];

    // Get CSS selector in the table header.
    let selectors = get_extra_trueup_column_selectors();

    // Calculate sum of the rows 1-29b
    $.each(selectors, function(j, selector) {
        let grand_total = 0;
        $.each(indexes, function(i, row_index) {
            let css_selector = row_index + '-' + selector; // row_index + "selector"
            let amount = grab_input2number(css_selector);
            grand_total += amount;
        })

        // Set the total separated by Perm/Temp.
        let perm_temp = get_perm_temp_status(selector);
        let sum_perm = (perm_temp === 'P') ? grand_total : 0;
        let sum_temp = (perm_temp === 'P') ? 0 : grand_total;
        set_number2input('total-deductions-' + selector, sum_perm, '');
        set_number2input('empty-row-30-' + selector, sum_temp, '');
        set_number2input('taxable-income-loss-' + selector, grand_total, '');

        // Set the tax expense amount.
        let fed_tax_rate = 0.21;
        let income_tax_expense = Math.round(fed_tax_rate * grand_total);
        set_number2input('income-tax-expense-' + selector, income_tax_expense, '');
        if (perm_temp === 'P') {
            set_number2input('tax-rate-' + selector, income_tax_expense, '');
        }
    })
}

function sum_trueup_income_column(index_v, selector, column_name) {
    let total_value = 0;
    $.each(index_v, function(i, index) {
        let css_selector = index + '-' + column_name;
        let value = grab_input2number(css_selector);
        total_value += value;
    });
    set_number2input(selector + column_name, total_value, '');
    return total_value;
}

function calculate_default_trueup_analysis() {
    let headers = get_trueup_headers();
    let index_income = ['3', '4', '5', '6', '7', '8', '9', '10'];
    let index_difference = ['1', '1b', '2'].concat(index_income);
    let index_deduction = ['12', '13', '14', '15', '16', '17', '18', '19', '20',
        '21', '22', '23', '24', '25', '26', '29b'];

    $.each(headers, function(idx_h, header) {
        if (idx_h > 2) {
            return false;
        }

        // Total deduction: sum(row 11 - 29b)
        let deduction = sum_trueup_income_column(index_deduction, 'total-deductions-', header);
        if (idx_h < 2) {
            // (1) (2) Balances per PY Tax Provision, Return: sum(row 3 - 10)
            let income = sum_trueup_income_column(index_income, 'total-income-', header);

            let taxable_income = income - deduction;
            set_number2input('taxable-income-loss-' + header, taxable_income, '');

            let tax_rate = 0.21;
            let income_tax_expense = tax_rate * taxable_income;
            set_number2input('income-tax-expense-' + header, income_tax_expense, '');
            set_number2input('tax-rate-' + header, 21.00, '%');
        } else {
            // (3) Difference: sum(row 1 - 10)
            let income = sum_trueup_income_column(index_difference, 'total-income-', header);

            let taxable_income = income - deduction;
            set_number2input('taxable-income-loss-' + header, taxable_income, '');
        }
    })
}

function grab_trueup_analysis_input_values() {
    // construct css selectors
    let headers = get_trueup_headers();
    let headers_custom = get_trueup_custom_headers();
    headers = headers.concat(headers_custom);
    let row_indexes = get_row_indexes();
    let additional_indexes = ['total-income',
        'total-deductions',
        'empty-row-30',
        'taxable-income-loss',
        'income-tax-expense',
        'tax-rate'];
    row_indexes = row_indexes.concat(additional_indexes);
    let payload = {};

    // Grab <input> values
    $.each(headers, function(i, header) {
        $.each(row_indexes, function(j, row_index) {
            let css_selector = row_index + '-' + header;
            payload[css_selector] = grab_input2number(css_selector);;
        })
    })

    // Grab <select> values.
    let additional_headers = [];
    $('#data-table thead select').each(function(i, elem) {
        let selected_option = $(this).find('option:selected').val();
        let class_name = $(this).attr('class').split(' ')[0].split('-').slice(-1)[0]
        additional_headers.push(class_name);
        payload['column-' + class_name] = parseInt(selected_option);
    });

    payload['additional_headers'] = additional_headers;
    return payload;
}

function save_trueup_analysis() {
    $.ajax( {
        data: {'payload': JSON.stringify( grab_trueup_analysis_input_values())},
        type: 'POST',
        url: '/old_true_up/save'
    }).done(function(data) {
        if (data.error) {
            console.log('Error while saving True-up data.');
            toastr.error('Unable to save. ' + data.error);
        } else {
            toastr.success('Saved');
        }
    });
}
