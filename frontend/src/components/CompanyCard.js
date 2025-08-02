import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Building, 
  Activity,
  DollarSign,
  Percent
} from 'lucide-react';

const CompanyCard = ({ 
  company, 
  onClick, 
  formatCurrency, 
  getRiskIcon, 
  getPriceChangeIcon, 
  getRecommendationColor 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { company: companyInfo, ratios, marketData, analysis } = company;
  const { distressScore, aiAnalysis } = analysis;

  const toggleExpanded = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const getZScoreBadgeClass = (riskZone) => {
    switch (riskZone) {
      case 'Safe Zone':
        return 'badge-safe';
      case 'Grey Zone':
        return 'badge-grey';
      case 'Distress Zone':
        return 'badge-distress';
      default:
        return 'badge-neutral';
    }
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatRatio = (value, decimals = 2) => {
    if (value === null || value === undefined) return 'N/A';
    if (value === 999) return '999+'; // For very high ratios
    return value.toFixed(decimals);
  };

  const getProgressBarWidth = (value, max = 100) => {
    if (value === null || value === undefined) return 0;
    return Math.min((Math.abs(value) / max) * 100, 100);
  };

  return (
    <div className="company-card modern-card" onClick={onClick}>
      {/* Company Header */}
      <div className="company-header">
        <div className="company-info">
          <div className="company-name-section">
            <div className="company-icon-wrapper">
              <Building size={20} />
            </div>
            <div className="company-text">
              <h3 className="company-name">
                {companyInfo.name}
              </h3>
              <span className="company-ticker">
                {companyInfo.ticker} • {companyInfo.industry || 'Technology'}
              </span>
            </div>
          </div>
          
          <div className="company-actions">
            <button 
              className="favorite-btn modern-btn" 
              onClick={(e) => e.stopPropagation()}
              title="Add to favorites"
            >
              <Star size={16} />
            </button>
          </div>
        </div>

        <div className="price-info">
          <div className="current-price">
            {formatCurrency(marketData.currentPrice)}
          </div>
          <div className="price-change">
            {getPriceChangeIcon(marketData.changePercent)}
            <span className={marketData.changePercent >= 0 ? 'text-safe' : 'text-distress'}>
              {formatPercentage(marketData.changePercent)} • Today
            </span>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="risk-assessment">
        <div className="risk-scores">
          <div className="z-score-section">
            <span className="score-label">Altman Z-Score</span>
            <div className={`z-score-badge ${getZScoreBadgeClass(distressScore.riskZone)}`}>
              {distressScore.altmanZScore}
            </div>
            <span className="score-type">({distressScore.formula})</span>
          </div>

          <div className="risk-level-section">
            <span className="score-label">Risk Level</span>
            <div className="risk-zone">
              {getRiskIcon(distressScore.riskZone)}
              <span className={`risk-${distressScore.riskZone.toLowerCase().replace(' zone', '').replace(' ', '')}`}>
                {distressScore.riskZone.replace(' Zone', '')}
              </span>
            </div>
          </div>

          <div className="recommendation-section">
            <span className="score-label">Recommendation</span>
            <div className={`recommendation ${getRecommendationColor(aiAnalysis.recommendation)}`}>
              {aiAnalysis.recommendation}
            </div>
            <span className="recommendation-reason">
              {aiAnalysis.recommendationReasoning}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Metrics Preview */}
      <div className="metrics-preview">
        <div className="metric-item">
          <span className="metric-label">Current Ratio</span>
          <div className="metric-value-container">
            <span className="metric-value">{formatRatio(ratios.liquidity.currentRatio)}</span>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${getProgressBarWidth(ratios.liquidity.currentRatio * 50, 100)}%` }}
              ></div>
            </div>
            <span className="metric-percentage">{Math.round(getProgressBarWidth(ratios.liquidity.currentRatio * 50, 100))}%</span>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-label">ROE</span>
          <div className="metric-value-container">
            <span className="metric-value">{formatRatio(ratios.profitability.returnOnEquity)}%</span>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${getProgressBarWidth(ratios.profitability.returnOnEquity, 30)}%` }}
              ></div>
            </div>
            <span className="metric-percentage">{Math.round(getProgressBarWidth(ratios.profitability.returnOnEquity, 30))}%</span>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-label">Debt/Equity</span>
          <div className="metric-value-container">
            <span className="metric-value">{formatRatio(ratios.leverage.debtToEquity)}</span>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${getProgressBarWidth(ratios.leverage.debtToEquity * 20, 100)}%` }}
              ></div>
            </div>
            <span className="metric-percentage">{Math.round(100 - getProgressBarWidth(ratios.leverage.debtToEquity * 20, 100))}%</span>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-label">Net Margin</span>
          <div className="metric-value-container">
            <span className="metric-value">{formatRatio(ratios.profitability.netMargin)}%</span>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${getProgressBarWidth(ratios.profitability.netMargin, 50)}%` }}
              ></div>
            </div>
            <span className="metric-percentage">{Math.round(getProgressBarWidth(ratios.profitability.netMargin, 50))}%</span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button className="expand-btn" onClick={toggleExpanded}>
        {isExpanded ? (
          <>
            <ChevronUp size={16} />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            Show Details
          </>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="expanded-content">
          {/* Key Insights */}
          <div className="insights-section">
            <h4 className="insights-title">
              <Activity size={18} />
              Key Insights
            </h4>
            
            <div className="insights-grid">
              <div className="insights-column">
                <h5 className="insights-subtitle">Strengths</h5>
                <ul className="insights-list">
                  {aiAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="insight-item insight-positive">
                      ✓ {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="insights-column">
                <h5 className="insights-subtitle">Concerns</h5>
                <ul className="insights-list">
                  {aiAnalysis.concerns.map((concern, index) => (
                    <li key={index} className="insight-item insight-warning">
                      ⚠ {concern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="detailed-metrics">
            <h4 className="metrics-title">
              <DollarSign size={18} />
              Financial Ratios
            </h4>
            
            <div className="metrics-grid">
              <div className="metric-group">
                <h5 className="group-title">Liquidity</h5>
                <div className="metric-row">
                  <span>Current Ratio</span>
                  <span>{formatRatio(ratios.liquidity.currentRatio)}</span>
                </div>
                <div className="metric-row">
                  <span>Quick Ratio</span>
                  <span>{formatRatio(ratios.liquidity.quickRatio)}</span>
                </div>
              </div>

              <div className="metric-group">
                <h5 className="group-title">Leverage</h5>
                <div className="metric-row">
                  <span>Debt-to-Equity</span>
                  <span>{formatRatio(ratios.leverage.debtToEquity)}</span>
                </div>
                <div className="metric-row">
                  <span>Interest Coverage</span>
                  <span>{formatRatio(ratios.leverage.interestCoverage, 1)}x</span>
                </div>
              </div>

              <div className="metric-group">
                <h5 className="group-title">Profitability</h5>
                <div className="metric-row">
                  <span>ROE</span>
                  <span>{formatRatio(ratios.profitability.returnOnEquity)}%</span>
                </div>
                <div className="metric-row">
                  <span>ROA</span>
                  <span>{formatRatio(ratios.profitability.returnOnAssets)}%</span>
                </div>
                <div className="metric-row">
                  <span>Net Margin</span>
                  <span>{formatRatio(ratios.profitability.netMargin)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="executive-summary">
            <h4 className="summary-title">
              <Percent size={18} />
              Executive Summary
            </h4>
            <p className="summary-text">
              {aiAnalysis.executiveSummary}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .company-card {
          background: white;
          border: 1px solid var(--color-neutral-200);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease-out;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .company-card:hover {
          box-shadow: var(--shadow-lg);
          border-color: var(--color-neutral-300);
          transform: translateY(-2px);
        }
        
        .company-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-neutral-100);
        }
        
        .company-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .company-name-section {
          flex: 1;
        }
        
        .company-name {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin: 0 0 var(--space-1);
        }
        
        .company-ticker {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          font-weight: var(--font-weight-medium);
        }
        
        .company-actions {
          display: flex;
          gap: var(--space-2);
        }
        
        .favorite-btn {
          background: none;
          border: 1px solid var(--color-neutral-300);
          border-radius: var(--radius-md);
          padding: var(--space-2);
          cursor: pointer;
          color: var(--color-neutral-400);
          transition: all 0.2s ease-out;
        }
        
        .favorite-btn:hover {
          color: var(--color-primary);
          border-color: var(--color-primary);
        }
        
        .price-info {
          text-align: right;
          margin-left: var(--space-4);
        }
        
        .current-price {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-neutral-900);
          margin-bottom: var(--space-1);
        }
        
        .price-change {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-1);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }
        
        .risk-assessment {
          margin-bottom: var(--space-6);
        }
        
        .risk-scores {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          text-align: center;
        }
        
        .score-label {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-2);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .z-score-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: white;
          margin-bottom: var(--space-1);
        }
        
        .score-type {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-neutral-500);
          font-weight: var(--font-weight-medium);
        }
        
        .risk-zone {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-1);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
        }
        
        .recommendation {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--space-1);
        }
        
        .recommendation-reason {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          text-align: center;
          line-height: 1.4;
          font-weight: var(--font-weight-medium);
        }
        
        .metrics-preview {
          margin-bottom: var(--space-4);
        }
        
        .metric-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }
        
        .metric-item:last-child {
          margin-bottom: 0;
        }
        
        .metric-label {
          flex-shrink: 0;
          width: 100px;
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          font-weight: var(--font-weight-medium);
        }
        
        .metric-value-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .metric-value {
          flex-shrink: 0;
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          font-size: var(--font-size-sm);
          min-width: 50px;
        }
        
        .metric-bar {
          flex: 1;
          height: 6px;
          background: var(--color-neutral-200);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        
        .metric-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-sm);
          transition: width 0.3s ease;
        }
        
        .metric-percentage {
          flex-shrink: 0;
          font-size: var(--font-size-xs);
          color: var(--color-neutral-500);
          min-width: 30px;
          text-align: right;
        }
        
        .expand-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-neutral-50);
          border: 1px solid var(--color-neutral-200);
          border-radius: var(--radius-lg);
          color: var(--color-neutral-600);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s ease-out;
        }
        
        .expand-btn:hover {
          background: var(--color-neutral-100);
          color: var(--color-neutral-800);
        }
        
        .expanded-content {
          margin-top: var(--space-6);
          padding-top: var(--space-6);
          border-top: 1px solid var(--color-neutral-200);
        }
        
        .insights-section,
        .detailed-metrics,
        .executive-summary {
          margin-bottom: var(--space-6);
        }
        
        .insights-title,
        .metrics-title,
        .summary-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin-bottom: var(--space-4);
        }
        
        .insights-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }
        
        .insights-subtitle {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
          margin-bottom: var(--space-2);
        }
        
        .insights-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .insight-item {
          font-size: var(--font-size-sm);
          line-height: 1.4;
          margin-bottom: var(--space-2);
          padding: var(--space-2);
          border-radius: var(--radius-md);
        }
        
        .insight-positive {
          background: rgba(0, 212, 170, 0.1);
          color: var(--color-safe);
        }
        
        .insight-warning {
          background: rgba(255, 184, 0, 0.1);
          color: var(--color-grey);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }
        
        .metric-group {
          background: var(--color-neutral-50);
          padding: var(--space-3);
          border-radius: var(--radius-lg);
        }
        
        .group-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
          margin-bottom: var(--space-2);
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-1) 0;
          font-size: var(--font-size-sm);
        }
        
        .metric-row span:first-child {
          color: var(--color-neutral-600);
        }
        
        .metric-row span:last-child {
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
        }
        
        .summary-text {
          font-size: var(--font-size-sm);
          line-height: 1.6;
          color: var(--color-neutral-700);
          background: var(--color-neutral-50);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--color-primary);
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .company-header {
            flex-direction: column;
            gap: var(--space-3);
          }
          
          .price-info {
            text-align: left;
            margin-left: 0;
          }
          
          .risk-scores {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }
          
          .insights-grid,
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .metric-label {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyCard;