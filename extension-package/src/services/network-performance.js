/**
 * Network Performance Testing Service
 * 网络性能测试服务，用于分析不同地域的网络连接质量
 */

class NetworkPerformanceTesting {
  constructor() {
    this.testResults = new Map();
    this.testEndpoints = this.initializeTestEndpoints();
  }

  /**
   * 初始化测试节点
   */
  initializeTestEndpoints() {
    return {
      'US': {
        name: '美国东部',
        endpoints: [
          'https://cloudflare.com/cdn-cgi/trace',
          'https://httpbin.org/delay/0',
          'https://jsonplaceholder.typicode.com/posts/1'
        ]
      },
      'GB': {
        name: '英国伦敦',
        endpoints: [
          'https://cloudflare.com/cdn-cgi/trace',
          'https://httpbin.org/delay/0'
        ]
      },
      'DE': {
        name: '德国法兰克福',
        endpoints: [
          'https://cloudflare.com/cdn-cgi/trace',
          'https://httpbin.org/delay/0'
        ]
      },
      'CN': {
        name: '中国大陆',
        endpoints: [
          'https://www.baidu.com/favicon.ico',
          'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js'
        ]
      },
      'JP': {
        name: '日本东京',
        endpoints: [
          'https://cloudflare.com/cdn-cgi/trace',
          'https://httpbin.org/delay/0'
        ]
      },
      'KR': {
        name: '韩国首尔',
        endpoints: [
          'https://cloudflare.com/cdn-cgi/trace'
        ]
      }
    };
  }

  /**
   * 执行网络性能测试
   */
  async runPerformanceTest(targetRegions = ['US'], options = {}) {
    const {
      timeout = 10000,
      retryCount = 2,
      includeDetailedMetrics = true
    } = options;

    const results = {};

    for (const region of targetRegions) {
      try {
        console.log(`开始测试 ${region} 地区网络性能...`);
        results[region] = await this.testRegionPerformance(region, {
          timeout,
          retryCount,
          includeDetailedMetrics
        });
      } catch (error) {
        console.error(`${region} 地区网络测试失败:`, error);
        results[region] = {
          region,
          status: 'failed',
          error: error.message,
          metrics: null
        };
      }
    }

    return {
      timestamp: new Date().toISOString(),
      testId: this.generateTestId(),
      results: results,
      summary: this.generateSummary(results)
    };
  }

  /**
   * 测试特定地区的网络性能
   */
  async testRegionPerformance(region, options) {
    const regionConfig = this.testEndpoints[region];
    if (!regionConfig) {
      throw new Error(`不支持的地区: ${region}`);
    }

    const endpointTests = [];
    
    // 为每个端点执行测试
    for (const endpoint of regionConfig.endpoints) {
      endpointTests.push(this.testEndpoint(endpoint, options));
    }

    const endpointResults = await Promise.allSettled(endpointTests);
    const successfulTests = endpointResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    if (successfulTests.length === 0) {
      throw new Error(`所有端点测试失败`);
    }

    // 计算综合指标
    const metrics = this.calculateRegionMetrics(successfulTests);
    
    return {
      region,
      regionName: regionConfig.name,
      status: 'completed',
      endpointCount: regionConfig.endpoints.length,
      successfulTests: successfulTests.length,
      metrics: metrics,
      details: successfulTests
    };
  }

