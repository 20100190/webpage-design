function load_rfd_table() {
    $.ajax({
        data: {},
        type: 'GET',
        url: '/rfd/load'    // TODO: get formula and <input> data.
    }).done(function(data) {
        if (data.error) {
            toastr.error('Failed to load RFD. Please try again later.')
            console.log('Error: ' + data.error);
        } else {
            load_rfd_user_input_data(data.rfd_payload);
            update_rfd_table(data.rfd_payload.structure);
        }
    });
}

function update_rfd_table(table_structure) {
    calculate_rfd_totals(table_structure);
    calculate_error_check_column(table_structure);
}

function load_rfd_user_input_data(rfd_payload) {
    // Load user-input rows and columns.
    let table_structure = rfd_payload['structure'];
    let table_body = rfd_payload["body"];

    let num_new_cols_aje = table_structure['num_new_cols_aje'];
    let num_new_cols_pre_prov = table_structure['num_new_cols_pre_prov'];
    let num_new_cols_cy_ended = table_structure['num_new_cols_cy_ended'];
    if (num_new_cols_aje === 0) {
        return;
    }

    let extra_columns_aje = range(1, num_new_cols_aje);
    let extra_columns_pre_prov = range(1, num_new_cols_pre_prov);
    let extra_columns_cy_ended = range(1, num_new_cols_cy_ended);

    let tags = [
        string2tag("Prior Year Ended"),
        string2tag(""),
        string2tag(""),
        // string2tag("Entries Made by Client Pre-Adj"),
        string2tag("Extension payments"),
        string2tag("Estimate payments"),
        string2tag("Provision booked by client"),
        string2tag("Prior period payments"),
        string2tag("Tax Refund"),
        string2tag("Pre-Provision Adj GL"),
        string2tag("Per Preliminary GL"),
        string2tag(""),
        string2tag(""),
        // string2tag("Proposed Entries"),
        string2tag("PY true-up"),
        string2tag("CY Tax Provision"),
        string2tag("Penalty and interest"),
        string2tag("Reversal of Client's JE"),
        string2tag("Change in (DTA) DTL"),
        string2tag("Current Year Ended"),
        string2tag("Should be"),
        string2tag("Difference"),
    ];

    // Need to insert rows and columns
    // table 1
    // tbody, #TODO: get unique row names > name2tag().
    $.each(extra_columns_aje, function (idx_e, column_number) {
        // add a new column between interest and cash.
        let num_columns_h1 = $("#data-table > thead").find("tr:first th").length;
        let num_columns_h2 = $("#data-table > thead").find("tr:last th").length;
        let num_columns_bd = $("#data-table > tbody").find("tr:first td").length;

        $('#data-table > tbody').find('tr').each(function(index, row) {
            let class_name = tags[index] + '-c-' + column_number;
            let value_ = table_body[class_name]
            if (value_ === undefined) {
                value_ = 0;
            }

            if ([0, 3, 4, 5, 6, 7, 12, 13, 15, 16].includes(index)) {
                let new_cell = '<td><input class="number ' + class_name + '" value="' + value_ + '"></td>';
                $(row).find('td').eq(num_columns_bd - 3).after(new_cell);
            } else if ([8, 9, 14, 17, 18, 19].includes(index)) {
                let new_cell = '<td><input class="number ' + class_name + '" value="' + value_ + '" readonly></td>';
                $(row).find('td').eq(num_columns_bd - 3).after(new_cell);
            } else {
                $(row).find('td').eq(num_columns_bd - 3).after('<td></td>');
            }
        });

        // Header 1
        $('#data-table > thead').find('tr:first').each(function(index, row) {
            let class_name = 'header-c-' + column_number;
            let value_ = rfd_payload["header"][class_name]
            let new_cell_th1 = '<th><input class="string ' + class_name + '" value="' + value_ + '"></th>'
            $(row).find('th').eq(num_columns_h1 - 3).after(new_cell_th1);
        })

        // Header 2
        let new_cell_th2 = '<th></th>';
        $('#data-table > thead').find('tr:last').each(function(index, row) {
            $(row).find('th').eq(num_columns_h2 - 3).after(new_cell_th2);
        })
    });

    // Insert Pre-Prov extra rows
    let range_cols_beg = range(0, 15);  // [index] - Interest
    let range_cols_end = range(16, 17); // cash, error
    let range_cols_extra = range(1, num_new_cols_aje);
    $.each(extra_columns_pre_prov, function(idx_p, row_number) {
        // Middle
        let row_html_extra = '';
        $.each(range_cols_extra, function(idx_e, col_num_e) {
            let cell_number = 100 + col_num_e;
            let class_name = 'pre-prov-' + row_number + '-c-' + cell_number;
            let value = table_body[class_name];
            row_html_extra += '<td><input class="number ' + class_name + '" value="' + value + '" ></td>'
        })

        let row_html_beg = '';
        $.each(range_cols_beg, function(idx_c, col_num) {
            let class_name = 'pre-prov-' + row_number + '-c-' + col_num;
            let value = table_body[class_name];
            if (col_num === 0) {    // row header
                row_html_beg += '<td><input class="string ' + class_name + '" value="' + value + '" ></td>';
            } else if ([3, 6, 9, 12].includes(col_num)) {　// readonly, subtotal
                row_html_beg += '<td><input class="number ' + class_name + '" value="' + value  + '" readonly ></td>'
            } else if ([1,2, 4,5, 7,8, 10,11, 13,14,15].includes(col_num)) {　// user input
                row_html_beg += '<td><input class="number ' + class_name + '" value="' + value + '" ></td>'
            }
        });

        let row_html_end = '';
        $.each(range_cols_end, function(idx_c, col_num) {
            let class_name = 'pre-prov-' + row_number + '-c-' + col_num;
            let value = table_body[class_name];
            if (col_num === 16) {    // row header
                row_html_end += '<td><input class="number ' + class_name + '" value="' + value + '" ></td>';
            } else if (col_num === 17) {
                row_html_end += '<td><input class="number ' + class_name + '" value="' + value + '" readonly ></td>'
            }
        });

        let row_html = '<tr>' + row_html_beg + row_html_extra + row_html_end + '</tr>';
        $('#pre-prov-add').closest('tr').before(row_html);
    });

    // Insert CY-Ended extra rows
    $.each(extra_columns_cy_ended, function(idx_c, row_number) {
        // Middle
        let row_html_extra = '';
        $.each(range_cols_extra, function(idx_e, col_num_e) {
            let cell_number = 100 + col_num_e;
            let class_name = 'cy-ended-' + row_number + '-c-' + cell_number;
            let value = table_body[class_name];
            row_html_extra += '<td><input class="number ' + class_name + '" value="' + value + '" ></td>'
        })

        let row_html_beg = '';
        $.each(range_cols_beg, function(idx_c, col_num) {
            let class_name = 'cy-ended-' + row_number + '-c-' + col_num;
            let value = table_body[class_name];
            if (col_num === 0) {    // row header
                row_html_beg += '<td><input class="string ' + class_name + '" value="' + value + '" ></td>';
            } else if ([3, 6, 9, 12].includes(col_num)) {　// readonly, subtotal
                row_html_beg += '<td><input class="number ' + class_name + '" value="' + value  + '" readonly ></td>'
            } else if ([1,2, 4,5, 7,8, 10,11, 13,14,15].includes(col_num)) {　// user input
                row_html_beg += '<td><input class="number ' + class_name + '" value="' + value + '" ></td>'
            }
        });

        let row_html_end = '';
        $.each(range_cols_end, function(idx_c, col_num) {
            let class_name = 'cy-ended-' + row_number + '-c-' + col_num;
            let value = table_body[class_name];
            if (col_num === 16) {    // row header
                row_html_end += '<td><input class="number ' + class_name + '" value="' + value + '" ></td>';
            } else if (col_num === 17) {
                row_html_end += '<td><input class="number ' + class_name + '" value="' + value + '" readonly ></td>'
            }
        });

        let row_html = '<tr>' + row_html_beg + row_html_extra + row_html_end + '</tr>';
        $('#cy-ended-add').closest('tr').before(row_html);
    });

    // AJE Table
    $.ajax({
        data: {},
        type: 'GET',
        url: '/trial_balance/accounts'    // TODO: get formula and <input> data.
    }).done(function(data) {
        if (data.error) {
            console.log('Error');
        } else {
            $.each(extra_columns_aje, function (idx_e, column_number) {
                // Calculate the number of rows in the table each iteration.
                let aje_num_rows = $("#data-table-aje > tbody").find("tr").length;

                let value0 = rfd_payload['aje']['aje-account-name-' + column_number];
                let value1 = rfd_payload['aje']['aje-tb-act-' + column_number];
                let value2 = rfd_payload['aje']['aje-should-be-' + column_number];
                let value3 = rfd_payload['aje']['aje-per-book-' + column_number];
                let value4 = rfd_payload['aje']['aje-adjustment-' + column_number];

                // TB account list
                let account_list = data["tb_account_list"].sort();
                let cell1 = '<select class="aje-account-name-' + column_number + '">';
                $.each(account_list, function (index, account) {
                    if (account === value0) {
                        cell1 += '<option value="' + account + '" selected>' + account + '</option>';
                    } else {
                        cell1 += '<option value="' + account + '">' + account + '</option>';
                    }
                });
                cell1 += '</select>';
                let row = '<tr><td class="string" style="min-width: 180px">' + cell1 + '</td>';
                row += '<td><input class="string aje-tb-act-' + column_number + '" value="'+ value1 +'" readonly></td>';
                row += '<td><input class="number aje-should-be-' + column_number + '" value="'+ value2 +'" readonly></td>';
                row += '<td><input class="number aje-per-book-' + column_number + '" value="'+ value3 +'" readonly></td>';
                row += '<td><input class="number aje-adjustment-' + column_number + '" value="'+ value4 +'"></td></tr>';
                $('#data-table-aje > tbody > tr').eq(aje_num_rows - 1).before(row);
            });
        }
    });
}

