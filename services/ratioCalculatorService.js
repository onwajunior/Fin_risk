/**
 * Financial Ratio Calculator Service
 * Calculates key financial ratios and Altman Z-Score for bankruptcy prediction
 */

class RatioCalculatorService {
  /**
   * Calculate all financial ratios for a company
   * @param {Object} financials - Financial statements data
   * @param {Object} marketData - Current market data
   * @param {Object} overview - Company overview data
   * @returns {Object} Calculated ratios and scores
   */
  calculateAllRatios(financials, marketData, overview) {
    const { incomeStatement, balanceSheet, cashFlow } = financials;
    
    const ratios = {
      // Liquidity Ratios
      liquidity: this.calculateLiquidityRatios(balanceSheet, incomeStatement),
      
      // Leverage/Solvency Ratios
      leverage: this.calculateLeverageRatios(balanceSheet, incomeStatement),
      
      // Profitability Ratios
      profitability: this.calculateProfitabilityRatios(incomeStatement, balanceSheet, marketData),
      
      // Efficiency Ratios
      efficiency: this.calculateEfficiencyRatios(incomeStatement, balanceSheet),
      
      // Cash Flow Ratios
      cashFlow: this.calculateCashFlowRatios(cashFlow, incomeStatement, balanceSheet),
      
      // Market-Based Ratios
      market: this.calculateMarketRatios(marketData, incomeStatement, balanceSheet)
    };

    // Calculate Altman Z-Score
    const distressScore = this.calculateAltmanZScore(
      balanceSheet, 
      incomeStatement, 
      marketData, 
      overview.companyType || 'non-manufacturing'
    );

    return {
      ratios,
      distressScore,
      calculationDate: new Date().toISOString(),
      dataQuality: this.assessDataQuality(financials, marketData)
    };
  }

  /**
   * Calculate liquidity ratios
   */
  calculateLiquidityRatios(balanceSheet, incomeStatement) {
    const currentAssets = balanceSheet.totalCurrentAssets || 0;
    const currentLiabilities = balanceSheet.totalCurrentLiabilities || 0;
    const cash = balanceSheet.cash || 0;
    const inventory = balanceSheet.inventory || 0;
    const revenue = incomeStatement.totalRevenue || 0;

    // Quick assets = Current assets - Inventory
    const quickAssets = currentAssets - inventory;

    return {
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? quickAssets / currentLiabilities : 0,
      cashRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0,
      workingCapitalRatio: revenue > 0 ? (currentAssets - currentLiabilities) / revenue : 0
    };
  }

  /**
   * Calculate leverage/solvency ratios
   */
  calculateLeverageRatios(balanceSheet, incomeStatement) {
    const totalDebt = (balanceSheet.longTermDebt || 0) + (balanceSheet.shortTermDebt || 0);
    const totalAssets = balanceSheet.totalAssets || 0;
    const totalEquity = balanceSheet.totalShareholderEquity || 0;
    const totalLiabilities = balanceSheet.totalLiabilities || 0;
    const ebit = incomeStatement.ebit || incomeStatement.operatingIncome || 0;
    const interestExpense = incomeStatement.interestExpense || 0;

    return {
      debtToEquity: totalEquity > 0 ? totalDebt / totalEquity : 0,
      debtToAssets: totalAssets > 0 ? totalDebt / totalAssets : 0,
      equityRatio: totalAssets > 0 ? totalEquity / totalAssets : 0,
      debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
      interestCoverage: interestExpense > 0 ? ebit / interestExpense : ebit > 0 ? 999 : 0,
      timesInterestEarned: interestExpense > 0 ? ebit / interestExpense : ebit > 0 ? 999 : 0
    };
  }

  /**
   * Calculate profitability ratios
   */
  calculateProfitabilityRatios(incomeStatement, balanceSheet, marketData) {
    const revenue = incomeStatement.totalRevenue || 0;
    const grossProfit = incomeStatement.grossProfit || 0;
    const operatingIncome = incomeStatement.operatingIncome || 0;
    const netIncome = incomeStatement.netIncome || 0;
    const totalAssets = balanceSheet.totalAssets || 0;
    const totalEquity = balanceSheet.totalShareholderEquity || 0;

    return {
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      netMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      returnOnAssets: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      returnOnEquity: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
      returnOnInvestment: (totalAssets > 0 && netIncome > 0) ? (netIncome / totalAssets) * 100 : 0
    };
  }

