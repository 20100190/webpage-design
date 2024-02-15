function update_nol() {
    let filing_states = grab_filing_states();
    let filing_year = parseInt($('select#filing-year').find('option:selected').text());
    let filing_year_prev = filing_year - 1;

    // Count the number of rows
    let table_fed = $('#data-table-worksheet-FED tbody').find('tr');
    let num_years = table_fed.length - 2;
    let years_h = range(filing_year - num_years, filing_year);      // columns
    let years_v = range(filing_year - num_years, filing_year);      // rows
    let year_init = years_v[0];
    let year_end = years_v.slice(-1)[0]; // need this value throughout the year_v loop.

    // Calculate NOL from top, year_v
    // year_v: year that income / loss is generated.
    // for each filing state: FED, CA, ...
    $.each(filing_states,function(idx_s, filing_state) {
        $.each(years_v, function (idx_v, year_v) {
            let loss_cy = grab_input2number('loss-' + year_v + '-' + filing_state);
            let income_current = grab_input2number('income-' + year_v + '-' + filing_state);
            if (isNaN(loss_cy)) {
                loss_cy = 0.0;
                set_number2input('loss-' + year_v + '-' + filing_state, 0, '');
            }
            if (isNaN(income_current)) {
                income_current = 0.0;
                set_number2input('income-' + year_v + '-' + filing_state, 0, '');
            }

            if (loss_cy < 0) {
                // Nothing to do here; you have a net operating loss.
                return;
            }

            // A positive income was generated.
            // Copy the value to the loss and sum with the previous balance(s)
            // from right (2016) to left (2021)
            let years_h_ = range(year_v, filing_year)
            $.each(years_h_, function (idx_h, year_h) {
                let cell_class = 'balance-' + year_v + '-' + year_h + '-' + filing_state;
                set_number2input(cell_class, loss_cy, '');
            });

            if (idx_v === 0) {
                return;
            }

            let income_utilizable = income_current;
            let year_v_prev = year_v - 1;   // 2017, the immediate right column wrt 2018.

            // Initialize all utilized cells with 0
            $.each(range(year_init, year_v), function(idx_h, year_h_) {
                let class_name = 'utilized-' + year_h_ + '-' + year_v + '-' + filing_state;
                set_number2input(class_name, 0, '', undefined, ['manual']);
            });

            $.each(range(year_init, year_v - 1), function(idx_h, year_h) {
                // Apply the 80% rule.
                // TODO: verify if this condition works for year_v after 2022 and forward.
                if ((year_v > 2020) && (filing_state === 'FED')) {
                    let nol_rate = year_h < 2018 ? 1.0 : 0.80;
                    let utilized_pre_2018 = 0;
                    $.each(range(year_init, year_v), function(idx_x, year_x) {
                        let class_name = 'utilized-' + year_x + '-' + year_v + '-' + filing_state;
                        utilized_pre_2018 += grab_input2number(class_name);
                    });
                    income_utilizable = nol_rate * income_current - utilized_pre_2018;
                }

                if (income_utilizable < 0) {
                    return false;
                }

                let balance_prev_selector = 'balance-' + year_h + '-' + year_v_prev + '-' + filing_state;
                let balance_prev = grab_input2number(balance_prev_selector); // balance(2017, 2016)
                let manual_input_selector = 'utilized-' + year_h + '-' + year_v + '-' + filing_state + '.manual';
                let utilized_now = (grab_input2string(manual_input_selector) === '')
                    ? Math.min(income_utilizable, balance_prev)
                    : Math.min(grab_input2number(manual_input_selector), balance_prev);
                let balance_now = Math.max(0, balance_prev - utilized_now);

                let utilized_now_selector = 'utilized-' + year_h + '-' + year_v + '-' + filing_state;
                set_number2input(utilized_now_selector, utilized_now,
                    '', undefined, ['manual']);
                $.each(range(year_v, year_end), function(idx_h, year_h_) {
                    let balance_now_selector = 'balance-' + year_h + '-' + year_h_ + '-' + filing_state;
                    set_number2input(balance_now_selector, balance_now, '');
                });

                income_utilizable -= utilized_now;
            });
        });

        // Set NOL CY Ending Balance after all calculations are complete.
        $.each(years_v, function (idx_v, year_v) {
            // finally set NOL CY ending balance at end of the horizontal loop.
            let nol_cy = grab_input2number('balance-' + year_v + '-' + year_end + '-' + filing_state);
            set_number2input('nol-' + year_v + '-' + filing_state, nol_cy, '');
        });

        // Calculate Total: Income generated, Loss incurred
        $.each(filing_states, function (idx_s, filing_state) {
            let loss_total = 0;
            let nol_total = 0;
            $.each(years_v, function (idx_v, year_v) {
                loss_total += grab_input2number('loss-' + year_v + '-' + filing_state);
                nol_total += grab_input2number('nol-' + year_v + '-' + filing_state);
            });
            set_number2input('loss-total-' + filing_state, loss_total, '');
            set_number2input('nol-total-' + filing_state, nol_total, '');
        });

        // Calculate Total: Utilized & Balance
        $.each(filing_states, function (idx_s, filing_state) {
            $.each(years_h, function (idx_h, year_h) {
                let utilized_total = 0;
                let balance_total = 0;
                $.each(years_v, function (idx_v, year_v) {
                    utilized_total += grab_input2number('utilized-' + year_v + '-' + year_h + '-' + filing_state);
                    balance_total += grab_input2number('balance-' + year_v + '-' + year_h + '-' + filing_state);
                });
                set_number2input('utilized-total--' + year_h + '-' + filing_state, utilized_total, '');
                set_number2input('balance-total--' + year_h + '-' + filing_state, balance_total, '');
            });
        });
    });

    // Finally set Federal NOL CY/PY, State NOL CY/PY
    let nol_fed_cy = grab_input2number('balance-total--' + filing_year + '-FED');
    let nol_fed_py = grab_input2number('balance-total--' + filing_year_prev + '-FED');
    let nol_state_cy = 0;
    let nol_state_py = 0;
    $.each(filing_states, function(idx_s, filing_state) {
        if (filing_state !== 'FED') {
            let nol_cy = grab_input2number('balance-total--' + filing_year + '-' + filing_state);
            nol_state_cy += nol_cy;
            let nol_py = grab_input2number('balance-total--' + filing_year_prev + '-' + filing_state);
            nol_state_py += nol_py;
        }
    });
    set_number2input('federal-cy', nol_fed_cy, '');
    set_number2input('federal-py', nol_fed_py, '');
    set_number2input('state-cy', nol_state_cy, '');
    set_number2input('state-py', nol_state_py, '');
}

