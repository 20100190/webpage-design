$('#data-table tbody').on('click', 'button.m1-clear', function(event) {
    let elem_id = $(this).attr('id').split('-').at(-1);
    $('#m1-adj-dr-' + elem_id).val(0.0);
    $('#m1-adj-cr-' + elem_id).val(0.0);
    event.preventDefault();
});

$('input').change('.gain-loss-nonbusiness-interest, ' +
    '.state-apportionment-manual-entry, ' +
    '.state-apportionment-manual-entry, ' +
    '.tx-special-deduction-manual-entry', function() {
    // CA only
    calculate_state_tax();
});

$('select').change('.state-income-tax-rate', function() {
    // CA, TX
    calculate_state_tax();
});

$('table.tn-state-apportionment input').change(function() {
    calculate_state_tax();
});

$('button#m1-state-save-button').on('click', function(event) {
    let payload = calculate_state_tax();

    if (typeof getGenericIncomeTaxStateTable === "function") {
        payload["genericIncomeTaxStateTable"] = getGenericIncomeTaxStateTable();
    }
    if (typeof getIncomeBasedStateTaxReturn === "function") {
        payload["incomeBasedStateTaxReturn"] = getIncomeBasedStateTaxReturn();
    }
    if (typeof getGrossReceiptsTaxTable === "function") {
        payload["grossReceiptsTaxTable"] = getGrossReceiptsTaxTable();
    }
    if (typeof getGrossReceiptsStateTaxReturn === "function") {
        payload["grossReceiptsStateTaxReturn"] = getGrossReceiptsStateTaxReturn();
    }
    if (typeof getIncomeNetWorthStateTaxReturn === "function") {
        payload["incomeNetWorthStateTaxReturn"] = getIncomeNetWorthStateTaxReturn();
    }
    if (typeof getGenericAllManualTaxReturn === "function") {
        payload["genericAllManualTaxReturn"] = getGenericAllManualTaxReturn();
    }
    if (typeof getChooseModel === "function") {
        payload["chooseModel"] = getChooseModel();
    }

    $.ajax({
        data: JSON.stringify(payload),
        type: "POST",
        url: "/state/save"
    }).done(function(data) {
        if (data.error) {
            toastr.success("Error", data.error);
        } else {
            toastr.success("Saved");
        }
    });
    event.preventDefault();
});

function calculate_state_tax() {
    let state_name = window.location.pathname.split('/').at(-1);    // CA, NY, TN, ...
    let payload = {};
    if (state_name === 'CA') {
        payload = calculate_state_tax_ca();
    } else if (state_name === 'NY') {
        payload = calculate_state_tax_ny();
    } else if (state_name === 'TX') {
        payload = calculate_state_tax_tx();
    } else if (state_name === 'TN') {
        payload = calculate_state_tax_tn();
    } else {
        // Generic income states: FED, CT, VA, ....
        payload = calculate_state_tax_generic_income_state();
    }
    payload['state_name'] = state_name;
    return payload;
}

function calculate_state_tax_ca() {
    // Net (Income) / Loss after state adjustment -> the last column of the M-1 table.
    let g262_net_income_loss = grab_input2number('group-net-income-loss-sum');
    set_number2html('net-income-loss', g262_net_income_loss, '');

    // Dividend, G202, 'dividend-income'
    let g202_dividend_income = grab_html2number('dividend-income-total')
    set_number2html('dividend-income', g202_dividend_income, '');

    // Interest, G211, 'interest-income'
    let g211_interest_income = grab_html2number('interest-income-total');
    set_number2html('interest-income', g211_interest_income, '');

    // Net (income) loss from the rental of property, G217, 'lease-income-other-income'
    let g217_lease_income = grab_html2number('lease-income-other-income-total');
    set_number2html('lease-income-other-income', g217_lease_income, '');

    // Royalties, G25, 'sales-royalty-income'
    let g25_royalty_income = grab_html2number('sales-royalty-income-total');
    set_number2html('sales-royalty-income', g25_royalty_income, '')

    // (Gain) loss from the sale of assets, G205 + G208, 'gain-loss-from-the-sale-of-assets'
    let g205_g208_gain_loss_assets = grab_html2number('gain-loss-from-the-sale-of-assets-total');
    set_number2html('gain-loss-from-the-sale-of-assets', g205_g208_gain_loss_assets, '');

    // (Gain) Loss from sale of a nonbusiness interest in a partnership or LLC, (empty),
    let g270_gain_loss_nonbusiness_interest = grab_input2number('gain-loss-nonbusiness-interest');

    // Miscellaneous nonbusiness (income) loss, G223, 'other-income'
    let g223_other_income = grab_html2number('other-income-total');
    set_number2html('other-income', g223_other_income, '');

    // Total nonbusiness income, SUM(E264:E271), 'total-nonbusiness-income'
    let g272_total_nonbusiness_income = g202_dividend_income + g211_interest_income + g217_lease_income +
        g25_royalty_income + g205_g208_gain_loss_assets + g270_gain_loss_nonbusiness_interest +
        g223_other_income;
    set_number2html('total-nonbusiness-income', g272_total_nonbusiness_income, '');

    // Total Business (Income) / Loss, E262 - E272, 'total-business-income-loss'
    let g274_total_business_income = g262_net_income_loss - g272_total_nonbusiness_income;
    set_number2html('total-business-income-loss', g274_total_business_income, '');

    // State Apportionment ~= 82.68%, G276
    let g276_state_apportionment = grab_html2number('state-apportionment') / 100.0;

    // Business (income) loss apportioned to CA, G277, =E274*E276
    let g277_business_income_loss_to_state = g274_total_business_income * g276_state_apportionment;
    set_number2html('business-income-loss-apportioned', g277_business_income_loss_to_state, '');

    // Nonbusiness (income) loss allocable to CA, G279, =G272
    let g279_nonbusiness_income_loss_allocable =  g272_total_nonbusiness_income;
    set_number2html('nonbusiness-income-loss-allocable', g272_total_nonbusiness_income, '');

    // State Apportionment - Manual Entry, G280
    let g280_state_apportionment_manual_entry = grab_input2number('state-apportionment-manual-entry');

    // Business (income) loss apportioned to CA, G281, =E279*E280
    let g281_business_income_loss_apportioned = g272_total_nonbusiness_income * g280_state_apportionment_manual_entry / 100.0;
    set_number2html('business-income-loss-apportioned', g281_business_income_loss_apportioned, '');

    // Net (income) loss for CA purpose, G283, =SUM(E277,E281)
    let g283_net_income_loss_for_state_purpose = g277_business_income_loss_to_state + g281_business_income_loss_apportioned;
    set_number2html('net-income-loss-for-state-purpose', g283_net_income_loss_for_state_purpose, '');

    // Available NOL
    let g285_available_nol = grab_html2number('available-nol');

    // Adjustments to NOL: any formula which could exist by state. For California, there is nothing.
    let g287_adjustments_to_nol = grab_input2number('adjustments-to-nol');

    // Available NOL After Adjustment, "state-ca-available-nol-after-adjustment", G289
    let g289_available_nol_after_adjustment = g285_available_nol + g287_adjustments_to_nol;
    set_number2html('available-nol-after-adjustment', g289_available_nol_after_adjustment, '');

    // State Taxable Income After NOL, G291, =+E283+E289
    let g291_state_taxable_income_after_nol = g283_net_income_loss_for_state_purpose
        + g289_available_nol_after_adjustment;
    set_number2html('state-taxable-income-after-nol', g291_state_taxable_income_after_nol, '');

    // Income Tax Rate, G293
    let g293_income_tax_rate = grab_input2number('state-income-tax-rate');
    let g293_income_tax_rate_index = grab_input2selected_index('state-income-tax-rate');

    // Income Tax Expense (Benefit), G294, =-E291*E293
    let g294_income_tax_expense_benefit = - g291_state_taxable_income_after_nol * g293_income_tax_rate / 100.0;
    set_number2html('income-tax-expense-benefit', g294_income_tax_expense_benefit, '');

    // Effective Tax Rate, G296, product of regular income tax rate x apportionment (instead of -E294/G257)
    let g296_effective_tax_rate = g293_income_tax_rate * g276_state_apportionment;
    set_number2html('effective-tax-rate', g296_effective_tax_rate, '%');

    return {
        'taxable_income': g262_net_income_loss,
        'available_nol': g285_available_nol,
        'adjustments_to_nol': g287_adjustments_to_nol,
        'nol_deduction': g289_available_nol_after_adjustment,
        'income_tax_expense': g294_income_tax_expense_benefit,
        'regular_income_tax_rate': g293_income_tax_rate,
        'effective_state_income_tax_rate': g296_effective_tax_rate,
        'non_income_tax': 0,
        'g262_net_income_loss': g262_net_income_loss,
        'g202_dividend_income': g202_dividend_income,
        'g211_interest_income': g211_interest_income,
        'g217_lease_income': g217_lease_income,
        'g25_royalty_income': g25_royalty_income,
        'g205_g208_gain_loss_assets': g205_g208_gain_loss_assets,
        'g270_gain_loss_nonbusiness_interest': g270_gain_loss_nonbusiness_interest, // [R]
        'g223_other_income': g223_other_income,
        'g272_total_nonbusiness_income': g272_total_nonbusiness_income,
        'g274_total_business_income': g274_total_business_income,
        'g276_state_apportionment': g276_state_apportionment,
        'g277_business_income_loss_to_state': g277_business_income_loss_to_state,
        'g279_nonbusiness_income_loss_allocable': g279_nonbusiness_income_loss_allocable,
        'g280_state_apportionment_manual_entry': g280_state_apportionment_manual_entry, // [R]
        'g281_business_income_loss_apportioned': g281_business_income_loss_apportioned,
        'g283_net_income_loss_for_state_purpose': g283_net_income_loss_for_state_purpose,
        'g285_available_nol': g285_available_nol,
        'g287_adjustments_to_nol': g287_adjustments_to_nol,
        'g289_available_nol_after_adjustment': g289_available_nol_after_adjustment,
        'g291_state_taxable_income_after_nol': g291_state_taxable_income_after_nol,
        'g293_income_tax_rate': g293_income_tax_rate,
        'g293_income_tax_rate_index': g293_income_tax_rate_index,   // [R]
        'g294_income_tax_expense_benefit': g294_income_tax_expense_benefit,
        'g296_effective_tax_rate': g296_effective_tax_rate
    }
}

function calculate_state_tax_generic_income_state() {
    // Generic Income State: CT, VA, FED

    // Net (Income) / Loss after state adjustment -> the last column of the M-1 table.
    let g265_net_income_loss = grab_input2number('group-net-income-loss-sum'); //grab_html2number();
    set_number2input('net-income-loss', g265_net_income_loss, '');

    // State Apportionment ~= 82.68%, G276
    let g269_state_apportionment = grab_input2number('state-apportionment') / 100.0;

    // Business (income) loss apportioned to CA, G281, =E279*E280
    let g270_state_apportioned_taxable_income = g265_net_income_loss * g269_state_apportionment;
    set_number2input('state-apportioned-taxable-income-loss', g270_state_apportioned_taxable_income, '');

    // Available NOL
    let g272_available_nol = grab_input2number('available-nol');

    // Adjustments to NOL:
    let g274_adjustments_to_nol = grab_input2number('adjustments-to-nol')

    // Available NOL After Adjustment, "state-ca-available-nol-after-adjustment", G276
    let g276_available_nol_after_adjustment = g272_available_nol + g274_adjustments_to_nol;
    set_number2input('available-nol-after-adjustment', g276_available_nol_after_adjustment, '');

    // State Taxable Income After NOL, G291, =+E283+E289
    let g278_state_taxable_income_after_nol = g276_available_nol_after_adjustment + g270_state_apportioned_taxable_income;
    set_number2input('state-taxable-income-after-nol', g278_state_taxable_income_after_nol, '');

    // Income Tax Rate, G293
    let g280_income_tax_rate = grab_input2number('state-income-tax-rate');

    // Income Tax Expense (Benefit), G294, =-E291*E293
    let g281_income_tax_expense_benefit = - g280_income_tax_rate / 100 * g278_state_taxable_income_after_nol;
    set_number2input('income-tax-expense-benefit', g281_income_tax_expense_benefit, '');

    // Effective Tax Rate, G296, = product(regular income tax rate, state apportionment)
    let g283_effective_tax_rate = g269_state_apportionment * g280_income_tax_rate;
    set_number2input('effective-tax-rate', g283_effective_tax_rate, '%');

    return {
        'taxable_income': g265_net_income_loss,
        'available_nol': g272_available_nol,
        'adjustments_to_nol': g274_adjustments_to_nol,
        'nol_deduction': g276_available_nol_after_adjustment,
        'income_tax_expense': g281_income_tax_expense_benefit,
        'regular_income_tax_rate': g280_income_tax_rate,
        'effective_state_income_tax_rate': g283_effective_tax_rate,
        'non_income_tax': 0,
        'g265_net_income_loss': g265_net_income_loss,
        'g269_state_apportionment': g269_state_apportionment,
        'g270_state_apportioned_taxable_income': g270_state_apportioned_taxable_income,
        'g272_available_nol': g272_available_nol,
        'g274_adjustments_to_nol': g274_adjustments_to_nol,
        'g276_available_nol_after_adjustment': g276_available_nol_after_adjustment,
        'g278_state_taxable_income_after_nol': g278_state_taxable_income_after_nol,
        'g280_income_tax_rate': g280_income_tax_rate,
        'g281_income_tax_expense_benefit': g281_income_tax_expense_benefit,
        'g283_effective_tax_rate': g283_effective_tax_rate
    };
}

function calculate_state_tax_ny() {
    // NY, method 1

    // Net (Income) / Loss after state adjustment
    // Copy the value from the last column of the M-1 table.
    let g285_net_income_loss = grab_input2number('group-net-income-loss-sum');
    set_number2input('net-income-loss', g285_net_income_loss, '');
    set_number2input('net-income-loss-sum', g285_net_income_loss, '');

    // State Apportionment ~= 82.68%, G276
    let g286_state_apportionment = grab_input2number('state-apportionment') / 100.0;

    // Business (income) loss apportioned to CA, G281, =E279*E280
    let g287_state_apportioned_taxable_income = g286_state_apportionment * g285_net_income_loss;
    set_number2input('state-apportioned-taxable-income-loss',
        g287_state_apportioned_taxable_income, '');

    // Available NOL
    let g289_available_nol = grab_input2number('available-nol');

    // Adjustments to NOL:
    let g291_adjustments_to_nol = grab_input2number('adjustments-to-nol');

    // Available NOL After Adjustment, "state-ca-available-nol-after-adjustment", G276
    let g293_available_nol_after_adjustment = g289_available_nol + g291_adjustments_to_nol;
    set_number2input('available-nol-after-adjustment', g293_available_nol_after_adjustment, '');

    // State Taxable Income After NOL, G291, =+E283+E289
    let g295_state_taxable_income_after_nol = g293_available_nol_after_adjustment + g287_state_apportioned_taxable_income;
    set_number2input('state-taxable-income-after-nol', g295_state_taxable_income_after_nol, '');

    // Income Tax Rate, G293
    let g297_income_tax_rate = grab_input2number('state-income-tax-rate') / 100.0;

    // Income Tax Expense (Benefit), G294 = -E291 * E293
    let g298_income_tax_expense_benefit = -g297_income_tax_rate * g295_state_taxable_income_after_nol;
    set_number2input('ny-tax-a-income-tax-expense-benefit', g298_income_tax_expense_benefit, '');
    grab_input2number('ny-tax-a-income-tax-expense-benefit');

    // Effective Tax Rate, G296, = -E294/G257
    let g300_effective_tax_rate = g286_state_apportionment * g297_income_tax_rate;
    set_number2input('effective-tax-rate', g300_effective_tax_rate * 100, '%');

    // Method 2
    let total_asset_py = grab_input2number('method2-total-asset-py');
    let total_asset_cy = grab_input2number('method2-total-asset-cy');
    let total_asset_avg = (total_asset_py + total_asset_cy) / 2;
    set_number2input('method2-total-asset-avg', total_asset_avg, '');

    let total_liability_py = grab_input2number('method2-total-liability-py');
    let total_liability_cy = grab_input2number('method2-total-liability-cy');
    let total_liability_avg = (total_liability_py + total_liability_cy) / 2;
    set_number2input('method2-total-liability-avg', total_liability_avg, '');

    let total_capital = total_asset_avg + total_liability_avg;
    set_number2input('method2-total-capital', total_capital, '');
    let method2_allocation_rate = grab_input2number('method2-allocation-rate');

    let method2_allocation = total_capital * method2_allocation_rate / 100;
    set_number2input('method2-allocation', method2_allocation, '');

    let capital_tax_rate = grab_input2number('method2-capital-tax-rate');
    let capital_tax_amount = method2_allocation * capital_tax_rate / 100;
    set_number2input('ny-tax-b-capital-tax-amount', capital_tax_amount, '');

    // Finally, calculate the state tax.
    // Update with 3 Tax methods
    let ny_tax_a = grab_input2number('ny-tax-a-income-tax-expense-benefit');
    let ny_tax_b = grab_input2number('ny-tax-b-capital-tax-amount');
    let ny_tax_c = grab_input2number('ny-tax-c-fixed-dollar-minimum-tax');
    set_number2input('ny-tax-a', ny_tax_a, '');
    set_number2input('ny-tax-b', ny_tax_b, '');
    set_number2input('ny-tax-c', ny_tax_c, '');

    let calculated_income_tax_expense = Math.max(ny_tax_a, ny_tax_b, ny_tax_c);
    set_number2input('calculated-income-tax-expense', calculated_income_tax_expense, '');

    // MTA Surcharge Tax
    // Update a couple of <input> fields: NY State Summary, NYS Surcharge Tax
    let mta_surcharge_tax = grab_html2number('mta-surcharge-tax-calculated');
    set_number2input('mta-surcharge-tax', mta_surcharge_tax, '');

    // Total state tax expense
    let g278_total_state_tax_expense = mta_surcharge_tax + calculated_income_tax_expense;
    set_number2input('total-state-tax-expense', g278_total_state_tax_expense, '');

    // Effective Tax Rate, overall
    let g281_final_effective_tax_rate = - g278_total_state_tax_expense / g285_net_income_loss * 100.0;
    set_number2input('final-effective-tax-rate', g281_final_effective_tax_rate, '%');

    // NYS Surcharge Tax
    let sales_within_mctd = grab_input2number('sales-within-mctd');
    let sales_ny_state = grab_input2number('sales-ny-state');
    let property_within_mctd = grab_input2number('property-within-mctd');
    let property_ny_state = grab_input2number('property-ny-state');
    let payroll_officers_mctd = grab_input2number('payroll-officers-mctd');
    let payroll_officers_ny_state = grab_input2number('payroll-officers-ny-state');

    return {
        // used with 2.3 fed & state summary tab
        'taxable_income': g285_net_income_loss,
        'available_nol': g289_available_nol,
        'adjustments_to_nol': g291_adjustments_to_nol,
        'nol_deduction': g293_available_nol_after_adjustment,
        'income_tax_expense': g278_total_state_tax_expense,
        'regular_income_tax_rate': g297_income_tax_rate,
        'effective_state_income_tax_rate': g281_final_effective_tax_rate,
        'non_income_tax': 0,
        // used with each state summary tab
        'g285_net_income_loss': g285_net_income_loss,
        'g286_state_apportionment': g286_state_apportionment,
        'g287_state_apportioned_taxable_income': g287_state_apportioned_taxable_income,
        'g289_available_nol': g289_available_nol,
        'g291_adjustments_to_nol': g291_adjustments_to_nol,
        'g293_available_nol_after_adjustment': g293_available_nol_after_adjustment,
        'g295_state_taxable_income_after_nol': g295_state_taxable_income_after_nol,
        'g297_income_tax_rate': g297_income_tax_rate,
        'g298_income_tax_expense_benefit': g298_income_tax_expense_benefit,
        'g300_effective_tax_rate': g300_effective_tax_rate,
        'ny_tax_a': ny_tax_a,
        'ny_tax_b': ny_tax_b,
        'ny_tax_c': ny_tax_c,
        'method2_total_asset_py': total_asset_py,
        'method2_total_liability_py': total_liability_py,
        'calculated_income_tax_expense': calculated_income_tax_expense,
        'mta_surcharge_tax': mta_surcharge_tax,
        'g278_total_state_tax_expense': g278_total_state_tax_expense,
        'g281_final_effective_tax_rate': g281_final_effective_tax_rate,
        // NYS Surcharge Tax
        'sales_within_mctd': sales_within_mctd,
        'sales_ny_state': sales_ny_state,
        'property_within_mctd': property_within_mctd,
        'property_ny_state': property_ny_state,
        'payroll_officers_mctd': payroll_officers_mctd,
        'payroll_officers_ny_state': payroll_officers_ny_state,
    };
}

