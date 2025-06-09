// Dashboard Data Management
let dashboardData = null;
let charts = {};
let currentPage = 1;
const itemsPerPage = 5;

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const totalUsers = document.getElementById('totalUsers');
const totalRevenue = document.getElementById('totalRevenue');
const totalOrders = document.getElementById('totalOrders');
const avgRating = document.getElementById('avgRating');
const lastUpdated = document.getElementById('lastUpdated');
const transactionsBody = document.getElementById('transactionsBody');
const activityFeed = document.getElementById('activityFeed');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initializing...');
    loadDashboardData();
    setupEventListeners();
});

// Load Data from JSON
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Simulate loading delay for demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        
        dashboardData = await response.json();
        console.log('Data loaded successfully:', dashboardData);
        
        // Initialize all dashboard components
        updateSummaryCards();
        createCharts();
        populateTransactionsTable();
        populateActivityFeed();
        updateLastUpdated();
        
        showLoading(false);
        showSuccessMessage('Dashboard loaded successfully!');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showLoading(false);
        showErrorMessage('Failed to load dashboard data. Please try again.');
    }
}

// Update Summary Cards
function updateSummaryCards() {
    if (!dashboardData) return;
    
    const { summary } = dashboardData;
    
    // Animate number counting
    animateNumber(totalUsers, 0, summary.totalUsers, 1000);
    animateNumber(totalRevenue, 0, summary.totalRevenue, 1000, '$', true);
    animateNumber(totalOrders, 0, summary.totalOrders, 1000);
    animateNumber(avgRating, 0, summary.avgRating, 1000, '', false, 1);
}

// Animate Number Counting
function animateNumber(element, start, end, duration, prefix = '', isComma = false, decimals = 0) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (difference * progress);
        let value = current.toFixed(decimals);
        
        if (isComma) {
            value = Number(value).toLocaleString();
        }
        
        element.textContent = prefix + value;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Create Charts
function createCharts() {
    createSalesChart();
    createCategoryChart();
    createActivityChart();
}

// Sales Trend Chart
function createSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const salesData = dashboardData.salesData['6months'];
    
    charts.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesData.labels,
            datasets: [{
                label: 'Monthly Sales',
                data: salesData.values,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Category Distribution Chart
function createCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categoryData = dashboardData.categoryData;
    
    charts.categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.values,
                backgroundColor: categoryData.colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// User Activity Chart
function createActivityChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    const activityData = dashboardData.activityData.all;
    
    charts.activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: activityData.labels,
            datasets: [
                {
                    label: 'Desktop',
                    data: activityData.desktop,
                    backgroundColor: '#667eea',
                    borderRadius: 4
                },
                {
                    label: 'Mobile',
                    data: activityData.mobile,
                    backgroundColor: '#764ba2',
                    borderRadius: 4
                },
                {
                    label: 'Tablet',
                    data: activityData.tablet,
                    backgroundColor: '#f093fb',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Populate Transactions Table
function populateTransactionsTable() {
    if (!dashboardData || !transactionsBody) return;
    
    const transactions = dashboardData.transactions;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTransactions = transactions.slice(startIndex, endIndex);
    
    transactionsBody.innerHTML = '';
    
    pageTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.customer}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td><span class="status-badge status-${transaction.status}">${transaction.status}</span></td>
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.category}</td>
        `;
        transactionsBody.appendChild(row);
    });
    
    updatePagination();
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(dashboardData.transactions.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// Populate Activity Feed
function populateActivityFeed() {
    if (!dashboardData || !activityFeed) return;
    
    const activities = dashboardData.activityFeed;
    activityFeed.innerHTML = '';
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <span class="activity-time">${activity.time}</span>
            <span class="activity-message">${activity.message}</span>
        `;
        activityFeed.appendChild(activityItem);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Data Button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            showSuccessMessage('Refreshing dashboard data...');
            loadDashboardData();
        });
    }
    
    // Export Data Button
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Sales Period Selector
    const salesPeriod = document.getElementById('salesPeriod');
    if (salesPeriod) {
        salesPeriod.addEventListener('change', (e) => {
            updateSalesChart(e.target.value);
        });
    }
    
    // Chart Type Buttons
    const chartTypeBtns = document.querySelectorAll('.chart-type-btn');
    chartTypeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from siblings
            e.target.parentNode.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const chartType = e.target.dataset.type;
            updateCategoryChart(chartType);
        });
    });
    
    // Filter Buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.parentNode.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filter = e.target.dataset.filter;
            updateActivityChart(filter);
        });
    });
    
    // Pagination
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                populateTransactionsTable();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(dashboardData.transactions.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                populateTransactionsTable();
            }
        });
    }
    
    // Search Table
    const searchInput = document.getElementById('searchTable');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTransactions(e.target.value);
        });
    }
    
    // Sort by Date Button
    const sortBtn = document.getElementById('sortDate');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortTransactionsByDate();
        });
    }
}

