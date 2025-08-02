import React from 'react';
import { 
  PieChart, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  AlertCircle,
  BarChart3
} from 'lucide-react';

const PortfolioSummary = ({ summary, totalCompanies }) => {
  const { riskDistribution, averageZScore, portfolioRisk, recommendations } = summary;

  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'text-safe';
      case 'Medium':
        return 'text-grey';
      case 'High':
        return 'text-distress';
      default:
        return 'text-neutral-600';
    }
  };

  const getZScoreColor = (score) => {
    if (score > 2.99) return 'text-safe';
    if (score >= 1.8) return 'text-grey';
    return 'text-distress';
  };

  return (
    <div className="portfolio-summary">
      {/* Portfolio Header */}
      <div className="portfolio-header">
        <div className="portfolio-title">
          <h3>
            <BarChart3 size={24} />
            Portfolio Overview
          </h3>
          <p>Comprehensive risk assessment across {totalCompanies} companies</p>
        </div>
        
        <div className="portfolio-metrics">
          <div className="metric-card">
            <div className="metric-label">Total Companies</div>
            <div className="metric-value">{totalCompanies}</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Average Z-Score</div>
            <div className={`metric-value ${getZScoreColor(averageZScore)}`}>
              {averageZScore}
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Portfolio Risk</div>
            <div className={`metric-value ${getRiskColor(portfolioRisk)}`}>
              {portfolioRisk}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="risk-distribution">
        <h4 className="section-title">
          <PieChart size={20} />
          Risk Distribution
        </h4>
        
        <div className="distribution-grid">
          <div className="risk-zone-card safe-zone">
            <div className="zone-header">
              <Shield size={24} />
              <div className="zone-info">
                <h5>Safe Zone</h5>
                <p>Low bankruptcy risk</p>
              </div>
            </div>
            
            <div className="zone-metrics">
              <div className="zone-count">{riskDistribution.safeZone.count}</div>
              <div className="zone-percentage">{formatPercentage(riskDistribution.safeZone.percentage)}</div>
            </div>
            
            <div className="zone-bar">
              <div 
                className="zone-fill safe-fill"
                style={{ width: `${riskDistribution.safeZone.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="risk-zone-card grey-zone">
            <div className="zone-header">
              <AlertTriangle size={24} />
              <div className="zone-info">
                <h5>Grey Zone</h5>
                <p>Moderate risk, monitor closely</p>
              </div>
            </div>
            
            <div className="zone-metrics">
              <div className="zone-count">{riskDistribution.greyZone.count}</div>
              <div className="zone-percentage">{formatPercentage(riskDistribution.greyZone.percentage)}</div>
            </div>
            
            <div className="zone-bar">
              <div 
                className="zone-fill grey-fill"
                style={{ width: `${riskDistribution.greyZone.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="risk-zone-card distress-zone">
            <div className="zone-header">
              <AlertCircle size={24} />
              <div className="zone-info">
                <h5>Distress Zone</h5>
                <p>High bankruptcy risk</p>
              </div>
            </div>
            
            <div className="zone-metrics">
              <div className="zone-count">{riskDistribution.distressZone.count}</div>
              <div className="zone-percentage">{formatPercentage(riskDistribution.distressZone.percentage)}</div>
            </div>
            
            <div className="zone-bar">
              <div 
                className="zone-fill distress-fill"
                style={{ width: `${riskDistribution.distressZone.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Insights */}
      {recommendations && recommendations.length > 0 && (
        <div className="portfolio-insights">
          <h4 className="section-title">
            <TrendingUp size={20} />
            Portfolio Insights
          </h4>
          
          <div className="insights-list">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="insight-card">
                <div className="insight-icon">
                  <TrendingUp size={16} />
                </div>
                <p className="insight-text">{recommendation}</p>
              </div>
            ))}
            
            {/* Additional dynamic insights based on portfolio composition */}
            {riskDistribution.safeZone.percentage > 70 && (
              <div className="insight-card insight-positive">
                <div className="insight-icon">
                  <Shield size={16} />
                </div>
                <p className="insight-text">
                  Strong portfolio stability with {riskDistribution.safeZone.percentage}% of companies in Safe Zone
                </p>
              </div>
            )}
            
            {riskDistribution.distressZone.count > 0 && (
              <div className="insight-card insight-warning">
                <div className="insight-icon">
                  <AlertCircle size={16} />
                </div>
                <p className="insight-text">
                  {riskDistribution.distressZone.count} {riskDistribution.distressZone.count === 1 ? 'company requires' : 'companies require'} immediate attention due to high distress indicators
                </p>
              </div>
            )}
            
            {averageZScore > 3.5 && (
              <div className="insight-card insight-positive">
                <div className="insight-icon">
                  <TrendingUp size={16} />
                </div>
                <p className="insight-text">
                  Exceptional portfolio quality with average Z-Score of {averageZScore}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .portfolio-summary {
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          padding: var(--space-8);
          margin-bottom: var(--space-8);
          border: 1px solid var(--color-neutral-200);
        }
        
        .portfolio-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-8);
          padding-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-neutral-200);
        }
        
        .portfolio-title h3 {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin: 0 0 var(--space-2);
        }
        
        .portfolio-title p {
          color: var(--color-neutral-600);
          font-size: var(--font-size-base);
          margin: 0;
        }
        
        .portfolio-metrics {
          display: flex;
          gap: var(--space-4);
        }
        
        .metric-card {
          text-align: center;
          padding: var(--space-4);
          background: var(--color-neutral-50);
          border-radius: var(--radius-lg);
          min-width: 120px;
        }
        
        .metric-label {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-2);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .metric-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-neutral-900);
        }
        
        .risk-distribution {
          margin-bottom: var(--space-8);
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin-bottom: var(--space-6);
        }
        
        .distribution-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }
        
        .risk-zone-card {
          background: var(--color-neutral-50);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: all 0.2s ease-out;
          border: 2px solid transparent;
        }
        
        .safe-zone {
          border-color: var(--color-safe);
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.05) 0%, rgba(0, 184, 148, 0.05) 100%);
        }
        
        .grey-zone {
          border-color: var(--color-grey);
          background: linear-gradient(135deg, rgba(255, 184, 0, 0.05) 0%, rgba(243, 156, 18, 0.05) 100%);
        }
        
        .distress-zone {
          border-color: var(--color-distress);
          background: linear-gradient(135deg, rgba(255, 75, 75, 0.05) 0%, rgba(231, 76, 60, 0.05) 100%);
        }
        
        .zone-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }
        
        .safe-zone .zone-header svg {
          color: var(--color-safe);
        }
        
        .grey-zone .zone-header svg {
          color: var(--color-grey);
        }
        
        .distress-zone .zone-header svg {
          color: var(--color-distress);
        }
        
        .zone-info h5 {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin: 0 0 var(--space-1);
        }
        
        .zone-info p {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          margin: 0;
        }
        
        .zone-metrics {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: var(--space-3);
        }
        
        .zone-count {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-neutral-900);
        }
        
        .zone-percentage {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
        }
        
        .zone-bar {
          height: 6px;
          background: var(--color-neutral-200);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        
        .zone-fill {
          height: 100%;
          border-radius: var(--radius-sm);
          transition: width 0.5s ease;
        }
        
        .safe-fill {
          background: var(--gradient-success);
        }
        
        .grey-fill {
          background: var(--gradient-warning);
        }
        
        .distress-fill {
          background: var(--gradient-danger);
        }
        
        .portfolio-insights {
          margin-bottom: 0;
        }
        
        .insights-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        
        .insight-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-neutral-50);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--color-primary);
        }
        
        .insight-positive {
          background: rgba(0, 212, 170, 0.1);
          border-left-color: var(--color-safe);
        }
        
        .insight-warning {
          background: rgba(255, 184, 0, 0.1);
          border-left-color: var(--color-grey);
        }
        
        .insight-icon {
          flex-shrink: 0;
          padding: var(--space-1);
          background: white;
          border-radius: var(--radius-md);
          color: var(--color-primary);
        }
        
        .insight-positive .insight-icon {
          color: var(--color-safe);
        }
        
        .insight-warning .insight-icon {
          color: var(--color-grey);
        }
        
        .insight-text {
          flex: 1;
          font-size: var(--font-size-sm);
          color: var(--color-neutral-700);
          line-height: 1.5;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .portfolio-header {
            flex-direction: column;
            gap: var(--space-4);
          }
          
          .portfolio-metrics {
            width: 100%;
            justify-content: space-between;
          }
          
          .metric-card {
            min-width: auto;
            flex: 1;
            padding: var(--space-3);
          }
          
          .distribution-grid {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }
          
          .portfolio-title h3 {
            font-size: var(--font-size-xl);
          }
        }
        
        @media (max-width: 480px) {
          .portfolio-summary {
            padding: var(--space-6);
          }
          
          .portfolio-metrics {
            flex-direction: column;
            gap: var(--space-2);
          }
          
          .metric-card {
            padding: var(--space-3);
          }
          
          .zone-count {
            font-size: var(--font-size-2xl);
          }
          
          .zone-percentage {
            font-size: var(--font-size-base);
          }
        }
      `}</style>
    </div>
  );
};

export default PortfolioSummary;