$('table.nys-surcharge-tax input').change(function() {
    let sales_within_mctd = grab_input2number('sales-within-mctd');
    let sales_ny_state = grab_input2number('sales-ny-state');
    let property_within_mctd = grab_input2number('property-within-mctd');
    let property_ny_state = grab_input2number('property-ny-state');
    let payroll_officers_mctd = grab_input2number('payroll-officers-mctd');
    let payroll_officers_ny_state = grab_input2number('payroll-officers-ny-state');
    let sales_ratio = (sales_ny_state > 0) ? sales_within_mctd / sales_ny_state * 100 : 0;
    let property_ratio = (property_ny_state > 0) ? property_within_mctd / property_ny_state * 100 : 0;
    let payroll_ratio = (payroll_officers_ny_state > 0) ? payroll_officers_mctd / payroll_officers_ny_state * 100 : 0;
    set_number2input('sales-state-ratio', sales_ratio, '%');
    set_number2input('property-state-ratio', property_ratio, '%');
    set_number2input('payroll-officers-ratio', payroll_ratio, '%');

    let mctd_apportionment_factor = (sales_ratio + property_ratio + payroll_ratio) / 3;
    set_number2input('mctd-apportionment-factor', mctd_apportionment_factor, '%');

    let income_tax = grab_input2number('calculated-income-tax-expense');
    let mta_surcharge_tax_base = mctd_apportionment_factor * income_tax / 100.0;
    let mta_tax_rate = 0.2860;  // TODO: read from a corporate tax rate table
    let mta_surcharge_tax = mta_surcharge_tax_base * mta_tax_rate;
    set_number2input('mta-surcharge-tax-base', mta_surcharge_tax_base, '');
    set_number2input('mta-surcharge-tax-calculated', mta_surcharge_tax, '');

    calculate_state_tax_ny();
});

