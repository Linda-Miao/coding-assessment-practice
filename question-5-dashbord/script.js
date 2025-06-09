// Database Management Interface - JavaScript
class DatabaseManager {
    constructor() {
        this.db = null;
        this.tables = new Map();
        this.queryHistory = [];
        this.savedQueries = new Map();
        this.currentPage = 1;
        this.recordsPerPage = 10;
        this.currentTable = null;
        this.chart = null;
        this.queryCount = 0;
        
        this.initializeDatabase();
        this.initializeEventListeners();
        this.loadSampleData();
    }

    async initializeDatabase() {
        try {
            // Initialize SQL.js
            const SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
            
            this.db = new SQL.Database();
            this.showSuccess('Database initialized successfully!');
            this.updateStatus('connected');
            
        } catch (error) {
            console.error('Failed to initialize database:', error);
            this.showError('Failed to initialize database');
            this.updateStatus('disconnected');
        }
    }

    initializeEventListeners() {
        // Header controls
        document.getElementById('importBtn').addEventListener('click', () => this.openImportModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportDatabase());
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Query editor
        document.getElementById('runQueryBtn').addEventListener('click', () => this.executeQuery());
        document.getElementById('saveQueryBtn').addEventListener('click', () => this.saveQuery());
        document.getElementById('savedQueries').addEventListener('change', (e) => this.loadSavedQuery(e.target.value));
        
        // Browse controls
        document.getElementById('tableSelect').addEventListener('change', (e) => this.browseTable(e.target.value));
        document.getElementById('searchData').addEventListener('input', (e) => this.searchData(e.target.value));
        document.getElementById('addRecordBtn').addEventListener('click', () => this.openAddRecordModal());
        document.getElementById('prevPage').addEventListener('click', () => this.changePage(-1));
        document.getElementById('nextPage').addEventListener('click', () => this.changePage(1));
        
        // Analytics
        document.getElementById('generateAnalyticsBtn').addEventListener('click', () => this.generateAnalytics());
        
        // Schema/Table creation
        document.getElementById('createTableBtn').addEventListener('click', () => this.openCreateTableModal());
        document.getElementById('addTableBtn').addEventListener('click', () => this.openCreateTableModal());
        document.getElementById('addColumnBtn').addEventListener('click', () => this.addColumnField());
        document.getElementById('createTableForm').addEventListener('submit', (e) => this.createTable(e));
        document.getElementById('addRecordForm').addEventListener('submit', (e) => this.addRecord(e));
        
        // Import controls
        document.getElementById('loadSampleBtn').addEventListener('click', () => this.loadSampleData());
        document.getElementById('importCsvBtn').addEventListener('click', () => this.importCSV());
        document.getElementById('importJsonBtn').addEventListener('click', () => this.importJSON());
        
        // Modal controls
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.closeModals();
                }
            });
        });
        
        // Enable SQL editor shortcuts
        document.getElementById('sqlEditor').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.executeQuery();
            }
        });
    }

    async loadSampleData() {
        if (!this.db) {
            this.showError('Database not initialized');
            return;
        }

        try {
            // Create sample tables
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    age INTEGER,
                    department TEXT,
                    salary REAL,
                    hire_date DATE
                );
            `);

            this.db.run(`
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    start_date DATE,
                    end_date DATE,
                    budget REAL,
                    status TEXT DEFAULT 'Active'
                );
            `);

            this.db.run(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    project_id INTEGER,
                    assigned_to INTEGER,
                    priority TEXT DEFAULT 'Medium',
                    status TEXT DEFAULT 'Open',
                    created_date DATE,
                    FOREIGN KEY(project_id) REFERENCES projects(id),
                    FOREIGN KEY(assigned_to) REFERENCES users(id)
                );
            `);

            // Insert sample data
            const users = [
                ['Alice Johnson', 'alice@company.com', 28, 'Engineering', 75000, '2022-01-15'],
                ['Bob Smith', 'bob@company.com', 35, 'Marketing', 65000, '2021-06-20'],
                ['Carol Davis', 'carol@company.com', 31, 'Engineering', 80000, '2020-03-10'],
                ['David Wilson', 'david@company.com', 29, 'Sales', 60000, '2023-02-28'],
                ['Eva Brown', 'eva@company.com', 26, 'Design', 55000, '2023-05-15'],
                ['Frank Miller', 'frank@company.com', 42, 'Engineering', 95000, '2019-08-05'],
                ['Grace Lee', 'grace@company.com', 33, 'HR', 58000, '2021-11-12'],
                ['Henry Taylor', 'henry@company.com', 37, 'Finance', 72000, '2020-09-18']
            ];

            users.forEach(user => {
                this.db.run(
                    'INSERT INTO users (name, email, age, department, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
                    user
                );
            });

            const projects = [
                ['Website Redesign', 'Complete overhaul of company website', '2024-01-01', '2024-06-30', 150000, 'Active'],
                ['Mobile App', 'Development of mobile application', '2024-02-15', '2024-12-31', 250000, 'Active'],
                ['Data Migration', 'Migrate legacy systems to cloud', '2023-10-01', '2024-03-31', 100000, 'Completed'],
                ['AI Integration', 'Implement AI features across products', '2024-03-01', '2024-11-30', 300000, 'Active'],
                ['Security Audit', 'Comprehensive security review', '2024-01-15', '2024-04-15', 75000, 'Completed']
            ];

            projects.forEach(project => {
                this.db.run(
                    'INSERT INTO projects (name, description, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?)',
                    project
                );
            });

            const tasks = [
                ['Design Homepage', 'Create new homepage design', 1, 5, 'High', 'Completed', '2024-01-05'],
                ['Develop Backend API', 'Build RESTful API endpoints', 2, 1, 'High', 'In Progress', '2024-02-20'],
                ['Database Schema', 'Design database structure', 2, 3, 'Medium', 'Completed', '2024-02-18'],
                ['User Testing', 'Conduct user experience testing', 1, 2, 'Medium', 'Open', '2024-03-01'],
                ['Security Review', 'Review security protocols', 5, 6, 'Critical', 'In Progress', '2024-01-20'],
                ['Mobile UI Design', 'Design mobile interface', 2, 5, 'High', 'Open', '2024-03-10'],
                ['Performance Optimization', 'Optimize application performance', 1, 3, 'Medium', 'Open', '2024-03-15'],
                ['Documentation', 'Write technical documentation', 4, 1, 'Low', 'Open', '2024-03-05']
            ];

            tasks.forEach(task => {
                this.db.run(
                    'INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    task
                );
            });

            this.refreshTables();
            this.updateMetrics();
            this.showSuccess('Sample database loaded successfully!');

        } catch (error) {
            console.error('Error loading sample data:', error);
            this.showError('Failed to load sample data: ' + error.message);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // Initialize tab-specific content
        if (tabName === 'browse') {
            this.initializeBrowseTab();
        } else if (tabName === 'analytics') {
            this.initializeAnalyticsTab();
        } else if (tabName === 'schema') {
            this.initializeSchemaTab();
        }
    }

    executeQuery() {
        const query = document.getElementById('sqlEditor').value.trim();
        if (!query) {
            this.showError('Please enter a SQL query');
            return;
        }

        if (!this.db) {
            this.showError('Database not initialized');
            return;
        }

        try {
            const startTime = performance.now();
            
            if (query.toLowerCase().startsWith('select')) {
                const stmt = this.db.prepare(query);
                const results = [];
                
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                
                this.displayQueryResults(results, query);
            } else {
                this.db.run(query);
                this.displayQueryResults([], query, 'Query executed successfully');
                this.refreshTables();
                this.updateMetrics();
            }
            
            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime);
            
            this.queryCount++;
            this.queryHistory.push({
                query: query,
                timestamp: new Date(),
                executionTime: executionTime
            });
            
            this.updateQueryInfo(`Query executed in ${executionTime}ms`);
            this.updateMetrics();
            
        } catch (error) {
            console.error('Query error:', error);
            this.showError('Query error: ' + error.message);
            this.updateQueryInfo('Query failed: ' + error.message);
        }
    }

    displayQueryResults(results, query, message = null) {
        const resultsContainer = document.getElementById('queryResults');
        
        if (message) {
            resultsContainer.innerHTML = `<div class="query-success">${message}</div>`;
            return;
        }
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }
        
        const headers = Object.keys(results[0]);
        let tableHTML = '<table><thead><tr>';
        
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        results.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => {
                tableHTML += `<td>${row[header] !== null ? row[header] : 'NULL'}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        resultsContainer.innerHTML = tableHTML;
        
        this.updateQueryInfo(`${results.length} rows returned`);
    }

    refreshTables() {
        if (!this.db) return;
        
        try {
            const stmt = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            const tables = [];
            
            while (stmt.step()) {
                const tableName = stmt.getAsObject().name;
                tables.push(tableName);
                
                // Get table info
                const infoStmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
                const columns = [];
                let recordCount = 0;
                
                while (infoStmt.step()) {
                    columns.push(infoStmt.getAsObject());
                }
                infoStmt.free();
                
                // Get record count
                const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
                if (countStmt.step()) {
                    recordCount = countStmt.getAsObject().count;
                }
                countStmt.free();
                
                this.tables.set(tableName, {
                    name: tableName,
                    columns: columns,
                    recordCount: recordCount
                });
            }
            stmt.free();
            
            this.updateTablesDisplay();
            this.updateTableSelects();
            
        } catch (error) {
            console.error('Error refreshing tables:', error);
        }
    }

    updateTablesDisplay() {
        const tablesList = document.getElementById('tablesList');
        tablesList.innerHTML = '';
        
        this.tables.forEach((table, tableName) => {
            const tableItem = document.createElement('div');
            tableItem.className = 'table-item';
            tableItem.innerHTML = `
                <div class="table-name">${tableName}</div>
                <div class="table-info">${table.columns.length} columns, ${table.recordCount} records</div>
            `;
            
            tableItem.addEventListener('click', () => {
                document.querySelectorAll('.table-item').forEach(item => item.classList.remove('active'));
                tableItem.classList.add('active');
                this.selectTable(tableName);
            });
            
            tablesList.appendChild(tableItem);
        });
    }

    updateTableSelects() {
        const selects = ['tableSelect', 'analyticsTable'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select table...</option>';
                
                this.tables.forEach((table, tableName) => {
                    const option = document.createElement('option');
                    option.value = tableName;
                    option.textContent = tableName;
                    select.appendChild(option);
                });
            }
        });
    }

    selectTable(tableName) {
        this.currentTable = tableName;
        this.currentPage = 1;
        
        // Update browse tab if active
        if (document.getElementById('browseTab').classList.contains('active')) {
            document.getElementById('tableSelect').value = tableName;
            this.browseTable(tableName);
        }
    }

    initializeBrowseTab() {
        if (this.currentTable) {
            this.browseTable(this.currentTable);
        }
    }

    browseTable(tableName) {
        if (!tableName || !this.db) return;
        
        this.currentTable = tableName;
        this.currentPage = 1;
        
        this.displayTableData();
    }

    displayTableData() {
        if (!this.currentTable || !this.db) return;
        
        try {
            const offset = (this.currentPage - 1) * this.recordsPerPage;
            const stmt = this.db.prepare(`SELECT * FROM ${this.currentTable} LIMIT ${this.recordsPerPage} OFFSET ${offset}`);
            const results = [];
            
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            
            const dataTable = document.getElementById('dataTable');
            
            if (results.length === 0) {
                dataTable.innerHTML = '<div class="no-data">No data in this table</div>';
                return;
            }
            
            const headers = Object.keys(results[0]);
            let tableHTML = '<table><thead><tr>';
            
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';
            
            results.forEach((row, rowIndex) => {
                tableHTML += '<tr>';
                headers.forEach(header => {
                    tableHTML += `<td>${row[header] !== null ? row[header] : 'NULL'}</td>`;
                });
                tableHTML += '</tr>';
            });
            
            tableHTML += '</tbody></table>';
            dataTable.innerHTML = tableHTML;
            
            this.updatePagination();
            
        } catch (error) {
            console.error('Error displaying table data:', error);
            this.showError('Error loading table data: ' + error.message);
        }
    }

    updatePagination() {
        if (!this.currentTable || !this.db) return;
        
        try {
            const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.currentTable}`);
            let totalRecords = 0;
            
            if (stmt.step()) {
                totalRecords = stmt.getAsObject().count;
            }
            stmt.free();
            
            const totalPages = Math.ceil(totalRecords / this.recordsPerPage);
            
            document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of ${totalPages}`;
            document.getElementById('prevPage').disabled = this.currentPage <= 1;
            document.getElementById('nextPage').disabled = this.currentPage >= totalPages;
            
        } catch (error) {
            console.error('Error updating pagination:', error);
        }
    }

    changePage(direction) {
        this.currentPage += direction;
        this.displayTableData();
    }

    initializeAnalyticsTab() {
        this.initializeAnalyticsChart();
    }

    initializeAnalyticsChart() {
        const ctx = document.getElementById('analyticsChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Count',
                    data: [],
                    backgroundColor: 'rgba(26, 54, 93, 0.8)',
                    borderColor: 'rgba(26, 54, 93, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Database Analytics'
                    }
                }
            }
        });
    }

    generateAnalytics() {
        const tableName = document.getElementById('analyticsTable').value;
        const analyticsType = document.getElementById('analyticsType').value;
        
        if (!tableName) {
            this.showError('Please select a table for analytics');
            return;
        }
        
        try {
            switch (analyticsType) {
                case 'distribution':
                    this.generateDistributionAnalytics(tableName);
                    break;
                case 'trends':
                    this.generateTrendAnalytics(tableName);
                    break;
                case 'summary':
                    this.generateSummaryAnalytics(tableName);
                    break;
            }
        } catch (error) {
            console.error('Analytics error:', error);
            this.showError('Error generating analytics: ' + error.message);
        }
    }

    generateDistributionAnalytics(tableName) {
        const table = this.tables.get(tableName);
        if (!table) return;
        
        // Find a suitable column for distribution (text columns work well)
        const textColumn = table.columns.find(col => col.type === 'TEXT' || col.name === 'department' || col.name === 'status');
        
        if (!textColumn) {
            this.showError('No suitable column found for distribution analysis');
            return;
        }
        
        const stmt = this.db.prepare(`SELECT ${textColumn.name}, COUNT(*) as count FROM ${tableName} GROUP BY ${textColumn.name} ORDER BY count DESC`);
        const results = [];
        
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        
        const labels = results.map(r => r[textColumn.name] || 'NULL');
        const data = results.map(r => r.count);
        
        this.updateChart(labels, data, `Distribution by ${textColumn.name}`);
        this.updateStatsDisplay(results, 'distribution');
    }

    generateTrendAnalytics(tableName) {
        const table = this.tables.get(tableName);
        if (!table) return;
        
        // Find a date column
        const dateColumn = table.columns.find(col => 
            col.name.includes('date') || col.name.includes('created') || col.name.includes('hire')
        );
        
        if (!dateColumn) {
            this.showError('No date column found for trend analysis');
            return;
        }
        
        const stmt = this.db.prepare(`
            SELECT strftime('%Y-%m', ${dateColumn.name}) as month, COUNT(*) as count 
            FROM ${tableName} 
            WHERE ${dateColumn.name} IS NOT NULL 
            GROUP BY month 
            ORDER BY month
        `);
        const results = [];
        
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        
        const labels = results.map(r => r.month);
        const data = results.map(r => r.count);
        
        this.chart.config.type = 'line';
        this.updateChart(labels, data, `Trends by ${dateColumn.name}`);
        this.updateStatsDisplay(results, 'trends');
    }

    generateSummaryAnalytics(tableName) {
        const table = this.tables.get(tableName);
        if (!table) return;
        
        // Find numeric columns
        const numericColumns = table.columns.filter(col => 
            col.type === 'INTEGER' || col.type === 'REAL' || 
            col.name.includes('salary') || col.name.includes('budget') || col.name.includes('age')
        );
        
        if (numericColumns.length === 0) {
            this.showError('No numeric columns found for summary analysis');
            return;
        }
        
        const column = numericColumns[0];
        const stmt = this.db.prepare(`
            SELECT 
                COUNT(*) as count,
                AVG(${column.name}) as avg,
                MIN(${column.name}) as min,
                MAX(${column.name}) as max,
                SUM(${column.name}) as sum
            FROM ${tableName} 
            WHERE ${column.name} IS NOT NULL
        `);
        
        let stats = {};
        if (stmt.step()) {
            stats = stmt.getAsObject();
        }
        stmt.free();
        
        // Create a simple bar chart for min, avg, max
        const labels = ['Minimum', 'Average', 'Maximum'];
        const data = [stats.min, stats.avg, stats.max];
        
        this.updateChart(labels, data, `Summary Statistics for ${column.name}`);
        this.updateStatsDisplay([stats], 'summary');
    }

    updateChart(labels, data, title) {
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.options.plugins.title.text = title;
        this.chart.update();
    }

    updateStatsDisplay(data, type) {
        const statsDisplay = document.getElementById('statsDisplay');
        let statsHTML = '';
        
        if (type === 'distribution') {
            statsHTML = '<div class="stats-list">';
            data.forEach(item => {
                const key = Object.keys(item)[0];
                statsHTML += `
                    <div class="stat-item">
                        <span class="stat-label">${item[key]}</span>
                        <span class="stat-value">${item.count}</span>
                    </div>
                `;
            });
            statsHTML += '</div>';
        } else if (type === 'summary') {
            const stats = data[0];
            statsHTML = `
                <div class="stats-list">
                    <div class="stat-item">
                        <span class="stat-label">Count</span>
                        <span class="stat-value">${stats.count}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Average</span>
                        <span class="stat-value">${stats.avg ? stats.avg.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Minimum</span>
                        <span class="stat-value">${stats.min}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Maximum</span>
                        <span class="stat-value">${stats.max}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Sum</span>
                        <span class="stat-value">${stats.sum ? stats.sum.toFixed(2) : 'N/A'}</span>
                    </div>
                </div>
            `;
        }
        
        statsDisplay.innerHTML = statsHTML;
    }

    initializeSchemaTab() {
        this.renderSchemaCanvas();
    }

    renderSchemaCanvas() {
        const canvas = document.getElementById('schemaCanvas');
        canvas.innerHTML = '';
        
        if (this.tables.size === 0) {
            canvas.innerHTML = '<div>No tables in database. Create a table to see schema visualization.</div>';
            return;
        }
        
        let x = 50;
        let y = 50;
        const tableWidth = 200;
        const tableHeight = 150;
        const spacing = 250;
        
        this.tables.forEach((table, tableName) => {
            const tableDiv = document.createElement('div');
            tableDiv.className = 'schema-table';
            tableDiv.style.left = x + 'px';
            tableDiv.style.top = y + 'px';
            
            let columnsHTML = '';
            table.columns.forEach(column => {
                const isPrimaryKey = column.pk === 1;
                const keyIcon = isPrimaryKey ? ' 🔑' : '';
                columnsHTML += `
                    <div class="schema-column">
                        <span class="column-name">${column.name}${keyIcon}</span>
                        <span class="column-type">${column.type}</span>
                    </div>
                `;
            });
            
            tableDiv.innerHTML = `
                <div class="schema-table-header">${tableName}</div>
                ${columnsHTML}
            `;
            
            canvas.appendChild(tableDiv);
            
            x += spacing;
            if (x > canvas.offsetWidth - tableWidth) {
                x = 50;
                y += tableHeight + 50;
            }
        });
    }

    openCreateTableModal() {
        document.getElementById('createTableModal').classList.add('show');
        this.addColumnField(); // Add one initial column field
    }

    addColumnField() {
        const container = document.getElementById('columnsContainer');
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column-definition';
        
        columnDiv.innerHTML = `
            <div class="column-row">
                <div class="form-group">
                    <label>Column Name</label>
                    <input type="text" class="column-name" required>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select class="column-type">
                        <option value="TEXT">TEXT</option>
                        <option value="INTEGER">INTEGER</option>
                        <option value="REAL">REAL</option>
                        <option value="DATE">DATE</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Options</label>
                    <select class="column-options">
                        <option value="">None</option>
                        <option value="PRIMARY KEY AUTOINCREMENT">Primary Key (Auto)</option>
                        <option value="NOT NULL">Not Null</option>
                        <option value="UNIQUE">Unique</option>
                    </select>
                </div>
                <button type="button" class="remove-column" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        container.appendChild(columnDiv);
    }

    createTable(event) {
        event.preventDefault();
        
        const tableName = document.getElementById('tableName').value.trim();
        if (!tableName) {
            this.showError('Please enter a table name');
            return;
        }
        
        const columnDefinitions = [];
        document.querySelectorAll('.column-definition').forEach(columnDiv => {
            const name = columnDiv.querySelector('.column-name').value.trim();
            const type = columnDiv.querySelector('.column-type').value;
            const options = columnDiv.querySelector('.column-options').value;
            
            if (name) {
                columnDefinitions.push(`${name} ${type} ${options}`.trim());
            }
        });
        
        if (columnDefinitions.length === 0) {
            this.showError('Please add at least one column');
            return;
        }
        
        try {
            const createSQL = `CREATE TABLE ${tableName} (${columnDefinitions.join(', ')})`;
            this.db.run(createSQL);
            
            this.refreshTables();
            this.updateMetrics();
            this.closeModals();
            this.showSuccess(`Table "${tableName}" created successfully!`);
            
        } catch (error) {
            console.error('Error creating table:', error);
            this.showError('Error creating table: ' + error.message);
        }
    }

    updateMetrics() {
        document.getElementById('tableCount').textContent = this.tables.size;
        
        let totalRecords = 0;
        this.tables.forEach(table => {
            totalRecords += table.recordCount;
        });
        document.getElementById('recordCount').textContent = totalRecords.toLocaleString();
        document.getElementById('queryCount').textContent = this.queryCount;
        
        // Estimate database size (rough calculation)
        const dbSize = Math.round(totalRecords * 100 / 1024); // Rough estimate in KB
        document.getElementById('dbSize').textContent = dbSize + ' KB';
    }

    updateQueryInfo(info) {
        document.getElementById('resultsInfo').textContent = info;
    }

    updateStatus(status) {
        const statusEl = document.getElementById('dbStatus');
        const indicator = statusEl.querySelector('.status-indicator');
        const text = statusEl.querySelector('span:last-child');
        
        if (status === 'connected') {
            indicator.className = 'status-indicator online';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'status-indicator offline';
            text.textContent = 'Disconnected';
        }
    }

    saveQuery() {
        const query = document.getElementById('sqlEditor').value.trim();
        if (!query) {
            this.showError('No query to save');
            return;
        }
        
        const name = prompt('Enter a name for this query:');
        if (name) {
            this.savedQueries.set(name, query);
            this.updateSavedQueriesSelect();
            this.showSuccess(`Query saved as "${name}"`);
        }
    }

    loadSavedQuery(queryName) {
        if (!queryName) return;
        
        const query = this.savedQueries.get(queryName);
        if (query) {
            document.getElementById('sqlEditor').value = query;
        }
    }

    updateSavedQueriesSelect() {
        const select = document.getElementById('savedQueries');
        select.innerHTML = '<option value="">Saved Queries...</option>';
        
        this.savedQueries.forEach((query, name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }

    exportDatabase() {
        if (!this.db) {
            this.showError('No database to export');
            return;
        }
        
        try {
            const data = this.db.export();
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'database_export.db';
            a.click();
            
            URL.revokeObjectURL(url);
            this.showSuccess('Database exported successfully!');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Error exporting database: ' + error.message);
        }
    }

    openImportModal() {
        document.getElementById('importModal').classList.add('show');
    }

    openAddRecordModal() {
        if (!this.currentTable) {
            this.showError('Please select a table first');
            return;
        }
        
        this.generateRecordForm();
        document.getElementById('addRecordModal').classList.add('show');
    }

    generateRecordForm() {
        const table = this.tables.get(this.currentTable);
        if (!table) return;
        
        const fieldsContainer = document.getElementById('recordFields');
        fieldsContainer.innerHTML = '';
        
        table.columns.forEach(column => {
            if (column.pk === 1 && column.name.toLowerCase() === 'id') {
                return; // Skip auto-increment primary keys
            }
            
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            
            let inputHTML = '';
            switch (column.type) {
                case 'INTEGER':
                    inputHTML = `<input type="number" name="${column.name}" ${column.notnull ? 'required' : ''}>`;
                    break;
                case 'REAL':
                    inputHTML = `<input type="number" step="0.01" name="${column.name}" ${column.notnull ? 'required' : ''}>`;
                    break;
                case 'DATE':
                    inputHTML = `<input type="date" name="${column.name}" ${column.notnull ? 'required' : ''}>`;
                    break;
                default:
                    inputHTML = `<input type="text" name="${column.name}" ${column.notnull ? 'required' : ''}>`;
            }
            
            fieldDiv.innerHTML = `
                <label>${column.name}</label>
                ${inputHTML}
            `;
            
            fieldsContainer.appendChild(fieldDiv);
        });
    }

    addRecord(event) {
        event.preventDefault();
        
        if (!this.currentTable) {
            this.showError('No table selected');
            return;
        }
        
        const formData = new FormData(event.target);
        const columns = [];
        const values = [];
        const placeholders = [];
        
        for (const [key, value] of formData.entries()) {
            if (value.trim()) {
                columns.push(key);
                values.push(value);
                placeholders.push('?');
            }
        }
        
        if (columns.length === 0) {
            this.showError('Please fill in at least one field');
            return;
        }
        
        try {
            const sql = `INSERT INTO ${this.currentTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
            this.db.run(sql, values);
            
            this.refreshTables();
            this.displayTableData();
            this.updateMetrics();
            this.closeModals();
            this.showSuccess('Record added successfully!');
            
        } catch (error) {
            console.error('Error adding record:', error);
            this.showError('Error adding record: ' + error.message);
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        
        // Reset forms
        document.getElementById('createTableForm').reset();
        document.getElementById('addRecordForm').reset();
        document.getElementById('columnsContainer').innerHTML = '';
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
    window.dbManager = new DatabaseManager();
});

// Add some sample queries for demonstration
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.dbManager) {
            window.dbManager.savedQueries.set('All Users', 'SELECT * FROM users;');
            window.dbManager.savedQueries.set('Users by Department', 'SELECT department, COUNT(*) as count FROM users GROUP BY department;');
            window.dbManager.savedQueries.set('High Salary Users', 'SELECT name, salary FROM users WHERE salary > 70000 ORDER BY salary DESC;');
            window.dbManager.savedQueries.set('Active Projects', 'SELECT * FROM projects WHERE status = "Active";');
            window.dbManager.savedQueries.set('Tasks with Users', 'SELECT t.title, t.status, u.name as assigned_to FROM tasks t JOIN users u ON t.assigned_to = u.id;');
            window.dbManager.updateSavedQueriesSelect();
        }
    }, 2000);
});