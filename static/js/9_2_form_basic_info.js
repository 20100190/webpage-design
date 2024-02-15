$(document).ready(recalculateAndFormat);
$(document).ready(function() {
$("#transaction-table input, #foreignstock input, #shareholder input").change(recalculateAndFormat);
});

$(document).ready(function() {
    $("#save-button").click(addCompany);
});

function addCompany() {

// Select the table
var table = document.getElementById('9471-basic-info');

// Select the table head and body
var thead = table.getElementsByTagName('thead')[0];
var tbody = table.getElementsByTagName('tbody')[0];

// Create new header cell
var newHeaderCell = document.createElement('th');
newHeaderCell.className = "green";
newHeaderCell.textContent = "New Column";

// Append new header cell to the header row
thead.rows[0].appendChild(newHeaderCell);

// Create new body cell
var newBodyCell = document.createElement('td');
newBodyCell.textContent = "New Data";

// Append new body cell to the first body row
tbody.rows[0].appendChild(newBodyCell);


}

function recalculateAndFormat() {
    calculateShareholder();
    calculateForeignStock();
    calculateTransaction();
    format_number_input();
}

function saveTemplateForm() {
    let payload = {};

    var agents = calculateAgent();
    var shareholders = calculateShareholder();
    var foreign_stocks = calculateForeignStock();
    var basic_info_transaction = calculateTransaction();
    var basic_info_company = calculateCompany();
    format_number_input();

    payload[`agent_info`] = agents;
    payload[`basic_info_transaction`] = basic_info_transaction;
    payload[`basic_info_company`] = basic_info_company;
    payload[`foreign_stocks`] = foreign_stocks;
    payload[`shareholders`] = shareholders;


    format_number_input();
    $.ajax({
        data: {payload: JSON.stringify(payload)},
        type: "POST",
        url: "/form_basic_info/save"
    }).done((data) => {
        if (data.error) {
            toastr.error("Failed to save Template Form Data. Please try again later: " + data.error);
        } else {
            toastr.success("Successfully saved Template Form Data");
        }
    });
};

function calculateShareholder() {
    var container = $('#shareholder');
    var shareholderCount = container.find('.table.worksheet').length;
    let shareholders = {};
    for (let i = 1; i <= shareholderCount; i++) {
        let shareholder = {};
        shareholder[`shareholder_name`] = $(`input#shareholder-name-${i}`).val();
        shareholder[`shareholder_address`] = $(`input#shareholder-address-${i}`).val();
        shareholder[`class_stock_held`] = $(`input#shareholder-classstock-${i}`).val();
        shareholder[`start_num_share`] = str2number($(`input#shareholder-start_num_share-${i}`).val());
        shareholder[`end_num_share`] = str2number($(`input#shareholder-end_num_share-${i}`).val());
        shareholder[`shareholder_number`] = i;
        shareholders[`${i}`] = shareholder;
        let end_num_share = str2number($(`input#shareholder-end_num_share-${i}`).val());
        let ending_stock = str2number($(`input#ending-stock-1`).val()); 
        $(`input#shareholder-total_perc-${i}`).val(100*end_num_share/ending_stock);
    }
    return shareholders;
};

function calculateForeignStock() {
    var container = $('#foreignstock');
    var shareholderCount = container.find('.table.worksheet').length;
    let foreign_stocks = {};
    for (let i = 1; i <= shareholderCount; i++) {
        let foreign_stock = {};
        foreign_stock[`class_stock`] = $(`input#class-stock-${i}`).val();
        foreign_stock[`beginning_stock`] = str2number($(`input#beginning-stock-${i}`).val());
        foreign_stock[`ending_stock`] = str2number($(`input#ending-stock-${i}`).val());
        foreign_stock[`stock_number`] = i;
        foreign_stocks[`${i}`] = foreign_stock
    }
    return foreign_stocks;
};


function calculateAgent() {
    var container = $('#agent');
    var agentCount = container.find('.table.worksheet').length;
    let agents = {};
    const fields = ['name', 'street', 'city', 'state', 'zip', 'contact', 'person_type'];

    for (let i = 1; i <= agentCount; i++) {
        let agent = {};
        fields.forEach(field => {
            agent[`agent_info_${field}`] = $(`input#agent-info-${field}-${i}`).val();
        });
        agent[`agent_number`] = i;
        agents[`${i}`] = agent
    }
    return agents;
};

