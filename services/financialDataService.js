const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for 5 minutes to avoid excessive API calls
const cache = new NodeCache({ stdTTL: 300 });

class FinancialDataService {
  constructor() {
    // Multiple data sources for redundancy
    this.dataSources = {
      alphavantage: {
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: process.env.ALPHA_VANTAGE_API_KEY,
        dailyLimit: 25,
        requestsToday: 0
      },
      financialModelingPrep: {
        baseUrl: 'https://financialmodelingprep.com/api/v3',
        apiKey: process.env.FINANCIAL_MODELING_PREP_API_KEY,
        dailyLimit: 250,
        requestsToday: 0
      },
      yahooFinance: {
        baseUrl: 'https://query1.finance.yahoo.com/v10/finance',
        apiKey: null, // Yahoo Finance doesn't require API key for basic data
        dailyLimit: 1000,
        requestsToday: 0
      },
      finnhub: {
        baseUrl: 'https://finnhub.io/api/v1',
        apiKey: process.env.FINNHUB_API_KEY,
        dailyLimit: 60,
        requestsToday: 0
      }
    };
  }

  /**
   * Resolve company name to ticker symbol
   * @param {string} companyInput - Company name or ticker
   * @returns {Promise<Object>} Company information with ticker
   */
  async resolveCompanyTicker(companyInput) {
    const cacheKey = `ticker_${companyInput.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  
    const normalizedInput = companyInput.trim().toUpperCase();
    
    try {
      // 1. Use FMP search API first to find company dynamically
      console.log(`Searching for company: ${companyInput}`);
      const fmpResult = await this.searchCompanyFMP(companyInput);
      if (fmpResult) {
        cache.set(cacheKey, fmpResult);
        return fmpResult;
      }

      // 2. If search fails, try direct ticker lookup (1-4 letters only)
      if (/^[A-Z]{1,4}$/.test(normalizedInput)) {
        console.log(`Direct ticker lookup: ${normalizedInput}`);
        const directResult = await this.getCompanyOverview(normalizedInput);
        cache.set(cacheKey, directResult);
        return directResult;
      }
  
      // 3. Fallback to Alpha Vantage search
      console.log(`FMP search failed, trying Alpha Vantage for: ${companyInput}`);
      const searchResult = await this.searchCompanyByName(companyInput);
      if (searchResult) {
        cache.set(cacheKey, searchResult);
        return searchResult;
      }
  
      throw new Error(`Company not found: ${companyInput}`);
    } catch (error) {
      console.error(`Error resolving ticker for ${companyInput}:`, error.message);
      throw new Error(`Could not resolve company "${companyInput}". Please use the stock ticker symbol (e.g., AAPL for Apple) or check the spelling.`);
    }
  }

  /**
   * Search for company using Financial Modeling Prep API
   */
  async searchCompanyFMP(companyName) {
    if (!this.dataSources.financialModelingPrep.apiKey) {
      console.warn('Financial Modeling Prep API key not configured');
      return null;
    }

    try {
      const response = await axios.get(
        `${this.dataSources.financialModelingPrep.baseUrl}/search`,
        {
          params: { 
            query: companyName,
            apikey: this.dataSources.financialModelingPrep.apiKey,
            limit: 10
          },
          timeout: 5000
        }
      );

      const results = response.data;
      if (results && results.length > 0) {
        // Find the best match - prefer US exchanges and exact name matches
        const bestMatch = results.find(company => 
          company.exchangeShortName === 'NASDAQ' || company.exchangeShortName === 'NYSE'
        ) || results[0];

        this.dataSources.financialModelingPrep.requestsToday += 1;
        
        console.log(`FMP search found: ${companyName} → ${bestMatch.symbol} (${bestMatch.name})`);
        
        // Get full company overview using the found ticker
        return await this.getCompanyOverview(bestMatch.symbol);
      }

      return null;
    } catch (error) {
      console.error(`FMP search error for ${companyName}:`, error.message);
      return null;
    }
  }

  /**
   * Search for company by name using Alpha Vantage
   */
  async searchCompanyByName(companyName) {
    if (!this.dataSources.alphavantage.apiKey) {
      console.warn('Alpha Vantage API key not configured, using fallback method');
      return null;
    }

    try {
      const response = await axios.get(this.dataSources.alphavantage.baseUrl, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: companyName,
          apikey: this.dataSources.alphavantage.apiKey
        },
        timeout: 10000
      });

      const matches = response.data.bestMatches;
      if (matches && matches.length > 0) {
        const bestMatch = matches[0];
        return {
          ticker: bestMatch['1. symbol'],
          name: bestMatch['2. name'],
          type: bestMatch['3. type'],
          region: bestMatch['4. region'],
          marketOpen: bestMatch['5. marketOpen'],
          marketClose: bestMatch['6. marketClose'],
          timezone: bestMatch['7. timezone'],
          currency: bestMatch['8. currency']
        };
      }

      return null;
    } catch (error) {
      console.error('Alpha Vantage search error:', error.message);
      return null;
    }
  }

  /**
   * Get best available data source
   */
  getBestDataSource() {
    // Priority order: Financial Modeling Prep > Alpha Vantage > Mock Data
    if (this.dataSources.financialModelingPrep.apiKey && 
        this.dataSources.financialModelingPrep.requestsToday < this.dataSources.financialModelingPrep.dailyLimit) {
      return 'financialModelingPrep';
    }
    
    if (this.dataSources.alphavantage.apiKey && 
        this.dataSources.alphavantage.requestsToday < this.dataSources.alphavantage.dailyLimit) {
      return 'alphavantage';
    }
    
    return 'mock';
  }

  /**
   * Get company overview data
   */
  async getCompanyOverview(ticker) {
    const cacheKey = `overview_${ticker}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const dataSource = this.getBestDataSource();
    
    if (dataSource === 'mock') {
      console.log(`No real data sources available for ${ticker} - API keys missing or limits exceeded`);
      throw new Error(`Financial data unavailable for ${ticker}. API services are not available at the moment.`);
    }

    // Try Financial Modeling Prep first
    if (dataSource === 'financialModelingPrep') {
      try {
        const overview = await this.getCompanyOverviewFromFMP(ticker);
        cache.set(cacheKey, overview);
        return overview;
      } catch (error) {
        console.error(`Financial Modeling Prep error for ${ticker}:`, error.message);
        // Fall through to Alpha Vantage
      }
    }

    try {
      const response = await axios.get(this.dataSources.alphavantage.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol: ticker,
          apikey: this.dataSources.alphavantage.apiKey
        },
        timeout: 10000
      });