  /**
   * 测试单个端点
   */
  async testEndpoint(url, options) {
    const { timeout, retryCount } = options;
    let lastError;

    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        const result = await this.performSingleTest(url, timeout);
        result.attempt = attempt;
        return result;
      } catch (error) {
        lastError = error;
        if (attempt <= retryCount) {
          // 重试前等待
          await this.sleep(1000 * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * 执行单次测试
   */
  async performSingleTest(url, timeout) {
    const startTime = performance.now();
    const startTimestamp = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'cors'
      });

      clearTimeout(timeoutId);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      let responseSize = 0;
      if (response.headers.get('content-length')) {
        responseSize = parseInt(response.headers.get('content-length'));
      }

      return {
        url,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        responseSize,
        timestamp: startTimestamp,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      throw {
        url,
        status: 'failed',
        error: error.name,
        message: error.message,
        responseTime,
        timestamp: startTimestamp
      };
    }
  }

  /**
   * 计算地区综合性能指标
   */
  calculateRegionMetrics(testResults) {
    if (testResults.length === 0) {
      return null;
    }

    const responseTimes = testResults.map(r => r.responseTime);
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    // 计算网络质量评分 (0-100)
    const networkScore = this.calculateNetworkScore(avgResponseTime);
    
    // 计算稳定性 (响应时间方差)
    const variance = responseTimes.reduce((acc, time) => {
      return acc + Math.pow(time - avgResponseTime, 2);
    }, 0) / responseTimes.length;
    const stability = Math.max(0, 100 - Math.sqrt(variance) / 10);

    return {
      averageResponseTime: avgResponseTime,
      minResponseTime: minResponseTime,
      maxResponseTime: maxResponseTime,
      networkScore: Math.round(networkScore),
      stability: Math.round(stability),
      reliability: Math.round((testResults.filter(r => r.status === 'success').length / testResults.length) * 100),
      testCount: testResults.length
    };
  }

  /**
   * 计算网络评分
   */
  calculateNetworkScore(avgResponseTime) {
    // 基于响应时间的评分算法
    if (avgResponseTime <= 100) return 100;
    if (avgResponseTime <= 300) return 90;
    if (avgResponseTime <= 500) return 80;
    if (avgResponseTime <= 1000) return 70;
    if (avgResponseTime <= 2000) return 60;
    if (avgResponseTime <= 3000) return 50;
    if (avgResponseTime <= 5000) return 40;
    if (avgResponseTime <= 8000) return 30;
    if (avgResponseTime <= 15000) return 20;
    return 10;
  }

  /**
   * 生成测试摘要
   */
  generateSummary(results) {
    const regions = Object.keys(results);
    const successfulRegions = regions.filter(r => results[r].status === 'completed');
    
    if (successfulRegions.length === 0) {
      return {
        totalRegions: regions.length,
        successfulRegions: 0,
        averageScore: 0,
        bestRegion: null,
        worstRegion: null
      };
    }

    const scores = successfulRegions.map(r => ({
      region: r,
      score: results[r].metrics?.networkScore || 0,
      responseTime: results[r].metrics?.averageResponseTime || 0
    }));

    scores.sort((a, b) => b.score - a.score);

    return {
      totalRegions: regions.length,
      successfulRegions: successfulRegions.length,
      averageScore: Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length),
      bestRegion: scores[0],
      worstRegion: scores[scores.length - 1],
      recommendations: this.generateNetworkRecommendations(scores)
    };
  }

  /**
   * 生成网络优化建议
   */
  generateNetworkRecommendations(scores) {
    const recommendations = [];

    scores.forEach(({ region, score, responseTime }) => {
      if (score < 60) {
        recommendations.push({
          region,
          priority: score < 30 ? 'high' : 'medium',
          issue: '网络性能较差',
          suggestion: `${region}地区平均响应时间${responseTime}ms，建议使用CDN或优化服务器位置`
        });
      } else if (score < 80) {
        recommendations.push({
          region,
          priority: 'low',
          issue: '网络性能可优化',
          suggestion: `考虑为${region}地区启用缓存优化或压缩传输`
        });
      }
    });

    return recommendations;
  }

  /**
   * 获取网络性能建议
   */
  getPerformanceInsights(testResults) {
    const insights = {
      globalInsights: [],
      regionInsights: {},
      recommendations: []
    };

    if (!testResults || !testResults.results) {
      return insights;
    }

    const results = testResults.results;
    const regions = Object.keys(results);

    // 全局洞察
    const avgScores = [];
    regions.forEach(region => {
      if (results[region].status === 'completed' && results[region].metrics) {
        avgScores.push(results[region].metrics.networkScore);
      }
    });

    if (avgScores.length > 0) {
      const globalAvg = Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length);
      insights.globalInsights.push({
        type: 'performance',
        message: `全球平均网络性能评分: ${globalAvg}/100`,
        score: globalAvg
      });
    }

    // 地区特定洞察
    regions.forEach(region => {
      const result = results[region];
      if (result.status === 'completed' && result.metrics) {
        insights.regionInsights[region] = {
          score: result.metrics.networkScore,
          responseTime: result.metrics.averageResponseTime,
          stability: result.metrics.stability,
          recommendation: this.getRegionRecommendation(result.metrics)
        };
      }
    });

    return insights;
  }

  /**
   * 获取地区特定建议
   */
  getRegionRecommendation(metrics) {
    const { networkScore, averageResponseTime, stability } = metrics;

    if (networkScore >= 90) {
      return '网络性能优秀，无需特殊优化';
    } else if (networkScore >= 70) {
      return '网络性能良好，可考虑进一步缓存优化';
    } else if (networkScore >= 50) {
      return '网络性能一般，建议启用CDN和图片压缩';
    } else {
      return '网络性能较差，强烈建议使用CDN、优化服务器位置并启用所有性能优化措施';
    }
  }

  /**
   * 生成唯一测试ID
   */
  generateTestId() {
    return 'net-test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理旧的测试结果
   */
  cleanup() {
    this.testResults.clear();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkPerformanceTesting;
} else {
  window.NetworkPerformanceTesting = NetworkPerformanceTesting;
}