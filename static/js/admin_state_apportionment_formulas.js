function saveStateApportionmentFormulas() {
    $.ajax( {
        data: {'payload': getPayload()},
        type: 'POST',
        url: '/admin/state_apportionment_formulas/save'
    }).done(function(data) {
        if (data.error) {
            console.log('Error while saving state apportionment formulas.');
            toastr.error('Unable to save.');
        } else {
            toastr.success('Saved.');
        }
    });
}

function getPayload() {
    let payload = {};

    $("select.user-inputs").each((_, elem) => {
        let year = $(elem).data("year");
        let state = $(elem).data("state");
        if (!(year in payload)) {
            payload[year] = {};
        }
        payload[year][state] = $(elem).val();
    });

    return JSON.stringify(payload);
}