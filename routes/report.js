const express = require('express');
const reportGeneratorService = require('../services/reportGeneratorService');
const NodeCache = require('node-cache');

const router = express.Router();

// Cache for storing analysis results temporarily for PDF generation
const analysisCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

/**
 * POST /api/report/generate
 * Generate PDF report from analysis data
 */
router.post('/generate', async (req, res) => {
  try {
    const { analysisData, reportId } = req.body;
    
    if (!analysisData || !analysisData.results || !Array.isArray(analysisData.results)) {
      return res.status(400).json({
        error: 'Invalid analysis data',
        message: 'Please provide valid analysis results to generate a report'
      });
    }

    if (analysisData.results.length === 0) {
      return res.status(400).json({
        error: 'No analysis results',
        message: 'Cannot generate report with empty analysis results'
      });
    }

    console.log(`Generating PDF report for ${analysisData.results.length} companies`);

    // Store analysis data in cache for download
    const cacheId = reportId || `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    analysisCache.set(cacheId, analysisData);

    // Generate PDF
    const pdfBuffer = await reportGeneratorService.generateAnalysisReport({
      companies: analysisData.results,
      portfolioSummary: analysisData.portfolioSummary,
      timestamp: analysisData.timestamp || new Date().toISOString()
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="financial-risk-analysis-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`PDF report generated successfully (${pdfBuffer.length} bytes)`);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    
    res.status(500).json({
      error: 'Report generation failed',
      message: 'An error occurred while generating the PDF report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/report/download/:reportId
 * Download previously generated report by ID
 */
router.get('/download/:reportId', async (req, res) => {
  try {
    const reportId = req.params.reportId;
    
    if (!reportId) {
      return res.status(400).json({
        error: 'Report ID is required'
      });
    }

    // Get analysis data from cache
    const analysisData = analysisCache.get(reportId);
    
    if (!analysisData) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'The requested report has expired or does not exist'
      });
    }

    console.log(`Generating PDF download for report ID: ${reportId}`);

    // Generate PDF
    const pdfBuffer = await reportGeneratorService.generateAnalysisReport({
      companies: analysisData.results,
      portfolioSummary: analysisData.portfolioSummary,
      timestamp: analysisData.timestamp || new Date().toISOString()
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="financial-risk-analysis-${reportId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF download error:', error);
    
    res.status(500).json({
      error: 'Download failed',
      message: 'An error occurred while downloading the report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/report/preview
 * Generate HTML preview of the report
 */
router.post('/preview', async (req, res) => {
  try {
    const { analysisData } = req.body;
    
    if (!analysisData || !analysisData.results || !Array.isArray(analysisData.results)) {
      return res.status(400).json({
        error: 'Invalid analysis data',
        message: 'Please provide valid analysis results to generate a preview'
      });
    }

    // Generate a simplified HTML preview
    const htmlContent = generateHTMLPreview({
      companies: analysisData.results,
      portfolioSummary: analysisData.portfolioSummary,
      timestamp: analysisData.timestamp || new Date().toISOString()
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);

  } catch (error) {
    console.error('HTML preview error:', error);
    
    res.status(500).json({
      error: 'Preview generation failed',
      message: 'An error occurred while generating the report preview',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/report/save
 * Save analysis data for later report generation
 */
router.post('/save', (req, res) => {
  try {
    const { analysisData } = req.body;
    
    if (!analysisData) {
      return res.status(400).json({
        error: 'Analysis data is required'
      });
    }

    // Generate unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in cache
    analysisCache.set(reportId, analysisData);

    res.json({
      success: true,
      reportId,
      downloadUrl: `/api/report/download/${reportId}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      message: 'Analysis data saved successfully'
    });

  } catch (error) {
    console.error('Save analysis error:', error);
    
    res.status(500).json({
      error: 'Save failed',
      message: 'An error occurred while saving the analysis data'
    });
  }
});

