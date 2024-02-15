function load_state_apportionment(post_http_hook) {
    $.ajax({
        data: {},
        type: 'GET',
        url: '/config/states_active'    // TODO: get formula and <input> data.
    }).done(function(data) {
        if (data.error) {
            console.log('Error');
        } else {
            calculate_state_apportionment(data.state_apportionment);
            if (post_http_hook) {
                post_http_hook()
            }
        }
    });
}

function get_active_states_from_header() {
    // ignore index === 0
    // Find the index for "Total", N.
    // Grab text in between 0 - N.
    let active_states = [];
    let total_index = $('#data-table thead th:contains("Total")').closest('th').index();
    $('#data-table thead').find('tr:eq(0)').find('th').each(function(index, cell) {
        if ((index > 0) && (index < total_index)) {
            // console.log($(this).html());
            let state_ = $(this).html();
            active_states.push(state_);
        }
    });
    // console.log('get_active_states_from_header(): ' + active_states);
    return active_states;
}

function calculate_state_apportionment(active_states_formula) {
    // 6.2 State Apportionment
    let active_states = [];
    for (let key in active_states_formula) {
        active_states.push(key);
    }

    // This includes the additional column.
    let active_states_header = get_active_states_from_header();
    for (let state_ext of active_states_header) {
        if (active_states.indexOf(state_ext) < 0) {
            active_states.push(state_ext);
            active_states_formula[state_ext] = 'SS';
        }
    }

    $.each(active_states, function(index, state_name) {
        calculate_single_state_apportionment(state_name);
    })

    calculate_total(active_states);
    calculate_total_percentages(active_states);
    for (let key in active_states_formula) {
        calculate_apportionment(key, active_states_formula[key]);
    }

    calculate_difference_total_bspl();
    calculate_section_totals();     // TODO: combine with calculate_total()?
}

function calculate_section_totals() {
    // (1) Properties
    // total_property-BSPL
    let property_building_avg = grab_input2number('building_average-BSPL');
    let property_machinery_avg = grab_input2number('machinery_average-BSPL');
    let property_vehicles_avg = grab_input2number('vehicles_average-BSPL');
    let property_tools_avg = grab_input2number('tools_average-BSPL');
    let properties = property_building_avg + property_machinery_avg + property_vehicles_avg + property_tools_avg;
    set_number2input('property_total_average-BSPL', properties, '');

    // x8
    let real_x8 = grab_input2number('real_property_x8-BSPL');
    let lease_x8 = grab_input2number('lease_property_x8-BSPL');
    let total_x8 = real_x8 + lease_x8;
    set_number2input('total_x8-BSPL', total_x8, '');

    // Total property
    let total_property = properties + total_x8;
    set_number2input('total_property-BSPL', total_property, '');

    // Payroll
    let payroll_salary = grab_input2number('payroll_salary-BSPL');
    let payroll_overtime = grab_input2number('payroll_overtime-BSPL');
    let payroll_incentive_pay = grab_input2number('payroll_incentive_pay-BSPL');
    let payroll_bonus = grab_input2number('payroll_bonus-BSPL');
    let payroll_provision_bonus = grab_input2number('payroll_provision_bonus-BSPL');
    let payroll_total = payroll_salary + payroll_overtime + payroll_incentive_pay + payroll_bonus + payroll_provision_bonus;
    set_number2input('total_payroll-BSPL', payroll_total, '');

    // Sales
    let sales_sales = grab_input2number('sales_sales-BSPL');
    let sales_interest = grab_input2number('sales_interest_income-BSPL');
    let sales_assets = grab_input2number('sales_gain_sales-BSPL');
    let sales_exchange = grab_input2number('sales_gain_exchange-BSPL');
    let sales_lease = grab_input2number('sales_lease_income-BSPL');
    let sales_income = grab_input2number('sales_other_income-BSPL');
    let sales_total = sales_sales + sales_interest + sales_assets + sales_exchange + sales_lease + sales_income;
    set_number2input('total_sales-BSPL', sales_total, '');
}