function calculate_rfd_totals(table_structure) {
    // Calculate totals
    // (1) Top, 1st half: Pre-Provision Adj GL
    // (2) Top, 2nd half: Current year ended
    // (3) Top, Calculate the differences: Current Year Ended - Should be
    // (4) AJE: (To provide for current and deferred provision), aje-total-[2,3,4]

    let num_new_cols_aje = table_structure['num_new_cols_aje'];
    let num_new_cols_pre_prov = table_structure['num_new_cols_pre_prov'];
    let num_new_cols_cy_ended = table_structure['num_new_cols_cy_ended'];

    // TODO: also calculate cy-ended-c-{i}-{j}, pre-prov-c-{i}-{j}
    let rows_1 = [
        string2tag("Prior Year Ended"),
        string2tag(""),
        string2tag("Entries Made by Client Pre-Adj"),
        string2tag("Extension payments"),
        string2tag("Estimate payments"),
        string2tag("Provision booked by client"),
        string2tag("Prior period payments"),
        string2tag("Tax Refund"),
    ];

    // (1) Pre-Provision Adj GL (1st half of the table)
    let columns_index = range(1, 16);
    let pre_prov_adj_gl_values = [];
    $.each(columns_index, function (idx_c, col_index) {
        let pre_prov_adj_gl = 0
        $.each(rows_1, function (idx1, row) {
            let val_ = grab_input2number(row + '-' + col_index);
            pre_prov_adj_gl += val_;
        })

        if (num_new_cols_pre_prov > 0) {
            let rows_pre_prov = range(1, num_new_cols_pre_prov);
            $.each(rows_pre_prov, function (idx1_e, row_e) {
                let val_ = grab_input2number('pre-prov-' + row_e + '-c-' + col_index);
                pre_prov_adj_gl += val_;
            });
        }

        let class_name = string2tag("Pre-Provision Adj GL");
        pre_prov_adj_gl_values.push(pre_prov_adj_gl);
        set_number2input(class_name + '-' + col_index, pre_prov_adj_gl, '');
    });

    // (1)' Pre-Provision Adj GL (1st half of the table), custom columns
    if (num_new_cols_aje > 0) {
        let extra_columns = range(1, num_new_cols_aje);
        $.each(extra_columns, function (idx_c, col_index) {
            let pre_prov_adj_gl = 0
            $.each(rows_1, function (idx1, row) {
                let val_ = grab_input2number(row + '-c-' + col_index);
                pre_prov_adj_gl += val_;
            })

            if (num_new_cols_pre_prov > 0) {
                let rows_pre_prov = range(1, num_new_cols_pre_prov);
                $.each(rows_pre_prov, function (idx1_e, row_e) {
                    let col_e = 100 + col_index;
                    let val_ = grab_input2number('pre-prov-' + row_e + '-c-' + col_e);
                    pre_prov_adj_gl += val_;
                });
            }

            let class_name = string2tag("Pre-Provision Adj GL");
            pre_prov_adj_gl_values.push(pre_prov_adj_gl);
            set_number2input(class_name + '-c-' + col_index, pre_prov_adj_gl, '');
        });
    }

    // (2) Current Year Ended (2nd half of the table)
    let rows_2 = [
        string2tag("PY true-up"),
        string2tag("CY Tax Provision"),
        string2tag("Penalty and interest"),
        string2tag("Reversal of Client's JE"),
        string2tag("Change in (DTA) DTL"),
    ];

    $.each(columns_index, function (idx_c, col_index) {
        let current_year_ended = pre_prov_adj_gl_values[idx_c];
        $.each(rows_2, function (idx2, row) {
            let val_ = grab_input2number(row + '-' + col_index);
            current_year_ended += val_;
        });

        if (num_new_cols_cy_ended > 0) {
            let rows_cy_ended = range(1, num_new_cols_cy_ended);
            $.each(rows_cy_ended, function (idx1_e, row_e) {
                let val_ = grab_input2number('cy-ended-' + row_e + '-c-' + col_index);
                current_year_ended += val_;
            });
        }

        let class_name = string2tag("Current Year Ended");
        set_number2input(class_name + '-' + col_index, current_year_ended, '');
    });

    // (2)' Current Year Ended (2nd half of the table), custom columns
    if (num_new_cols_aje > 0) {
        let extra_columns = range(1, num_new_cols_aje);
        $.each(extra_columns, function (idx_c, col_index) {
            let current_year_ended = 0;
            $.each(rows_2, function (idx2, row) {
                let val_ = grab_input2number(row + '-c-' + col_index);
                current_year_ended += val_;
            });

            if (num_new_cols_cy_ended > 0) {
                let rows_cy_ended = range(1, num_new_cols_cy_ended);
                $.each(rows_cy_ended, function (idx1_e, row_e) {
                    let col_e = 100 + col_index;
                    let val_ = grab_input2number('cy-ended-' + row_e + '-c-' + col_e);
                    current_year_ended += val_;
                });
            }

            let class_name = string2tag("Current Year Ended");
            set_number2input(class_name + '-c-' + col_index, current_year_ended, '');
        });
    }

    // (3) Calculate the differences: Current Year Ended - Should be
    $.each(columns_index, function (idx_c, col_index) {
        let current_year_ended = grab_input2number('current-year-ended-' + idx_c);
        let should_be = grab_input2number('should-be-' + idx_c);
        let diff = current_year_ended - should_be;
        set_number2input('difference-' + idx_c, diff, '');
    });

    // (3)' Calculate the differences: Current Year Ended - Should be
    if (num_new_cols_aje > 0) {
        let extra_columns = range(1, num_new_cols_aje);
        $.each(extra_columns, function (idx_c, col_index) {
            let current_year_ended = grab_input2number('current-year-ended-c-' + col_index);
            let should_be = grab_input2number('should-be-c-' + col_index);
            let diff = current_year_ended - should_be;
            set_number2input('difference-c-' + col_index, diff, '');
        });
    }

    // Calculate Total: column 3, 6, 9, 12 for pre-prov-* and cy-ended-* rows
    if (num_new_cols_pre_prov > 0) {
        let rows_pre_prov = range(1, num_new_cols_pre_prov);
        $.each(rows_pre_prov, function (idx1_e, row_e) {
            let v1 = grab_input2number('pre-prov-' + row_e + '-c-1');
            let v2 = grab_input2number('pre-prov-' + row_e + '-c-2');
            set_number2input('pre-prov-' + row_e + '-c-3', v1 + v2, '');

            let v4 = grab_input2number('pre-prov-' + row_e + '-c-4');
            let v5 = grab_input2number('pre-prov-' + row_e + '-c-5');
            set_number2input('pre-prov-' + row_e + '-c-6', v4 + v5, '');

            let v7 = grab_input2number('pre-prov-' + row_e + '-c-7');
            let v8 = grab_input2number('pre-prov-' + row_e + '-c-8');
            set_number2input('pre-prov-' + row_e + '-c-9', v7 + v8, '');

            let v10 = grab_input2number('pre-prov-' + row_e + '-c-10');
            let v11 = grab_input2number('pre-prov-' + row_e + '-c-11');
            set_number2input('pre-prov-' + row_e + '-c-12', v10 + v11, '');
        });
    }

    if (num_new_cols_cy_ended > 0) {
        let rows_cy_ended = range(1, num_new_cols_cy_ended);
        $.each(rows_cy_ended, function (idx1_e, row_e) {
            let v1 = grab_input2number('cy-ended-' + row_e + '-c-1');
            let v2 = grab_input2number('cy-ended-' + row_e + '-c-2');
            set_number2input('cy-ended-' + row_e + '-c-3', v1 + v2, '');

            let v4 = grab_input2number('cy-ended-' + row_e + '-c-4');
            let v5 = grab_input2number('cy-ended-' + row_e + '-c-5');
            set_number2input('cy-ended-' + row_e + '-c-6', v4 + v5, '');

            let v7 = grab_input2number('cy-ended-' + row_e + '-c-7');
            let v8 = grab_input2number('cy-ended-' + row_e + '-c-8');
            set_number2input('cy-ended-' + row_e + '-c-9', v7 + v8, '');

            let v10 = grab_input2number('cy-ended-' + row_e + '-c-10');
            let v11 = grab_input2number('cy-ended-' + row_e + '-c-11');
            set_number2input('cy-ended-' + row_e + '-c-12', v10 + v11, '');
        });
    }


    // (4) AJE Table
    let should_be = 0;
    let per_book = 0;
    let adjustment = 0;
    let len = $('#data-table-aje tbody tr').length;
    $('#data-table-aje tbody tr').each(function(idx) {
        if (idx < len - 1) {
            let v0 = str2number($(this).find('input:eq(0)').val());
            let v1 = str2number($(this).find('input:eq(1)').val());
            let v2 = str2number($(this).find('input:eq(2)').val());
            should_be += v0;
            per_book += v1;
            adjustment += v2;
        }
    });

    if (num_new_cols_aje > 0) {
        let extra_columns = range(1, num_new_cols_aje);
        $.each(extra_columns, function(idx_c, col_index) {
            let should_be_ex = grab_input2number('aje-should-be-' + col_index);
            let per_book_ex = grab_input2number('aje-per-book-' + col_index);
            let adjustment_ex = grab_input2number('aje-adjustment-' + col_index);
            should_be += should_be_ex;
            per_book += per_book_ex;
            adjustment += adjustment_ex;
        });
    }

    set_number2input('aje-total-2', should_be, '');
    set_number2input('aje-total-3', per_book, '');
    set_number2input('aje-total-4', adjustment, '');
}

