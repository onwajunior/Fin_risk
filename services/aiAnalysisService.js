const OpenAI = require('openai');

class AIAnalysisService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured. AI analysis will use fallback logic.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Generate comprehensive AI analysis for a company
   * @param {Object} companyData - Company overview and financial data
   * @returns {Promise<Object>} AI-generated analysis
   */
  async generateCompanyAnalysis(companyData) {
    const { company, ratios, distressScore, marketData } = companyData;

    try {
      if (this.openai) {
        return await this.generateOpenAIAnalysis(companyData);
      } else {
        return this.generateFallbackAnalysis(companyData);
      }
    } catch (error) {
      console.error(`Error generating AI analysis for ${company.ticker}:`, error.message);
      return this.generateFallbackAnalysis(companyData);
    }
  }

  /**
   * Generate analysis using OpenAI API
   */
  async generateOpenAIAnalysis(companyData) {
    const { company, ratios, distressScore, marketData } = companyData;

    const prompt = this.buildAnalysisPrompt(companyData);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior financial analyst specializing in bankruptcy risk assessment and investment recommendations. Your analysis should be professional, concise, and suitable for C-suite executives. Focus heavily on the Altman Z-Score and distress indicators while providing actionable insights.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent financial analysis
        max_tokens: 1000
      });

      const analysis = completion.choices[0].message.content;
      return this.parseAIResponse(analysis, distressScore);

    } catch (error) {
      console.error('OpenAI API error:', error.message);
      return this.generateFallbackAnalysis(companyData);
    }
  }

  /**
   * Build detailed prompt for AI analysis
   */
  buildAnalysisPrompt(companyData) {
    const { company, ratios, distressScore, marketData } = companyData;

    return `
FINANCIAL RISK ANALYSIS REQUEST

Company: ${company.name} (${company.ticker})
Industry: ${company.industry}
Sector: ${company.sector}
Market Cap: $${(marketData.marketCap / 1000000000).toFixed(1)}B
Current Price: $${marketData.currentPrice}

ALTMAN Z-SCORE ANALYSIS (Primary Focus):
- Z-Score: ${distressScore.altmanZScore}
- Risk Zone: ${distressScore.riskZone}
- Formula Used: ${distressScore.formula}
- Interpretation: ${distressScore.interpretation}

KEY FINANCIAL RATIOS:
Liquidity:
- Current Ratio: ${ratios.liquidity.currentRatio.toFixed(2)}
- Quick Ratio: ${ratios.liquidity.quickRatio.toFixed(2)}

Leverage:
- Debt-to-Equity: ${ratios.leverage.debtToEquity.toFixed(2)}
- Interest Coverage: ${ratios.leverage.interestCoverage.toFixed(1)}x

Profitability:
- Net Margin: ${ratios.profitability.netMargin.toFixed(1)}%
- ROE: ${ratios.profitability.returnOnEquity.toFixed(1)}%
- ROA: ${ratios.profitability.returnOnAssets.toFixed(1)}%

Efficiency:
- Asset Turnover: ${ratios.efficiency.assetTurnover.toFixed(2)}

Market Performance:
- Price Change: ${marketData.changePercent?.toFixed(2) || 0}%
- P/E Ratio: ${ratios.market.priceToEarnings.toFixed(1)}

ANALYSIS REQUIREMENTS:
Please provide a structured analysis with the following components:

1. OVERALL RISK RATING: Low/Medium/High (heavily weight the Altman Z-Score)

2. BANKRUPTCY/DISTRESS ASSESSMENT: Focus on the Z-Score zone and what it means for financial stability

3. KEY STRENGTHS: 2-3 bullet points highlighting positive financial indicators

4. KEY CONCERNS: 2-3 bullet points identifying risk factors and areas requiring attention

5. INVESTMENT RECOMMENDATION: Buy/Hold/Sell/Avoid with brief justification

6. EXECUTIVE SUMMARY: One impactful sentence emphasizing the company's financial stability and investment worthiness

Format your response as JSON with the following structure:
{
  "riskRating": "Low/Medium/High",
  "distressAssessment": "detailed assessment text",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2", "concern 3"],
  "recommendation": "Buy/Hold/Sell/Avoid",
  "recommendationReasoning": "brief justification",
  "executiveSummary": "one powerful sentence"
}
`;
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(analysisText, distressScore) {
    try {
      // Try to parse as JSON first
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          riskRating: parsed.riskRating || this.determineRiskRating(distressScore),
          distressAssessment: parsed.distressAssessment || distressScore.interpretation,
          strengths: parsed.strengths || [],
          concerns: parsed.concerns || [],
          recommendation: parsed.recommendation || this.determineRecommendation(distressScore),
          recommendationReasoning: parsed.recommendationReasoning || '',
          executiveSummary: parsed.executiveSummary || `Company shows ${distressScore.riskZone.toLowerCase()} risk profile`,
          analysisText: analysisText
        };
      }

      // Fallback parsing if JSON format failed
      return this.parseTextResponse(analysisText, distressScore);

    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      return this.generateFallbackAnalysis({ distressScore });
    }
  }

  /**
   * Parse text-based response (fallback)
   */
  parseTextResponse(text, distressScore) {
    const lines = text.split('\n').filter(line => line.trim());
    
    const strengths = [];
    const concerns = [];
    let riskRating = this.determineRiskRating(distressScore);
    let recommendation = this.determineRecommendation(distressScore);
    let executiveSummary = `Company shows ${distressScore.riskZone.toLowerCase()} risk profile`;

    // Simple text parsing logic
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('strength') || lower.includes('positive')) {
        strengths.push(line.replace(/^\W*/, '').trim());
      } else if (lower.includes('concern') || lower.includes('risk') || lower.includes('weakness')) {
        concerns.push(line.replace(/^\W*/, '').trim());
      } else if (lower.includes('recommend')) {
        if (lower.includes('buy')) recommendation = 'Buy';
        else if (lower.includes('sell')) recommendation = 'Sell';
        else if (lower.includes('hold')) recommendation = 'Hold';
        else if (lower.includes('avoid')) recommendation = 'Avoid';
      }
    }

    return {
      riskRating,
      distressAssessment: distressScore.interpretation,
      strengths: strengths.slice(0, 3),
      concerns: concerns.slice(0, 3),
      recommendation,
      recommendationReasoning: 'Based on financial analysis and Z-Score assessment',
      executiveSummary,
      analysisText: text
    };
  }

  /**
   * Generate fallback analysis when AI is not available
   */
  generateFallbackAnalysis(companyData) {
    const { company, ratios, distressScore, marketData } = companyData;

    const riskRating = this.determineRiskRating(distressScore);
    const recommendation = this.determineRecommendation(distressScore);
    
    const strengths = this.identifyStrengths(ratios, distressScore, marketData);
    const concerns = this.identifyConcerns(ratios, distressScore, marketData);

    return {
      riskRating,
      distressAssessment: this.generateDistressAssessment(distressScore, ratios),
      strengths,
      concerns,
      recommendation,
      recommendationReasoning: this.getRecommendationReasoning(distressScore, ratios),
      executiveSummary: this.generateExecutiveSummary(company, distressScore, ratios),
      analysisText: 'Generated using fallback analysis engine',
      isAIGenerated: false
    };
  }

  /**
   * Determine risk rating based on Z-Score and ratios
   */
  determineRiskRating(distressScore) {
    if (distressScore.riskZone === 'Safe Zone') {
      return 'Low';
    } else if (distressScore.riskZone === 'Grey Zone') {
      return 'Medium';
    } else {
      return 'High';
    }
  }

  /**
   * Determine investment recommendation
   */
  determineRecommendation(distressScore) {
    if (distressScore.riskZone === 'Safe Zone') {
      return distressScore.altmanZScore > 4.0 ? 'Buy' : 'Hold';
    } else if (distressScore.riskZone === 'Grey Zone') {
      return 'Hold';
    } else {
      return distressScore.altmanZScore < 1.0 ? 'Avoid' : 'Sell';
    }
  }

  /**
   * Identify company strengths
   */
  identifyStrengths(ratios, distressScore, marketData) {
    const strengths = [];

    if (distressScore.riskZone === 'Safe Zone') {
      strengths.push(`Strong financial stability with Altman Z-Score of ${distressScore.altmanZScore}`);
    }

    if (ratios.profitability.netMargin > 10) {
      strengths.push(`Excellent profitability with ${ratios.profitability.netMargin.toFixed(1)}% net margin`);
    }

    if (ratios.profitability.returnOnEquity > 15) {
      strengths.push(`Strong ROE of ${ratios.profitability.returnOnEquity.toFixed(1)}% indicates efficient capital use`);
    }

    if (ratios.liquidity.currentRatio > 1.5) {
      strengths.push(`Solid liquidity position with current ratio of ${ratios.liquidity.currentRatio.toFixed(2)}`);
    }

    if (ratios.leverage.interestCoverage > 5) {
      strengths.push(`Low financial risk with ${ratios.leverage.interestCoverage.toFixed(1)}x interest coverage`);
    }

    if (marketData.changePercent > 0) {
      strengths.push(`Positive market momentum with ${marketData.changePercent.toFixed(1)}% recent gain`);
    }

    return strengths.slice(0, 3);
  }

  /**
   * Identify company concerns
   */
  identifyConcerns(ratios, distressScore, marketData) {
    const concerns = [];

    if (distressScore.riskZone === 'Distress Zone') {
      concerns.push(`High bankruptcy risk indicated by Altman Z-Score of ${distressScore.altmanZScore}`);
    } else if (distressScore.riskZone === 'Grey Zone') {
      concerns.push(`Elevated financial risk requires monitoring (Z-Score: ${distressScore.altmanZScore})`);
    }

    if (ratios.liquidity.currentRatio < 1.0) {
      concerns.push(`Liquidity concerns with current ratio below 1.0 (${ratios.liquidity.currentRatio.toFixed(2)})`);
    }

    if (ratios.leverage.debtToEquity > 2.0) {
      concerns.push(`High leverage risk with debt-to-equity ratio of ${ratios.leverage.debtToEquity.toFixed(2)}`);
    }

    if (ratios.profitability.netMargin < 0) {
      concerns.push(`Unprofitable operations with negative net margin (${ratios.profitability.netMargin.toFixed(1)}%)`);
    }

    if (ratios.leverage.interestCoverage < 2.5) {
      concerns.push(`Weak interest coverage (${ratios.leverage.interestCoverage.toFixed(1)}x) may indicate debt service difficulties`);
    }

    if (marketData.changePercent < -5) {
      concerns.push(`Significant market decline of ${Math.abs(marketData.changePercent).toFixed(1)}% indicates investor concerns`);
    }

    return concerns.slice(0, 3);
  }

  /**
   * Generate distress assessment
   */
  generateDistressAssessment(distressScore, ratios) {
    const zScore = distressScore.altmanZScore;
    const zone = distressScore.riskZone;

    if (zone === 'Safe Zone') {
      return `Company demonstrates strong financial health with an Altman Z-Score of ${zScore}, indicating low probability of bankruptcy within the next two years. Financial fundamentals support continued operations and growth.`;
    } else if (zone === 'Grey Zone') {
      return `Company shows moderate financial stress with an Altman Z-Score of ${zScore}. While not in immediate distress, careful monitoring of key financial metrics is recommended to prevent deterioration.`;
    } else {
      return `Company exhibits high financial distress with an Altman Z-Score of ${zScore}, suggesting elevated bankruptcy risk. Immediate attention to liquidity, debt management, and operational efficiency is critical.`;
    }
  }

  /**
   * Get recommendation reasoning
   */
  getRecommendationReasoning(distressScore, ratios) {
    const zone = distressScore.riskZone;
    
    if (zone === 'Safe Zone') {
      return 'Strong financial fundamentals and low bankruptcy risk support investment consideration';
    } else if (zone === 'Grey Zone') {
      return 'Mixed financial indicators require cautious approach and continued monitoring';
    } else {
      return 'High financial distress and bankruptcy risk make investment inadvisable';
    }
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(company, distressScore, ratios) {
    const profitability = ratios.profitability.netMargin;
    const stability = distressScore.riskZone;

    if (stability === 'Safe Zone' && profitability > 10) {
      return `${company.name} demonstrates exceptional financial strength with strong profitability and minimal bankruptcy risk.`;
    } else if (stability === 'Safe Zone') {
      return `${company.name} maintains solid financial stability despite moderate profitability challenges.`;
    } else if (stability === 'Grey Zone') {
      return `${company.name} requires careful monitoring due to elevated financial risk indicators.`;
    } else {
      return `${company.name} faces significant financial distress requiring immediate management attention.`;
    }
  }

  /**
   * Generate portfolio-level analysis
   */
  async generatePortfolioAnalysis(companies) {
    const totalCompanies = companies.length;
    const riskDistribution = {
      'Safe Zone': 0,
      'Grey Zone': 0,
      'Distress Zone': 0
    };

    const averageZScore = companies.reduce((sum, company) => 
      sum + (company.analysis?.distressScore?.altmanZScore || 0), 0) / totalCompanies;

    companies.forEach(company => {
      const zone = company.analysis?.distressScore?.riskZone || 'Unknown';
      if (riskDistribution[zone] !== undefined) {
        riskDistribution[zone]++;
      }
    });

    const portfolioRisk = this.assessPortfolioRisk(riskDistribution, totalCompanies);
    
    return {
      totalCompanies,
      averageZScore: Math.round(averageZScore * 100) / 100,
      riskDistribution: {
        safeZone: {
          count: riskDistribution['Safe Zone'],
          percentage: Math.round((riskDistribution['Safe Zone'] / totalCompanies) * 100)
        },
        greyZone: {
          count: riskDistribution['Grey Zone'],
          percentage: Math.round((riskDistribution['Grey Zone'] / totalCompanies) * 100)
        },
        distressZone: {
          count: riskDistribution['Distress Zone'],
          percentage: Math.round((riskDistribution['Distress Zone'] / totalCompanies) * 100)
        }
      },
      portfolioRisk,
      recommendations: this.generatePortfolioRecommendations(riskDistribution, totalCompanies),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Assess overall portfolio risk
   */
  assessPortfolioRisk(riskDistribution, totalCompanies) {
    const distressPercentage = (riskDistribution['Distress Zone'] / totalCompanies) * 100;
    const greyPercentage = (riskDistribution['Grey Zone'] / totalCompanies) * 100;
    
    if (distressPercentage > 25) {
      return 'High';
    } else if (distressPercentage > 10 || greyPercentage > 50) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Generate portfolio recommendations
   */
  generatePortfolioRecommendations(riskDistribution, totalCompanies) {
    const recommendations = [];
    
    const distressPercentage = (riskDistribution['Distress Zone'] / totalCompanies) * 100;
    const safePercentage = (riskDistribution['Safe Zone'] / totalCompanies) * 100;
    
    if (distressPercentage > 15) {
      recommendations.push('Consider reducing exposure to high-risk companies in the Distress Zone');
    }
    
    if (safePercentage > 80) {
      recommendations.push('Portfolio shows strong financial stability across holdings');
    }
    
    if (riskDistribution['Grey Zone'] > totalCompanies * 0.3) {
      recommendations.push('Monitor companies in Grey Zone for potential risk escalation');
    }
    
    return recommendations;
  }
}

module.exports = new AIAnalysisService();