  /**
   * Calculate efficiency ratios
   */
  calculateEfficiencyRatios(incomeStatement, balanceSheet) {
    const revenue = incomeStatement.totalRevenue || 0;
    const totalAssets = balanceSheet.totalAssets || 0;
    const inventory = balanceSheet.inventory || 0;
    const costOfGoodsSold = (incomeStatement.totalRevenue || 0) - (incomeStatement.grossProfit || 0);

    return {
      assetTurnover: totalAssets > 0 ? revenue / totalAssets : 0,
      inventoryTurnover: inventory > 0 ? costOfGoodsSold / inventory : 0,
      receivablesTournover: 0, // Would need accounts receivable data
      workingCapitalTurnover: balanceSheet.workingCapital > 0 ? revenue / balanceSheet.workingCapital : 0
    };
  }

  /**
   * Calculate cash flow ratios
   */
  calculateCashFlowRatios(cashFlow, incomeStatement, balanceSheet) {
    const operatingCashFlow = cashFlow.operatingCashflow || 0;
    const freeCashFlow = cashFlow.freeCashFlow || 0;
    const revenue = incomeStatement.totalRevenue || 0;
    const currentLiabilities = balanceSheet.totalCurrentLiabilities || 0;
    const totalDebt = (balanceSheet.longTermDebt || 0) + (balanceSheet.shortTermDebt || 0);

    return {
      operatingCashFlowToSales: revenue > 0 ? operatingCashFlow / revenue : 0,
      freeCashFlowYield: revenue > 0 ? freeCashFlow / revenue : 0,
      cashFlowCoverage: currentLiabilities > 0 ? operatingCashFlow / currentLiabilities : 0,
      debtCoverage: totalDebt > 0 ? operatingCashFlow / totalDebt : operatingCashFlow > 0 ? 999 : 0
    };
  }

  /**
   * Calculate market-based ratios
   */
  calculateMarketRatios(marketData, incomeStatement, balanceSheet) {
    const marketCap = marketData.marketCap || 0;
    const currentPrice = marketData.currentPrice || 0;
    const netIncome = incomeStatement.netIncome || 0;
    const revenue = incomeStatement.totalRevenue || 0;
    const bookValue = balanceSheet.totalShareholderEquity || 0;

    // Estimate shares outstanding from market cap and price
    const sharesOutstanding = currentPrice > 0 ? marketCap / currentPrice : 0;
    const earningsPerShare = sharesOutstanding > 0 ? netIncome / sharesOutstanding : 0;
    const bookValuePerShare = sharesOutstanding > 0 ? bookValue / sharesOutstanding : 0;

    return {
      priceToEarnings: earningsPerShare > 0 ? currentPrice / earningsPerShare : 0,
      priceToBook: bookValuePerShare > 0 ? currentPrice / bookValuePerShare : 0,
      priceToSales: revenue > 0 && sharesOutstanding > 0 ? marketCap / revenue : 0,
      marketToBook: bookValue > 0 ? marketCap / bookValue : 0,
      earningsPerShare: earningsPerShare,
      bookValuePerShare: bookValuePerShare
    };
  }