function calculate_error_check_column(table_structure) {
    // Calculates the Error column (index 17)
    let num_new_cols_aje = table_structure['num_new_cols_aje'];
    let num_new_cols_pre_prov = table_structure['num_new_cols_pre_prov'];
    let num_new_cols_cy_ended = table_structure['num_new_cols_cy_ended'];

    let rows = [
        string2tag("Extension payments"),
        string2tag("Estimate payments"),
        string2tag("Provision booked by client"),
        string2tag("Prior period payments"),
        string2tag("Tax Refund"),
        string2tag("PY true-up"),
        string2tag("CY Tax Provision"),
        string2tag("Penalty and interest"),
        string2tag("Reversal of Client's JE"),
        string2tag("Change in (DTA) DTL"),
    ];

    // Default rows
    let column_indices = [3, 6, 9, 12, 13, 14, 15, 16];
    $.each(rows, function(idx_r, row) {
        let error_value = 0;
        $.each(column_indices, function(idx_c, col_index) {
            let val_ = grab_input2number(row + '-' + col_index);
            error_value += val_;
        });

        if (num_new_cols_aje > 0) {
            let extra_columns = range(1, num_new_cols_aje);
            $.each(extra_columns, function(idx_c, col_index) {
                let val_ = grab_input2number(row + '-c-' + col_index);
                error_value += val_;
            });
        }
        set_number2input(row + '-17', error_value, '');
    });

    // Extra rows, Pre Provision
    if (num_new_cols_pre_prov > 0) {
        let rows_pre_prov = range(1, num_new_cols_pre_prov);
        $.each(rows_pre_prov, function (idx1_e, row_e) {
            let error_value = 0;
            $.each(column_indices, function(idx_c, col_index) {
                let val_ = grab_input2number('pre-prov-' + row_e + '-c-' + col_index);
                error_value += val_;
            });

            if (num_new_cols_aje > 0) {
                let extra_columns = range(1, num_new_cols_aje);
                $.each(extra_columns, function(idx_c, col_index) {
                    let ex_index = 100 + col_index;
                    let val_ = grab_input2number('pre-prov-' + row_e + '-c-' + ex_index);
                    error_value += val_;
                });
            }
            set_number2input('pre-prov-' + row_e + '-c-17', error_value, '');
        });
    }

    // Extra rows, CY Ended
    if (num_new_cols_cy_ended > 0) {
        let rows_cy_ended = range(1, num_new_cols_cy_ended);
        $.each(rows_cy_ended, function (idx1_e, row_e) {
            let error_value = 0;
            $.each(column_indices, function(idx_c, col_index) {
                let val_ = grab_input2number('cy-ended-' + row_e + '-c-' + col_index);
                error_value += val_;
            });

            if (num_new_cols_aje > 0) {
                let extra_columns = range(1, num_new_cols_aje);
                $.each(extra_columns, function(idx_c, col_index) {
                    let ex_index = 100 + col_index;
                    let val_ = grab_input2number('cy-ended-' + row_e + '-c-' + ex_index);
                    error_value += val_;
                });
            }
            set_number2input('cy-ended-' + row_e + '-c-17', error_value, '');
        });
    }
}

