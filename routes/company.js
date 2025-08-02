const express = require('express');
const financialDataService = require('../services/financialDataService');
const ratioCalculatorService = require('../services/ratioCalculatorService');

const router = express.Router();

/**
 * GET /api/company/:ticker
 * Get detailed company information and financial data
 */
router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    
    if (!ticker || ticker.length > 10) {
      return res.status(400).json({
        error: 'Invalid ticker symbol',
        message: 'Please provide a valid stock ticker symbol'
      });
    }

    console.log(`Fetching company data for ${ticker}`);

    // Get company overview
    const company = await financialDataService.getCompanyOverview(ticker);
    
    // Get financial statements and market data in parallel
    const [financials, marketData] = await Promise.all([
      financialDataService.getFinancialStatements(ticker),
      financialDataService.getCurrentPrice(ticker)
    ]);

    // Calculate ratios
    const calculatedRatios = ratioCalculatorService.calculateAllRatios(
      financials, 
      marketData, 
      company
    );

    const response = {
      success: true,
      company,
      financials,
      marketData,
      ratios: calculatedRatios.ratios,
      distressScore: calculatedRatios.distressScore,
      dataQuality: calculatedRatios.dataQuality,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error(`Error fetching company data for ${req.params.ticker}:`, error.message);
    
    res.status(404).json({
      error: 'Company not found',
      message: `Unable to find financial data for ticker: ${req.params.ticker}`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/company/search
 * Search for companies by name or ticker
 */
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a company name or ticker symbol to search'
      });
    }

    const searchQuery = query.trim();
    
    if (searchQuery.length < 2) {
      return res.status(400).json({
        error: 'Search query too short',
        message: 'Please provide at least 2 characters for search'
      });
    }

    console.log(`Searching for companies: ${searchQuery}`);

    // Try to resolve the company
    try {
      const company = await financialDataService.resolveCompanyTicker(searchQuery);
      
      res.json({
        success: true,
        results: [company],
        query: searchQuery
      });
    } catch (error) {
      // If direct resolution fails, return empty results
      res.json({
        success: true,
        results: [],
        query: searchQuery,
        message: `No companies found matching: ${searchQuery}`
      });
    }

  } catch (error) {
    console.error('Company search error:', error.message);
    
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching for companies',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/company/:ticker/ratios
 * Get just the financial ratios for a company
 */
router.get('/:ticker/ratios', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    
    console.log(`Fetching ratios for ${ticker}`);

    // Get company overview and financial data
    const [company, financials, marketData] = await Promise.all([
      financialDataService.getCompanyOverview(ticker),
      financialDataService.getFinancialStatements(ticker),
      financialDataService.getCurrentPrice(ticker)
    ]);

    // Calculate ratios
    const calculatedRatios = ratioCalculatorService.calculateAllRatios(
      financials, 
      marketData, 
      company
    );

    res.json({
      success: true,
      ticker,
      companyName: company.name,
      ratios: calculatedRatios.ratios,
      distressScore: calculatedRatios.distressScore,
      dataQuality: calculatedRatios.dataQuality,
      timestamp: calculatedRatios.calculationDate
    });

  } catch (error) {
    console.error(`Error fetching ratios for ${req.params.ticker}:`, error.message);
    
    res.status(404).json({
      error: 'Unable to calculate ratios',
      message: `Failed to get financial data for ticker: ${req.params.ticker}`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/company/:ticker/price
 * Get current market data for a company
 */
router.get('/:ticker/price', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    
    console.log(`Fetching price data for ${ticker}`);

    const marketData = await financialDataService.getCurrentPrice(ticker);

    res.json({
      success: true,
      ticker,
      marketData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error fetching price for ${req.params.ticker}:`, error.message);
    
    res.status(404).json({
      error: 'Price data not available',
      message: `Unable to get current price for ticker: ${req.params.ticker}`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/company/validate
 * Validate a list of company tickers/names
 */
router.post('/validate', async (req, res) => {
  try {
    const { companies } = req.body;
    
    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({
        error: 'Companies array is required',
        message: 'Please provide an array of company names or tickers'
      });
    }

    if (companies.length === 0) {
      return res.status(400).json({
        error: 'Empty companies array',
        message: 'Please provide at least one company to validate'
      });
    }

    if (companies.length > 50) {
      return res.status(400).json({
        error: 'Too many companies',
        message: 'Maximum 50 companies allowed for validation'
      });
    }

    console.log(`Validating ${companies.length} companies`);

    // Validate companies in parallel
    const validationPromises = companies.map(async (company) => {
      try {
        const resolved = await financialDataService.resolveCompanyTicker(company);
        return {
          input: company,
          valid: true,
          ticker: resolved.ticker,
          name: resolved.name,
          industry: resolved.industry
        };
      } catch (error) {
        return {
          input: company,
          valid: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(validationPromises);
    const validCompanies = results.filter(r => r.valid);
    const invalidCompanies = results.filter(r => !r.valid);

    res.json({
      success: true,
      totalCompanies: companies.length,
      validCompanies: validCompanies.length,
      invalidCompanies: invalidCompanies.length,
      results: {
        valid: validCompanies,
        invalid: invalidCompanies
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Company validation error:', error.message);
    
    res.status(500).json({
      error: 'Validation failed',
      message: 'An error occurred while validating companies',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;