  /**
   * Calculate Altman Z-Score for bankruptcy prediction
   * Different formulas for manufacturing vs non-manufacturing companies
   */
  calculateAltmanZScore(balanceSheet, incomeStatement, marketData, companyType) {
    try {
      const totalAssets = balanceSheet.totalAssets || 0;
      const totalLiabilities = balanceSheet.totalLiabilities || 0;
      const workingCapital = balanceSheet.workingCapital || 0;
      const retainedEarnings = balanceSheet.retainedEarnings || 0;
      const ebit = incomeStatement.ebit || incomeStatement.operatingIncome || 0;
      const marketValue = marketData.marketCap || 0;
      const sales = incomeStatement.totalRevenue || 0;

      if (totalAssets === 0) {
        throw new Error('Cannot calculate Z-Score: Total assets is zero');
      }

      // Calculate individual components
      const A = workingCapital / totalAssets; // Working Capital / Total Assets
      const B = retainedEarnings / totalAssets; // Retained Earnings / Total Assets  
      const C = ebit / totalAssets; // EBIT / Total Assets
      const D = marketValue / totalLiabilities; // Market Value of Equity / Total Liabilities
      const E = sales / totalAssets; // Sales / Total Assets

      let zScore;
      let formula;
      let interpretation;

      if (companyType === 'manufacturing') {
        // Original Altman Z-Score for manufacturing companies
        // Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E
        zScore = (1.2 * A) + (1.4 * B) + (3.3 * C) + (0.6 * D) + (1.0 * E);
        formula = 'manufacturing';
        
        if (zScore > 2.99) {
          interpretation = 'Safe Zone - Low bankruptcy risk';
        } else if (zScore >= 1.8) {
          interpretation = 'Grey Zone - Moderate bankruptcy risk, requires monitoring';
        } else {
          interpretation = 'Distress Zone - High bankruptcy risk';
        }
      } else {
        // Modified Altman Z-Score for non-manufacturing companies
        // Z = 6.56A + 3.26B + 6.72C + 1.05D
        zScore = (6.56 * A) + (3.26 * B) + (6.72 * C) + (1.05 * D);
        formula = 'non-manufacturing';
        
        if (zScore > 2.6) {
          interpretation = 'Safe Zone - Low bankruptcy risk';
        } else if (zScore >= 1.1) {
          interpretation = 'Grey Zone - Moderate bankruptcy risk, requires monitoring';
        } else {
          interpretation = 'Distress Zone - High bankruptcy risk';
        }
      }

      // Determine risk zone
      let riskZone;
      if (companyType === 'manufacturing') {
        riskZone = zScore > 2.99 ? 'Safe Zone' : zScore >= 1.8 ? 'Grey Zone' : 'Distress Zone';
      } else {
        riskZone = zScore > 2.6 ? 'Safe Zone' : zScore >= 1.1 ? 'Grey Zone' : 'Distress Zone';
      }

      return {
        altmanZScore: Math.round(zScore * 100) / 100, // Round to 2 decimal places
        riskZone,
        formula,
        companyType,
        interpretation,
        components: {
          workingCapitalToAssets: Math.round(A * 10000) / 100, // Convert to percentage
          retainedEarningsToAssets: Math.round(B * 10000) / 100,
          ebitToAssets: Math.round(C * 10000) / 100,
          marketValueToLiabilities: Math.round(D * 100) / 100,
          salesToAssets: Math.round(E * 100) / 100
        },
        confidence: this.calculateConfidenceLevel(balanceSheet, incomeStatement, marketData)
      };
    } catch (error) {
      console.error('Error calculating Altman Z-Score:', error.message);
      return {
        altmanZScore: 0,
        riskZone: 'Unknown',
        formula: companyType,
        companyType,
        interpretation: 'Unable to calculate Z-Score due to insufficient data',
        components: {},
        confidence: 'Low',
        error: error.message
      };
    }
  }

