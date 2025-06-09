// Global variables to store our data
let rawData = [];
let cleanedData = [];
let stats = {
    originalRows: 0,
    cleanedRows: 0,
    emailsFixed: 0,
    phonesFixed: 0
};

// Wait for the page to load completely
document.addEventListener('DOMContentLoaded', function() {
    // Get references to HTML elements
    const csvFileInput = document.getElementById('csvFile');
    const loadDataBtn = document.getElementById('loadData');
    const removeEmptyBtn = document.getElementById('removeEmpty');
    const validateEmailsBtn = document.getElementById('validateEmails');
    const standardizePhonesBtn = document.getElementById('standardizePhones');
    const cleanAllBtn = document.getElementById('cleanAll');

    // Event listeners for buttons
    loadDataBtn.addEventListener('click', loadCSVData);
    removeEmptyBtn.addEventListener('click', removeEmptyRows);
    validateEmailsBtn.addEventListener('click', validateEmails);
    standardizePhonesBtn.addEventListener('click', standardizePhones);
    cleanAllBtn.addEventListener('click', cleanAllData);

    // Allow file input to trigger loading
    csvFileInput.addEventListener('change', loadCSVData);
});

// Function to load and parse CSV data
function loadCSVData() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showMessage('Please select a CSV file first!', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        parseCSV(csvText);
    };
    reader.readAsText(file);
}

// Function to parse CSV text into array of objects
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    rawData = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        const values = lines[i].split(',').map(value => value.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        rawData.push(row);
    }

    stats.originalRows = rawData.length;
    cleanedData = [...rawData]; // Create a copy for cleaning
    
    displayRawData();
    updateStats();
    showMessage(`Loaded ${rawData.length} rows successfully!`, 'success');
}

// Function to display raw data in a table
function displayRawData() {
    const container = document.getElementById('rawDataContainer');
    
    if (rawData.length === 0) {
        container.innerHTML = '<p>No data loaded yet...</p>';
        return;
    }

    const headers = Object.keys(rawData[0]);
    let tableHTML = '<table><thead><tr>';
    
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Show first 10 rows only to avoid overwhelming the display
    const displayRows = rawData.slice(0, 10);
    
    displayRows.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<td>${row[header] || ''}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    
    if (rawData.length > 10) {
        tableHTML += `<p><em>Showing first 10 rows of ${rawData.length} total rows</em></p>`;
    }

    container.innerHTML = tableHTML;
}

// Function to display cleaned data
function displayCleanedData() {
    const container = document.getElementById('cleanedDataContainer');
    
    if (cleanedData.length === 0) {
        container.innerHTML = '<p>No cleaned data available...</p>';
        return;
    }

    const headers = Object.keys(cleanedData[0]);
    let tableHTML = '<table><thead><tr>';
    
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Show first 10 rows only
    const displayRows = cleanedData.slice(0, 10);
    
    displayRows.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<td>${row[header] || ''}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    
    if (cleanedData.length > 10) {
        tableHTML += `<p><em>Showing first 10 rows of ${cleanedData.length} total rows</em></p>`;
    }

    container.innerHTML = tableHTML;
}

// Function to remove empty rows
function removeEmptyRows() {
    if (rawData.length === 0) {
        showMessage('Please load data first!', 'error');
        return;
    }

    const beforeCount = cleanedData.length;
    
    cleanedData = cleanedData.filter(row => {
        // Check if row has at least one non-empty value
        return Object.values(row).some(value => value && value.trim() !== '');
    });

    const afterCount = cleanedData.length;
    const removed = beforeCount - afterCount;
    
    stats.cleanedRows = cleanedData.length;
    displayCleanedData();
    updateStats();
    
    showMessage(`Removed ${removed} empty rows!`, 'success');
}