function calculateTransaction() {
    let basic_info_transaction = {};
    basic_info_transaction[`sales_inventory`] = str2number($(`input#sales-inventory`).val());
    basic_info_transaction[`sales_tangible_property`] = str2number($(`input#sales-tangible-property`).val());
    basic_info_transaction[`sales_property_rights`] = str2number($(`input#sales-property-rights`).val());
    basic_info_transaction[`platform_contributions_received`] = str2number($(`input#platform-contributions-received`).val());
    basic_info_transaction[`cost_sharing_payments_received`] = str2number($(`input#cost-sharing-payments-received`).val());
    basic_info_transaction[`compensation_services_received`] = str2number($(`input#compensation-services-received`).val());
    basic_info_transaction[`commissions_received`] = str2number($(`input#commissions-received`).val());
    basic_info_transaction[`rents_royalties_received`] = str2number($(`input#rents-royalties-received`).val());
    basic_info_transaction[`dividends_received`] = str2number($(`input#dividends-received`).val());
    basic_info_transaction[`interest_received`] = str2number($(`input#interest-received`).val());
    basic_info_transaction[`premiums_received`] = str2number($(`input#premiums-received`).val());
    let subtotal_received = str2number($(`input#sales-inventory`).val()) + 
        str2number($(`input#sales-tangible-property`).val()) +
        str2number($(`input#sales-property-rights`).val()) +
        str2number($(`input#platform-contributions-received`).val()) +
        str2number($(`input#cost-sharing-payments-received`).val()) +
        str2number($(`input#compensation-services-received`).val()) +
        str2number($(`input#commissions-received`).val()) +
        str2number($(`input#rents-royalties-received`).val()) +
        str2number($(`input#dividends-received`).val()) +
        str2number($(`input#interest-received`).val()) +
        str2number($(`input#premiums-received`).val());
    $(`input#subtotal-received`).val(subtotal_received);
    basic_info_transaction[`purchases_inventory`] = str2number($(`input#purchases-inventory`).val());
    basic_info_transaction[`purchases_tangible_property`] = str2number($(`input#purchases-tangible-property`).val());
    basic_info_transaction[`purchases_property_rights`] = str2number($(`input#purchases-property-rights`).val());
    basic_info_transaction[`platform_contributions_paid`] = str2number($(`input#platform-contributions-paid`).val());
    basic_info_transaction[`cost_sharing_payments_paid`] = str2number($(`input#cost-sharing-payments-paid`).val());
    basic_info_transaction[`compensation_services_paid`] = str2number($(`input#compensation-services-paid`).val());
    basic_info_transaction[`commissions_paid`] = str2number($(`input#commissions-paid`).val());
    basic_info_transaction[`rents_royalties_paid`] = str2number($(`input#rents-royalties-paid`).val());
    basic_info_transaction[`dividends_paid`] = str2number($(`input#dividends-paid`).val());
    basic_info_transaction[`interest_paid`] = str2number($(`input#interest-paid`).val());
    basic_info_transaction[`premiums_paid`] = str2number($(`input#premiums-paid`).val());
    let subtotal_paid = str2number($(`input#purchases-inventory`).val()) +
        str2number($(`input#purchases-tangible-property`).val()) +
        str2number($(`input#purchases-property-rights`).val()) +
        str2number($(`input#platform-contributions-paid`).val()) +
        str2number($(`input#cost-sharing-payments-paid`).val()) +
        str2number($(`input#compensation-services-paid`).val()) +
        str2number($(`input#commissions-paid`).val()) +
        str2number($(`input#rents-royalties-paid`).val()) +
        str2number($(`input#dividends-paid`).val()) +
        str2number($(`input#interest-paid`).val()) +
        str2number($(`input#premiums-paid`).val());
    $(`input#subtotal-paid`).val(subtotal_paid);
    basic_info_transaction[`amounts_borrowed`] = str2number($(`input#amounts-borrowed`).val());
    basic_info_transaction[`amounts_loaned`] = str2number($(`input#amounts-loaned`).val());
    return basic_info_transaction;
};

function calculateCompany() {
    let basic_info_company = {};
    basic_info_company[`company_name`] = $(`input#company-name`).val();
    basic_info_company[`company_address`] = $(`input#company-address`).val();
    basic_info_company[`employer_id_no`] = $(`input#employer-id-no`).val();
    basic_info_company[`company_country`] = $(`input#company-country`).val();
    basic_info_company[`incorporation_date`] = $(`input#incorporation-date`).val();
    basic_info_company[`principal_place`] = $(`input#principal-place`).val();
    basic_info_company[`principal_business`] = $(`input#principal-business`).val();
    basic_info_company[`foreign_currency`] = $(`input#foreign-currency`).val();
    basic_info_company[`exchange_rate_bs`] = str2number($(`input#exchange-rate-bs`).val());
    basic_info_company[`exchange_rate_pl`] = str2number($(`input#exchange-rate-pl`).val());
    basic_info_company[`tax_year_beginning`] = $(`input#tax-year-beginning`).val();
    basic_info_company[`tax_year_ending`] = $(`input#tax-year-ending`).val();
    basic_info_company[`office_in_usa`] = $(`input#office-in-usa`).val();
    basic_info_company[`branch_name`] = $(`input#branch-name`).val();
    basic_info_company[`branch_address`] = $(`input#branch-address`).val();
    basic_info_company[`usa_office_tax`] = $(`input#usa-office-tax`).val();
    basic_info_company[`taxable_income`] = str2number($(`input#taxable-income`).val());
    basic_info_company[`usa_tax_paid`] = str2number($(`input#usa-tax-paid`).val());
    basic_info_company[`branch_in_incorporation`] = $(`input#branch-in-incorporation`).val();
    basic_info_company[`foreign_corporation_name`] = $(`input#foreign-corporation-name`).val();
    basic_info_company[`foreign_corporation_address`] = $(`input#foreign-corporation-address`).val();
    basic_info_company[`person_with_record`] = $(`input#person-with-record`).val();
    basic_info_company[`record_holder_name`] = $(`input#record-holder-name`).val();
    basic_info_company[`record_holder_address`] = $(`input#record-holder-address`).val();
    return basic_info_company;
};