function calculate_difference_total_bspl() {
    // (1) Property
    let properties = ['building', 'machinery', 'vehicles', 'tools'];
    $.each(properties, function(index, property) {
        let end_total_ = grab_input2number(property + '_ending-Total');
        let end_bspl_ = grab_input2number(property + '_ending-BSPL');
        let end_diff_ = end_total_ + end_bspl_;
        set_number2input(property + '_ending-Difference', end_diff_, '');
    });

    // (1) Property: Rent
    let rents = ['real_property', 'real_property_x8',
        'lease_property', 'lease_property_x8'];
    $.each(rents, function(index, rent) {
        let total_ = grab_input2number(rent + '-Total');
        let bspl_ = grab_input2number(rent + '-BSPL');
        let diff_ = total_ + bspl_;
        set_number2input(rent + '-Difference', diff_, '');
    });

    // (2) Payroll
    let payrolls = ['payroll_salary', 'payroll_overtime',
        'payroll_incentive_pay', 'payroll_bonus', 'payroll_provision_bonus'];
    $.each(payrolls, function(index, payroll) {
        let total_ = grab_input2number(payroll + '-Total');
        let bspl_ = grab_input2number(payroll + '-BSPL');
        let diff_ = total_ + bspl_;
        set_number2input(payroll + '-Difference', diff_, '');
    });

    // (3) Sales
    let sales = ['sales_sales', 'sales_interest_income', 'sales_gain_sales',
        'sales_gain_current', 'sales_lease_income', 'sales_other_income'];
    $.each(sales, function(index, sale) {
        let total_ = grab_input2number(sale + '-Total');
        let bspl_ = grab_input2number(sale + '-BSPL');
        let diff_ = total_ - bspl_;
        set_number2input(sale + '-Difference', diff_, '');
    });

    // Set background color if *-Difference is not zero.
    $("tbody input[class*='Difference']").each(function(idx, element) {
        let num_ = str2number($(this).val());
        if (Math.abs(num_) > 0) {
            $(this).css({'background-color': '#f8bbd0'});
        } else {
            $(this).css({'background-color': '#ffffff'});
        }
    });
}

function calculate_single_state_apportionment(state_name) {
    // Properties: calculate averages.
    // Building, Machinery, Vehicles, Tools
    let properties = ['building', 'machinery', 'vehicles', 'tools'];
    let prop_total = 0;
    $.each(properties, function(index, value) {
        let beg_number = grab_input2number(value + '_beginning-' + state_name);
        let end_number = grab_input2number(value + '_ending-' + state_name);
        let avg_number = (beg_number + end_number) / 2;
        prop_total += avg_number;
        set_number2input(value + '_average-' + state_name, avg_number, '');
    });
    set_number2input('property_total_average-' + state_name, prop_total, '');

    // Rent: calculate x8.
    let rents = ['real_property', 'lease_property'];
    let rentx8_total = 0;
    $.each(rents, function(index, rent) {
        let rent_number = grab_input2number(rent + '-' + state_name);
        let rentx8_number = rent_number * 8;
        rentx8_total += rentx8_number;
        set_number2input(rent + '_x8-' + state_name, rentx8_number, '');
    });
    set_number2input('total_x8-' + state_name, rentx8_total, '');

    // Payroll
    let payrolls = ['payroll_salary', 'payroll_overtime',
        'payroll_incentive_pay', 'payroll_bonus', 'payroll_provision_bonus'];
    let payroll_total = 0;
    $.each(payrolls, function(index, payroll) {
        payroll_total += grab_input2number(payroll + '-' + state_name);
    });
    set_number2input('total_payroll-' + state_name, payroll_total, '');

    // Sales
    let sales_total = grab_input2number('sales_sales-' + state_name);
    set_number2input('total_sales-' + state_name, sales_total, '');
}

function calculate_total(active_states) {
    // Property: Building, Machinery, Vehicles, Tools: calculate averages.
    let properties = ['building', 'machinery', 'vehicles', 'tools'];
    let property_total_average = 0;
    $.each(properties, function(index, property) {
        let beg_total = 0;
        let end_total = 0;
        $.each(active_states, function(index, state_name) {
            beg_total += grab_input2number( property + '_beginning-' + state_name);
            end_total += grab_input2number( property + '_ending-' + state_name);
        });
        let avg_total = (beg_total + end_total) / 2;
        set_number2input(property + '_beginning-Total', beg_total, '');
        set_number2input(property + '_ending-Total', end_total, '');
        set_number2input(property + '_average-Total', avg_total, '');
        property_total_average += avg_total;
    });
    set_number2input('property_total_average-Total', property_total_average, '')

    // Rent: calculate x8.
    let rents = ['real_property', 'lease_property'];
    let rentx8_total = 0;
    $.each(rents, function (index, rent) {
        let rent_sub_total = 0;
        let rent_x8_sub_total = 0;
        $.each(active_states, function(index, state_name) {
            let rent_value = grab_input2number(rent + '-' + state_name);
            let rent_value_x8 = rent_value * 8;
            rent_sub_total += rent_value;
            rent_x8_sub_total += rent_value_x8;
            rentx8_total += rent_value_x8;
        });
        set_number2input(rent + '-Total', rent_sub_total, '');
        set_number2input(rent + '_x8-Total', rent_x8_sub_total, '');
    });
    set_number2input('total_x8-Total', rentx8_total, '');

    // Property: Total
    let property_total = 0;
    $.each(active_states, function(index, state_name) {
        let state_total_average = grab_input2number('property_total_average-' + state_name);
        let state_total_rentx8 = grab_input2number('total_x8-' + state_name);
        let state_total = state_total_average + state_total_rentx8;
        property_total += state_total;
        set_number2input('total_property-' + state_name, state_total, '');
    });
    set_number2input('total_property-Total', property_total, '');

    // Payroll, Sales
    let sections = {
        'payroll': ['salary', 'overtime', 'incentive_pay',
            'bonus', 'provision_bonus'],
        'sales': ['sales', 'interest_income', 'gain_sales',
            'gain_current', 'lease_income', 'other_income']};
    for (let key in sections) {
        let section_total = 0;
        $.each(sections[key], function(index, value) {
            let section_sub_total = 0;
            $.each(active_states, function(index, state_name) {
                section_sub_total += grab_input2number(key + '_' + value + '-' + state_name)
            });
            set_number2input(key + '_' + value + '-Total', section_sub_total, '');
            section_total += section_sub_total;
        })

        if (key === 'sales') {
            // Total Sales = Sales, not including through Interest Income to Other Income.
            let sales_total = grab_input2number('sales_sales-Total');
            set_number2input('total_sales-Total', sales_total, '');
        } else {
            set_number2input('total_' + key + '-Total', section_total, '');
        }
    }
}