function calculate_state_tax_tx() {
    // Part 1: table, below

    // Gross Receipts, G281 = -D52
    let g281_gross_receipts = grab_html2number('group-net-sales-sum');
    set_number2html('tx-gross-receipts', g281_gross_receipts, '');

    // Dividend Income, G282 = -D208
    let g282_dividend_income = grab_html2number('dividend-income-total');
    set_number2html('tx-dividend-income', g282_dividend_income, '');

    // Interest Income, G283 = -D217
    let g283_interest_income = grab_html2number('interest-income-total');
    set_number2html('tx-interest-income', g283_interest_income, '');

    // Rental Income, G284 = -D223
    let g284_rental_income = grab_html2number('rental-income-total');
    set_number2html('tx-rental-income', g284_rental_income, '');

    // Royalty Income, G285 = ?
    let g285_royalty_income = grab_html2number('royalty-income-total');
    set_number2html('tx-royalty-income', g285_royalty_income, '');

    // Total Other Income, G288 = -D229
    let g288_total_other_income = grab_html2number('other-income-total');
    set_number2html('tx-total-other-income', g288_total_other_income, '');

    // Total Other Income 2, G289 = -D211
    let g289_total_other_income_2 = grab_html2number('gain-loss-on-sale-of-fixed-assets-total');
    set_number2html('tx-total-other-income-2', g289_total_other_income_2, '');

    // Bad debt exp excluded from gross receipt, G290 = -D100
    let g290_bad_debt_exp_excluded = grab_html2number('bad-debt-expenses-total');
    set_number2html('tx-bad-debt-exp-excluded', g290_bad_debt_exp_excluded, '');

    // Special deduction (manual entry), G291
    let g291_special_deduction_manual_entry = grab_input2number('tx-special-deduction-manual-entry');

    // TTL receipts, sum of all above values, G292
    let g292_ttl_receipts = [g281_gross_receipts, g282_dividend_income,
        g283_interest_income, g284_rental_income, g285_royalty_income,
        g288_total_other_income, g289_total_other_income_2,
        g290_bad_debt_exp_excluded, g291_special_deduction_manual_entry].reduce((a, b) => a + b, 0);
    set_number2html('tx-ttl-receipts', g292_ttl_receipts, '');

    //  Wages and comp including officer comp, G296 = D174 + D171 + D70
    let d174 = grab_html2number('salaries-wages-total');
    let d171 = grab_html2number('officer-compensation-total');
    let d70 = grab_html2number('cogs-payroll-taxes-total');
    let g296_wages_and_comp = [d174, d171, d70].reduce((a, b) => a + b, 0);
    set_number2html('tx-wages-and-comp', g296_wages_and_comp, '');

    // EE benefits, G297 = D118
    let g297_ee_benefits = grab_html2number('employee-benefit-programs-total');
    set_number2html('tx-ee-benefits', g297_ee_benefits, '');

    // Other, manual entry, G298
    let g298_other_manual_entry = grab_input2number('tx-other-manual-entry');

    // Subtotal, G299 = ∑(G296 - G298)
    let g299_subtotal = [g296_wages_and_comp,
        g297_ee_benefits,
        g298_other_manual_entry].reduce((a, b) => a + b, 0);
    set_number2html('tx-subtotal', g299_subtotal, '');

    // (a) TTL receipts - TTL comp., G301
    let g301_ttl_receipts = g292_ttl_receipts - g299_subtotal;
    set_number2html('tx-ttl-receipts-ttl-comp', g301_ttl_receipts, '');

    // COGS, G303
    let g303_cogs = grab_html2number('group-total-cost-of-sales-sum');
    set_number2html('tx-cogs', g303_cogs, '');

    // Indirect or administrative overhead cost, G304
    let g304_indirect_administrative_overhead = 0;

    // (b) TTL receipts - COGS, G305
    let g305_ttl_receipts_cogs = g292_ttl_receipts - g303_cogs - g304_indirect_administrative_overhead;
    set_number2html('tx-ttl-receipts-cogs', g305_ttl_receipts_cogs, '');

    // (c) TTL receipts x 70%, G307
    let g307_ttl_receipts_70 = g292_ttl_receipts * 0.70;
    set_number2html('tx-ttl-receipts-70', g307_ttl_receipts_70, '');

    // (d) TTL receipts less $1MM, G309
    let g309_ttl_receipts_less_1mm = g292_ttl_receipts - 1e6;
    set_number2html('tx-ttl-receipts-less-1mm', g309_ttl_receipts_less_1mm, '');

    // Smallest of [a-d], G311
    let g311_smallest_of_abcd = Math.min(g301_ttl_receipts,
        g305_ttl_receipts_cogs,
        g307_ttl_receipts_70,
        g309_ttl_receipts_less_1mm);
    set_number2html('tx-smallest-of-abcd', g311_smallest_of_abcd, '');

    // Part 2: table, top

    // Taxable Base from Below, G269
    let g269_taxable_base = grab_html2number('tx-smallest-of-abcd');
    set_number2html('taxable-base-from-below', g269_taxable_base, '');

    // State Apportionment, G270
    let g270_state_apportionment = grab_html2number('state-apportionment') / 100.0;

    // State Apportioned Taxable Base, G271 = G270 x G269
    let g271_state_apportioned_taxable_base = g270_state_apportionment * g269_taxable_base;
    set_number2html('state-apportioned-taxable-base', g271_state_apportioned_taxable_base, '');

    // Allowable Deductions - Manual Entry, G272
    let g272_allowable_deductions = grab_input2number('allowable-deductions-manual-entry'); // [R]

    // State Taxable Base After Adjustment, G273,
    let g273_state_taxable_base_after_adjustment = g272_allowable_deductions + g271_state_apportioned_taxable_base;
    set_number2html('state-taxable-base-after-adjustment', g273_state_taxable_base_after_adjustment, '');

    // Flat income tax rate, G275
    let g275_flat_income_tax_rate = grab_input2number('flat-income-tax-rate');
    let g275_flat_income_tax_rate_index = grab_input2selected_index('flat-income-tax-rate');    // [R]

    // Income Tax Expense (benefit), G276
    let g276_income_tax_expense_benefit = - g273_state_taxable_base_after_adjustment * g275_flat_income_tax_rate / 100.0;
    set_number2html('income-tax-expense-benefit', g276_income_tax_expense_benefit, '');

    // Effective tax rate
    let gx_effective_state_income_tax_rate = g276_income_tax_expense_benefit / g311_smallest_of_abcd;

    return {
        // used with 2.3 fed & state summary tab
        'taxable_income': g311_smallest_of_abcd,
        'available_nol': 0,
        'adjustments_to_nol': 0,
        'nol_deduction': 0,
        'income_tax_expense': g276_income_tax_expense_benefit,
        'regular_income_tax_rate': g275_flat_income_tax_rate,
        'effective_state_income_tax_rate': gx_effective_state_income_tax_rate,
        'non_income_tax': 0,
        // used with each state summary tab
        'g281_gross_receipts': g281_gross_receipts,
        'g282_dividend_income': g282_dividend_income,
        'g283_interest_income': g283_interest_income,
        'g284_rental_income': g284_rental_income,
        'g285_royalty_income': g285_royalty_income,
        'g288_total_other_income': g288_total_other_income,
        'g289_total_other_income_2': g289_total_other_income_2,
        'g290_bad_debt_exp_excluded': g290_bad_debt_exp_excluded,
        'g291_special_deduction_manual_entry': g291_special_deduction_manual_entry,
        'g292_ttl_receipts': g292_ttl_receipts,
        'g296_wages_and_comp': g296_wages_and_comp,
        'g297_ee_benefits': g297_ee_benefits,
        'g298_other_manual_entry': g298_other_manual_entry,
        'g301_ttl_receipts': g301_ttl_receipts,
        'g303_cogs': g303_cogs,
        'g305_ttl_receipts_cogs': g305_ttl_receipts_cogs,
        'g307_ttl_receipts_70': g307_ttl_receipts_70,
        'g309_ttl_receipts_less_1mm': g309_ttl_receipts_less_1mm,
        'g311_smallest_of_abcd': g311_smallest_of_abcd,
        'g269_taxable_base': g269_taxable_base,
        'g270_state_apportionment': g270_state_apportionment,
        'g271_state_apportioned_taxable_base': g271_state_apportioned_taxable_base,
        'g272_allowable_deductions': g272_allowable_deductions,
        'g273_state_taxable_base_after_adjustment': g273_state_taxable_base_after_adjustment,
        'g275_flat_income_tax_rate': g275_flat_income_tax_rate,
        'g275_flat_income_tax_rate_index': g275_flat_income_tax_rate_index,
        'g276_income_tax_expense_benefit': g276_income_tax_expense_benefit,
    };
}

