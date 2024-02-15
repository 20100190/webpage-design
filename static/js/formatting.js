function addCommas(nStr) {
	nStr += '';
	let x = nStr.split('.');
	let x1 = x[0];
	let x2 = x.length > 1 ? '.' + x[1] : '';
	let rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function number2currency(number, digits=2, minus_to_parens=true) {
    if (number === '') {
        number = 0;
    }
    number = parseFloat(number).toFixed(digits);
    let number_str = number.toLocaleString('en-US');
    number_str = addCommas(number_str);
    if (minus_to_parens && number_str.includes('-')) {
        number_str = number_str.replace('-', '(') + ')';
    }
    return number_str;
}

function number2wholenumber(number) {
    // Only used with 2.4 Form1120 Summary
    number = parseFloat(number).toFixed(0);
    let number_str = number.toLocaleString('en-US');
    number_str = addCommas(number_str);
    if (number_str.includes('-')) {
        number_str = number_str.replace('-', '(') + ')';
    }
    return number_str;
}

function str2number(str_num) {
    // # TODO: includes not working?,
    if (str_num == null || str_num === '' || str_num === '-') { str_num = '0'; }
    if (str_num.replace(' ', '').replace('-') === '') { str_num = '0'; }
    let sign = 1.0;
    if (~str_num.indexOf('(')) { sign = -1.0; }
    if (~str_num.indexOf('-')) { sign = -1.0; }
    return parseFloat(str_num.replace('-', '0').replace('(','').replace(')','').split(',').join('')) * sign;
}

function string2tag(x) {
    x = x.split('<')[0];
    let unwanted_chars = ['(', ')', '%', '/', ',', '.', '_', ':', ';', "'"];
    x = x.trim().toLowerCase().replace(/ +(?= )/g, '');
    $.each(unwanted_chars, function(index, char) {
        x = x.replace(char, '');
    });
    x = x.split(' ').join('-');
    return x
}

$('input.number').on('change', '', function(event) {
    let value = $(this).val()
    if ($.isNumeric(value)) {
        $(this).css({'background-color': '#e0f7fa'});
    } else {
        $(this).css({'background-color': '#00ff99'});
        $(this).val(0);
    }
})

$('input.number').on('keypress', function(event) {
    let v = $(this).val().replace(/[^0-9\.-]/g, '');
    $(this).val(v);
});

$('input.string').on('change', function(event) {
    let value = $(this).val().trim();
    if ((value.length === 0) || (value === '')) {
        $(this).css({'background-color': '#00ff99'});
    } else {
        $(this).css({'background-color': '#e0f7fa'});
    }
});

// All <input> with .number class --> decimal
function format_number_input() {
    $('input.number').each(function() {
        let value = $(this).val();
        let digits = 2;
        if ($(this).attr("data-default") !== undefined) {
            let defaultValue = $(this).attr("data-default");
            if (value.includes("Infinity") || value.includes("NaN")) {
                value = defaultValue;
            }
        }
        if ($(this).data("digits") !== undefined) {
            digits = parseInt($(this).data("digits"));
        }
        if (value.startsWith("(") || value.includes(",") || value.includes("%")) {
            return;  // Consider this value is already formatted
        } else if (value === "-" || parseFloat(value) === 0) {
            $(this).val("-");
        } else {
            if ($(this).hasClass("percent")) {
                var strVal = number2currency(value, digits, false);
                if (strVal === "-0.00") {
                    strVal = "0.00";
                } else if (strVal === "-0") {
                    strVal = "0";
                }
                $(this).val(strVal + "%");
            } else {
                $(this).val(number2currency(value, digits));
            }
            let classes = $(this).attr('class');
            if (~classes.indexOf('value-diff')) {
                $(this).addClass('cell-pink-1');
            }
        }
    })
};
format_number_input();

$('tbody').on('focusin', 'input.number', function(){
    let value = $(this).val();
    if (value === '-') {
        $(this).val('');
    } else {
        value = str2number(value);
        $(this).val(value);
    }
})

$('tbody').on('focusout', 'input.number', function(){
    let value = $(this).val();
    value = str2number(value);

    // Check if credit < 0 or debit > 0.
    let classes = $(this).attr('class');
    if (~classes.indexOf('credit')) {
        if (parseInt(value) > 0) {
            $(this).css({'background-color': '#f8bbd0'});
            return;
        }
    } else if (~classes.indexOf('debit')) {
        if (parseInt(value) < 0) {
            $(this).css({'background-color': '#f8bbd0'});
            return
        }
    }

    if (parseFloat(value) === 0 || value === '') {
        $(this).val("-");
    } else {
        let digits = 2;
        if ($(this).data("digits") !== undefined) {
            digits = parseInt($(this).data("digits"));
        }
        if ($(this).hasClass("percent")) {
            $(this).val(number2currency(value, digits) + "%");
        } else {
            $(this).val(number2currency(value, digits));
        }
    }
})

// 2.4 Summary: whole number
$('input.number-f1120').each(function() {
    let value = $(this).val();
    if (parseInt(value) == 0) {
        $(this).val("-");
    } else {
        $(this).val(number2wholenumber(value));
        let classes = $(this).attr('class');
        if (~classes.indexOf('value-diff')) {
            $(this).addClass('cell-pink-1')
        }
    }
})
