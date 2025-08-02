import React, { useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  BarChart3,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePDFReport, downloadBlob } from '../services/api';
import CompanyCard from './CompanyCard';
import PortfolioSummary from './PortfolioSummary';

const AnalysisResults = ({ results, onNewAnalysis }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  // const [selectedCompany, setSelectedCompany] = useState(null);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      toast.loading('Generating PDF report...', { id: 'pdf-generation' });

      const pdfBlob = await generatePDFReport(results);
      const filename = `financial-risk-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      
      downloadBlob(pdfBlob, filename);
      
      toast.success('PDF report downloaded successfully!', { id: 'pdf-generation' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report', { id: 'pdf-generation' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getRiskIcon = (riskZone) => {
    switch (riskZone) {
      case 'Safe Zone':
        return <CheckCircle className="risk-safe" size={20} />;
      case 'Grey Zone':
        return <AlertTriangle className="risk-grey" size={20} />;
      case 'Distress Zone':
        return <AlertCircle className="risk-distress" size={20} />;
      default:
        return <Minus className="text-neutral-400" size={20} />;
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'Buy':
        return 'text-safe';
      case 'Hold':
        return 'text-grey';
      case 'Sell':
      case 'Avoid':
        return 'text-distress';
      default:
        return 'text-neutral-600';
    }
  };

  const getPriceChangeIcon = (changePercent) => {
    if (changePercent > 0) return <TrendingUp className="text-safe" size={16} />;
    if (changePercent < 0) return <TrendingDown className="text-distress" size={16} />;
    return <Minus className="text-neutral-400" size={16} />;
  };

  const formatCurrency = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="analysis-results">
      <div className="container">
        {/* Results Header */}
        <div className="results-header">
          <div className="results-title">
            <h2>Portfolio Analysis</h2>
            <p className="results-subtitle">
              Analysis completed in {(results.processingTime / 1000).toFixed(1)} seconds
            </p>
          </div>
          
          <div className="results-actions">
            <button
              className="btn btn-secondary"
              onClick={onNewAnalysis}
            >
              <RefreshCw size={18} />
              New Analysis
            </button>
            
            <button
              className="btn btn-primary"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <div className="loading-spinner"></div>
              ) : (
                <Download size={18} />
              )}
              Download PDF
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <PortfolioSummary 
          summary={results.portfolioSummary}
          totalCompanies={results.successfulAnalyses}
        />

        {/* Company Results Grid */}
        <div className="companies-section">
          <div className="section-header">
            <h3 className="section-title">
              <BarChart3 size={24} />
              Company Analysis
            </h3>
            <p className="section-subtitle">
              Detailed risk assessment for each company
            </p>
          </div>

          <div className="companies-grid">
            {results.results.map((company, index) => (
              <CompanyCard
                key={`${company.company.ticker}-${index}`}
                company={company}
                onClick={() => {/* Company details will be implemented later */}}
                formatCurrency={formatCurrency}
                getRiskIcon={getRiskIcon}
                getPriceChangeIcon={getPriceChangeIcon}
                getRecommendationColor={getRecommendationColor}
              />
            ))}
          </div>
        </div>

        {/* Risk Matrix Summary */}
        <div className="risk-matrix-section">
          <div className="section-header">
            <h3 className="section-title">
              <Shield size={24} />
              Risk Matrix Overview
            </h3>
          </div>

          <div className="risk-matrix-grid">
            <div className="risk-matrix-card">
              <div className="matrix-header">
                <h4>Company Risk Distribution</h4>
              </div>
              <div className="matrix-table">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Z-Score</th>
                      <th>Risk Zone</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((company, index) => (
                      <tr key={index}>
                        <td>
                          <div className="company-cell">
                            <span className="company-name">{company.company.name}</span>
                            <span className="company-ticker">({company.company.ticker})</span>
                          </div>
                        </td>
                        <td className="font-semibold">
                          {company.analysis.distressScore.altmanZScore}
                        </td>
                        <td>
                          <div className="risk-zone-cell">
                            {getRiskIcon(company.analysis.distressScore.riskZone)}
                            <span className={`risk-${company.analysis.distressScore.riskZone.toLowerCase().replace(' zone', '').replace(' ', '')}`}>
                              {company.analysis.distressScore.riskZone}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`font-semibold ${getRecommendationColor(company.analysis.aiAnalysis.recommendation)}`}>
                            {company.analysis.aiAnalysis.recommendation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Disclaimer */}
        <div className="disclaimer-section">
          <div className="disclaimer-card">
            <div className="disclaimer-header">
              <FileText size={20} />
              <h4>Important Disclaimer</h4>
            </div>
            <div className="disclaimer-content">
              <p>
                This analysis is for informational purposes only and should not be considered as investment advice. 
                The Altman Z-Score and other financial metrics are historical indicators and do not guarantee future performance. 
                All investment decisions should be made after consulting with qualified financial professionals.
              </p>
              <p>
                Data sources include public financial statements and market data. While we strive for accuracy, 
                we cannot guarantee the completeness or timeliness of all information presented.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        {results.warnings && results.warnings.length > 0 && (
          <div className="warnings-section">
            <div className="warnings-card">
              <div className="warnings-header">
                <AlertTriangle className="text-grey" size={20} />
                <h4>Analysis Warnings</h4>
              </div>
              <div className="warnings-list">
                {results.warnings.map((warning, index) => (
                  <div key={index} className="warning-item">
                    <strong>{warning.company}:</strong> {warning.error}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .analysis-results {
          padding: var(--space-8) 0;
          min-height: 80vh;
        }
        
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-8);
          padding-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-neutral-200);
        }
        
        .results-title h2 {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-neutral-900);
          margin-bottom: var(--space-2);
        }
        
        .results-subtitle {
          color: var(--color-neutral-600);
          font-size: var(--font-size-base);
          margin: 0;
        }
        
        .results-actions {
          display: flex;
          gap: var(--space-3);
        }
        
        .companies-section,
        .risk-matrix-section {
          margin-bottom: var(--space-12);
        }
        
        .section-header {
          margin-bottom: var(--space-6);
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin-bottom: var(--space-2);
        }
        
        .section-subtitle {
          color: var(--color-neutral-600);
          font-size: var(--font-size-base);
          margin: 0;
        }
        
        .companies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-6);
        }
        
        .risk-matrix-grid {
          display: grid;
          gap: var(--space-6);
        }
        
        .risk-matrix-card {
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        
        .matrix-header {
          background: var(--color-neutral-50);
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--color-neutral-200);
        }
        
        .matrix-header h4 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin: 0;
        }
        
        .matrix-table {
          overflow-x: auto;
        }
        
        .matrix-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .matrix-table th,
        .matrix-table td {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          border-bottom: 1px solid var(--color-neutral-100);
        }
        
        .matrix-table th {
          background: var(--color-neutral-50);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
          font-size: var(--font-size-sm);
        }
        
        .matrix-table td {
          font-size: var(--font-size-sm);
        }
        
        .company-cell {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        
        .company-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-neutral-900);
        }
        
        .company-ticker {
          font-size: var(--font-size-xs);
          color: var(--color-neutral-500);
        }
        
        .risk-zone-cell {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .disclaimer-section,
        .warnings-section {
          margin-top: var(--space-12);
        }
        
        .disclaimer-card,
        .warnings-card {
          background: var(--color-neutral-50);
          border: 1px solid var(--color-neutral-200);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }
        
        .disclaimer-header,
        .warnings-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
        }
        
        .disclaimer-header h4,
        .warnings-header h4 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin: 0;
        }
        
        .disclaimer-content p {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          line-height: 1.6;
          margin-bottom: var(--space-3);
        }
        
        .disclaimer-content p:last-child {
          margin-bottom: 0;
        }
        
        .warnings-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        
        .warning-item {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          padding: var(--space-2) var(--space-3);
          background: white;
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-grey);
        }
        
        @media (max-width: 768px) {
          .results-header {
            flex-direction: column;
            gap: var(--space-4);
          }
          
          .results-actions {
            width: 100%;
          }
          
          .results-actions .btn {
            flex: 1;
          }
          
          .companies-grid {
            grid-template-columns: 1fr;
          }
          
          .results-title h2 {
            font-size: var(--font-size-2xl);
          }
          
          .section-title {
            font-size: var(--font-size-xl);
          }
        }
        
        @media (max-width: 480px) {
          .matrix-table {
            font-size: var(--font-size-xs);
          }
          
          .matrix-table th,
          .matrix-table td {
            padding: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default AnalysisResults;