/**
 * GET /api/report/status/:reportId
 * Check if a report is available for download
 */
router.get('/status/:reportId', (req, res) => {
  try {
    const reportId = req.params.reportId;
    const analysisData = analysisCache.get(reportId);
    
    if (analysisData) {
      res.json({
        success: true,
        reportId,
        status: 'available',
        companies: analysisData.results?.length || 0,
        downloadUrl: `/api/report/download/${reportId}`
      });
    } else {
      res.json({
        success: false,
        reportId,
        status: 'not_found',
        message: 'Report not found or expired'
      });
    }

  } catch (error) {
    console.error('Report status error:', error);
    
    res.status(500).json({
      error: 'Status check failed',
      message: 'An error occurred while checking report status'
    });
  }
});

/**
 * Generate HTML preview (simplified version of the full report)
 */
function generateHTMLPreview(analysisData) {
  const { companies, portfolioSummary, timestamp } = analysisData;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Risk Analysis Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .company-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .risk-safe { color: #28a745; }
        .risk-grey { color: #ffc107; }
        .risk-distress { color: #dc3545; }
        .download-btn {
            background: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Financial Risk Analysis</h1>
        <p>Generated on ${new Date(timestamp).toLocaleDateString()}</p>
    </div>

    <h2>Portfolio Summary</h2>
    <div class="metric-grid">
        <div class="metric-card">
            <div>Total Companies</div>
            <div style="font-size: 24px; font-weight: bold;">${portfolioSummary.totalCompanies}</div>
        </div>
        <div class="metric-card">
            <div>Average Z-Score</div>
            <div style="font-size: 24px; font-weight: bold;">${portfolioSummary.averageZScore}</div>
        </div>
        <div class="metric-card">
            <div>Portfolio Risk</div>
            <div style="font-size: 24px; font-weight: bold;" class="risk-${portfolioSummary.portfolioRisk.toLowerCase()}">${portfolioSummary.portfolioRisk}</div>
        </div>
    </div>

    <h2>Risk Distribution</h2>
    <div class="metric-grid">
        <div class="metric-card">
            <div>Safe Zone</div>
            <div style="font-size: 20px; font-weight: bold;" class="risk-safe">${portfolioSummary.riskDistribution.safeZone.count} (${portfolioSummary.riskDistribution.safeZone.percentage}%)</div>
        </div>
        <div class="metric-card">
            <div>Grey Zone</div>
            <div style="font-size: 20px; font-weight: bold;" class="risk-grey">${portfolioSummary.riskDistribution.greyZone.count} (${portfolioSummary.riskDistribution.greyZone.percentage}%)</div>
        </div>
        <div class="metric-card">
            <div>Distress Zone</div>
            <div style="font-size: 20px; font-weight: bold;" class="risk-distress">${portfolioSummary.riskDistribution.distressZone.count} (${portfolioSummary.riskDistribution.distressZone.percentage}%)</div>
        </div>
    </div>

    <h2>Company Analysis</h2>
    ${companies.map(company => `
        <div class="company-card">
            <h3>${company.company.name} (${company.company.ticker})</h3>
            <p><strong>Z-Score:</strong> ${company.analysis.distressScore.altmanZScore} - <span class="risk-${company.analysis.distressScore.riskZone.toLowerCase().replace(' zone', '').replace(' ', '')}">${company.analysis.distressScore.riskZone}</span></p>
            <p><strong>Recommendation:</strong> ${company.analysis.aiAnalysis.recommendation}</p>
            <p><strong>Summary:</strong> ${company.analysis.aiAnalysis.executiveSummary}</p>
        </div>
    `).join('')}

    <div style="text-align: center; margin: 40px 0;">
        <p>This is a preview. Download the full PDF report for complete analysis.</p>
        <button class="download-btn" onclick="window.close()">Close Preview</button>
    </div>
</body>
</html>`;
}

module.exports = router;