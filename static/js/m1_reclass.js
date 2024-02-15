$('#refresh-button').on('click', '', function() {
    location.reload();
})

// Add a new row for a new Reclass record on the modal view.
$('#data-table-modal tbody').on('click', 'button.add-journal-row', function() {
    let idx = $(this).closest('tr').index();
    insert_new_row(idx);
});

// Add a new row for the existing Reclass record
$('#data-table tbody').on('click', 'button.add-journal-row', function() {
    const rje_number = $(this).attr('id').split('-').at(-1);
    const row_index_insert = $('#data-table > tbody > tr.rje-' + rje_number).last().index();
    insert_extra_row(row_index_insert, rje_number);
});

// Remove existing row from RJE Reclass Journals
$('#data-table-modal tbody').on('click', 'button.remove-journal-row', function() {
    $(this).closest('tr').remove();
});

// Remove existing row from RJE Reclass Journals
$('#data-table tbody').on('click', 'button.remove-journal-row', function() {
    let obj_id_rm = $(this).attr('id').split('-').at(-2);    // format: delete-journal-{id}-{rje}
    if (/^\d+$/.test(obj_id_rm)) {
        remove_reclass_row(obj_id_rm);
    }
    $(this).closest('tr').remove()
});

// Save a new ReclassRJE record from the modal view.
$('button#reclass-save-button').on('click', '', function() {
    try {
        m1_reclass_save();
    } catch (error) {
        console.log(error);
    }
});

// Update ReclassRJE records
$('#data-table tbody').on('click', 'button.reclass-edit', function() {
    try {
       m1_reclass_update($(this));
    } catch (error) {
        console.log(error);
    }
});

// Delete ReclassRJE records where RJE #N are the same.
$('#data-table tbody').on('click', 'button.reclass-delete', function() {
    m1_reclass_delete($(this));
})

function insert_new_row(row_index_insert) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/m1_adjustment/options'
    }).done(function(data) {
        if (data) {
            let txcas = data.tax_chart_of_accounts;
            let new_row_html = '<tr>';
            new_row_html += '<td><select name="reclass-tax-chart-of-account-name" ';
            new_row_html += 'class="selectpicker reclass-tax-chart-of-account-name" data-live-search="true">';
            for (let i = 0; i < txcas.length; i++) {
                new_row_html += '<option value="' + txcas[i] + '" selected>' + txcas[i] + '</option>';
            }
            new_row_html += '</select></td>';
            new_row_html += '<td><input name="reclass-description" class="reclass-description string" type="text" ' +
                'value="" placeholder="description"></td>';
            new_row_html += '<td><input name="reclass-debit" class="number debit reclass-debit" value="0"></td>';
            new_row_html += '<td><input name="reclass-credit" class="number credit reclass-credit" value="0"></td>';
            new_row_html += '<td><input name="reclass-note" class="reclass-note string" value="" ' +
                'placeholder="note"></td>';
            new_row_html += '<td class="string"><button id="delete-journal-" type="button" ' +
                'class="btn btn-default btn-circle remove-journal-row"><i class="fa fa-times"></i></button></td>';
            new_row_html += '</tr>';
            $('#data-table-modal > tbody > tr').eq(row_index_insert).after(new_row_html);
            $('.selectpicker').selectpicker('render');
        }
    });
}

function insert_extra_row(row_index_insert, rje_number) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/m1_adjustment/options'
    }).done(function(data) {
        if (data) {
            let tmp_id = generate_id(3);
            let txcas = data.tax_chart_of_accounts;
            let new_row_html = '<tr class="rje-' + rje_number + '"><td id="reclass-rje-' + tmp_id + '"></td>';
            new_row_html += '<td><select name="reclass-tax-chart-of-account-name-' + tmp_id + '" ' +
                'class="selectpicker reclass-tax-chart-of-account-name-' + tmp_id + '" data-live-search="true">';
            for (let i = 0; i < txcas.length; i++) {
                new_row_html += '<option value="' + txcas[i] + '" selected>' + txcas[i] + '</option>';
            }
            new_row_html += '</select></td>';
            new_row_html += '<td><input name="reclass-description-' + tmp_id + '" class="reclass-description-' +
                tmp_id + ' string" type="text" value="" placeholder="description"></td>';
            new_row_html += '<td><input name="reclass-debit-' + tmp_id + '" class="number debit reclass-debit-' +
                tmp_id + '" value="0"></td>';
            new_row_html += '<td><input name="reclass-credit-' + tmp_id + '" class="number credit reclass-credit-' +
                tmp_id + '" value="0"></td>';
            new_row_html += '<td><input name="reclass-note-' + tmp_id + '" class="string reclass-note-' +
                tmp_id + '" value="" placeholder="note"></td>';
            new_row_html += '<td class="string"><button id="delete-journal-' + tmp_id + '-' + rje_number +
                '"  type="button" class="btn btn-default btn-circle remove-journal-row">' +
                '<i class="fa fa-times"></i></button></td>';
            new_row_html += '</tr>';
            $('#data-table > tbody > tr').eq(row_index_insert).after(new_row_html);
            $('.selectpicker').selectpicker('render');
        }
    });
}