function insert_aje_row(selected_element, num_new_cols_aje) {
    // Get a list of TB account name
    $.ajax({
        data: {},
        type: 'GET',
        url: '/trial_balance/accounts'    // TODO: get formula and <input> data.
    }).done(function(data) {
        if (data.error) {
            console.log('Error');
        } else {
            // TB account list
            let account_list = data["tb_account_list"].sort();
            let cell1 = '<select class="aje-account-name-'+ num_new_cols_aje +'">';
            $.each(account_list, function(index, account) {
                cell1 += '<option value="' + account + '">' + account + '</option>';
            });
            cell1 += '</select>';
            let idx = selected_element.closest('tr').index();
            let row = '<tr><td class="string" style="min-width: 180px">' + cell1 + '</td>';
            row += '<td><input class="string aje-tb-act-'+ num_new_cols_aje + '" value="-" readonly></td>';
            row += '<td><input class="number aje-should-be-'+ num_new_cols_aje +'" value="0" readonly></td>';
            row += '<td><input class="number aje-per-book-'+ num_new_cols_aje +'" value="0" readonly></td>';
            row += '<td><input class="number aje-adjustment-' + num_new_cols_aje +'" value="0"></td></tr>';
            $('#data-table-aje > tbody > tr').eq(idx).before(row);
        }
    });
}