function grab_filing_states() {
    let filing_states = []
    $('.filing-state').each(function() {
        let state_ = $(this).text().split(" ")[0];
        filing_states.push(state_);
    })
    return filing_states;
}

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

function save_nol() {
    $.ajax( {
        data: grab_nol_input_values(),
        type: 'POST',
        url: '/nol/save'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved.');
        }
    });
}

function grab_nol_input_values() {
    // Saves only <input>, which are editable.
    let filing_states = grab_filing_states();
    let filing_year = parseInt($('select#filing-year').find('option:selected').text());

    // number of rows
    let table_fed = $('#data-table-worksheet-FED tbody').find('tr');
    let num_years = table_fed.length - 2;
    let years_h = range(filing_year - num_years, filing_year);
    let years_v = range(filing_year - num_years, filing_year);

    let payload = {};
    // Loop through
    // (1) filing states
    // (2) year, vertical
    // (3) year, horizontal + income + loss
    $.each(filing_states, function(idx_s, filing_state) {
        $.each(years_v, function(idx_v, year_v) {
            let key_income = 'income-' + year_v + '-' + filing_state;
            let key_loss = 'loss-' + year_v + '-' + filing_state;
            let income_ = grab_input2number(key_income);
            let loss_ = grab_input2number(key_loss);
            payload[key_income] = income_;
            payload[key_loss] = loss_;

            $.each(years_h, function(idx_h, year_h) {
                let key_util = 'utilized-' + year_v + '-' + year_h + '-' + filing_state;
                let util_ = grab_input2number(key_util);
                payload[key_util] = util_;
            });

            // Available NOL = the ending balance of the previous tax year
            let key_available_nol = 'balance-total--' + year_v + '-' + filing_state;
            payload[key_available_nol] = grab_input2number(key_available_nol);
            let key_utilized_nol = 'utilized-total--' + year_v + '-' + filing_state;
            payload[key_utilized_nol] = grab_input2number(key_utilized_nol);
        });

        // total ending balance for each state and FED.
        let key_ending_balance = 'nol-total-' + filing_state;
        let ending_balance = grab_input2number(key_ending_balance);
        payload[key_ending_balance] = ending_balance;
    });

    // Federal & Total State NOL (to be used with 5.2)
    payload['federal-cy'] = grab_input2number('federal-cy');
    payload['state-cy'] = grab_input2number('state-cy');
    return payload;
}