  /**
   * Assess the quality of financial data for reliability scoring
   */
  assessDataQuality(financials, marketData) {
    let score = 0;
    let maxScore = 0;
    const issues = [];

    // Check income statement data
    maxScore += 3;
    if (financials.incomeStatement.totalRevenue > 0) score += 1;
    if (financials.incomeStatement.netIncome !== 0) score += 1;
    if (financials.incomeStatement.ebit > 0) score += 1;

    // Check balance sheet data
    maxScore += 3;
    if (financials.balanceSheet.totalAssets > 0) score += 1;
    if (financials.balanceSheet.totalShareholderEquity > 0) score += 1;
    if (financials.balanceSheet.totalCurrentAssets > 0) score += 1;

    // Check market data
    maxScore += 2;
    if (marketData.currentPrice > 0) score += 1;
    if (marketData.marketCap > 0) score += 1;

    // Check for data consistency
    maxScore += 2;
    if (financials.balanceSheet.totalAssets >= financials.balanceSheet.totalCurrentAssets) score += 1;
    if (financials.balanceSheet.totalAssets === 
        (financials.balanceSheet.totalLiabilities + financials.balanceSheet.totalShareholderEquity)) {
      score += 1;
    } else {
      issues.push('Balance sheet does not balance');
    }

    const qualityPercentage = (score / maxScore) * 100;
    let quality;
    
    if (qualityPercentage >= 80) {
      quality = 'High';
    } else if (qualityPercentage >= 60) {
      quality = 'Medium';
    } else {
      quality = 'Low';
      issues.push('Insufficient financial data for reliable analysis');
    }

    return {
      score: Math.round(qualityPercentage),
      level: quality,
      issues,
      recommendation: quality === 'Low' ? 
        'Results may be unreliable due to insufficient data' : 
        'Data quality is sufficient for analysis'
    };
  }

  /**
   * Calculate confidence level for Z-Score analysis
   */
  calculateConfidenceLevel(balanceSheet, incomeStatement, marketData) {
    const hasCompleteFinancials = 
      balanceSheet.totalAssets > 0 && 
      balanceSheet.totalLiabilities > 0 &&
      incomeStatement.totalRevenue > 0 &&
      marketData.marketCap > 0;

    const hasKeyMetrics = 
      balanceSheet.retainedEarnings !== undefined &&
      incomeStatement.ebit > 0 &&
      balanceSheet.workingCapital !== undefined;

    if (hasCompleteFinancials && hasKeyMetrics) {
      return 'High';
    } else if (hasCompleteFinancials) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Generate ratio insights for AI analysis
   */
  generateRatioInsights(calculatedRatios) {
    const insights = [];
    const { ratios, distressScore } = calculatedRatios;

    // Liquidity insights
    if (ratios.liquidity.currentRatio < 1.0) {
      insights.push({
        type: 'warning',
        category: 'liquidity',
        message: `Low current ratio (${ratios.liquidity.currentRatio.toFixed(2)}) indicates potential liquidity issues`
      });
    } else if (ratios.liquidity.currentRatio > 3.0) {
      insights.push({
        type: 'info',
        category: 'liquidity',
        message: `High current ratio (${ratios.liquidity.currentRatio.toFixed(2)}) suggests excess cash or inefficient asset use`
      });
    }

    // Leverage insights
    if (ratios.leverage.debtToEquity > 2.0) {
      insights.push({
        type: 'warning',
        category: 'leverage',
        message: `High debt-to-equity ratio (${ratios.leverage.debtToEquity.toFixed(2)}) indicates high financial leverage`
      });
    }

    if (ratios.leverage.interestCoverage < 2.5) {
      insights.push({
        type: 'warning',
        category: 'leverage',
        message: `Low interest coverage (${ratios.leverage.interestCoverage.toFixed(1)}x) may indicate difficulty servicing debt`
      });
    }

    // Profitability insights
    if (ratios.profitability.netMargin < 0) {
      insights.push({
        type: 'danger',
        category: 'profitability',
        message: `Negative net margin (${ratios.profitability.netMargin.toFixed(1)}%) indicates unprofitability`
      });
    }

    if (ratios.profitability.returnOnEquity > 15) {
      insights.push({
        type: 'positive',
        category: 'profitability',
        message: `Strong ROE (${ratios.profitability.returnOnEquity.toFixed(1)}%) demonstrates efficient use of shareholder equity`
      });
    }

    // Distress score insights
    if (distressScore.riskZone === 'Distress Zone') {
      insights.push({
        type: 'danger',
        category: 'distress',
        message: `Altman Z-Score of ${distressScore.altmanZScore} indicates high bankruptcy risk`
      });
    } else if (distressScore.riskZone === 'Safe Zone') {
      insights.push({
        type: 'positive',
        category: 'distress',
        message: `Altman Z-Score of ${distressScore.altmanZScore} indicates low bankruptcy risk`
      });
    }

    return insights;
  }
}

module.exports = new RatioCalculatorService();