function grab_rfd_input_values(table_structure) {
    let payload = {};
    let tags = [
        string2tag("Prior Year Ended"),
        string2tag("Extension payments"),
        string2tag("Estimate payments"),
        string2tag("Provision booked by client"),
        string2tag("Prior period payments"),
        string2tag("Tax Refund"),
        string2tag("Pre-Provision Adj GL"),
        string2tag("Per Preliminary GL"),
        string2tag("PY true-up"),
        string2tag("CY Tax Provision"),
        string2tag("Penalty and interest"),
        string2tag("Reversal of Client's JE"),
        string2tag("Change in (DTA) DTL"),
        string2tag("Current Year Ended"),
    ];
    let tags_aje = [
        'aje-account-name-',
        'aje-tb-act-',
        'aje-should-be-',
        'aje-per-book-',
        'aje-adjustment-'
    ];
    let num_new_cols_aje = table_structure['num_new_cols_aje'];
    let num_new_cols_pre_prov = table_structure['num_new_cols_pre_prov'];
    let num_new_cols_cy_ended = table_structure['num_new_cols_cy_ended'];
    let cols_aje = range(1, num_new_cols_aje);
    let cols_pre_prov = range(1, num_new_cols_pre_prov);
    let cols_cy_ended = range(1, num_new_cols_cy_ended);
    let cols_default = range(0, 17);

    // (2-A) <input> data, default columns
    let table_body = {};
    $.each(tags, function(idx_t, tag) {
        $.each(cols_aje, function(idx_c, col) {
            let class_name = tag + '-c-' + col;
            table_body[class_name] = grab_input2number(class_name);
        });
    });

    // (2-B) <input> data, extra columns (pre-prov)
    $.each(cols_pre_prov, function(idx_p, col_p) {
        // Default columns.
        $.each(cols_default, function(idx_d, col_d) {
            let class_name = 'pre-prov-' + col_p + '-c-' + col_d;
            if (col_d === 0) {
                table_body[class_name] = grab_input2string(class_name);
            } else {
                table_body[class_name] = grab_input2number(class_name);
            }
        });

        // Extra columns added from the AJE table.
        $.each(cols_aje, function(idx_a, col_a) {
            let cell_number = 100 + col_a;
            let class_name = 'pre-prov-' + col_p + '-c-' + cell_number;
            table_body[class_name] = grab_input2number(class_name);
        });
    })

    // (2-C) <input> data, extra columns (cy-ended)
    $.each(cols_cy_ended, function(idx_c, col_c) {
        // Default columns.
        $.each(cols_default, function(idx_d, col_d) {
            let class_name = 'cy-ended-' + col_c + '-c-' + col_d;
            if (col_d === 0) {
                table_body[class_name] = grab_input2string(class_name);
            } else {
                table_body[class_name] = grab_input2number(class_name);
            }
        });

        // Extra columns added from the AJE table.
        $.each(cols_aje, function(idx_a, col_a) {
            let cell_number = 100 + col_a;
            let class_name = 'cy-ended-' + col_c + '-c-' + cell_number;
            table_body[class_name] = grab_input2number(class_name);
        });
    })

    // (3) <input> data, header
    let table_header = {};
    $.each(cols_aje, function(idx_c, col) {
        let class_name = 'header-c-' + col;
        let value = grab_input2string(class_name);
        table_header[class_name] = value;
    });

    // (4) AJE Table
    let table_aje = {};
    $.each(cols_aje, function(idx_a, col) {
        $.each(tags_aje, function(idx_j, tag_aje) {
            let class_name = tag_aje + col;
            if (idx_j < 2) {
                let value = grab_input2selected_value(class_name);
                table_aje[class_name] = value;
            } else {
                let value = grab_input2number(class_name);
                table_aje[class_name] = value;
            }
        });
    });

    payload['body'] = table_body;
    payload['aje'] = table_aje;
    payload['header'] = table_header;
    payload['structure'] = table_structure;
    return payload;
}

function save_rfd(val) {
    $.ajax( {
        data: {'payload': JSON.stringify( grab_rfd_input_values(val))},
        type: 'POST',
        url: '/rfd/save'
    }).done(function(data) {
        if (data.error) {
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved.');
        }
    });
}