function check_income_loss_input_boxes() {
    let filing_states = grab_filing_states();
    let filing_year = parseInt($('select#filing-year').find('option:selected').text());
    let table_fed = $('#data-table-worksheet-FED tbody').find('tr');
    let num_years = table_fed.length - 2;
    let years_v = range(filing_year - num_years, filing_year);

    $.each(filing_states,function(idx_s, filing_state) {
        $.each(years_v, function (idx_v, year_v) {
            let income_cy = grab_input2number('income-' + year_v + '-' + filing_state);
            let loss_cy = grab_input2number('loss-' + year_v + '-' + filing_state);

            if (income_cy < 0) {
                set_number2input('income-' + year_v + '-' +filing_state, Math.abs(loss_cy), '');
            }

            if (loss_cy < 0) {
                set_number2input('loss-' + year_v + '-' +filing_state, Math.abs(loss_cy), '');
            }

            if (income_cy * loss_cy === 0) {
                // do nothing
                $('.' + 'income-' + year_v + '-' + filing_state).css({'background-color': '#e0f7fa'});
                $('.' + 'loss-' + year_v + '-' + filing_state).css({'background-color': '#e0f7fa'});
            } else {
                toastr.error('Either income or loss must be zero.');
                $('.' + 'income-' + year_v + '-' + filing_state).css({'background-color': '#f8bbd0'});
                $('.' + 'loss-' + year_v + '-' + filing_state).css({'background-color': '#f8bbd0'});
            }
        });
    });
}

function append_col_row_years(data) {
    let nol_state_years_map = data.nol_state_years_map;

    // Add a new column and row with respect to the current filing year.
    let filing_year = parseInt($('select#filing-year').find('option:selected').text());
    let table_fed = $('#data-table-worksheet-FED tbody').find('tr');
    let num_years = table_fed.length - 2;
    let years_v = range(filing_year - num_years, filing_year);
    let new_year = filing_year - num_years - 1;
    let filing_states = grab_filing_states();

    $.each(filing_states, function(idx_y, filing_state) {
        // Add new row first.
        let new_row = '<tr><td class="incurred-date-' + new_year + '-' + filing_state + '">9/30/' + new_year + '</td>';
        if (nol_state_years_map[filing_state] == 0) {
            new_row += '<td class="expiring-date-' + new_year + '-' + filing_state + '">N/A</td>';
        } else {
            new_row += '<td class="expiring-date-' +  new_year + '-' + filing_state + '">9/30/' + new_year + '</td>';
        }
        new_row += '<td class="tax-year">' + new_year + '</td>';
        new_row += '<td><input class="income-' +  new_year + '-' + filing_state + ' number" value="0"></td>';
        new_row += '<td><input class="loss-' +  new_year + '-' + filing_state + ' number" value="0"></td>';
        new_row += '<td><input class="nol-' + new_year + '-' + filing_state + ' number" value="0" readonly></td>';

        $.each(years_v, function(idx, year_col) {
            let year_class = filing_year - idx;
            new_row += '<td><input class="utilized-' + new_year + '-' + year_class + '-' + filing_state  + ' utilized number" value="0"></td>';
            new_row += '<td><input class="balance-' + new_year+ '-' + year_class + '-' + filing_state + ' number" value="0" readonly></td>';
        });
        new_row += '</tr>';
        $('#data-table-worksheet-' + filing_state + ' tbody tr').eq(0).before(new_row);

        // Then, add two columns at once.
        $('#data-table-worksheet-' + filing_state + ' thead').find('tr').each(function(index, row) {
            if (index === 0) {
                $(row).append('<th colspan="2">' + new_year + '</th>')
            } else {
                $(row).append('<th>Utilized</th><th>Balance</th>')
            }
        });

        $('#data-table-worksheet-' + filing_state + ' tbody').find('tr').each(function(index, row) {
            if (index === 0) {
                let row_ = '';
                row_ += '<td><input class="utilized-' + new_year + '-' + new_year + '-' + filing_state  + ' utilized number" value="0"></td>';
                row_ += '<td><input class="balance-' + new_year+ '-' + new_year + '-' + filing_state + ' number" value="0" readonly></td>';
                $(row).append(row_);
            } else if (index === table_fed.length) {
                let row_ = '';
                row_ += '<td><input class="utilized-total--'+ new_year + '-' + filing_state + ' number" value="0" readOnly></td>';
                row_ += '<td><input class="balance-total--' + new_year + '-' + filing_state + ' number" value="0" readOnly></td>';
                $(row).append(row_);
            } else {
                $(row).append('<td class="light-gray"></td><td class="light-gray"></td>')
            }
        });
    });
}