function addShareholder() {
    // Find the container with the ID "shareholder"
    var container = $('#shareholder');
    // Clone the last shareholder table and clear input values
    var newShareholderTable = container.find('.table.worksheet:last').clone();
    // Clear input fields that are not readonly 
    newShareholderTable.find('input:not([readonly])').val('');
    // Adjust the IDs and names for inputs if needed
    var shareholderCount = container.find('.table.worksheet').length;
    newShareholderTable.find('input').each(function() {
        var parts = $(this).attr('id').split('-');
        var baseId = parts.slice(0, -1).join('-');
        $(this).attr('id', baseId + '-' + (shareholderCount + 1));
    });
    newShareholderTable.find('#shareholder-shareholder_number-'+(shareholderCount + 1)).val(shareholderCount + 1);
    // Append the new entry to the container
    container.append(newShareholderTable);
};

function addForeignstock() {
    var container = $('#foreignstock');
    var newForeignStockTable = container.find('.table.worksheet:last').clone();
    newForeignStockTable.find('input:not([readonly])').val('');
    var shareholderCount = container.find('.table.worksheet').length;
    newForeignStockTable.find('input').each(function() {
        var parts = $(this).attr('id').split('-');
        var baseId = parts.slice(0, -1).join('-');
        $(this).attr('id', baseId + '-' + (shareholderCount + 1));
    });
    newForeignStockTable.find('#stock_number-'+(shareholderCount + 1)).val(shareholderCount + 1);
    container.append(newForeignStockTable);
};

function addAgent() {
    var container = $('#agent');
    var newAgentTable = container.find('.table.worksheet:last').clone();
    newAgentTable.find('input:not([readonly])').val('');
    var agentCount = container.find('.table.worksheet').length;
    newAgentTable.find('input').each(function() {
        var parts = $(this).attr('id').split('-');
        var baseId = parts.slice(0, -1).join('-');
        $(this).attr('id', baseId + '-' + (agentCount + 1));
    });
    newAgentTable.find('#agent_number-'+(agentCount + 1)).val(agentCount + 1);
    container.append(newAgentTable);
};

function toggleRows(button, sectionClass) {
  // Select all rows with the provided section class
  var rows = document.querySelectorAll('.' + sectionClass);
  // Check if the first row of this section is currently displayed
  var isHidden = rows[0].style.display === 'none' || rows[0].style.display === '';

  // Loop through rows and toggle their display property
  rows.forEach(function(row) {
    row.style.display = isHidden ? 'table-row' : 'none';
  });

  // Change the button text according to the state
  button.textContent = isHidden ? '-' : '+';
}

function toggleDivs(button, sectionClass) {
    // Select all divs with the provided section class
    var divs = document.querySelectorAll('.' + sectionClass);
    // Check if the first div of this section is currently displayed
    var isHidden = divs[0].style.display === 'none' || divs[0].style.display === '';
  
    // Loop through divs and toggle their display property
    divs.forEach(function(div) {
      div.style.display = isHidden ? 'block' : 'none';
    });
  
    // Change the button text according to the state
    button.textContent = isHidden ? '-' : '+';
}

function showRows(sectionClass, shouldShow) {
  // Select all rows with the provided section class
  var rows = document.querySelectorAll('.' + sectionClass);

  // Loop through rows and set their display property based on shouldShow argument
  rows.forEach(function(row) {
    row.style.display = shouldShow ? 'table-row' : 'none';
  });
}

function showDivs(sectionClass, shouldShow) {
    // Select all rows with the provided section class
    var rows = document.querySelectorAll('.' + sectionClass);
  
    // Loop through rows and set their display property based on shouldShow argument
    rows.forEach(function(row) {
      row.style.display = shouldShow ? 'block' : 'none';
    });
  }