function calculate_apportionment_average_tn(class_name) {
    let prefix = '.'; // identify numbers in the state tax table.
    let font_css = {'color': '#000099'};
    let val_b = str2number($(prefix + class_name + '-beg').val());
    let val_e = str2number($(prefix + class_name + '-end').val());
    let val_avg = (val_b + val_e) / 2;
    $(prefix + class_name + '-avg').html(number2currency(val_avg)).css(font_css);
}

function calculate_state_tax_tn() {
    // (1)  Regular Excise (Income) Tax Calculation

    // Net (Income) / Loss after state adjustment, E278
    let g278_net_income_loss = grab_input2number('group-net-income-loss-sum');
    set_number2html('net-income-loss', g278_net_income_loss, '');

    // State Apportionment ~= 0.59%, E279
    let g279_state_apportionment = grab_html2number('state-apportionment') / 100.0;

    // State Apportioned Taxable (Income) Loss, E280
    let g280_state_apportioned_taxable_income = g278_net_income_loss * g279_state_apportionment;
    set_number2html('state-apportioned-taxable-income-loss', g280_state_apportioned_taxable_income, '');

    // Available NOL, E282, pull from NOL.
    let g282_available_nol = grab_html2number('available-nol');

    // Adjustments to NOL:
    let g284_adjustments_to_nol = grab_input2number('adjustments-to-nol');

    // Available NOL After Adjustment, "state-ca-available-nol-after-adjustment", G276
    let g286_available_nol_after_adjustment = g282_available_nol + g284_adjustments_to_nol;
    set_number2html('available-nol-after-adjustment', g286_available_nol_after_adjustment, '');

    // State Taxable Income After NOL, G288 = E280 + E286
    let g288_state_taxable_income_after_nol = g280_state_apportioned_taxable_income
        + g286_available_nol_after_adjustment;
    set_number2html('state-taxable-income-after-nol', g288_state_taxable_income_after_nol, '');

    // Income Tax Rate, G293
    let g290_income_tax_rate = grab_input2number('state-income-tax-rate') / 100.0;

    // Income Tax Expense (Benefit), G294, =-E291*E293
    let g291_income_tax_expense_benefit = - g290_income_tax_rate * g288_state_taxable_income_after_nol;
    set_number2html('income-tax-expense-benefit', g291_income_tax_expense_benefit, '');

    // (2) State Apportionment Calculation
    let class_names = [
        'land-building-leaseholds-improvements',
        'machinery-equipment-furniture-and-fixtures',
        'automobiles-and-trucks',
        'inventories-and-work-in-progress',
        'prepaid-supplies-and-other-property',
        'adjust-exempt-inventory',
        'rented-property-rent-paid-x-8'];
    for (const name of class_names) {
        calculate_apportionment_average_tn(name);
        calculate_apportionment_average_tn(name + '-everywhere');
    }

    // Total for Excise Tax (excluding exempt inventory)
    // Total for Franchise Tax
    let tot_class_names = [
        'total-for-excise-tax',
        'total-for-franchise-tax'];
    for (const tot_name of tot_class_names) {
        let tot_beg = 0;
        let tot_end = 0;
        let tot_everywhere_beg = 0;
        let tot_everywhere_end = 0;
        for (const name of class_names) {
            let b = grab_input2number(name + '-beg');
            let e = grab_input2number(name + '-end');
            let ev_b = grab_input2number(name + '-everywhere-beg');
            let ev_e = grab_input2number(name + '-everywhere-end');
            tot_beg += b;
            tot_end += e;
            tot_everywhere_beg += ev_b;
            tot_everywhere_end += ev_e;
        }
        // Exclude the 'Adjust: Exempt Inventory'
        if (tot_name === 'total-for-excise-tax') {
            let exempt_class = 'adjust-exempt-inventory';
            let exempt_beg = grab_input2number(exempt_class + '-beg');
            let exempt_end = grab_input2number(exempt_class + '-end');
            let exempt_everywhere_beg = grab_input2number(exempt_class + '-everywhere-beg');
            let exempt_everywhere_end = grab_input2number(exempt_class + '-everywhere-end');
            tot_beg -= exempt_beg;
            tot_end -= exempt_end;
            tot_everywhere_beg -= exempt_everywhere_beg;
            tot_everywhere_end -= exempt_everywhere_end;
        }

        // Calculate averages.
        let tot_avg = (tot_beg + tot_end) / 2;
        let tot_everywhere_avg = (tot_everywhere_beg + tot_everywhere_end) / 2;
        set_number2html(tot_name + '-beg', tot_beg, '');
        set_number2html(tot_name + '-end', tot_end, '');
        set_number2html(tot_name + '-avg', tot_avg, '');
        set_number2html(tot_name + '-everywhere-beg', tot_everywhere_beg, '');
        set_number2html(tot_name + '-everywhere-end', tot_everywhere_end, '');
        set_number2html(tot_name + '-everywhere-avg', tot_everywhere_avg, '');
    }

    // Payroll, COGS, Salaries
    let g308_payroll_e70 = grab_html2number('cogs-payroll-taxes-total');  // M1 Table, D70
    let g309_cogs_salaries_e69 = grab_html2number('cogs-salaries-total');   // M1 table
    let g310_e174 = grab_html2number('salaries-wages-total');   // M1 table, D174
    let g310_e171 = grab_input2number('officer-compensation-total');    // M1 table, D171
    let g308_payroll_total = g308_payroll_e70 + g310_e171 + g310_e174;
    $('.payroll-state-apportionment-calculation-everywhere').val(g308_payroll_total);
    $('.cogs-state-apportionment-calculation-everywhere').val(g309_cogs_salaries_e69);
    $('.salaries-state-apportionment-calculation-everywhere').val(g310_e171 + g310_e174);

    // Excise Ratio, G314 = H305 / M305
    let h305 = grab_html2number('total-for-excise-tax-avg');
    let m305 = grab_html2number('total-for-excise-tax-everywhere-avg');
    let g314_excise_ratio = h305 / m305;
    if (g314_excise_ratio == null || isNaN(g314_excise_ratio)) g314_excise_ratio = 0;
    set_number2html('excise-ratio-state-apportionment-calculation',
        g314_excise_ratio * 100, '%');

    // Excise Tax, property, G317
    let g317_property_factor = g314_excise_ratio;
    set_number2html('property-factor-excise-tax',
        g317_property_factor * 100, '%');

    // Francise Tax, property, H317
    let h306 = grab_html2number('total-for-franchise-tax-avg');
    let m306 = grab_html2number('total-for-franchise-tax-everywhere-avg');
    let h317_property_factor = h306 / m306;
    if (h317_property_factor == null || isNaN(h317_property_factor)) h317_property_factor = 0;
    set_number2html('property-factor-franchise-tax',
        h317_property_factor * 100, '%');

    // Payroll factor, Excise Tax, G318
    let g308_payroll = grab_input2number('payroll-state-apportionment-calculation');
    let l308_payroll = grab_input2number('payroll-state-apportionment-calculation-everywhere');
    let g318_payroll_factor = g308_payroll / l308_payroll;
    if (g318_payroll_factor == null || isNaN(g318_payroll_factor)) g318_payroll_factor = 0;
    set_number2html('payroll-factor-excise-tax',
        g318_payroll_factor * 100, '%');

    let g309_cogs_salaries = grab_input2number('cogs-state-apportionment-calculation');
    let g310_salaries_wedges = grab_input2number('salaries-state-apportionment-calculation');


    // Payroll factor, Franchise Tax, H318, the same equation?
    let h318_payroll_factor = g318_payroll_factor;
    set_number2html('payroll-factor-franchise-tax',
        h318_payroll_factor * 100, '%');

    // Triple Weighted, Excise Tax, G319
    let g312 = grab_html2number('sales-state-apportionment-calculation');
    let l312 = grab_html2number('sales-state-apportionment-calculation-everywhere');
    let f319_factor = g312 / l312;
    if (f319_factor == null || isNaN(f319_factor)) f319_factor = 0.0136;
    set_number2html('triple-weighted-sales-factor-ratio',
        f319_factor * 100, '%');

    let g319_factor = f319_factor * 3;
    set_number2html('triple-weighted-sales-factor-excise-tax',
        g319_factor * 100, '%');

    // Triple Weighted, Franchise Tax, H319 = G319
    let h319_factor = g319_factor;
    set_number2html('triple-weighted-sales-factor-franchise-tax',
        h319_factor * 100, '%');

    // Total Ratio, Excise Tax, G320
    let g320_total_ratio = [
        g317_property_factor,
        g318_payroll_factor,
        g319_factor].reduce((a, b) => a + b, 0)
    set_number2html('total-ratio-factor-excise-tax',
        g320_total_ratio * 100, '%');

    // Total Ratio, Franchise Tax, H320
    let h320_total_ratio = [
        h317_property_factor,
        h318_payroll_factor,
        h319_factor].reduce((a, b) => a + b, 0);
    set_number2html('total-ratio-factor-franchise-tax',
        h320_total_ratio * 100, '%');

    // Franchise Tax Apportionment Ratio, Excise, G322 = G320/5
    let g322_ratio = g320_total_ratio / 5;
    set_number2html('franchise-tax-apportionment-ratio-excise-tax',
        g322_ratio * 100, '%');

    // Franchise Tax Apportionment Ratio, Franchise, H322 = H320/5
    let h322_ratio = h320_total_ratio / 5;
    set_number2html('franchise-tax-apportionment-ratio-franchise-tax',
        h322_ratio * 100, '%');

    // (3) Franchise Tax Based on Net Worth
    let g328_total_assets = 60067854;   // BS.C52 #TODO
    let g329_total_liabilities = -23255671; // BS.C76 #TODO
    let g330_net_worth = g328_total_assets + g329_total_liabilities;
    let g331_add_back_loan = 0;     // #TODO
    let g332_adjusted_net_worth = g330_net_worth + g331_add_back_loan;
    let g333_franchise_tax_apportionment = h322_ratio;
    let g334_net_worth_apportioned = g330_net_worth * g333_franchise_tax_apportionment;

    let g336_real_and_tangible = grab_html2number('total-for-franchise-tax-avg');
    let g337_less_certified = 0;
    let g338_less_exempt = 0;
    let g339_rental_cost = 0;
    let g340_real_property_8 = 0;
    let g341_manufact_3 = 0;
    let g342_furniture_2 = 0;
    let g343_delivery_1 = 0;
    let g345_total_real_and_tangible = [
        g336_real_and_tangible, g337_less_certified, g338_less_exempt,
        g339_rental_cost, g340_real_property_8, g341_manufact_3,
        g342_furniture_2, g343_delivery_1
    ].reduce((a, b) => a + b, 0);
    let g347_franchise_tax_base = Math.max(
        g334_net_worth_apportioned,
        g345_total_real_and_tangible);
    let g348_franchise_tax = g347_franchise_tax_base /100 * 0.25;

    // css, value, unit string (%, etc.)
    set_number2html('ftbw-total-assets', g328_total_assets, '');
    set_number2html('ftbw-total-liabilities', g329_total_liabilities, '');
    set_number2html('ftbw-net-worth', g330_net_worth, '');
    set_number2html('ftbw-add-back-loan', g331_add_back_loan, '');
    set_number2html('ftbw-adjusted-net-worth', g332_adjusted_net_worth, '');
    set_number2html('ftbw-franchise-tax-apportionment', g333_franchise_tax_apportionment, '');
    set_number2html('ftbw-net-worth-apportioned', g334_net_worth_apportioned, '');
    set_number2html('ftbw-real-and-tangible', g336_real_and_tangible, '');
    set_number2html('ftbw-less-certified-pollution', g337_less_certified, '');
    set_number2html('ftbw-less-exempt', g338_less_exempt, '');
    set_number2html('ftbw-rental-cost', g339_rental_cost, '');
    set_number2html('ftbw-real-property', g340_real_property_8, '');
    set_number2html('ftbw-manufact', g341_manufact_3, '');
    set_number2html('ftbw-furniture', g342_furniture_2, '');
    set_number2html('ftbw-delivery', g343_delivery_1, '');
    set_number2html('ftbw-tn-total-real-and-tangible', g345_total_real_and_tangible, '');
    set_number2html('ftbw-franchise-tax-base', g347_franchise_tax_base, '');
    set_number2html('ftbw-franchise-tax', g348_franchise_tax, '');

    // (4) State Income Tax Calculation
    // State income tax expense, E291
    set_number2html('state-income-tax-expense', g291_income_tax_expense_benefit, '');

    // State Franchise tax expense, F348
    set_number2html('state-franchise-tax-expense', g348_franchise_tax, '');

    // Total Tax Expense, E269 + E270
    let g271_total_tax_expense = g291_income_tax_expense_benefit + g348_franchise_tax;
    set_number2html('total-tax-expense', g271_total_tax_expense, '');

    // Effective Tax Rate, E274 = -E271/E265
    let g274_effective_tax_rate = - g271_total_tax_expense / g278_net_income_loss * 100.0;
    set_number2html('effective-tax-rate', g274_effective_tax_rate, '%');

    let payload = {
        // used with 2.3 fed & state summary tab
        'taxable_income': g278_net_income_loss,
        'available_nol': g282_available_nol,
        'adjustments_to_nol': g284_adjustments_to_nol,
        'nol_deduction': g286_available_nol_after_adjustment,
        'income_tax_expense': g271_total_tax_expense,
        'regular_income_tax_rate': g290_income_tax_rate,
        'effective_state_income_tax_rate': g274_effective_tax_rate,
        'non_income_tax': g348_franchise_tax,
        // used with each state summary tab
        'g271_total_tax_expense': g271_total_tax_expense,
        'g274_effective_tax_rate': g274_effective_tax_rate,
        'g278_net_income_loss': g278_net_income_loss,
        'g279_state_apportionment': g279_state_apportionment,
        'g280_state_apportioned_taxable_income': g280_state_apportioned_taxable_income,
        'g282_available_nol': g282_available_nol,
        'g284_adjustments_to_nol': g284_adjustments_to_nol,
        'g286_available_nol_after_adjustment': g286_available_nol_after_adjustment,
        'g288_state_taxable_income_after_nol': g288_state_taxable_income_after_nol,
        'g290_income_tax_rate': g290_income_tax_rate,
        'g291_income_tax_expense_benefit': g291_income_tax_expense_benefit,
        'g308_payroll': g308_payroll,
        'g309_cogs_salaries': g309_cogs_salaries,
        'g310_salaries_wedges': g310_salaries_wedges,
        'h322_ratio': h322_ratio,
        'g328_total_assets': g328_total_assets,
        'g329_total_liabilities': g329_total_liabilities,
        'g330_net_worth': g330_net_worth,
        'g331_add_back_loan': g331_add_back_loan,
        'g332_adjusted_net_worth': g332_adjusted_net_worth,
        'g333_franchise_tax_apportionment': g333_franchise_tax_apportionment,
        'g334_net_worth_apportioned': g334_net_worth_apportioned,
        'g336_real_and_tangible': g336_real_and_tangible,
        'g337_less_certified': g337_less_certified,
        'g338_less_exempt': g338_less_exempt,
        'g339_rental_cost': g339_rental_cost,
        'g340_real_property_8': g340_real_property_8,
        'g341_manufact_3': g341_manufact_3,
        'g342_furniture_2': g342_furniture_2,
        'g343_delivery_1': g343_delivery_1,
        'g345_total_real_and_tangible': g345_total_real_and_tangible,
        'g347_franchise_tax_base': g347_franchise_tax_base,
        'g348_franchise_tax': g348_franchise_tax,
    };
    for (const name of class_names) {
        let b = grab_input2number(name + '-beg');
        let e = grab_input2number(name + '-end');
        let ev_b = grab_input2number(name + '-everywhere-beg');
        let ev_e = grab_input2number(name + '-everywhere-end');
        payload[name + '-beg'] = b;
        payload[name + '-end'] = e;
        payload[name + '-everywhere-beg'] = ev_b;
        payload[name + '-everywhere-end'] = ev_e;
    }
    return payload;
}
