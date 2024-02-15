$(document).ready(() => {
    let containerHeight = $("#primary-content").height();
    let headerHeight = $(".worksheet-container").siblings(".container").outerHeight(true);
    $('.worksheet-container').css('height', containerHeight - headerHeight);
    let dataTable = $('#data-table').DataTable({
        "ordering": false,
        "scrollX": true,
        "scrollY": containerHeight - headerHeight,
        "scrollCollapse": true,
        "paging": false,
        "searching": false,
        "info": false,
        "columnDefs": [{targets: 0, className: "text-nowrap"}],
    });

    recalculateAndFormat();
});

$("button.add-row").on("click", function(event) {
    _addUserInputRow($(this));
    event.preventDefault();
});

$("button.remove-row").on("click", function(ev) {
    $(this).closest("tr").remove()
    ev.preventDefault();
    recalculateAndFormat();
});


$("input.number").change((event) => {
    recalculateAndFormat();
});

$("button#save-button").on("click", function(event) {
    save();
    event.preventDefault();
});

/**
 * Refresh table by recalculate and format.
 */
function recalculateAndFormat() {
    _calculateSubtotal();
    _calculatePriorYearTrueup();
    _calculateStateTotal();
    _calculateGrandTotal();
    format_number_input();
}

/**
 * Ajax call to save user inputs.
 */
function save() {
    // Collect input values per row
    let inputs = [];
    $("tr").each((_, tr) => {
        if ($(tr).find(":input[type='text']:not([readonly])").length === 0) {
            return;
        }
        let row = {};
        $(tr).find(":input").each((_, input) => {
            if (input.readOnly) {
                return;
            }
            if ($(input).hasClass("number")) {
                if (!("states" in row)) {
                    row["states"] = {};
                }
                row["states"][input.name.toUpperCase()] = str2number(input.value);
            } else {
                row[input.name] = input.value;
            }
        });
        inputs.push(row);
    });

    // Calculate row index
    let row_index = 0;
    let parent = "";
    inputs.forEach((element, _index) => {
        if (element["parent"] === "") {
            row_index = 0;
        } else if (element["parent"] != "") {
            if (parent === "" || parent !== element["parent"]) {
                parent = element["parent"];
                row_index = 0;
            } else {
                row_index++;
            }
        }
        element["row_index"] = row_index;
    });

    $.ajax({
        data: {"payload": JSON.stringify(inputs)},
        type: "POST",
        url: "/prepaid_payable"
    }).done(function(data) {
        if (data.error) {
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved');
        }
    });
}

/**
 * Calculate subtotal for each item that has child rows.
 */
function _calculateSubtotal() {
    $("input.number.subtotal").each((_, element) => {
        let state = $(element).data("state");
        let index = $(element).closest("tr").index();
        let sum = 0;
        while(index > 0) {
            index--;
            let input = $("#data-table > tbody > tr").eq(index).find("input.number." + state);
            if (input.length === 0) {
                break;
            }
            sum += str2number(input.val());
        }
        $(element).val(sum);
    });
    // Special case for Over (under) accrual of PY taxes to calculate diff
    $("input.number.diff").each((_, element) => {
        let state = $(element).data("state");
        let index = $(element).closest("tr").index();
        let per_tax = $("#data-table > tbody > tr").eq(index - 2).find("input.number." + state);
        let per_book = $("#data-table > tbody > tr").eq(index - 1).find("input.number." + state);
        let diff = str2number(per_tax.val()) - str2number(per_book.val());
        $(element).val(diff);
    });
}

/**
 * Copy Over (under) accrual of PY taxes values to Prior Year True-up
 */
function _calculatePriorYearTrueup() {
    $("input[id^=OVER_UNDER_ACCRUAL_OF_PY_TAXES_subtotal_]").each((_, element) => {
        let state = $(element).data("state").toUpperCase();
        $("input#PriorYearTrueup_" + state).val($(element).val());
    });
}

/**
 * Add a row to the section.
 */
function _addUserInputRow(button) {
    let rowHtml = `
    <tr class="user-inputs">
        <td class="string-indent">
            <input name="name" value="" type="text">
            <input name="parent" value="${ $(button).data('name') }" type="hidden">
        </td>
        <td>
            <button class="remove-row"><nobr><span class="bi bi-x-circle-fill"> Remove</span></nobr></button>
        </td>
        ${(() => {
            let columns = "";
            for (let i = 0; i < $("th.state-name").length; i++) {
                let stateName = $($("th.state-name")[i]).html().toLowerCase();
                if (stateName.length > 3) {
                    // If "scrollX" and "scrollY" options are true, there are hidden elements in the header.
                    // <div class="datatables_sizing" style="height: 0px; overflow: hidden;">fed</div>
                    continue;
                }

                let classes = ["number"];
                if (stateName === "fed") {
                    classes.push("fed");
                } else {
                    classes.push("state");
                    classes.push(stateName);
                }
                columns += '<td><input class="' + classes.join(" ") + '" name="' + stateName + '" value="-" type="text"></td>';
            }
            columns += '<td><input class="state-total number" value="-" type="text" readonly></td>';
            columns += '<td><input class="grand-total number" value="-" type="text" readonly></td>';
            return columns;
        })()}
    </tr>`;

    // Identify the tr index of the subtotal for this section and insert the row right before that
    let index = $(button).closest("tr").nextAll("tr.subtotal:first").index();
    $("#data-table > tbody > tr").eq(index).before(rowHtml);
    $("#data-table > tbody > tr").eq(index).find("input.number").each((_, number_input) => {
        $(number_input).change((event) => {
            recalculateAndFormat()
        });
    });

    $("button.remove-row").on("click", function(ev) {
        $(this).closest("tr").remove()
        ev.preventDefault();
        recalculateAndFormat();
    });

    recalculateAndFormat();
}

/**
 * Calculate state total column
 */
function _calculateStateTotal() {
    $("input.state-total").each((_, input_total) => {
        let sum = 0;
        $(input_total).closest("tr").find("input.number.state").each((_, input_state) => {
            sum += str2number($(input_state).val());
        })
        $(input_total).val(sum);
    });
}

/**
 * Calculate grand total column
 */
function _calculateGrandTotal() {
    $("input.grand-total").each((_, input_total) => {
        let tr = $(input_total).closest("tr");
        let sum = str2number(tr.find("input.state-total").val()) + str2number(tr.find("input.number.fed").val());
        $(input_total).val(sum);
    });
}