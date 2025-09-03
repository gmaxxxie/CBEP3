/**
 * Chart Generator for Analysis Reports
 * 可视化图表生成器，为分析报告提供图表支持
 */

class ChartGenerator {
  constructor() {
    this.chartLibrary = null;
    this.initialized = false;
    this.chartTypes = {
      scoreRadar: 'radar',
      regionComparison: 'bar', 
      trendLine: 'line',
      categoryPie: 'doughnut',
      heatmap: 'matrix'
    };
  }

  /**
   * 初始化图表库
   */
  async initialize() {
    if (this.initialized) return;

    try {
      if (typeof window !== 'undefined') {
        // 优先使用 Chart.js
        if (!window.Chart) {
          await this.loadChartJS();
        }
        this.chartLibrary = window.Chart;
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Chart library failed to load, using fallback canvas drawing');
      this.chartLibrary = null;
    }
  }

  /**
   * 动态加载Chart.js
   */
  async loadChartJS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Chart.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * 生成所有图表
   */
  async generateCharts(analysisData, options = {}) {
    await this.initialize();

    const {
      includeTypes = ['scoreRadar', 'regionComparison', 'categoryPie'],
      theme = 'light',
      size = { width: 400, height: 300 }
    } = options;

    const charts = {};

    for (const chartType of includeTypes) {
      try {
        switch (chartType) {
          case 'scoreRadar':
            charts[chartType] = await this.generateScoreRadarChart(analysisData, { theme, size });
            break;
          case 'regionComparison':
            charts[chartType] = await this.generateRegionComparisonChart(analysisData, { theme, size });
            break;
          case 'categoryPie':
            charts[chartType] = await this.generateCategoryPieChart(analysisData, { theme, size });
            break;
          case 'trendLine':
            charts[chartType] = await this.generateTrendLineChart(analysisData, { theme, size });
            break;
          default:
            console.warn(`Unsupported chart type: ${chartType}`);
        }
      } catch (error) {
        console.error(`Failed to generate ${chartType} chart:`, error);
        charts[chartType] = this.generateFallbackChart(chartType, analysisData, { theme, size });
      }
    }

    return charts;
  }

  /**
   * 生成评分雷达图
   */
  async generateScoreRadarChart(analysisData, options) {
    const { theme, size } = options;
    const canvas = this.createCanvas(size.width, size.height);

    if (this.chartLibrary && canvas) {
      const ctx = canvas.getContext('2d');
      const regions = Object.keys(analysisData.results);
      
      // 准备数据
      const datasets = regions.map((region, index) => {
        const result = analysisData.results[region];
        return {
          label: `${region} ${result.region?.name || ''}`,
          data: [
            result.language?.score || 0,
            result.culture?.score || 0,
            result.compliance?.score || 0,
            result.userExperience?.score || 0
          ],
          borderColor: this.getColor(index, theme),
          backgroundColor: this.getColor(index, theme, 0.2),
          pointBackgroundColor: this.getColor(index, theme),
          pointBorderColor: this.getColor(index, theme),
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: this.getColor(index, theme)
        };
      });

      new this.chartLibrary(ctx, {
        type: 'radar',
        data: {
          labels: ['语言适配', '文化适配', '合规性', '用户体验'],
          datasets: datasets
        },
        options: {
          responsive: false,
          animation: false,
          scales: {
            r: {
              angleLines: {
                display: true
              },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                stepSize: 20,
                font: { size: 10 }
              },
              pointLabels: {
                font: { size: 12 }
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { size: 10 } }
            },
            title: {
              display: true,
              text: '地区适配性对比',
              font: { size: 14 }
            }
          }
        }
      });

      return this.canvasToImageData(canvas, 'scoreRadar');
    }

    return this.generateFallbackChart('scoreRadar', analysisData, options);
  }

