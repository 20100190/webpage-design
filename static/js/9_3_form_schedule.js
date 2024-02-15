$(document).ready(function() {
    $("#save-button").click(saveScheduleData);
});

function saveScheduleData() {
    let payload = {
        "db_col": $("#1a-bool1").val(),
        "db_col2": $("#1a-bool2").val(),
        "db_col3": $("#1b-bool1").val(),
    };
    // console.log(payload);
    // $("#1b-bool1").val("no");
    $.ajax({
        data: {payload: JSON.stringify(payload)},
        type: "POST",
        url: "/form_schedule/save"
    }).done((data) => {
        if (data.error) {
            toastr.error("Failed to save Schedule Form Data. Please try again later: " + data.error);
        } else {
            toastr.success("Successfully saved Schedule Form Data");
        }
    });
};