function m1_reclass_save() {
    let journals = [];
    let debit_sum = 0.0;
    let credit_sum = 0.0;

    $('table#data-table-modal > tbody > tr').each(function() {
        let tcoa_name = $(this).find('button').attr('title');
        let description = $(this).find('.reclass-description').val().trim();
        let credit = str2number($(this).find('.reclass-credit').val());
        let debit = str2number($(this).find('.reclass-debit').val());
        let note = $(this).find('.reclass-note').val().trim();

        if (credit * debit !== 0) {
            toastr.error('Error', 'Either debit or credit must be zero.');
            $('.reclass-credit').css({'background-color': '#f8bbd0'});
            $('.reclass-debit').css({'background-color': '#f8bbd0'});
            throw new Error('Either debit or credit must be zero.')
        }

        if ((description.length === 0) || (description === '')) {
            toastr.info('Error', 'Description field is empty.');
            throw new Error('Description field is empty.');
        }

        if ((note.length === 0) || (note === '')) {
            toastr.info('Error', 'Note field is empty.');
            throw new Error('Note field is empty.');
        }

        journals.push({
            tcoa: tcoa_name,
            debit: debit,
            credit: credit,
            description: description,
            note: note
        });

        credit_sum += credit;
        debit_sum += debit;
    });

    if (Math.abs(debit_sum + credit_sum) > 0) {
        toastr.error("The sum of debits and credits must be equal to 0.");
        $('table#data-table-modal > tbody > tr').each(function() {
            $('.reclass-credit').css({'background-color': '#f8bbd0'});
            $('.reclass-debit').css({'background-color': '#f8bbd0'});
        });
        return false;
    }

    $.ajax({
        url: '/m1_reclass/save',
        data : {payload: JSON.stringify(journals)},
        dataType: 'json',
        type: 'POST'
    }).done(function(data) {
        if (data.error) {
            toastr.error("Error: " + data.error);
        } else {
            toastr.success("Saved");
            location.reload();
        }
    });
}

function m1_reclass_update(selected_element) {
    // RJE# number embedded in "id" from the button tapped.
    let rje_number = selected_element.attr('id').split('-').at(-1);

    // Reclass.note has a class "rje-{rje_number}", which leads to the object ID(s).
    let journals = []
    let debit_sum = 0.0;
    let credit_sum = 0.0;
    $('tr.rje-' + rje_number).each(function(){
        let obj_id = $(this).find('td').attr('id').split('-').at(-1);
        let tcoa_name = $(this).find('button').attr('title');
        let description = $('.reclass-description-' + obj_id).val().trim();
        let credit = grab_input2number('reclass-credit-' + obj_id);
        let debit = grab_input2number('reclass-debit-' + obj_id);
        let note = $('.reclass-note-' + obj_id).val().trim();

        if (credit * debit !== 0) {
            toastr.error('Error', "Either debit or credit must be zero.");
            $('.reclass-credit-' + obj_id).css({'background-color': '#f8bbd0'});
            $('.reclass-debit-' + obj_id).css({'background-color': '#f8bbd0'});
            throw new Error('Either debit or credit must be zero.');
        }

        if ((description.length === 0) || (description === '')) {
            toastr.error('Error', 'Description field is empty.');
            throw new Error('Description field is empty.');
        }

        if ((note.length === 0) || (note === '')) {
            toastr.error('Error', 'Note field is empty.');
            throw new Error('Note field is empty.');
        }

        journals.push({
            obj_id: obj_id,
            tcoa: tcoa_name,
            debit: debit,
            credit: credit,
            description: description,
            note: note,
            rje_number: rje_number,
        });

        credit_sum += credit;
        debit_sum += debit;
    });

    if (Math.abs(debit_sum + credit_sum) > 0) {
        toastr.error("The sum of debits and credits must be equal to 0.");
        $('input.rje-' + rje_number).each( function() {
            let obj_id = $(this).attr('id').split('-').at(-1);
            $('.reclass-credit-' + obj_id).css({'background-color': '#f8bbd0'});
            $('.reclass-debit-' + obj_id).css({'background-color': '#f8bbd0'});
        });
        return false;
    }

    $.ajax({
        url: '/m1_reclass/update',
        data : {
            payload: JSON.stringify(journals),
            rje_number: rje_number
        },
        dataType: 'json',
        type: 'POST'
    }).done(function(data){
        if (data.error) {
            toastr.error("Error: " + data.error);
        } else {
            toastr.success("Updated.");
            $('input.rje-' + rje_number).each( function() {
                let obj_id = $(this).attr('id').split('-').at(-1);
                $('.reclass-credit-' + obj_id).css({'background-color': '#E0F7FA'});
                $('.reclass-debit-' + obj_id).css({'background-color': '#E0F7FA'});
            });
        }
    });
}


function m1_reclass_delete(selected_element) {
    let rje_number = selected_element.attr('id').split('-').at(-1);

    // Reclass.note has a class "rje-{rje_number}", which leads to the object ID(s).
    let obj_ids = [];
    $('input.rje-' + rje_number).each( function() {
        let obj_id = $(this).attr('id').split('-').at(-1);
        obj_ids.push(obj_id);
    });

    $.ajax({
        data: {payload: JSON.stringify(obj_ids)},
        type: 'POST',
        url: '/m1_reclass/delete'
    }).done(function(data) {
        if (data.error) {
            toastr.error("Error: unable to delete the record.");
        } else {
            $('#data-table > tbody > tr.rje-' + rje_number).remove();
            toastr.success('Deleted');
        }
    });
}

// Delete a single ReclassRJE record.
function remove_reclass_row(obj_id_rm) {
    // Reclass.note has a class "rje-{rje_number}", which leads to the object ID(s).
    let obj_ids = [obj_id_rm]
    $.ajax({
        data: {payload: JSON.stringify(obj_ids)},
        type: 'POST',
        url: '/m1_reclass/delete'
    }).done(function(data) {
        if (data.error) {
            toastr.error("Error: unable to delete the record.");
        } else {
            toastr.success('Deleted');
        }
    });
}