// Update Sales Chart Period
function updateSalesChart(period) {
    if (!dashboardData || !charts.salesChart) return;
    
    const salesData = dashboardData.salesData[period];
    charts.salesChart.data.labels = salesData.labels;
    charts.salesChart.data.datasets[0].data = salesData.values;
    charts.salesChart.update();
}

// Update Category Chart Type
function updateCategoryChart(type) {
    if (!charts.categoryChart) return;
    
    charts.categoryChart.config.type = type;
    charts.categoryChart.update();
}

// Update Activity Chart Filter
function updateActivityChart(filter) {
    if (!dashboardData || !charts.activityChart) return;
    
    const activityData = dashboardData.activityData.all;
    
    if (filter === 'all') {
        charts.activityChart.data.datasets = [
            {
                label: 'Desktop',
                data: activityData.desktop,
                backgroundColor: '#667eea',
                borderRadius: 4
            },
            {
                label: 'Mobile',
                data: activityData.mobile,
                backgroundColor: '#764ba2',
                borderRadius: 4
            },
            {
                label: 'Tablet',
                data: activityData.tablet,
                backgroundColor: '#f093fb',
                borderRadius: 4
            }
        ];
    } else {
        charts.activityChart.data.datasets = [{
            label: filter.charAt(0).toUpperCase() + filter.slice(1),
            data: activityData[filter],
            backgroundColor: filter === 'desktop' ? '#667eea' : filter === 'mobile' ? '#764ba2' : '#f093fb',
            borderRadius: 4
        }];
    }
    
    charts.activityChart.update();
}

// Filter Transactions
function filterTransactions(searchTerm) {
    if (!dashboardData) return;
    
    const filteredTransactions = dashboardData.transactions.filter(transaction => 
        transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Update table with filtered results
    displayFilteredTransactions(filteredTransactions);
    showSuccessMessage(`Found ${filteredTransactions.length} matching transactions`);
}

// Filter Transactions by Status
function filterTransactionsByStatus(status) {
    if (!dashboardData) return;
    
    let filteredTransactions;
    if (status === 'all') {
        filteredTransactions = dashboardData.transactions;
    } else {
        filteredTransactions = dashboardData.transactions.filter(transaction => 
            transaction.status === status
        );
    }
    
    displayFilteredTransactions(filteredTransactions);
    showSuccessMessage(`Showing ${filteredTransactions.length} ${status === 'all' ? '' : status} transactions`);
}

// Sort Transactions by Date
function sortTransactionsByDate() {
    if (!dashboardData) return;
    
    // Toggle sort order
    const isAscending = dashboardData.transactions[0].date < dashboardData.transactions[dashboardData.transactions.length - 1].date;
    
    dashboardData.transactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return isAscending ? dateB - dateA : dateA - dateB;
    });
    
    currentPage = 1; // Reset to first page
    populateTransactionsTable();
    showSuccessMessage(`Transactions sorted by date ${isAscending ? 'newest first' : 'oldest first'}`);
}

// Display Filtered Transactions
function displayFilteredTransactions(transactions) {
    if (!transactionsBody) return;
    
    transactionsBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTransactions = transactions.slice(startIndex, endIndex);
    
    pageTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.customer}</td>
            <td>${transaction.amount.toFixed(2)}</td>
            <td><span class="status-badge status-${transaction.status}">${transaction.status}</span></td>
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.category}</td>
        `;
        transactionsBody.appendChild(row);
    });
    
    // Update pagination for filtered results
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

// Export Data
function exportData() {
    if (!dashboardData) return;
    
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'dashboard-data.json';
    link.click();
    
    showSuccessMessage('Data exported successfully!');
}

// Update Last Updated Time
function updateLastUpdated() {
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleString();
    }
}

// Show/Hide Loading
function showLoading(show) {
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Show Success Message
function showSuccessMessage(message) {
    console.log('Success:', message);
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Show Error Message
function showErrorMessage(message) {
    console.error('Error:', message);
    
    // Create error toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #ef4444, #dc2626);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds (longer for errors)
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 4000);
}

// Simulate Real-time Updates
setInterval(() => {
    if (dashboardData && activityFeed) {
        addNewActivity();
    }
}, 30000); // Every 30 seconds

function addNewActivity() {
    const activities = [
        "New order placed - $125.50",
        "Payment processed successfully",
        "New user registration",
        "Product review submitted",
        "Customer support ticket resolved"
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <span class="activity-time">Just now</span>
        <span class="activity-message">${randomActivity}</span>
    `;
    
    if (activityFeed.firstChild) {
        activityFeed.insertBefore(activityItem, activityFeed.firstChild);
    } else {
        activityFeed.appendChild(activityItem);
    }
    
    // Keep only last 10 activities
    while (activityFeed.children.length > 10) {
        activityFeed.removeChild(activityFeed.lastChild);
    }
}