  /**
   * 生成地区对比柱状图
   */
  async generateRegionComparisonChart(analysisData, options) {
    const { theme, size } = options;
    const canvas = this.createCanvas(size.width, size.height);

    if (this.chartLibrary && canvas) {
      const ctx = canvas.getContext('2d');
      const regions = Object.keys(analysisData.results);
      
      const data = regions.map(region => analysisData.results[region].overallScore || 0);
      const labels = regions.map(region => {
        const result = analysisData.results[region];
        return `${region}\\n${result.region?.name || ''}`;
      });

      new this.chartLibrary(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '总体适配评分',
            data: data,
            backgroundColor: data.map((_, index) => this.getColor(index, theme, 0.8)),
            borderColor: data.map((_, index) => this.getColor(index, theme)),
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { font: { size: 10 } }
            },
            x: {
              ticks: { 
                font: { size: 10 },
                maxRotation: 45
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: '地区总体评分对比',
              font: { size: 14 }
            }
          }
        }
      });

      return this.canvasToImageData(canvas, 'regionComparison');
    }

    return this.generateFallbackChart('regionComparison', analysisData, options);
  }

  /**
   * 生成分类饼图
   */
  async generateCategoryPieChart(analysisData, options) {
    const { theme, size } = options;
    const canvas = this.createCanvas(size.width, size.height);

    if (this.chartLibrary && canvas) {
      const ctx = canvas.getContext('2d');
      
      // 计算各维度平均得分
      const regions = Object.keys(analysisData.results);
      const categoryScores = {
        language: 0,
        culture: 0, 
        compliance: 0,
        userExperience: 0
      };

      regions.forEach(region => {
        const result = analysisData.results[region];
        categoryScores.language += result.language?.score || 0;
        categoryScores.culture += result.culture?.score || 0;
        categoryScores.compliance += result.compliance?.score || 0;
        categoryScores.userExperience += result.userExperience?.score || 0;
      });

      Object.keys(categoryScores).forEach(key => {
        categoryScores[key] = Math.round(categoryScores[key] / regions.length);
      });

      new this.chartLibrary(ctx, {
        type: 'doughnut',
        data: {
          labels: ['语言适配', '文化适配', '合规性', '用户体验'],
          datasets: [{
            data: Object.values(categoryScores),
            backgroundColor: [
              this.getColor(0, theme, 0.8),
              this.getColor(1, theme, 0.8), 
              this.getColor(2, theme, 0.8),
              this.getColor(3, theme, 0.8)
            ],
            borderColor: [
              this.getColor(0, theme),
              this.getColor(1, theme),
              this.getColor(2, theme), 
              this.getColor(3, theme)
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { font: { size: 10 } }
            },
            title: {
              display: true,
              text: '各维度平均得分分布',
              font: { size: 14 }
            }
          }
        }
      });

      return this.canvasToImageData(canvas, 'categoryPie');
    }

    return this.generateFallbackChart('categoryPie', analysisData, options);
  }

  /**
   * 生成趋势线图（用于历史数据对比）
   */
  async generateTrendLineChart(analysisData, options) {
    const { theme, size } = options;
    
    // 模拟趋势数据（实际应用中可从历史记录获取）
    const mockTrendData = this.generateMockTrendData(analysisData);
    
    return this.generateFallbackChart('trendLine', mockTrendData, options);
  }

  /**
   * 生成回退图表（简单的SVG图表）
   */
  generateFallbackChart(chartType, analysisData, options) {
    const { theme, size } = options;
    
    switch (chartType) {
      case 'scoreRadar':
        return this.generateSVGRadarChart(analysisData, options);
      case 'regionComparison':
        return this.generateSVGBarChart(analysisData, options);
      case 'categoryPie':
        return this.generateSVGPieChart(analysisData, options);
      default:
        return this.generateSVGPlaceholder(chartType, options);
    }
  }

  /**
   * 生成SVG雷达图
   */
  generateSVGRadarChart(analysisData, options) {
    const { size } = options;
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const radius = Math.min(size.width, size.height) / 2 - 50;
    
    const regions = Object.keys(analysisData.results);
    const categories = ['语言适配', '文化适配', '合规性', '用户体验'];
    
    let svg = `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // 网格线
    for (let i = 1; i <= 5; i++) {
      const r = radius * i / 5;
      svg += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
    }
    
    // 坐标轴
    for (let i = 0; i < 4; i++) {
      const angle = (i * 90 - 90) * Math.PI / 180;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      svg += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#d0d0d0" stroke-width="1"/>`;
      svg += `<text x="${x + 15 * Math.cos(angle)}" y="${y + 15 * Math.sin(angle)}" text-anchor="middle" font-size="12">${categories[i]}</text>`;
    }
    
    // 数据多边形
    regions.forEach((region, regionIndex) => {
      const result = analysisData.results[region];
      const scores = [
        result.language?.score || 0,
        result.culture?.score || 0,
        result.compliance?.score || 0,
        result.userExperience?.score || 0
      ];
      
      let points = '';
      scores.forEach((score, i) => {
        const angle = (i * 90 - 90) * Math.PI / 180;
        const r = radius * score / 100;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        points += `${x},${y} `;
      });
      
      const color = this.getColor(regionIndex, 'light');
      svg += `<polygon points="${points}" fill="${color}20" stroke="${color}" stroke-width="2"/>`;
      
      // 数据点
      scores.forEach((score, i) => {
        const angle = (i * 90 - 90) * Math.PI / 180;
        const r = radius * score / 100;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        svg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
      });
    });
    
    svg += '</svg>';
    
    return {
      type: 'svg',
      data: svg,
      title: '评分雷达图',
      width: size.width,
      height: size.height
    };
  }

  /**
   * 生成SVG柱状图
   */
  generateSVGBarChart(analysisData, options) {
    const { size } = options;
    const regions = Object.keys(analysisData.results);
    const scores = regions.map(region => analysisData.results[region].overallScore || 0);
    
    const margin = 40;
    const chartWidth = size.width - margin * 2;
    const chartHeight = size.height - margin * 2;
    const barWidth = chartWidth / regions.length * 0.8;
    const barSpacing = chartWidth / regions.length * 0.2;
    
    let svg = `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Y轴刻度
    for (let i = 0; i <= 5; i++) {
      const y = margin + chartHeight - (chartHeight * i / 5);
      const value = i * 20;
      svg += `<line x1="${margin}" y1="${y}" x2="${size.width - margin}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>`;
      svg += `<text x="${margin - 5}" y="${y + 4}" text-anchor="end" font-size="10">${value}</text>`;
    }
    
    // 柱状图
    scores.forEach((score, index) => {
      const x = margin + index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight = chartHeight * score / 100;
      const y = margin + chartHeight - barHeight;
      
      const color = this.getColor(index, 'light');
      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" stroke="${color}" stroke-width="1"/>`;
      svg += `<text x="${x + barWidth/2}" y="${margin + chartHeight + 15}" text-anchor="middle" font-size="10">${regions[index]}</text>`;
      svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10">${score}</text>`;
    });
    
    svg += '</svg>';
    
    return {
      type: 'svg',
      data: svg,
      title: '地区评分对比',
      width: size.width,
      height: size.height
    };
  }

  /**
   * 生成SVG饼图
   */
  generateSVGPieChart(analysisData, options) {
    const { size } = options;
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const radius = Math.min(size.width, size.height) / 2 - 50;
    
    const regions = Object.keys(analysisData.results);
    const categoryScores = { language: 0, culture: 0, compliance: 0, userExperience: 0 };
    
    regions.forEach(region => {
      const result = analysisData.results[region];
      categoryScores.language += result.language?.score || 0;
      categoryScores.culture += result.culture?.score || 0; 
      categoryScores.compliance += result.compliance?.score || 0;
      categoryScores.userExperience += result.userExperience?.score || 0;
    });
    
    Object.keys(categoryScores).forEach(key => {
      categoryScores[key] = categoryScores[key] / regions.length;
    });
    
    const total = Object.values(categoryScores).reduce((a, b) => a + b, 0);
    const categories = ['语言适配', '文化适配', '合规性', '用户体验'];
    
    let svg = `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    let currentAngle = 0;
    Object.values(categoryScores).forEach((score, index) => {
      const angle = (score / total) * 360;
      const startAngle = currentAngle * Math.PI / 180;
      const endAngle = (currentAngle + angle) * Math.PI / 180;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      const color = this.getColor(index, 'light');
      
      svg += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${color}" stroke="#fff" stroke-width="2"/>`;
      
      // 标签
      const labelAngle = (currentAngle + angle / 2) * Math.PI / 180;
      const labelX = centerX + (radius + 20) * Math.cos(labelAngle);
      const labelY = centerY + (radius + 20) * Math.sin(labelAngle);
      svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10">${categories[index]}</text>`;
      
      currentAngle += angle;
    });
    
    svg += '</svg>';
    
    return {
      type: 'svg', 
      data: svg,
      title: '维度分布图',
      width: size.width,
      height: size.height
    };
  }

  /**
   * 生成SVG占位符
   */
  generateSVGPlaceholder(chartType, options) {
    const { size } = options;
    
    let svg = `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size.width}" height="${size.height}" fill="#f8f9fa" stroke="#dee2e6"/>`;
    svg += `<text x="${size.width/2}" y="${size.height/2}" text-anchor="middle" font-size="16">${chartType} 图表</text>`;
    svg += `<text x="${size.width/2}" y="${size.height/2 + 20}" text-anchor="middle" font-size="12">图表生成中...</text>`;
    svg += '</svg>';
    
    return {
      type: 'svg',
      data: svg,
      title: `${chartType} 图表`,
      width: size.width,
      height: size.height
    };
  }

  /**
   * 创建Canvas元素
   */
  createCanvas(width, height) {
    if (typeof document === 'undefined') return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Canvas转图像数据
   */
  canvasToImageData(canvas, chartType) {
    return {
      type: 'canvas',
      data: canvas.toDataURL('image/png'),
      canvas: canvas,
      title: `${chartType} 图表`,
      width: canvas.width,
      height: canvas.height
    };
  }

  /**
   * 获取主题颜色
   */
  getColor(index, theme = 'light', opacity = 1) {
    const lightColors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    const darkColors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    const colors = theme === 'dark' ? darkColors : lightColors;
    const color = colors[index % colors.length];
    
    if (opacity < 1) {
      // 转换为rgba格式
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return color;
  }

  /**
   * 生成模拟趋势数据
   */
  generateMockTrendData(analysisData) {
    // 简化的模拟数据
    return {
      labels: ['上周', '本周'],
      datasets: Object.keys(analysisData.results).map((region, index) => ({
        label: region,
        data: [
          Math.max(0, (analysisData.results[region].overallScore || 0) - Math.random() * 20),
          analysisData.results[region].overallScore || 0
        ],
        borderColor: this.getColor(index, 'light'),
        backgroundColor: this.getColor(index, 'light', 0.1)
      }))
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartGenerator;
} else {
  window.ChartGenerator = ChartGenerator;
}