function calculate_total_percentages(active_states) {
    let sections = ['property', 'payroll', 'sales'];
    $.each(sections, function(index, section) {
        let section_total = grab_input2number('total_' + section + '-Total');
        let section_total_sum = 0;
        $.each(active_states, function(index, state_name) {
            let section_value = grab_input2number('total_' + section + '-' + state_name);
            let state_percent = 0;
            if (section_total > 0) {
                state_percent = section_value / section_total * 100.0;
            }
            section_total_sum += section_value;
            set_number2input( 'percent_total_' + section + '-' + state_name,
                state_percent, '%', 4);
        });
        let section_total_percent = 0
        if (section_total > 0) {
            section_total_percent = section_total_sum / section_total * 100.0;
        }
        set_number2input('percent_total_' + section + '-Total',
            section_total_percent, '%', 2);
    });
}

function calculate_apportionment(state_name, formula) {
    let property = grab_input2number( 'percent_total_property-' + state_name);
    let payroll = grab_input2number('percent_total_payroll-' + state_name);
    let sales = grab_input2number('percent_total_sales-' + state_name);
    let apportionment = 0;
    switch (formula) {
        case 'SS':
            // single sales factor
            apportionment = sales;
            break;
        case '3F6xS':
            // 3-factor with quadruple-weighted sales factor
            apportionment = (property + payroll + 6 * sales) / 8;
            break;
        case '3F5xS':
            // 3-factor with quadruple-weighted sales factor
            apportionment = (property + payroll + 5 * sales) / 7;
            break;
        case '3F4xS':
            // 3-factor with quadruple-weighted sales factor
            apportionment = (property + payroll + 4 * sales) / 6;
            break;
        case '3F3xS':
            // 3-factor with triple-weighted sales factor
            apportionment = (property + payroll + 3 * sales) / 5;
            break;
        case '3F2xS':
            // 3-factor with double-weighted sales factor
            apportionment = (property + payroll + 2 * sales) / 4;
            break;
        case '3F':
            apportionment = (property + payroll + sales) / 3;
            break;
        default:
            break;
    }
    set_number2input('total_apprt_factor-' + state_name, apportionment, '%', 4);
}

function grab_input_values() {
    // Grab all active states from the table.
    let active_states = get_active_states_from_header();
    // Add 'BSPL' to active states
    active_states.push('BSPL');

    let attributes_ = [
        `building_beginning`,
        `building_ending`,
        `machinery_beginning`,
        `machinery_ending`,
        `vehicles_beginning`,
        `vehicles_ending`,
        `tools_beginning`,
        `tools_ending`,
        `real-property`,
        `lease_property`,
        `payroll_salary`,
        `payroll_overtime`,
        `payroll_incentive_pay`,
        `payroll_bonus`,
        `payroll_provisions_bonus`,
        `sales_sales`,
        `sales_interest_income`,
        `sales_gain_sales`,
        `sales_gain_current`,
        `sales_lease_income`,
        `sales_other_income`,
        'total_sales',
    ]

    let factors_apportionments = {};
    $.each(active_states, function (index, state_name) {
        let apprt_factor = grab_input2number(`total_apprt_factor-${state_name}`);
        factors_apportionments[`state_apportionment_${state_name}`] = apprt_factor;
        $.each(attributes_, function(idx, attribute) {
            let class_name_ = attribute + '-' + state_name;
            factors_apportionments[class_name_] = grab_input2number(class_name_);
        })
    });

    // Also save TrialBalance IDs, <button data-trial-balances="">
    $.each(attributes_, function(idx, attribute) {
        let tb_ids = $('#' + attribute).attr('data-trial-balances');
        factors_apportionments[attribute + '_tb_ids'] = tb_ids;
    })

    // Remove "BSPL" when saving.
    active_states.pop();
    factors_apportionments['active_states'] = active_states;
    return factors_apportionments
}

function save_state_apportionment() {
    $.ajax( {
        data: {'payload': JSON.stringify(grab_input_values())},
        type: 'POST',
        url: '/apportionment/save'
    }).done(function(data) {
        if (data.error) {
            console.log('Error while saving state apportionment data.');
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved');
        }
    });
}