function reduce_col_row_years() {
    let num_rows = $('#data-table-worksheet-FED tbody').find('tr').length - 1;
    if (num_rows < 2) {
        return;
    }

    let filing_states = grab_filing_states();
    $.each(filing_states, function(idx_y, filing_state) {
        // Remove the last two columns.
        let num_columns = $('#data-table-worksheet-' + filing_state + ' tbody').find('tr:first td').length - 1;
        let idx_nex = num_columns - 1;
        $('#data-table-worksheet-' + filing_state).find('tr').each(function(idx, tr) {
            $(this).find('td:eq(' + num_columns + ')').remove();
            $(this).find('td:eq(' + idx_nex + ')').remove();

            if (idx === 0) {
                $(this).find('th:last-child').remove();
            } else if (idx === 1) {
                $(this).find('th:last-child').remove();
                $(this).find('th:last-child').remove();
            }
        })

        // Remove the first row.
        $('#data-table-worksheet-' + filing_state + ' tbody').find('tr:eq(0)').remove();
    });
}

function mark_manual_input(element) {
    // If income or loss input, reset "manual" classes
    for (const c of element.classList) {
        if (c.startsWith("income-") || c.startsWith("loss-")) {
            $("input.utilized").removeClass("manual");
            return;
        }
    }
    // If utilized input is updated, set "manual" class
    if (element.classList.contains("utilized")) {
        if (!element.classList.contains("manual")) {
            element.classList.add("manual");
        }
        // If the input value is negative, overwrite this utilized value with 0
        if (parseFloat(element.value) < 0) {
            element.value = 0;
        }
        // If the balance value right next to this is 0, overwrite this utilized value with 0
        let utilized_class = Array.from(element.classList.entries()).find(function(e) {
            return e[1].startsWith("utilized-")
        })[1];
        let balance_value = parseFloat($("." + utilized_class.replace("utilized-", "balance-"))[0].value)
        if (balance_value === 0 || isNaN(balance_value)) {
            element.value = 0;
        }
    }
}

function verify_nol() {
    let filing_year = parseInt($('select#filing-year').find('option:selected').text());
    set_number2input('pre2018nol-utilization-rate number', 100, '%');
    set_number2input('post2018nol-utilization-rate number', 80, '%');

    // Taxable Income x Utilization rate: E19 (2020 income generated)
    let taxable_income = grab_input2number('income-' + filing_year + '-FED');
    set_number2input('taxable-income-utilization-rate', taxable_income, '');

    // Previous NOL Balance, Pre 2018: M16 (2019-2017 balance)
    let prev_year = filing_year - 1;
    let prev_nol_pre_2018 = grab_input2number('balance-2017-' + prev_year + '-FED');
    set_number2input('pre2018nol-previous-nol-balance', prev_nol_pre_2018, '');

    // Previous NOL Balance, Post 2018
    let prev_nol_post_2018 = grab_input2number('balance-2018-' + prev_year + '-FED');
    set_number2input('post2018nol-previous-nol-balance', prev_nol_post_2018, '');

    // Maximum Utilization, Taxable Income
    let max_util_taxable_income = 0.80 * taxable_income;
    set_number2input('taxable-income-maximum-utilization', max_util_taxable_income, '');

    // Maximum Utilization, Pre 2018 NOL
    let max_util_pre_2018 = Math.min(taxable_income, prev_nol_pre_2018);
    set_number2input('pre2018nol-income-maximum-utilization', max_util_pre_2018, '');

    // Maximum Utilization, Post 2018 NOL
    let max_util_post_2018 = 0.0;
    if (max_util_pre_2018 < max_util_taxable_income) {
        max_util_post_2018 = Math.min(max_util_taxable_income - max_util_pre_2018, prev_nol_post_2018);
    }
    set_number2input('post2018nol-income-maximum-utilization', max_util_post_2018, '');

    // Outstanding, Pre 2018
    let outstanding_pre2018 = prev_nol_pre_2018 - max_util_pre_2018;
    set_number2input('pre2018nol-income-outstanding', outstanding_pre2018, '');

    // Outstanding, Post 2018
    let outstanding_post2018 = prev_nol_post_2018 - max_util_post_2018;
    set_number2input('post2018nol-income-outstanding', outstanding_post2018, '');

    // Outstanding, total
    let outstanding_total = outstanding_pre2018 + outstanding_post2018;
    set_number2input('total-outstanding', outstanding_total, '');
}