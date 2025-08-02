const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class ReportGeneratorService {
  constructor() {
    this.browserInstance = null;
  }

  /**
   * Initialize browser instance for PDF generation
   */
  async initializeBrowser() {
    if (!this.browserInstance) {
      this.browserInstance = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browserInstance;
  }

  /**
   * Generate comprehensive financial analysis PDF report
   * @param {Object} analysisData - Complete analysis data
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateAnalysisReport(analysisData) {
    try {
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      // Set page format and styling
      await page.setViewport({ width: 1200, height: 1600 });

      const htmlContent = this.generateReportHTML(analysisData);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate()
      });

      await page.close();
      return pdfBuffer;

    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate complete HTML content for the report
   */
  generateReportHTML(analysisData) {
    const { companies, portfolioSummary, timestamp } = analysisData;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Risk Analysis Report</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateCoverPage(portfolioSummary, timestamp)}
        ${this.generateExecutiveSummary(portfolioSummary, companies)}
        ${this.generateRiskMatrix(companies)}
        ${this.generateCompanyAnalyses(companies)}
        ${this.generateAppendix()}
    </div>
</body>
</html>`;
  }

  /**
   * Generate report CSS styles
   */
  getReportCSS() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
        }

        .report-container {
            max-width: 100%;
            margin: 0 auto;
        }

        .page-break {
            page-break-before: always;
        }

        .cover-page {
            text-align: center;
            padding: 100px 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .cover-title {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .cover-subtitle {
            font-size: 24px;
            font-weight: 300;
            margin-bottom: 40px;
            opacity: 0.9;
        }

        .cover-date {
            font-size: 18px;
            margin-top: 60px;
            opacity: 0.8;
        }

        .section {
            padding: 40px 50px;
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 28px;
            font-weight: 600;
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }

        .subsection-title {
            font-size: 20px;
            font-weight: 600;
            color: #34495e;
            margin: 25px 0 15px 0;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }

        .metric-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }

        .metric-title {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: #2c3e50;
        }

        .risk-safe { color: #27ae60; }
        .risk-grey { color: #f39c12; }
        .risk-distress { color: #e74c3c; }

        .company-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .company-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }

        .company-name {
            font-size: 22px;
            font-weight: 600;
            color: #2c3e50;
        }

        .company-ticker {
            font-size: 16px;
            color: #6c757d;
        }

        .z-score-badge {
            background: #3498db;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }

        .z-score-safe { background: #27ae60; }
        .z-score-grey { background: #f39c12; }
        .z-score-distress { background: #e74c3c; }

        .ratio-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .ratio-table th,
        .ratio-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }

        .ratio-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }

        .ratio-table td:last-child {
            text-align: right;
            font-weight: 600;
        }

        .insights-list {
            margin: 20px 0;
        }

        .insight-item {
            padding: 10px 15px;
            margin: 8px 0;
            border-left: 4px solid #3498db;
            background-color: #f8f9fa;
            border-radius: 4px;
        }

        .insight-positive { border-left-color: #27ae60; background-color: #d5f4e6; }
        .insight-warning { border-left-color: #f39c12; background-color: #fef9e7; }
        .insight-danger { border-left-color: #e74c3c; background-color: #fdebee; }

        .risk-matrix {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
        }

        .matrix-header {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
            font-weight: 600;
            text-align: center;
        }

        .matrix-body {
            padding: 20px;
        }

        .footer-disclaimer {
            font-size: 12px;
            color: #6c757d;
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #dee2e6;
        }

        @media print {
            .page-break {
                page-break-before: always;
            }
        }
    `;
  }

  /**
   * Generate cover page
   */
  generateCoverPage(portfolioSummary, timestamp) {
    const date = new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
        <div class="cover-page">
            <h1 class="cover-title">FINANCIAL RISK ANALYSIS</h1>
            <h2 class="cover-subtitle">Comprehensive Portfolio Assessment</h2>
            <div class="cover-date">Generated on ${date}</div>
        </div>
    `;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(portfolioSummary, companies) {
    const { riskDistribution, totalCompanies, averageZScore, portfolioRisk } = portfolioSummary;

    return `
        <div class="section page-break">
            <h2 class="section-title">Executive Summary</h2>
            
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-title">Total Companies</div>
                    <div class="metric-value">${totalCompanies}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Average Z-Score</div>
                    <div class="metric-value">${averageZScore}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Portfolio Risk</div>
                    <div class="metric-value risk-${portfolioRisk.toLowerCase()}">${portfolioRisk}</div>
                </div>
            </div>

            <h3 class="subsection-title">Risk Distribution</h3>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-title">Safe Zone</div>
                    <div class="metric-value risk-safe">${riskDistribution.safeZone.count} (${riskDistribution.safeZone.percentage}%)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Grey Zone</div>
                    <div class="metric-value risk-grey">${riskDistribution.greyZone.count} (${riskDistribution.greyZone.percentage}%)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Distress Zone</div>
                    <div class="metric-value risk-distress">${riskDistribution.distressZone.count} (${riskDistribution.distressZone.percentage}%)</div>
                </div>
            </div>

            <h3 class="subsection-title">Key Findings</h3>
            <div class="insights-list">
                ${this.generatePortfolioInsights(portfolioSummary, companies)}
            </div>
        </div>
    `;
  }

  /**
   * Generate risk matrix visualization
   */
  generateRiskMatrix(companies) {
    return `
        <div class="section">
            <h2 class="section-title">Company Risk Matrix</h2>
            <div class="risk-matrix">
                <div class="matrix-header">Risk Assessment Overview</div>
                <div class="matrix-body">
                    <table class="ratio-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Ticker</th>
                                <th>Industry</th>
                                <th>Z-Score</th>
                                <th>Risk Zone</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${companies.map(company => `
                                <tr>
                                    <td>${company.company.name}</td>
                                    <td>${company.company.ticker}</td>
                                    <td>${company.company.industry || 'N/A'}</td>
                                    <td>${company.analysis.distressScore.altmanZScore}</td>
                                    <td class="risk-${company.analysis.distressScore.riskZone.toLowerCase().replace(' ', '')}">${company.analysis.distressScore.riskZone}</td>
                                    <td>${company.analysis.aiAnalysis.recommendation}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate detailed company analyses
   */
  generateCompanyAnalyses(companies) {
    return companies.map((company, index) => `
        <div class="section ${index > 0 ? 'page-break' : ''}">
            ${this.generateCompanyAnalysis(company)}
        </div>
    `).join('');
  }

  /**
   * Generate individual company analysis
   */
  generateCompanyAnalysis(companyData) {
    const { company, ratios, analysis, marketData } = companyData;
    const { distressScore, aiAnalysis } = analysis;

    const zScoreClass = distressScore.riskZone.toLowerCase().replace(' zone', '').replace(' ', '');

    return `
        <div class="company-card">
            <div class="company-header">
                <div>
                    <div class="company-name">${company.name}</div>
                    <div class="company-ticker">${company.ticker} • ${company.industry || 'N/A'}</div>
                </div>
                <div class="z-score-badge z-score-${zScoreClass}">
                    Z-Score: ${distressScore.altmanZScore}
                </div>
            </div>

            <h3 class="subsection-title">Risk Assessment</h3>
            <p><strong>Risk Zone:</strong> <span class="risk-${zScoreClass}">${distressScore.riskZone}</span></p>
            <p><strong>Assessment:</strong> ${aiAnalysis.distressAssessment}</p>
            <p><strong>Recommendation:</strong> <strong>${aiAnalysis.recommendation}</strong> - ${aiAnalysis.recommendationReasoning}</p>

            <h3 class="subsection-title">Key Financial Ratios</h3>
            <table class="ratio-table">
                <tbody>
                    <tr><td>Current Ratio</td><td>${ratios.liquidity.currentRatio.toFixed(2)}</td></tr>
                    <tr><td>Quick Ratio</td><td>${ratios.liquidity.quickRatio.toFixed(2)}</td></tr>
                    <tr><td>Debt-to-Equity</td><td>${ratios.leverage.debtToEquity.toFixed(2)}</td></tr>
                    <tr><td>Interest Coverage</td><td>${ratios.leverage.interestCoverage.toFixed(1)}x</td></tr>
                    <tr><td>Net Margin</td><td>${ratios.profitability.netMargin.toFixed(1)}%</td></tr>
                    <tr><td>ROE</td><td>${ratios.profitability.returnOnEquity.toFixed(1)}%</td></tr>
                    <tr><td>ROA</td><td>${ratios.profitability.returnOnAssets.toFixed(1)}%</td></tr>
                    <tr><td>Asset Turnover</td><td>${ratios.efficiency.assetTurnover.toFixed(2)}</td></tr>
                </tbody>
            </table>

            <h3 class="subsection-title">Key Insights</h3>
            <div class="insights-list">
                ${aiAnalysis.strengths.map(strength => 
                    `<div class="insight-item insight-positive">✓ ${strength}</div>`
                ).join('')}
                ${aiAnalysis.concerns.map(concern => 
                    `<div class="insight-item insight-warning">⚠ ${concern}</div>`
                ).join('')}
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #3498db;">
                <strong>Executive Summary:</strong> ${aiAnalysis.executiveSummary}
            </div>
        </div>
    `;
  }

  /**
   * Generate portfolio insights
   */
  generatePortfolioInsights(portfolioSummary, companies) {
    const insights = [];
    const { riskDistribution, portfolioRisk, recommendations } = portfolioSummary;

    if (riskDistribution.safeZone.percentage > 70) {
      insights.push('<div class="insight-item insight-positive">Portfolio demonstrates strong overall financial stability with majority of companies in Safe Zone</div>');
    }

    if (riskDistribution.distressZone.count > 0) {
      insights.push(`<div class="insight-item insight-warning">${riskDistribution.distressZone.count} companies in Distress Zone require immediate attention</div>`);
    }

    if (portfolioRisk === 'Low') {
      insights.push('<div class="insight-item insight-positive">Overall portfolio risk is well-managed with minimal bankruptcy exposure</div>');
    }

    recommendations.forEach(rec => {
      insights.push(`<div class="insight-item insight-warning">Recommendation: ${rec}</div>`);
    });

    return insights.join('');
  }

  /**
   * Generate appendix with methodology
   */
  generateAppendix() {
    return `
        <div class="section page-break">
            <h2 class="section-title">Methodology & Disclaimer</h2>
            
            <h3 class="subsection-title">Altman Z-Score Methodology</h3>
            <p>The Altman Z-Score is a bankruptcy prediction model that uses five financial ratios to determine the likelihood of a company experiencing financial distress within two years.</p>
            
            <p><strong>Manufacturing Companies Formula:</strong><br>
            Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E</p>
            
            <p><strong>Non-Manufacturing Companies Formula:</strong><br>
            Z = 6.56A + 3.26B + 6.72C + 1.05D</p>
            
            <p><strong>Where:</strong><br>
            A = Working Capital / Total Assets<br>
            B = Retained Earnings / Total Assets<br>
            C = EBIT / Total Assets<br>
            D = Market Value of Equity / Total Liabilities<br>
            E = Sales / Total Assets (Manufacturing only)</p>

            <h3 class="subsection-title">Risk Zone Classifications</h3>
            <p><strong>Safe Zone:</strong> Z-Score > 2.99 (Manufacturing) or > 2.6 (Non-Manufacturing)<br>
            <strong>Grey Zone:</strong> Z-Score 1.8-2.99 (Manufacturing) or 1.1-2.6 (Non-Manufacturing)<br>
            <strong>Distress Zone:</strong> Z-Score < 1.8 (Manufacturing) or < 1.1 (Non-Manufacturing)</p>

            <div class="footer-disclaimer">
                <p><strong>DISCLAIMER:</strong> This analysis is for informational purposes only and should not be considered as investment advice. Past performance does not guarantee future results. All investment decisions should be made after consulting with qualified financial professionals and considering your specific financial situation and objectives.</p>
                <p>Data sources include public financial statements and market data. While we strive for accuracy, we cannot guarantee the completeness or timeliness of all information presented.</p>
            </div>
        </div>
    `;
  }

  /**
   * Get header template for PDF
   */
  getHeaderTemplate() {
    return `
        <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin-top: 10px;">
            Financial Risk Analysis Report
        </div>
    `;
  }

  /**
   * Get footer template for PDF
   */
  getFooterTemplate() {
    return `
        <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin-bottom: 10px;">
            <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
    `;
  }

  /**
   * Clean up browser instance
   */
  async cleanup() {
    if (this.browserInstance) {
      await this.browserInstance.close();
      this.browserInstance = null;
    }
  }
}

module.exports = new ReportGeneratorService();