// Function to validate and fix email addresses
function validateEmails() {
    if (rawData.length === 0) {
        showMessage('Please load data first!', 'error');
        return;
    }

    let emailsFixed = 0;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    cleanedData.forEach(row => {
        // Look for email columns (common names)
        const emailColumns = Object.keys(row).filter(key => 
            key.toLowerCase().includes('email') || key.toLowerCase().includes('mail')
        );

        emailColumns.forEach(column => {
            const email = row[column];
            if (email && !emailRegex.test(email)) {
                // Try to fix common email issues
                let fixedEmail = email.toLowerCase().trim();
                
                // Fix missing @ symbol
                if (!fixedEmail.includes('@') && fixedEmail.includes(' at ')) {
                    fixedEmail = fixedEmail.replace(' at ', '@');
                    emailsFixed++;
                }
                // Fix missing dots
                else if (fixedEmail.includes('@') && !fixedEmail.includes('.')) {
                    fixedEmail += '.com';
                    emailsFixed++;
                }
                // Fix double @@ symbols
                else if ((fixedEmail.match(/@/g) || []).length > 1) {
                    fixedEmail = fixedEmail.replace(/@@+/g, '@');
                    emailsFixed++;
                }
                
                row[column] = fixedEmail;
            }
        });
    });

    stats.emailsFixed = emailsFixed;
    stats.cleanedRows = cleanedData.length;
    displayCleanedData();
    updateStats();
    
    showMessage(`Fixed ${emailsFixed} email addresses!`, 'success');
}

// Function to standardize phone numbers
function standardizePhones() {
    if (rawData.length === 0) {
        showMessage('Please load data first!', 'error');
        return;
    }

    let phonesFixed = 0;

    cleanedData.forEach(row => {
        // Look for phone columns
        const phoneColumns = Object.keys(row).filter(key => 
            key.toLowerCase().includes('phone') || 
            key.toLowerCase().includes('tel') ||
            key.toLowerCase().includes('mobile')
        );

        phoneColumns.forEach(column => {
            let phone = row[column];
            if (phone && phone.trim() !== '') {
                // Remove all non-digit characters
                const digitsOnly = phone.replace(/\D/g, '');
                
                // Format US phone numbers (10 digits)
                if (digitsOnly.length === 10) {
                    const formatted = `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
                    if (formatted !== phone) {
                        row[column] = formatted;
                        phonesFixed++;
                    }
                }
                // Format US phone numbers with country code (11 digits starting with 1)
                else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
                    const formatted = `+1 (${digitsOnly.slice(1,4)}) ${digitsOnly.slice(4,7)}-${digitsOnly.slice(7)}`;
                    if (formatted !== phone) {
                        row[column] = formatted;
                        phonesFixed++;
                    }
                }
            }
        });
    });

    stats.phonesFixed = phonesFixed;
    stats.cleanedRows = cleanedData.length;
    displayCleanedData();
    updateStats();
    
    showMessage(`Standardized ${phonesFixed} phone numbers!`, 'success');
}

// Function to clean all data at once
function cleanAllData() {
    if (rawData.length === 0) {
        showMessage('Please load data first!', 'error');
        return;
    }

    // Reset cleaned data
    cleanedData = [...rawData];
    stats.emailsFixed = 0;
    stats.phonesFixed = 0;

    // Run all cleaning functions
    removeEmptyRows();
    validateEmails();
    standardizePhones();

    showMessage('All data cleaning completed!', 'success');
}

// Function to update statistics display
function updateStats() {
    document.getElementById('originalRows').textContent = stats.originalRows;
    document.getElementById('cleanedRows').textContent = stats.cleanedRows;
    document.getElementById('emailsFixed').textContent = stats.emailsFixed;
    document.getElementById('phonesFixed').textContent = stats.phonesFixed;
}

// Function to show success/error messages
function showMessage(message, type) {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Insert after the upload section
    const uploadSection = document.querySelector('.upload-section');
    uploadSection.insertAdjacentElement('afterend', messageDiv);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}