      const data = response.data;
      
      if (data.Symbol) {
        const overview = {
          ticker: data.Symbol,
          name: data.Name || ticker,
          description: data.Description || '',
          sector: data.Sector || 'Unknown',
          industry: data.Industry || 'Unknown',
          marketCap: parseFloat(data.MarketCapitalization) || 0,
          peRatio: parseFloat(data.PERatio) || null,
          pegRatio: parseFloat(data.PEGRatio) || null,
          bookValue: parseFloat(data.BookValue) || null,
          dividendPerShare: parseFloat(data.DividendPerShare) || null,
          dividendYield: parseFloat(data.DividendYield) || null,
          eps: parseFloat(data.EPS) || null,
          revenuePerShareTTM: parseFloat(data.RevenuePerShareTTM) || null,
          profitMargin: parseFloat(data.ProfitMargin) || null,
          operatingMarginTTM: parseFloat(data.OperatingMarginTTM) || null,
          returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM) || null,
          returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM) || null,
          revenueTTM: parseFloat(data.RevenueTTM) || null,
          grossProfitTTM: parseFloat(data.GrossProfitTTM) || null,
          ebitda: parseFloat(data.EBITDA) || null,
          companyType: this.determineCompanyType(data.Industry, data.Sector)
        };

        cache.set(cacheKey, overview);
        return overview;
      }

      throw new Error(`No data found for ticker: ${ticker}`);
    } catch (error) {
      console.error(`Error fetching overview for ${ticker}:`, error.message);
      throw new Error(`Financial data unavailable for ${ticker}. Please try again later or check if the company ticker is correct.`);
    }
  }

  /**
   * Get company overview from Financial Modeling Prep
   */
  async getCompanyOverviewFromFMP(ticker) {
    if (!this.dataSources.financialModelingPrep.apiKey) {
      throw new Error('Financial Modeling Prep API key not configured');
    }

    try {
      // Get company profile
      const profileResponse = await axios.get(
        `${this.dataSources.financialModelingPrep.baseUrl}/profile/${ticker}`,
        {
          params: { apikey: this.dataSources.financialModelingPrep.apiKey },
          timeout: 5000
        }
      );

      // Get key metrics
      const metricsResponse = await axios.get(
        `${this.dataSources.financialModelingPrep.baseUrl}/key-metrics-ttm/${ticker}`,
        {
          params: { apikey: this.dataSources.financialModelingPrep.apiKey },
          timeout: 5000
        }
      );

      const profile = profileResponse.data[0];
      const metrics = metricsResponse.data[0];

      if (!profile) {
        throw new Error(`No profile data found for ${ticker}`);
      }

      this.dataSources.financialModelingPrep.requestsToday += 2; // 2 API calls made

      return {
        ticker: profile.symbol,
        name: profile.companyName,
        description: profile.description || '',
        sector: profile.sector || 'Unknown',
        industry: profile.industry || 'Unknown',
        marketCap: profile.mktCap || 0,
        peRatio: metrics?.peRatioTTM || profile.pe || null,
        pegRatio: null,
        bookValue: metrics?.bookValuePerShareTTM || null,
        dividendPerShare: null,
        dividendYield: null,
        eps: profile.lastDiv || null,
        revenuePerShareTTM: metrics?.revenuePerShareTTM || null,
        profitMargin: metrics?.netProfitMarginTTM || null,
        operatingMarginTTM: metrics?.operatingProfitMarginTTM || null,
        returnOnAssetsTTM: metrics?.roaTTM || null,
        returnOnEquityTTM: metrics?.roeTTM || null,
        revenueTTM: metrics?.revenueTTM || null,
        grossProfitTTM: metrics?.grossProfitTTM || null,
        ebitda: null,
        companyType: this.determineCompanyType(profile.industry, profile.sector)
      };

    } catch (error) {
      console.error(`FMP API error for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get financial statements for ratio calculations
   */
  async getFinancialStatements(ticker) {
    const cacheKey = `financials_${ticker}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const dataSource = this.getBestDataSource();
    
    try {
      let financials;
      
      if (dataSource === 'financialModelingPrep') {
        financials = await this.getFinancialStatementsFromFMP(ticker);
      } else {
        // Get income statement, balance sheet, and cash flow from Alpha Vantage or fallback
        const [incomeStatement, balanceSheet, cashFlow] = await Promise.all([
          this.getIncomeStatement(ticker),
          this.getBalanceSheet(ticker),
          this.getCashFlow(ticker)
        ]);

        financials = {
          incomeStatement,
          balanceSheet,
          cashFlow,
          timestamp: new Date().toISOString()
        };
      }

      cache.set(cacheKey, financials);
      return financials;
    } catch (error) {
      console.error(`Error fetching financial statements for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get financial statements from Financial Modeling Prep
   */
  async getFinancialStatementsFromFMP(ticker) {
    try {
      // Get latest financial statements (we'll take the most recent annual data)
      const [incomeResponse, balanceResponse, cashFlowResponse] = await Promise.all([
        axios.get(`${this.dataSources.financialModelingPrep.baseUrl}/income-statement/${ticker}`, {
          params: { 
            apikey: this.dataSources.financialModelingPrep.apiKey,
            limit: 1,
            period: 'annual'
          },
          timeout: 5000
        }),
        axios.get(`${this.dataSources.financialModelingPrep.baseUrl}/balance-sheet-statement/${ticker}`, {
          params: { 
            apikey: this.dataSources.financialModelingPrep.apiKey,
            limit: 1,
            period: 'annual'
          },
          timeout: 5000
        }),
        axios.get(`${this.dataSources.financialModelingPrep.baseUrl}/cash-flow-statement/${ticker}`, {
          params: { 
            apikey: this.dataSources.financialModelingPrep.apiKey,
            limit: 1,
            period: 'annual'
          },
          timeout: 5000
        })
      ]);

      this.dataSources.financialModelingPrep.requestsToday += 3; // 3 API calls made

      const income = incomeResponse.data[0] || {};
      const balance = balanceResponse.data[0] || {};
      const cashFlow = cashFlowResponse.data[0] || {};

      return {
        incomeStatement: {
          fiscalDateEnding: income.date || income.calendarYear,
          totalRevenue: income.revenue || 0,
          grossProfit: income.grossProfit || 0,
          operatingIncome: income.operatingIncome || 0,
          netIncome: income.netIncome || 0,
          ebit: income.ebitda ? income.ebitda - (income.depreciationAndAmortization || 0) : income.operatingIncome || 0,
          ebitda: income.ebitda || 0,
          incomeBeforeTax: income.incomeBeforeTax || 0,
          interestExpense: income.interestExpense || 0
        },
        balanceSheet: {
          fiscalDateEnding: balance.date || balance.calendarYear,
          totalAssets: balance.totalAssets || 0,
          totalCurrentAssets: balance.totalCurrentAssets || 0,
          totalCurrentLiabilities: balance.totalCurrentLiabilities || 0,
          totalLiabilities: balance.totalLiabilities || 0,
          totalShareholderEquity: balance.totalStockholdersEquity || 0,
          retainedEarnings: balance.retainedEarnings || 0,
          workingCapital: (balance.totalCurrentAssets || 0) - (balance.totalCurrentLiabilities || 0),
          longTermDebt: balance.longTermDebt || 0,
          shortTermDebt: balance.shortTermDebt || 0,
          cash: balance.cashAndCashEquivalents || 0,
          inventory: balance.inventory || 0
        },
        cashFlow: {
          fiscalDateEnding: cashFlow.date || cashFlow.calendarYear,
          operatingCashflow: cashFlow.operatingCashFlow || 0,
          capitalExpenditures: Math.abs(cashFlow.capitalExpenditure || 0),
          freeCashFlow: cashFlow.freeCashFlow || 0
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`FMP financial statements error for ${ticker}:`, error.message);
      throw error;
    }
  }

  /**
   * Get income statement data
   */
  async getIncomeStatement(ticker) {
    if (!this.dataSources.alphavantage.apiKey) {
      throw new Error(`Income statement data unavailable for ${ticker}. Alpha Vantage API key not configured.`);
    }

    try {
      const response = await axios.get(this.dataSources.alphavantage.baseUrl, {
        params: {
          function: 'INCOME_STATEMENT',
          symbol: ticker,
          apikey: this.dataSources.alphavantage.apiKey
        },
        timeout: 15000
      });

      const data = response.data;
      if (data.annualReports && data.annualReports.length > 0) {
        const latest = data.annualReports[0];
        return {
          fiscalDateEnding: latest.fiscalDateEnding,
          totalRevenue: parseFloat(latest.totalRevenue) || 0,
          grossProfit: parseFloat(latest.grossProfit) || 0,
          operatingIncome: parseFloat(latest.operatingIncome) || 0,
          netIncome: parseFloat(latest.netIncome) || 0,
          ebit: parseFloat(latest.ebit) || 0,
          ebitda: parseFloat(latest.ebitda) || 0,
          incomeBeforeTax: parseFloat(latest.incomeBeforeTax) || 0,
          interestExpense: parseFloat(latest.interestExpense) || 0
        };
      }

      throw new Error(`No income statement data found for ${ticker}`);
    } catch (error) {
      console.error(`Income statement fetch failed for ${ticker}:`, error.message);
      throw new Error(`Income statement data unavailable for ${ticker}. Please try again later.`);
    }
  }

  /**
   * Get balance sheet data
   */
  async getBalanceSheet(ticker) {
    if (!this.dataSources.alphavantage.apiKey) {
      throw new Error(`Balance sheet data unavailable for ${ticker}. Alpha Vantage API key not configured.`);
    }

    try {
      const response = await axios.get(this.dataSources.alphavantage.baseUrl, {
        params: {
          function: 'BALANCE_SHEET',
          symbol: ticker,
          apikey: this.dataSources.alphavantage.apiKey
        },
        timeout: 15000
      });

      const data = response.data;
      if (data.annualReports && data.annualReports.length > 0) {
        const latest = data.annualReports[0];
        return {
          fiscalDateEnding: latest.fiscalDateEnding,
          totalAssets: parseFloat(latest.totalAssets) || 0,
          totalCurrentAssets: parseFloat(latest.totalCurrentAssets) || 0,
          totalCurrentLiabilities: parseFloat(latest.totalCurrentLiabilities) || 0,
          totalLiabilities: parseFloat(latest.totalLiabilities) || 0,
          totalShareholderEquity: parseFloat(latest.totalShareholderEquity) || 0,
          retainedEarnings: parseFloat(latest.retainedEarnings) || 0,
          workingCapital: (parseFloat(latest.totalCurrentAssets) || 0) - (parseFloat(latest.totalCurrentLiabilities) || 0),
          longTermDebt: parseFloat(latest.longTermDebt) || 0,
          shortTermDebt: parseFloat(latest.shortTermDebt) || 0,
          cash: parseFloat(latest.cash) || 0,
          inventory: parseFloat(latest.inventory) || 0
        };
      }

      throw new Error(`No balance sheet data found for ${ticker}`);
    } catch (error) {
      console.error(`Balance sheet fetch failed for ${ticker}:`, error.message);
      throw new Error(`Balance sheet data unavailable for ${ticker}. Please try again later.`);
    }
  }

  /**
   * Get cash flow data
   */
  async getCashFlow(ticker) {
    if (!this.dataSources.alphavantage.apiKey) {
      throw new Error(`Cash flow data unavailable for ${ticker}. Alpha Vantage API key not configured.`);
    }

    try {
      const response = await axios.get(this.dataSources.alphavantage.baseUrl, {
        params: {
          function: 'CASH_FLOW',
          symbol: ticker,
          apikey: this.dataSources.alphavantage.apiKey
        },
        timeout: 15000
      });

      const data = response.data;
      if (data.annualReports && data.annualReports.length > 0) {
        const latest = data.annualReports[0];
        return {
          fiscalDateEnding: latest.fiscalDateEnding,
          operatingCashflow: parseFloat(latest.operatingCashflow) || 0,
          capitalExpenditures: parseFloat(latest.capitalExpenditures) || 0,
          freeCashFlow: (parseFloat(latest.operatingCashflow) || 0) - Math.abs(parseFloat(latest.capitalExpenditures) || 0)
        };
      }

      throw new Error(`No cash flow data found for ${ticker}`);
    } catch (error) {
      console.error(`Cash flow fetch failed for ${ticker}:`, error.message);
      throw new Error(`Cash flow data unavailable for ${ticker}. Please try again later.`);
    }
  }

  /**
   * Get current stock price and market data
   */
  async getCurrentPrice(ticker) {
    const cacheKey = `price_${ticker}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Try Financial Modeling Prep first (most reliable)
    if (this.dataSources.financialModelingPrep.apiKey) {
      try {
        const response = await axios.get(
          `${this.dataSources.financialModelingPrep.baseUrl}/profile/${ticker}`,
          {
            params: { apikey: this.dataSources.financialModelingPrep.apiKey },
            timeout: 5000
          }
        );

        const profile = response.data[0];
        if (profile) {
          this.dataSources.financialModelingPrep.requestsToday += 1;
          
          const priceData = {
            currentPrice: profile.price || 0,
            previousClose: (profile.price || 0) - (profile.changes || 0),
            change: profile.changes || 0,
            changePercent: profile.changesPercentage || 0,
            marketCap: profile.mktCap || 0,
            volume: profile.volAvg || 0,
            averageVolume: profile.volAvg || 0,
            fiftyTwoWeekHigh: parseFloat(profile.range?.split('-')[1] || 0),
            fiftyTwoWeekLow: parseFloat(profile.range?.split('-')[0] || 0),
            beta: profile.beta || 0
          };

          cache.set(cacheKey, priceData);
          return priceData;
        }
      } catch (error) {
        console.warn(`Financial Modeling Prep price error for ${ticker}:`, error.message);
      }
    }

    try {
      // Fallback to Yahoo Finance (no API key required)
      const yahooResponse = await axios.get(
        `${this.dataSources.yahooFinance.baseUrl}/quoteSummary/${ticker}`,
        {
          params: { modules: 'price,summaryDetail' },
          timeout: 5000
        }
      );

      if (yahooResponse.data.quoteSummary?.result?.[0]) {
        const result = yahooResponse.data.quoteSummary.result[0];
        const price = result.price;
        const summary = result.summaryDetail;

        const priceData = {
          currentPrice: price.regularMarketPrice?.raw || 0,
          previousClose: price.regularMarketPreviousClose?.raw || 0,
          change: price.regularMarketChange?.raw || 0,
          changePercent: price.regularMarketChangePercent?.raw || 0,
          marketCap: price.marketCap?.raw || 0,
          volume: price.regularMarketVolume?.raw || 0,
          averageVolume: price.averageVolume?.raw || 0,
          fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh?.raw || 0,
          fiftyTwoWeekLow: summary.fiftyTwoWeekLow?.raw || 0
        };

        cache.set(cacheKey, priceData);
        return priceData;
      }
    } catch (error) {
      console.warn(`Yahoo Finance error for ${ticker}:`, error.message);
    }

    // Fallback to Alpha Vantage
    if (this.dataSources.alphavantage.apiKey) {
      try {
        const response = await axios.get(this.dataSources.alphavantage.baseUrl, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: ticker,
            apikey: this.dataSources.alphavantage.apiKey
          },
          timeout: 5000
        });

        const quote = response.data['Global Quote'];
        if (quote) {
          const priceData = {
            currentPrice: parseFloat(quote['05. price']) || 0,
            previousClose: parseFloat(quote['08. previous close']) || 0,
            change: parseFloat(quote['09. change']) || 0,
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
            volume: parseFloat(quote['06. volume']) || 0,
            high: parseFloat(quote['03. high']) || 0,
            low: parseFloat(quote['04. low']) || 0
          };

          cache.set(cacheKey, priceData);
          return priceData;
        }
      } catch (error) {
        console.warn(`Alpha Vantage quote error for ${ticker}:`, error.message);
      }
    }

    // If all APIs fail, throw an error
    console.error(`Price data unavailable for ${ticker} - all data sources failed`);
    throw new Error(`Price data unavailable for ${ticker}. Please try again later.`);
  }

  /**
   * Determine if company is manufacturing or non-manufacturing for Altman Z-Score
   */
  determineCompanyType(industry, sector) {
    const manufacturingKeywords = [
      'manufacturing', 'automotive', 'aerospace', 'industrial', 'machinery',
      'construction', 'materials', 'chemicals', 'steel', 'mining', 'oil',
      'energy', 'utilities', 'transportation', 'textiles', 'food', 'beverage'
    ];

    const text = `${industry} ${sector}`.toLowerCase();
    const isManufacturing = manufacturingKeywords.some(keyword => text.includes(keyword));
    
    return isManufacturing ? 'manufacturing' : 'non-manufacturing';
  }

  // Mock data methods for when APIs are not available
  getMockIncomeStatement(ticker) {
    const multiplier = ticker === 'AAPL' ? 10 : ticker === 'MSFT' ? 8 : 5;
    return {
      fiscalDateEnding: '2023-12-31',
      totalRevenue: 100000000000 * multiplier,
      grossProfit: 40000000000 * multiplier,
      operatingIncome: 25000000000 * multiplier,
      netIncome: 20000000000 * multiplier,
      ebit: 26000000000 * multiplier,
      ebitda: 30000000000 * multiplier,
      incomeBeforeTax: 24000000000 * multiplier,
      interestExpense: 500000000 * multiplier
    };
  }

  getMockBalanceSheet(ticker) {
    const multiplier = ticker === 'AAPL' ? 10 : ticker === 'MSFT' ? 8 : 5;
    return {
      fiscalDateEnding: '2023-12-31',
      totalAssets: 300000000000 * multiplier,
      totalCurrentAssets: 120000000000 * multiplier,
      totalCurrentLiabilities: 100000000000 * multiplier,
      totalLiabilities: 180000000000 * multiplier,
      totalShareholderEquity: 120000000000 * multiplier,
      retainedEarnings: 80000000000 * multiplier,
      workingCapital: 20000000000 * multiplier,
      longTermDebt: 60000000000 * multiplier,
      shortTermDebt: 10000000000 * multiplier,
      cash: 50000000000 * multiplier,
      inventory: 5000000000 * multiplier
    };
  }

  getMockCashFlow(ticker) {
    const multiplier = ticker === 'AAPL' ? 10 : ticker === 'MSFT' ? 8 : 5;
    return {
      fiscalDateEnding: '2023-12-31',
      operatingCashflow: 35000000000 * multiplier,
      capitalExpenditures: 5000000000 * multiplier,
      freeCashFlow: 30000000000 * multiplier
    };
  }

  getMockCompanyOverview(ticker) {
    // Normalize ticker to handle different inputs
    const normalizedTicker = ticker.toUpperCase();
    
    // Map common company names to tickers
    const companyMap = {
      'APPLE': 'AAPL',
      'APPLE INC': 'AAPL',
      'MICROSOFT': 'MSFT',
      'MICROSOFT CORP': 'MSFT',
      'TESLA': 'TSLA',
      'TESLA INC': 'TSLA',
      'TESLA MOTORS': 'TSLA',
      'GOOGLE': 'GOOGL',
      'ALPHABET': 'GOOGL',
      'AMAZON': 'AMZN',
      'META': 'META',
      'FACEBOOK': 'META',
      'NVIDIA': 'NVDA',
      'GILEAD': 'GILD'
    };

    const actualTicker = companyMap[normalizedTicker] || normalizedTicker;
    
    // Company data
    const companies = {
      'AAPL': {
        name: 'Apple Inc.',
        industry: 'Consumer Electronics',
        sector: 'Technology',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        marketCap: 3000000000000
      },
      'MSFT': {
        name: 'Microsoft Corporation',
        industry: 'Software—Infrastructure',
        sector: 'Technology',
        description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        marketCap: 2800000000000
      },
      'TSLA': {
        name: 'Tesla, Inc.',
        industry: 'Auto Manufacturers',
        sector: 'Consumer Cyclical',
        description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
        marketCap: 800000000000
      },
      'GOOGL': {
        name: 'Alphabet Inc.',
        industry: 'Internet Content & Information',
        sector: 'Communication Services',
        description: 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
        marketCap: 1700000000000
      },
      'AMZN': {
        name: 'Amazon.com, Inc.',
        industry: 'Internet Retail',
        sector: 'Consumer Cyclical',
        description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
        marketCap: 1500000000000
      },
      'META': {
        name: 'Meta Platforms, Inc.',
        industry: 'Internet Content & Information',
        sector: 'Communication Services',
        description: 'Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.',
        marketCap: 1200000000000
      },
      'GILD': {
        name: 'Gilead Sciences, Inc.',
        industry: 'Drug Manufacturers—General',
        sector: 'Healthcare',
        description: 'Gilead Sciences, Inc., a research-based biopharmaceutical company, discovers, develops, and commercializes medicines in the areas of unmet medical needs.',
        marketCap: 100000000000
      }
    };

    const companyData = companies[actualTicker] || {
      name: `${ticker} Inc.`,
      industry: 'Unknown',
      sector: 'Unknown',
      description: `Mock analysis for ${ticker}`,
      marketCap: 50000000000
    };

    return {
      ticker: actualTicker,
      name: companyData.name,
      description: companyData.description,
      sector: companyData.sector,
      industry: companyData.industry,
      marketCap: companyData.marketCap,
      peRatio: 25,
      pegRatio: 1.5,
      bookValue: 20,
      dividendPerShare: 1.0,
      dividendYield: 2.0,
      eps: 8.5,
      revenuePerShareTTM: 85,
      profitMargin: 0.23,
      operatingMarginTTM: 0.30,
      returnOnAssetsTTM: 0.20,
      returnOnEquityTTM: 0.35,
      revenueTTM: 400000000000,
      grossProfitTTM: 180000000000,
      ebitda: 120000000000,
      companyType: this.determineCompanyType(companyData.industry, companyData.sector)
    };
  }

  getMockPriceData(ticker) {
    const basePrice = ticker === 'AAPL' ? 175 : ticker === 'MSFT' ? 350 : ticker === 'TSLA' ? 250 : 100;
    return {
      currentPrice: basePrice,
      previousClose: basePrice * 0.99,
      change: basePrice * 0.01,
      changePercent: 1.0,
      marketCap: basePrice * 1000000000,
      volume: 50000000,
      averageVolume: 45000000,
      fiftyTwoWeekHigh: basePrice * 1.2,
      fiftyTwoWeekLow: basePrice * 0.7
    };
  }
}

module.exports = new FinancialDataService();