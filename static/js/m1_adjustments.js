$('#data-table tbody').on('click', 'button.m1-save', function(event) {
    let elem = $(this);                                     // save button
    let elem_id = elem.attr('id').split('-').at(-1);     // object ID of the Trial Balance.
    let tax_chart_name = elem.attr('value');             // Tax Chart of Account
    let state_name = window.location.pathname.split('/').at(-1);    // CA, NY, TN, ...
    let m1_debit = grab_input2number('m1-adj-dr-' + elem_id);
    let m1_credit = grab_input2number('m1-adj-cr-' + elem_id);
    let m1_item_name = $('#m1-item-name-' + elem_id).val();
    $.ajax({
        data : {
            state: state_name,
            m1_adj_dr: m1_debit,
            m1_adj_cr: m1_credit,
            m1_item_name: m1_item_name,
            tax_chart_name: tax_chart_name,
            obj_id: elem_id
        },
        type: 'POST',
        url: '/m1_adjustment/states/save'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Error: ' + data.error);
        } else {
            toastr.success(data.success);
            update_section_balance(elem, data.obj_id); //
            update_group_balances(); // Update the sum of group, purple
            calculate_state_tax();  // Update the top table, state tax.
        }
    });
    event.preventDefault();
});

function update_section_balance(section_button, obj_id) {
    // Get all debits and credits values that have the same 'class_name'.
    let elem_id = section_button.attr('id').split('-').at(-1);
    let class_name = section_button.attr('prop');
    let current_row = section_button.closest('tr');
    let prev_row = current_row.prevAll('.tax-chart:first');
    let m1_federal = str2number(prev_row.find('.m1-adj-federal').val());

    let debits_tot = 0.0;
    $('.' + class_name + '-debits').each( function() {
        debits_tot += str2number($(this).val());
    });

    let credits_tot = 0.0;
    $('.' + class_name + '-credits').each( function() {
        credits_tot += str2number($(this).val());
    });

    // Update with a new object ID when it is saved as a new.
    $('#m1-item-name-' + elem_id).attr('id', 'm1-item-name-' + obj_id);
    $('#m1-adj-dr-' + elem_id).attr('id', 'm1-adj-dr-' + obj_id);
    $('#m1-adj-cr-' + elem_id).attr('id', 'm1-adj-cr-' + obj_id);
    $('#m1-save-button-' + elem_id).attr('id', 'm1-save-button-' + obj_id);
    $('#m1-delete-button-' + elem_id).attr('id', 'm1-delete-button-' + obj_id);

    // Calculate the total value(s) for the TrialBalance row.
    let m1_sub_tot = m1_federal + credits_tot + debits_tot;
    let m1_dr_sum_str = number2currency(debits_tot);
    let m1_cr_sum_str = number2currency(credits_tot);
    let m1_sub_tot_str = number2currency(m1_sub_tot);
    prev_row.find('input.m1-adj-debit-sum').val(m1_dr_sum_str);
    prev_row.find('input.m1-adj-credit-sum').val(m1_cr_sum_str);
    prev_row.find('input.m1-sub-section-total').val(m1_sub_tot_str);

    // Update the group sum (purple)
    let group_sum = 0.0
    let group_name = prev_row.find('input.m1-sub-section-total').attr('class').split(' ').at(-1);
    $('.' + group_name).each( function() {
        group_sum += str2number($(this).val());
    });
    let group_sum_str = number2currency(group_sum);
    $('.' + group_name + '-sum').val(group_sum_str);

    // Update the section header total (yellow)
    let section_header_row = current_row.prevAll('tr.section-header-row:first');
    let group_header_row = current_row.nextAll('tr.group-header-row:first');
    let index_first = section_header_row.index() + 1;
    let index_last = group_header_row.index()
    let sub_section_sum = 0;
    let rows = $('#data-table tbody tr');
    for (let i = index_first; i < index_last; i++) {
        let balance = rows.eq(i).find('input.m1-sub-section-total').val();
        sub_section_sum += str2number(balance);
    }
    rows.eq(index_last).find('input:last').val(number2currency(sub_section_sum));
}

function update_group_balances() {
    // Update the Net Sales (Gross Sales + Sales Returns and Allowances)
    let net_sales_total_row = $('input.group-net-sales-sum').closest('tr');
    let net_sales_index = net_sales_total_row.index();
    let index_first = 1
    let sub_section_sum = 0;
    let rows = $('#data-table tbody tr');
    for (let i = index_first; i < net_sales_index; i++) {
        let balance = rows.eq(i).find('input.m1-sub-section-total').val();
        sub_section_sum += str2number(balance);
    }
    set_number2input('group-net-sales-sum', sub_section_sum, '');

    // Calculate and update the numbers in the group rows, highlighted as purple.
    let net_sales = 'net-sales';    // a
    let total_cost_of_sales = 'total-cost-of-sales';    // b
    let gross_profit_loss = 'gross-profit-loss';    // c
    let total_operating_expenses = 'total-operating-expenses';  // d
    let net_income_loss_from_operations = 'net-income-loss-from-operations';    // e
    let other_income_expense_net = 'other-income-expense-net';  // f
    let net_income_loss_before_tax = 'net-income-loss-before-tax';  // g
    let income_tax_expenses_benefits_net = 'income-tax-expenses-benefits-net';  // h
    let net_income_loss = 'net-income-loss';    // i
    let a = grab_input2number('group-' + net_sales + '-sum');
    let b = grab_input2number('group-' + total_cost_of_sales + '-sum');
    let c = a + b;  // gross_profit_loss
    let d = grab_input2number('group-' + total_operating_expenses + '-sum');
    let e = d + c;  // net_income_loss_from_operations
    let f = grab_input2number('group-' + other_income_expense_net + '-sum');
    let g = f + e;  // net_income_loss_before_tax
    let h = grab_input2number('group-' + income_tax_expenses_benefits_net + '-sum');
    let i = h + g;  // Net (Income) loss)
    set_number2input('group-' + gross_profit_loss + '-sum', c, '');
    set_number2input('group-' + net_income_loss_from_operations + '-sum', e, '');
    set_number2input('group-' + net_income_loss_before_tax + '-sum', g, '');
    set_number2input('group-' + net_income_loss + '-sum', i, '');
}