// Data Integration Hub - JavaScript
class DataIntegrationHub {
    constructor() {
        this.dataSources = new Map();
        this.updateIntervals = new Map();
        this.chart = null;
        this.chartData = {
            labels: [],
            datasets: [{
                label: 'Real-time Data',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
        this.startTime = Date.now();
        
        this.initializeEventListeners();
        this.initializeDefaultSources();
        this.startSystemMonitoring();
        this.initializeChart();
    }

    initializeEventListeners() {
        // Header controls
        document.getElementById('refreshAllBtn').addEventListener('click', () => this.refreshAllSources());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        
        // Modal controls
        document.getElementById('addApiBtn').addEventListener('click', () => this.openAddApiModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('addApiForm').addEventListener('submit', (e) => this.handleAddApi(e));
        
        // Chart controls
        document.getElementById('chartDataSource').addEventListener('change', (e) => this.updateChartSource(e.target.value));
        
        // Widget refresh buttons
        document.querySelectorAll('.refresh-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const source = e.target.getAttribute('data-source');
                this.refreshSource(source);
            });
        });
        
        // Close modal on outside click
        document.getElementById('addApiModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    initializeDefaultSources() {
        // Weather API (using OpenWeatherMap-like mock)
        this.addDataSource({
            id: 'weather',
            name: 'Weather API',
            url: 'https://api.openweathermap.org/data/2.5/weather?q=Seattle&appid=demo',
            type: 'json',
            interval: 300000, // 5 minutes
            mock: true
        });

        // News API (mock)
        this.addDataSource({
            id: 'news',
            name: 'News API',
            url: 'https://newsapi.org/v2/top-headlines?country=us&apiKey=demo',
            type: 'json',
            interval: 600000, // 10 minutes
            mock: true
        });

        // Cryptocurrency API (mock)
        this.addDataSource({
            id: 'crypto',
            name: 'Crypto API',
            url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
            type: 'json',
            interval: 60000, // 1 minute
            mock: true
        });

        this.updateSourcesGrid();
        this.updateMetrics();
        this.refreshAllSources();
    }

    addDataSource(config) {
        this.dataSources.set(config.id, {
            ...config,
            status: 'connecting',
            lastUpdate: null,
            responseTime: 0,
            data: null,
            error: null
        });

        if (config.interval) {
            this.startAutoRefresh(config.id, config.interval);
        }
    }

    startAutoRefresh(sourceId, interval) {
        if (this.updateIntervals.has(sourceId)) {
            clearInterval(this.updateIntervals.get(sourceId));
        }

        const intervalId = setInterval(() => {
            this.refreshSource(sourceId);
        }, interval);

        this.updateIntervals.set(sourceId, intervalId);
    }

    async refreshSource(sourceId) {
        const source = this.dataSources.get(sourceId);
        if (!source) return;

        const startTime = Date.now();
        source.status = 'loading';
        this.updateSourcesGrid();

        try {
            let data;
            
            if (source.mock) {
                // Use mock data for demo purposes
                data = await this.getMockData(sourceId);
            } else {
                // Real API call
                const response = await fetch(source.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                if (source.type === 'json') {
                    data = await response.json();
                } else if (source.type === 'csv') {
                    data = await response.text();
                } else {
                    data = await response.text();
                }
            }

            source.data = data;
            source.lastUpdate = new Date();
            source.responseTime = Date.now() - startTime;
            source.status = 'connected';
            source.error = null;

            this.updateWidgetData(sourceId, data);
            this.updateChartData(sourceId, data);
            this.showSuccess(`${source.name} updated successfully`);

        } catch (error) {
            source.status = 'error';
            source.error = error.message;
            source.responseTime = Date.now() - startTime;
            this.showError(`Failed to update ${source.name}: ${error.message}`);
        }

        this.updateSourcesGrid();
        this.updateMetrics();
        this.updateConnectionStatus();
    }

    async getMockData(sourceId) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        switch (sourceId) {
            case 'weather':
                return {
                    name: 'Seattle',
                    main: {
                        temp: Math.round(15 + Math.random() * 10),
                        humidity: Math.round(60 + Math.random() * 30)
                    },
                    weather: [{
                        main: 'Clouds',
                        description: 'scattered clouds'
                    }],
                    wind: {
                        speed: Math.round(5 + Math.random() * 10)
                    }
                };

            case 'news':
                const headlines = [
                    'Technology sector shows strong growth',
                    'New developments in AI research',
                    'Market trends indicate positive outlook',
                    'Innovation drives economic expansion',
                    'Data analytics becoming essential for businesses'
                ];
                return {
                    articles: headlines.slice(0, 3).map((title, i) => ({
                        title,
                        source: { name: ['TechNews', 'DataTimes', 'Innovation Daily'][i] },
                        publishedAt: new Date(Date.now() - i * 3600000).toISOString()
                    }))
                };

            case 'crypto':
                return {
                    bpi: {
                        USD: {
                            code: 'USD',
                            rate_float: 45000 + Math.random() * 10000
                        }
                    },
                    time: {
                        updated: new Date().toISOString()
                    }
                };

            default:
                return { value: Math.random() * 100, timestamp: Date.now() };
        }
    }

    updateWidgetData(sourceId, data) {
        switch (sourceId) {
            case 'weather':
                this.updateWeatherWidget(data);
                break;
            case 'news':
                this.updateNewsWidget(data);
                break;
            case 'crypto':
                this.updateCryptoWidget(data);
                break;
        }
    }

    updateWeatherWidget(data) {
        document.getElementById('temperature').textContent = `${data.main.temp}°C`;
        document.getElementById('location').textContent = data.name;
        document.getElementById('weatherDescription').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} km/h`;
    }

    updateNewsWidget(data) {
        const newsFeed = document.getElementById('newsFeed');
        newsFeed.innerHTML = '';

        data.articles.forEach(article => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            
            const publishedDate = new Date(article.publishedAt);
            const timeAgo = this.getTimeAgo(publishedDate);
            
            newsItem.innerHTML = `
                <div class="news-title">${article.title}</div>
                <div class="news-meta">
                    <span class="news-source">${article.source.name}</span>
                    <span class="news-time">${timeAgo}</span>
                </div>
            `;
            
            newsFeed.appendChild(newsItem);
        });
    }

    updateCryptoWidget(data) {
        const cryptoList = document.getElementById('cryptoList');
        
        // Mock additional crypto data
        const cryptos = [
            {
                symbol: 'BTC',
                name: 'Bitcoin',
                price: data.bpi.USD.rate_float,
                change: (Math.random() - 0.5) * 10
            },
            {
                symbol: 'ETH',
                name: 'Ethereum',
                price: 2500 + Math.random() * 1000,
                change: (Math.random() - 0.5) * 8
            },
            {
                symbol: 'ADA',
                name: 'Cardano',
                price: 1.2 + Math.random() * 0.8,
                change: (Math.random() - 0.5) * 15
            }
        ];

        cryptoList.innerHTML = '';

        cryptos.forEach(crypto => {
            const cryptoItem = document.createElement('div');
            cryptoItem.className = 'crypto-item';
            
            const changeClass = crypto.change >= 0 ? 'positive' : 'negative';
            const changeSymbol = crypto.change >= 0 ? '+' : '';
            
            cryptoItem.innerHTML = `
                <div class="crypto-info">
                    <div class="crypto-symbol">${crypto.symbol}</div>
                    <div class="crypto-name">${crypto.name}</div>
                </div>
                <div class="crypto-price">
                    <div class="price">$${crypto.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</div>
                    <div class="change ${changeClass}">
                        ${changeSymbol}${crypto.change.toFixed(2)}%
                    </div>
                </div>
            `;
            
            cryptoList.appendChild(cryptoItem);
        });
    }

    updateChartData(sourceId, data) {
        const currentTime = new Date().toLocaleTimeString();
        let value = 0;

        switch (sourceId) {
            case 'weather':
                value = data.main.temp;
                break;
            case 'crypto':
                value = data.bpi.USD.rate_float / 1000; // Scale down for chart
                break;
            default:
                value = Math.random() * 100;
        }

        // Keep only last 20 data points
        if (this.chartData.labels.length >= 20) {
            this.chartData.labels.shift();
            this.chartData.datasets[0].data.shift();
        }

        this.chartData.labels.push(currentTime);
        this.chartData.datasets[0].data.push(value);

        if (this.chart) {
            this.chart.update('none');
        }
    }

    initializeChart() {
        const ctx = document.getElementById('realTimeChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: this.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Real-time Data Trends'
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }

    updateSourcesGrid() {
        const sourcesGrid = document.getElementById('sourcesGrid');
        sourcesGrid.innerHTML = '';

        this.dataSources.forEach((source, id) => {
            const sourceItem = document.createElement('div');
            sourceItem.className = `source-item ${source.status === 'connected' ? 'active' : ''}`;
            
            const statusClass = {
                'connected': 'online',
                'loading': 'warning',
                'error': 'offline',
                'connecting': 'warning'
            }[source.status] || 'offline';

            sourceItem.innerHTML = `
                <div class="source-header">
                    <div class="source-name">${source.name}</div>
                    <div class="source-status status-indicator ${statusClass}"></div>
                </div>
                <div class="source-url">${source.url}</div>
            `;
            
            sourcesGrid.appendChild(sourceItem);
        });
    }

    updateMetrics() {
        const activeAPIs = Array.from(this.dataSources.values())
            .filter(s => s.status === 'connected').length;
        
        const totalDataPoints = Array.from(this.dataSources.values())
            .reduce((sum, s) => sum + (s.data ? 1 : 0), 0);
        
        const avgResponseTime = Array.from(this.dataSources.values())
            .filter(s => s.responseTime > 0)
            .reduce((sum, s, _, arr) => sum + s.responseTime / arr.length, 0);

        document.getElementById('activeAPIs').textContent = activeAPIs;
        document.getElementById('dataPoints').textContent = totalDataPoints * 156; // Mock larger number
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        document.getElementById('responseTime').textContent = Math.round(avgResponseTime) + ' ms';
    }

    updateConnectionStatus() {
        const statusEl = document.getElementById('connectionStatus');
        const activeConnections = Array.from(this.dataSources.values())
            .filter(s => s.status === 'connected').length;
        
        const indicator = statusEl.querySelector('.status-indicator');
        const text = statusEl.querySelector('span:last-child');
        
        if (activeConnections === this.dataSources.size) {
            indicator.className = 'status-indicator online';
            text.textContent = 'All Systems Online';
        } else if (activeConnections > 0) {
            indicator.className = 'status-indicator warning';
            text.textContent = `${activeConnections}/${this.dataSources.size} Connected`;
        } else {
            indicator.className = 'status-indicator offline';
            text.textContent = 'Connecting...';
        }
    }

    startSystemMonitoring() {
        // Update uptime every second
        setInterval(() => {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            
            document.getElementById('uptime').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    refreshAllSources() {
        this.dataSources.forEach((source, id) => {
            this.refreshSource(id);
        });
    }

    openAddApiModal() {
        document.getElementById('addApiModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('addApiModal').classList.remove('show');
        document.getElementById('addApiForm').reset();
    }

    handleAddApi(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const apiConfig = {
            id: 'custom_' + Date.now(),
            name: formData.get('apiName') || document.getElementById('apiName').value,
            url: formData.get('apiUrl') || document.getElementById('apiUrl').value,
            type: formData.get('dataType') || document.getElementById('dataType').value,
            interval: (formData.get('updateInterval') || document.getElementById('updateInterval').value) * 1000,
            apiKey: formData.get('apiKey') || document.getElementById('apiKey').value,
            mock: false
        };

        this.addDataSource(apiConfig);
        this.updateSourcesGrid();
        this.closeModal();
        this.showSuccess(`Added ${apiConfig.name} successfully!`);
        
        // Try to fetch data immediately
        this.refreshSource(apiConfig.id);
    }

    openSettings() {
        this.showSuccess('Settings panel would open here in a full implementation');
    }

    updateChartSource(sourceType) {
        this.chartData.datasets[0].label = `${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)} Data`;
        if (this.chart) {
            this.chart.update();
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
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
    new DataIntegrationHub();
});

// Demo functions for testing
window.addSampleAPI = function() {
    const hub = window.dataHub;
    if (hub) {
        hub.addDataSource({
            id: 'sample_' + Date.now(),
            name: 'Sample API',
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            type: 'json',
            interval: 30000,
            mock: false
        });
        hub.updateSourcesGrid();
    }
};

window.simulateError = function() {
    const hub = window.dataHub;
    if (hub) {
        hub.showError('This is a simulated error message for testing');
    }
};

// Store reference for demo functions
document.addEventListener('DOMContentLoaded', () => {
    window.dataHub = new DataIntegrationHub();
});