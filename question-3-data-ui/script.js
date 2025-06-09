// Excel Data UI - JavaScript
class ExcelDataUI {
    constructor() {
        this.workbook = null;
        this.currentSheet = null;
        this.currentData = [];
        this.filteredData = [];
        this.chart = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterData(e.target.value);
        });
        
        document.getElementById('columnFilter').addEventListener('change', () => {
            this.applyColumnFilter();
        });
        
        document.getElementById('filterValue').addEventListener('input', () => {
            this.applyColumnFilter();
        });

        // View controls
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.switchView('grid');
        });
        
        document.getElementById('chartViewBtn').addEventListener('click', () => {
            this.switchView('chart');
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Chart controls
        document.getElementById('generateChartBtn').addEventListener('click', () => {
            this.generateChart();
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    async processFile(file) {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            this.showError('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }

        this.showLoading(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellStyles: true,
                cellFormulas: true,
                cellDates: true
            });

            this.createSheetTabs();
            this.loadSheet(this.workbook.SheetNames[0]);
            this.showDataSection();
            this.showSuccess(`Excel file "${file.name}" loaded successfully!`);
            
            // Enable export button
            document.getElementById('exportBtn').disabled = false;
            document.getElementById('createChartBtn').disabled = false;
            
        } catch (error) {
            console.error('Error processing file:', error);
            this.showError('Error processing Excel file. Please check the file format.');
        } finally {
            this.showLoading(false);
        }
    }

    createSheetTabs() {
        const tabsContainer = document.getElementById('sheetTabs');
        tabsContainer.innerHTML = '';

        this.workbook.SheetNames.forEach((sheetName, index) => {
            const tab = document.createElement('div');
            tab.className = `sheet-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = sheetName;
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadSheet(sheetName);
            });
            tabsContainer.appendChild(tab);
        });
    }

    loadSheet(sheetName) {
        this.currentSheet = sheetName;
        const worksheet = this.workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        this.currentData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false
        });

        if (this.currentData.length === 0) {
            this.showError('Selected sheet appears to be empty');
            return;
        }

        this.filteredData = [...this.currentData];
        this.displayData();
        this.updateDataInfo();
        this.setupColumnFilters();
        this.setupChartControls();
    }

    displayData() {
        const table = document.getElementById('dataTable');
        table.innerHTML = '';

        if (this.filteredData.length === 0) {
            table.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
            return;
        }

        // Create header
        const headerRow = document.createElement('tr');
        const headers = this.filteredData[0] || [];
        
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header || `Column ${index + 1}`;
            th.addEventListener('click', () => this.sortByColumn(index));
            th.style.cursor = 'pointer';
            th.title = 'Click to sort';
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Create data rows
        for (let i = 1; i < this.filteredData.length; i++) {
            const row = document.createElement('tr');
            const rowData = this.filteredData[i] || [];
            
            headers.forEach((header, colIndex) => {
                const td = document.createElement('td');
                td.textContent = rowData[colIndex] || '';
                td.addEventListener('click', () => this.editCell(td, i, colIndex));
                row.appendChild(td);
            });
            
            table.appendChild(row);
        }
    }

    editCell(cell, rowIndex, colIndex) {
        if (cell.classList.contains('editing')) return;

        const originalValue = cell.textContent;
        cell.classList.add('editing');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalValue;
        input.addEventListener('blur', () => this.saveCell(cell, input, rowIndex, colIndex));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
        
        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
        input.select();
    }

    saveCell(cell, input, rowIndex, colIndex) {
        const newValue = input.value;
        
        // Update data
        if (!this.filteredData[rowIndex]) {
            this.filteredData[rowIndex] = [];
        }
        this.filteredData[rowIndex][colIndex] = newValue;
        
        // Update display
        cell.classList.remove('editing');
        cell.textContent = newValue;
        
        this.showSuccess('Cell updated successfully!');
    }

    filterData(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredData = [...this.currentData];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredData = this.currentData.filter((row, index) => {
                if (index === 0) return true; // Keep header
                return row.some(cell => 
                    cell && cell.toString().toLowerCase().includes(term)
                );
            });
        }
        
        this.displayData();
        this.updateDataInfo();
    }

    setupColumnFilters() {
        const columnFilter = document.getElementById('columnFilter');
        columnFilter.innerHTML = '<option value="">Filter by column...</option>';
        
        if (this.currentData.length > 0) {
            const headers = this.currentData[0] || [];
            headers.forEach((header, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = header || `Column ${index + 1}`;
                columnFilter.appendChild(option);
            });
        }
    }

    applyColumnFilter() {
        const columnIndex = document.getElementById('columnFilter').value;
        const filterValue = document.getElementById('filterValue').value.toLowerCase();
        
        if (!columnIndex || !filterValue) {
            this.filteredData = [...this.currentData];
        } else {
            this.filteredData = this.currentData.filter((row, index) => {
                if (index === 0) return true; // Keep header
                const cellValue = row[parseInt(columnIndex)] || '';
                return cellValue.toString().toLowerCase().includes(filterValue);
            });
        }
        
        this.displayData();
        this.updateDataInfo();
    }

    sortByColumn(columnIndex) {
        const header = this.filteredData[0];
        const dataRows = this.filteredData.slice(1);
        
        dataRows.sort((a, b) => {
            const aVal = a[columnIndex] || '';
            const bVal = b[columnIndex] || '';
            
            // Try to parse as numbers first
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            
            // String comparison
            return aVal.toString().localeCompare(bVal.toString());
        });
        
        this.filteredData = [header, ...dataRows];
        this.displayData();
        this.showSuccess(`Sorted by ${header[columnIndex] || `Column ${columnIndex + 1}`}`);
    }

    setupChartControls() {
        const xAxisSelect = document.getElementById('xAxisColumn');
        const yAxisSelect = document.getElementById('yAxisColumn');
        
        // Clear existing options
        xAxisSelect.innerHTML = '';
        yAxisSelect.innerHTML = '';
        
        if (this.currentData.length > 0) {
            const headers = this.currentData[0] || [];
            headers.forEach((header, index) => {
                const xOption = document.createElement('option');
                xOption.value = index;
                xOption.textContent = header || `Column ${index + 1}`;
                xAxisSelect.appendChild(xOption);
                
                const yOption = document.createElement('option');
                yOption.value = index;
                yOption.textContent = header || `Column ${index + 1}`;
                yAxisSelect.appendChild(yOption);
            });
            
            // Set default selections
            if (headers.length >= 2) {
                xAxisSelect.selectedIndex = 0;
                yAxisSelect.selectedIndex = 1;
            }
        }
    }

    switchView(view) {
        const gridView = document.getElementById('gridView');
        const chartView = document.getElementById('chartView');
        const gridBtn = document.getElementById('gridViewBtn');
        const chartBtn = document.getElementById('chartViewBtn');
        
        if (view === 'grid') {
            gridView.style.display = 'block';
            chartView.style.display = 'none';
            gridBtn.classList.add('active');
            chartBtn.classList.remove('active');
        } else {
            gridView.style.display = 'none';
            chartView.style.display = 'block';
            gridBtn.classList.remove('active');
            chartBtn.classList.add('active');
        }
    }

    generateChart() {
        const chartType = document.getElementById('chartType').value;
        const xAxisIndex = parseInt(document.getElementById('xAxisColumn').value);
        const yAxisIndex = parseInt(document.getElementById('yAxisColumn').value);
        
        if (isNaN(xAxisIndex) || isNaN(yAxisIndex)) {
            this.showError('Please select both X and Y axis columns');
            return;
        }
        
        if (this.filteredData.length < 2) {
            this.showError('Not enough data to create chart');
            return;
        }
        
        // Prepare chart data
        const labels = [];
        const data = [];
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', 
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
        ];
        
        // Skip header row
        for (let i = 1; i < Math.min(this.filteredData.length, 21); i++) { // Limit to 20 data points
            const row = this.filteredData[i];
            if (row && row[xAxisIndex] && row[yAxisIndex]) {
                labels.push(row[xAxisIndex].toString());
                const value = parseFloat(row[yAxisIndex]);
                data.push(isNaN(value) ? 0 : value);
            }
        }
        
        if (labels.length === 0) {
            this.showError('No valid data found for chart generation');
            return;
        }
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Create new chart
        const ctx = document.getElementById('dataChart').getContext('2d');
        const chartConfig = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: this.filteredData[0][yAxisIndex] || 'Data',
                    data: data,
                    backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
                        ? colors.slice(0, data.length)
                        : colors[0] + '80',
                    borderColor: colors[0],
                    borderWidth: 2,
                    fill: chartType === 'line' ? false : true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${this.filteredData[0][yAxisIndex] || 'Data'} by ${this.filteredData[0][xAxisIndex] || 'Category'}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: chartType === 'pie' || chartType === 'doughnut',
                        position: 'bottom'
                    }
                },
                scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
                    x: {
                        title: {
                            display: true,
                            text: this.filteredData[0][xAxisIndex] || 'X Axis'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.filteredData[0][yAxisIndex] || 'Y Axis'
                        },
                        beginAtZero: true
                    }
                }
            }
        };
        
        this.chart = new Chart(ctx, chartConfig);
        this.showSuccess(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart generated successfully!`);
    }

    exportData() {
        if (!this.currentData || this.currentData.length === 0) {
            this.showError('No data to export');
            return;
        }
        
        try {
            // Create new workbook
            const newWorkbook = XLSX.utils.book_new();
            
            // Convert current filtered data to worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(this.filteredData);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(newWorkbook, worksheet, this.currentSheet || 'Sheet1');
            
            // Generate Excel file
            const fileName = `exported_data_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(newWorkbook, fileName);
            
            this.showSuccess(`Data exported successfully as ${fileName}`);
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Error exporting data. Please try again.');
        }
    }

    updateDataInfo() {
        const info = document.getElementById('dataInfo');
        const rowCount = Math.max(0, this.filteredData.length - 1); // Subtract header
        const colCount = this.filteredData.length > 0 ? this.filteredData[0].length : 0;
        info.textContent = `${rowCount} rows, ${colCount} columns`;
    }

    showDataSection() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('dataSection').style.display = 'block';
    }

    showLoading(show) {
        const uploadSection = document.getElementById('uploadSection');
        const loadingSection = document.getElementById('loadingSection');
        
        if (show) {
            uploadSection.style.display = 'none';
            loadingSection.style.display = 'flex';
        } else {
            loadingSection.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageEl = document.getElementById(type + 'Message');
        const textEl = messageEl.querySelector('.message-text');
        
        textEl.textContent = message;
        messageEl.classList.add('show');
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 4000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ExcelDataUI();
});

// Sample data generator for testing
function generateSampleExcel() {
    const sampleData = [
        ['Product', 'Category', 'Price', 'Sales', 'Rating'],
        ['Laptop Pro', 'Electronics', 1299.99, 150, 4.5],
        ['Gaming Mouse', 'Electronics', 79.99, 300, 4.8],
        ['Office Chair', 'Furniture', 299.99, 75, 4.2],
        ['Wireless Headphones', 'Electronics', 199.99, 200, 4.6],
        ['Standing Desk', 'Furniture', 599.99, 45, 4.7],
        ['Smartphone', 'Electronics', 799.99, 250, 4.4],
        ['Coffee Maker', 'Appliances', 149.99, 120, 4.3],
        ['Tablet', 'Electronics', 399.99, 180, 4.5],
        ['Bookshelf', 'Furniture', 159.99, 60, 4.1],
        ['Bluetooth Speaker', 'Electronics', 89.99, 220, 4.7]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Add second sheet
    const salesData = [
        ['Month', 'Revenue', 'Orders', 'Customers'],
        ['January', 45000, 120, 85],
        ['February', 52000, 140, 95],
        ['March', 48000, 130, 88],
        ['April', 61000, 165, 110],
        ['May', 55000, 150, 102],
        ['June', 67000, 180, 125]
    ];
    
    const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales');
    
    XLSX.writeFile(workbook, 'sample_excel_data.xlsx');
}

// Add sample data generator button (for testing)
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header-right');
    const sampleBtn = document.createElement('button');
    sampleBtn.className = 'btn btn-secondary';
    sampleBtn.innerHTML = '<span>📋</span> Generate Sample Excel';
    sampleBtn.onclick = generateSampleExcel;
    header.appendChild(sampleBtn);
});