function grab_html2number(css_selector) {
    // css_selector = class name.
    let prefix = '.';
    return str2number($(prefix + css_selector).html());
}

function grab_html2string(css_selector) {
    let prefix = '.';
    return $(prefix + css_selector).html();
}

function grab_input2number(css_selector) {
    let prefix = '.';
    let val = $(prefix + css_selector).val();
    if (val == null || val === '') {
        val = '0';
        set_number2input(css_selector, 0, '');
    }
    return str2number(val);
}

function grab_input2string(css_selector) {
    let prefix = '.';
    let val = $(prefix + css_selector).val();
    if (val == null || val === '') {
        val = '';
    }
    return val;
}

function grab_input2selected_index(css_selector) {
    let val = $('.' + css_selector + ' option:selected').index();
    if (val == null) val = '0';
    return val
}

function grab_input2selected_value(css_selector) {
    let val = $('.' + css_selector + ' option:selected').val();
    if (val == null) val = '0';
    return val
}

function set_number2html(css_selector, value, unit_str) {
    // Sets the value into a text block specified by the css_selector, such as <td>{{ value }}</td>.
    let prefix = '.'; // identify numbers in the state tax table.
    let font_css = {'color': '#000000'};
    $(prefix + css_selector)
        .html(number2currency(value) + unit_str)
        .css(font_css);
}

function set_number2input(css_selector, value, unit_str, digits=2, skip_classes=[]) {
    // Sets the value into <input> form. If the element contains CSS in skip_classes, ignore.
    let prefix = '.'; // identify numbers in the state tax table.
    let font_css = {'color': '#000000'};
    let element = $(prefix + css_selector);
    for (const c of skip_classes) {
        if (element.hasClass(c)) {
            return;
        }
    }
    element
        .val(number2currency(value, digits) + unit_str)
        .css(font_css);
}

function set_string2input(css_selector, value) {
    let prefix = '.'; // identify numbers in the state tax table.
    let font_css = {'color': '#000000'};
    let element = $(prefix + css_selector);
    element.val(value).css(font_css);
}

function generate_id(length) {
    let output = '';
    let chars = 'abcdefghijklmnopqrstuvstrvwyz0123456789';
    let char_length = chars.length;
    for (let i = 0; i < length; i++) {
        output += chars.charAt(Math.floor(Math.random() * char_length));
    }
    return output;
}

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}