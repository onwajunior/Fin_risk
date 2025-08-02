const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Import services
const financialDataService = require('../services/financialDataService');
const ratioCalculatorService = require('../services/ratioCalculatorService');
const aiAnalysisService = require('../services/aiAnalysisService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * POST /api/analysis/analyze
 * Main endpoint for financial analysis
 */
router.post('/analyze', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { companies } = req.body;
    
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        error: 'Companies array is required',
        example: { companies: ['AAPL', 'MSFT', 'TSLA'] }
      });
    }

    if (companies.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 companies allowed per analysis'
      });
    }

    console.log(`Starting analysis for ${companies.length} companies:`, companies);

    // Process companies in parallel with rate limiting
    const results = await processCompaniesInBatches(companies, 5); // 5 concurrent requests
    
    // Filter out failed analyses
    const successfulResults = results.filter(result => result.success);
    const failedCompanies = results.filter(result => !result.success);

    if (successfulResults.length === 0) {
      return res.status(400).json({
        error: 'Unable to analyze any of the provided companies',
        failedCompanies: failedCompanies.map(f => ({ 
          company: f.company, 
          error: f.error 
        }))
      });
    }

    // Generate portfolio-level analysis
    const portfolioAnalysis = await aiAnalysisService.generatePortfolioAnalysis(successfulResults);

    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      totalCompanies: companies.length,
      successfulAnalyses: successfulResults.length,
      failedAnalyses: failedCompanies.length,
      results: successfulResults,
      portfolioSummary: portfolioAnalysis,
      processingTime,
      timestamp: new Date().toISOString()
    };

    if (failedCompanies.length > 0) {
      response.warnings = failedCompanies.map(f => ({
        company: f.company,
        error: f.error
      }));
    }

    console.log(`Analysis completed in ${processingTime}ms. Success: ${successfulResults.length}, Failed: ${failedCompanies.length}`);
    
    res.json(response);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Internal server error during analysis',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

/**
 * POST /api/analysis/upload
 * Upload CSV file for batch analysis
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a CSV file containing company names or tickers'
      });
    }

    const companies = await parseCSVFile(req.file.path);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (companies.length === 0) {
      return res.status(400).json({
        error: 'No valid companies found in CSV file',
        message: 'Please ensure your CSV file contains company names or ticker symbols'
      });
    }

    if (companies.length > 50) {
      return res.status(400).json({
        error: `Too many companies (${companies.length}). Maximum 50 allowed.`,
        preview: companies.slice(0, 10)
      });
    }

    res.json({
      success: true,
      companies,
      count: companies.length,
      message: `Successfully parsed ${companies.length} companies from CSV file`
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to process CSV file',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis/progress/:id
 * Get analysis progress (for future long-running analyses)
 */
router.get('/progress/:id', (req, res) => {
  // Placeholder for future implementation of long-running analyses
  res.json({
    id: req.params.id,
    status: 'completed',
    progress: 100,
    message: 'Analysis completed'
  });
});

/**
 * Process companies in batches to avoid overwhelming APIs
 */
async function processCompaniesInBatches(companies, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)}: ${batch.join(', ')}`);
    
    const batchPromises = batch.map(company => analyzeCompany(company));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      const company = batch[index];
      if (result.status === 'fulfilled') {
        results.push({
          success: true,
          company,
          ...result.value
        });
      } else {
        console.error(`Failed to analyze ${company}:`, result.reason);
        results.push({
          success: false,
          company,
          error: result.reason.message || 'Analysis failed'
        });
      }
    });

    // Add small delay between batches to be respectful to APIs
    if (i + batchSize < companies.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Analyze individual company
 */
async function analyzeCompany(companyInput) {
  try {
    console.log(`Analyzing ${companyInput}...`);
    
    // Step 1: Resolve company ticker and get overview
    const company = await financialDataService.resolveCompanyTicker(companyInput);
    console.log(`Resolved ${companyInput} to ${company.ticker} - ${company.name}`);

    // Step 2: Get financial data in parallel
    const [financials, marketData] = await Promise.all([
      financialDataService.getFinancialStatements(company.ticker),
      financialDataService.getCurrentPrice(company.ticker)
    ]);

    // Step 3: Calculate ratios and Z-Score
    const calculatedRatios = ratioCalculatorService.calculateAllRatios(
      financials, 
      marketData, 
      company
    );

    // Step 4: Generate AI analysis
    const aiAnalysis = await aiAnalysisService.generateCompanyAnalysis({
      company,
      ratios: calculatedRatios.ratios,
      distressScore: calculatedRatios.distressScore,
      marketData
    });

    console.log(`Completed analysis for ${company.ticker} (Z-Score: ${calculatedRatios.distressScore.altmanZScore})`);

    return {
      company: {
        ...company,
        companyType: calculatedRatios.distressScore.companyType
      },
      ratios: calculatedRatios.ratios,
      marketData,
      analysis: {
        distressScore: calculatedRatios.distressScore,
        aiAnalysis,
        dataQuality: calculatedRatios.dataQuality,
        calculationDate: calculatedRatios.calculationDate
      }
    };

  } catch (error) {
    console.error(`Error analyzing company ${companyInput}:`, error.message);
    throw error;
  }
}

/**
 * Parse CSV file and extract company names/tickers
 */
async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const companies = [];
    const seenCompanies = new Set();

    fs.createReadStream(filePath)
      .pipe(csv({
        headers: false, // Don't assume headers
        skipEmptyLines: true
      }))
      .on('data', (row) => {
        // Try to extract company name/ticker from any column
        const values = Object.values(row).map(v => v?.toString().trim()).filter(Boolean);
        
        for (const value of values) {
          if (value && value.length > 0 && value.length < 50) {
            // Clean up the value
            const cleanValue = value
              .replace(/['"]/g, '') // Remove quotes
              .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
              .trim();
            
            if (cleanValue && cleanValue.length > 1 && !seenCompanies.has(cleanValue.toUpperCase())) {
              companies.push(cleanValue);
              seenCompanies.add(cleanValue.toUpperCase());
              break; // Only take first valid value from each row
            }
          }
        }
      })
      .on('end', () => {
        console.log(`Parsed ${companies.length} companies from CSV file`);
        resolve(companies);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Error handling middleware
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'Please upload a file smaller than 10MB'
    });
  }

  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Please upload a CSV file'
    });
  }

  console.error('Route error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
  });
});

module.exports = router;