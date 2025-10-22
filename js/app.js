// 应用主逻辑
class WordCountApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.currentSort = 'count-desc';
        this.currentChartType = 'bar';
        
        this.initializeApp();
    }
    
    async initializeApp() {
        await this.loadData();
        this.setupEventListeners();
        this.updateStats();
        this.renderWordList();
        this.initializeChart();
    }
    
    async loadData() {
        try {
            const response = await fetch('data/wordcount.json');
            this.data = await response.json();
            this.filteredData = [...this.data];
            
            // 更新最后更新时间
            this.updateLastModified();
            
            console.log(`成功加载 ${this.data.length} 条词频数据`);
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('无法加载词频数据，请检查数据文件是否存在');
        }
    }
    
    updateLastModified() {
        // 这里可以改为从数据中获取实际更新时间
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleDateString('zh-CN');
    }
    
    setupEventListeners() {
        // 搜索功能
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterData(e.target.value);
            this.currentPage = 1;
            this.renderWordList();
        });
        
        // 排序功能
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.sortData();
            this.currentPage = 1;
            this.renderWordList();
            this.updateChart();
        });
        
        // 分页功能
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderWordList();
            }
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderWordList();
            }
        });
        
        // 图表类型切换
        document.getElementById('showTop20').addEventListener('click', () => {
            this.setActiveChartButton('showTop20');
            this.currentChartType = 'bar';
            this.updateChart();
        });
        
        document.getElementById('showTop50').addEventListener('click', () => {
            this.setActiveChartButton('showTop50');
            this.currentChartType = 'bar';
            this.updateChart(50);
        });
        
        document.getElementById('showWordCloud').addEventListener('click', () => {
            this.setActiveChartButton('showWordCloud');
            this.currentChartType = 'wordcloud';
            this.updateChart();
        });
    }
    
    setActiveChartButton(activeId) {
        // 移除所有按钮的active类
        document.querySelectorAll('.chart-controls .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // 为当前按钮添加active类
        document.getElementById(activeId).classList.add('active');
    }
    
    filterData(searchTerm) {
        if (!searchTerm) {
            this.filteredData = [...this.data];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredData = this.data.filter(item => 
                item.word.toLowerCase().includes(term)
            );
        }
        this.sortData();
    }
    
    sortData() {
        const [field, order] = this.currentSort.split('-');
        
        this.filteredData.sort((a, b) => {
            let comparison = 0;
            
            if (field === 'count') {
                comparison = a.count - b.count;
            } else if (field === 'word') {
                comparison = a.word.localeCompare(b.word);
            }
            
            return order === 'desc' ? -comparison : comparison;
        });
    }
    
    updateStats() {
        const totalWords = this.data.length;
        const totalOccurrences = this.data.reduce((sum, item) => sum + item.count, 0);
        const uniqueWords = new Set(this.data.map(item => item.word)).size;
        const topWord = this.data[0] ? this.data[0].word : '-';
        
        document.getElementById('totalWords').textContent = totalWords.toLocaleString();
        document.getElementById('totalOccurrences').textContent = totalOccurrences.toLocaleString();
        document.getElementById('uniqueWords').textContent = uniqueWords.toLocaleString();
        document.getElementById('topWord').textContent = topWord;
    }
    
    renderWordList() {
        const wordList = document.getElementById('wordList');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        // 更新分页信息
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        document.getElementById('pageInfo').textContent = 
            `第 ${this.currentPage} 页 / 共 ${totalPages} 页`;
        
        // 更新分页按钮状态
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
        
        // 渲染词汇列表
        wordList.innerHTML = pageData.map(item => `
            <div class="word-item">
                <span class="word-text">${this.escapeHtml(item.word)}</span>
                <span class="word-count">${item.count.toLocaleString()}</span>
            </div>
        `).join('');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        // 简单的错误提示
        alert(message);
    }
    
    initializeChart() {
        this.chart = echarts.init(document.getElementById('chartContainer'));
        this.updateChart();
        
        // 响应窗口大小变化
        window.addEventListener('resize', () => {
            this.chart.resize();
        });
    }
    
    updateChart(limit = 20) {
        if (!this.chart) return;
        
        const chartData = this.data.slice(0, limit);
        
        if (this.currentChartType === 'bar') {
            this.renderBarChart(chartData);
        } else if (this.currentChartType === 'wordcloud') {
            this.renderWordCloud(chartData);
        }
    }
    
    renderBarChart(data) {
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                name: '出现次数',
                axisLabel: {
                    fontWeight: 'bold'
                }
            },
            yAxis: {
                type: 'category',
                data: data.map(item => item.word).reverse(),
                name: '词汇',
                axisLabel: {
                    fontWeight: 'bold'
                }
            },
            series: [{
                name: '出现次数',
                type: 'bar',
                data: data.map(item => item.count).reverse(),
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: '#3498db' },
                        { offset: 1, color: '#2c3e50' }
                    ]),
                    borderRadius: [0, 5, 5, 0]
                },
                label: {
                    show: true,
                    position: 'right',
                    fontWeight: 'bold',
                    color: '#333'
                }
            }]
        };
        
        this.chart.setOption(option);
    }
    
    renderWordCloud(data) {
        // 简单的词云实现（ECharts需要额外的词云扩展）
        // 这里我们回退到条形图，或者可以提示用户
        this.renderBarChart(data.slice(0, 20));
        
        // 在实际项目中，您可以引入echarts-wordcloud扩展
        // 并实现真正的词云图表
        console.log('词云功能需要引入echarts-wordcloud扩展');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new WordCountApp();
});