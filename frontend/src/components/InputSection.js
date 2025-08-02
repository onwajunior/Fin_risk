import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Search, Upload, FileText, AlertCircle, Zap, Shield, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadCSV } from '../services/api';

const InputSection = ({ onAnalyze, error }) => {
  const [companies, setCompanies] = useState('');
  const [csvCompanies, setCsvCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadCSV(file);
      
      if (result.success) {
        setCsvCompanies(result.companies);
        setSelectedCompanies(result.companies.map((_, index) => index)); // Select all by default
        toast.success(`Successfully loaded ${result.companies.length} companies`);
      } else {
        toast.error(result.message || 'Failed to process CSV file');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload CSV file');
      console.error('CSV upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleManualAnalyze = () => {
    const companyList = companies
      .split(/[,\n]/)
      .map(company => company.trim())
      .filter(Boolean);

    if (companyList.length === 0) {
      toast.error('Please enter at least one company name or ticker');
      return;
    }

    if (companyList.length > 50) {
      toast.error('Maximum 50 companies allowed per analysis');
      return;
    }

    onAnalyze(companyList);
  };

  const handleCsvAnalyze = () => {
    if (csvCompanies.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }

    if (selectedCompanies.length === 0) {
      toast.error('Please select at least one company to analyze');
      return;
    }

    const selectedCompanyNames = selectedCompanies.map(index => csvCompanies[index]);
    onAnalyze(selectedCompanyNames);
  };

  const handleClearCsv = () => {
    setCsvCompanies([]);
    setSelectedCompanies([]);
  };

  const handleCompanySelect = (index) => {
    setSelectedCompanies(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === csvCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(csvCompanies.map((_, index) => index));
    }
  };

  return (
    <section className="input-section modern-input">
      <div className="container">
        <div className="input-hero modern-hero">
          <div className="hero-badge">
            <Shield size={16} />
            Professional Financial Analysis
          </div>
          <h2 className="input-title modern-title">
            Transform Company Names into 
            <span className="title-highlight"> Professional Risk Analysis</span>
          </h2>
          <p className="input-subtitle modern-subtitle">
            Get comprehensive financial risk assessment with Altman Z-Score, AI insights, and executive-ready reports in under 30 seconds
          </p>
          <div className="hero-features">
            <div className="feature-badge">
              <Zap size={14} />
              <span>30-Second Analysis</span>
            </div>
            <div className="feature-badge">
              <Shield size={14} />
              <span>Bankruptcy Risk Assessment</span>
            </div>
          </div>
        </div>

        <div className="input-card modern-card">
          <div className="input-tabs">
            <button
              className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Search size={18} />
              Manual Entry
            </button>
            <button
              className={`tab ${activeTab === 'csv' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('csv')}
            >
              <Upload size={18} />
              Batch Upload
            </button>
          </div>

          {activeTab === 'manual' && (
            <div className="tab-content">
              <div className="manual-input">
                <label htmlFor="companies" className="input-label">
                  Company Names or Tickers
                </label>
                <textarea
                  id="companies"
                  className="textarea input"
                  placeholder="Enter company names or tickers (comma-separated)&#10;&#10;Examples:&#10;AAPL, Microsoft, Tesla&#10;Apple Inc, MSFT, TSLA&#10;One per line also works"
                  value={companies}
                  onChange={(e) => setCompanies(e.target.value)}
                  rows={6}
                />
                <div className="input-help">
                  <p className="text-sm text-neutral-600">
                    Enter up to 50 companies. Supports company names (Apple, Microsoft) or tickers (AAPL, MSFT).
                  </p>
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg analyze-btn"
                onClick={handleManualAnalyze}
                disabled={!companies.trim()}
              >
                <Zap size={20} />
                Analyze Now
              </button>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="tab-content">
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${csvCompanies.length > 0 ? 'dropzone-success' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="dropzone-content">
                  {isUploading ? (
                    <div className="dropzone-uploading">
                      <div className="loading-spinner"></div>
                      <p>Processing CSV file...</p>
                    </div>
                  ) : csvCompanies.length > 0 ? (
                    <div className="dropzone-success-content">
                      <FileText size={48} className="text-safe" />
                      <p className="text-lg font-semibold">
                        {csvCompanies.length} companies loaded
                      </p>
                      <p className="text-sm text-neutral-600">
                        Ready for analysis
                      </p>
                      <button
                        className="btn btn-secondary btn-sm mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCsv();
                        }}
                      >
                        Upload Different File
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone-empty">
                      <Upload size={48} className="text-neutral-400" />
                      <p className="text-lg font-semibold">
                        {isDragActive ? 'Drop CSV file here' : 'Upload CSV file'}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Drag & drop or click to browse
                      </p>
                      <p className="text-xs text-neutral-500 mt-2">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {csvCompanies.length > 0 && (
                <div className="csv-selection">
                  <div className="selection-header">
                    <h4 className="selection-title">
                      Select Companies to Analyze ({selectedCompanies.length} of {csvCompanies.length} selected)
                    </h4>
                    <button
                      className="select-all-btn"
                      onClick={handleSelectAll}
                      type="button"
                    >
                      {selectedCompanies.length === csvCompanies.length ? (
                        <>
                          <CheckSquare size={16} />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare size={16} />
                          Select All
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="company-selection-grid">
                    {csvCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={`company-selection-item ${selectedCompanies.includes(index) ? 'selected' : ''}`}
                        onClick={() => handleCompanySelect(index)}
                      >
                        <div className="selection-checkbox">
                          {selectedCompanies.includes(index) ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} className="text-neutral-400" />
                          )}
                        </div>
                        <span className="company-name">{company}</span>
                      </div>
                    ))}
                  </div>

                  {csvCompanies.length > 10 && (
                    <div className="selection-summary">
                      <p className="text-sm text-neutral-600">
                        {selectedCompanies.length} companies selected for analysis
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary btn-lg analyze-btn"
                onClick={handleCsvAnalyze}
                disabled={csvCompanies.length === 0 || selectedCompanies.length === 0}
              >
                <Zap size={20} />
                Analyze {selectedCompanies.length} Selected {selectedCompanies.length === 1 ? 'Company' : 'Companies'}
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="input-features">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon bg-safe">
                <Shield size={24} />
              </div>
              <h3>Bankruptcy Risk Scoring</h3>
              <p>Altman Z-Score calculation with automatic company-type detection</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon bg-grey">
                <Search size={24} />
              </div>
              <h3>AI-Powered Analysis</h3>
              <p>Professional insights and recommendations from advanced AI</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon bg-distress">
                <FileText size={24} />
              </div>
              <h3>Executive Reports</h3>
              <p>High-quality PDF reports ready for boardroom presentations</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-section {
          padding: var(--space-16) 0;
        }
        
        .input-hero {
          text-align: center;
          margin-bottom: var(--space-12);
        }
        
        .input-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-neutral-900);
          margin-bottom: var(--space-4);
          line-height: 1.2;
        }
        
        .input-subtitle {
          font-size: var(--font-size-lg);
          color: var(--color-neutral-600);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        
        .input-card {
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          margin-bottom: var(--space-16);
        }
        
        .input-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-neutral-200);
        }
        
        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-4) var(--space-6);
          background: none;
          border: none;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-neutral-600);
          cursor: pointer;
          transition: all 0.2s ease-out;
          border-bottom: 3px solid transparent;
        }
        
        .tab:hover {
          background: var(--color-neutral-50);
          color: var(--color-neutral-800);
        }
        
        .tab-active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          background: var(--color-neutral-50);
        }
        
        .tab-content {
          padding: var(--space-8);
        }
        
        .input-label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
          margin-bottom: var(--space-2);
        }
        
        .input-help {
          margin-top: var(--space-2);
        }
        
        .analyze-btn {
          width: 100%;
          margin-top: var(--space-6);
        }
        
        .dropzone {
          border: 2px dashed var(--color-neutral-300);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease-out;
          background: var(--color-neutral-50);
        }
        
        .dropzone:hover {
          border-color: var(--color-neutral-400);
          background: var(--color-neutral-100);
        }
        
        .dropzone-active {
          border-color: var(--color-primary);
          background: rgba(0, 122, 255, 0.05);
        }
        
        .dropzone-success {
          border-color: var(--color-safe);
          background: rgba(0, 212, 170, 0.05);
        }
        
        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }
        
        .dropzone-uploading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }
        
        .dropzone-empty,
        .dropzone-success-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }
        
        .csv-preview {
          margin: var(--space-6) 0;
          padding: var(--space-4);
          background: var(--color-neutral-50);
          border-radius: var(--radius-lg);
        }
        
        .company-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }
        
        .company-tag {
          display: inline-flex;
          align-items: center;
          padding: var(--space-1) var(--space-3);
          background: white;
          border: 1px solid var(--color-neutral-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-neutral-700);
        }
        
        .company-tag-more {
          background: var(--color-neutral-200);
          border-color: var(--color-neutral-300);
          color: var(--color-neutral-600);
        }
        
        .csv-selection {
          margin: var(--space-6) 0;
          padding: var(--space-4);
          background: var(--color-neutral-50);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-neutral-200);
        }
        
        .selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-neutral-200);
        }
        
        .selection-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
          margin: 0;
        }
        
        .select-all-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: white;
          border: 1px solid var(--color-neutral-300);
          border-radius: var(--radius-md);
          color: var(--color-neutral-700);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s ease-out;
        }
        
        .select-all-btn:hover {
          background: var(--color-neutral-100);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        .company-selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--space-2);
          max-height: 300px;
          overflow-y: auto;
          padding-right: var(--space-2);
        }
        
        .company-selection-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: white;
          border: 1px solid var(--color-neutral-200);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease-out;
        }
        
        .company-selection-item:hover {
          border-color: var(--color-primary);
          box-shadow: 0 2px 8px rgba(0, 82, 255, 0.1);
        }
        
        .company-selection-item.selected {
          background: rgba(0, 82, 255, 0.05);
          border-color: var(--color-primary);
        }
        
        .selection-checkbox {
          flex-shrink: 0;
        }
        
        .company-selection-item .company-name {
          flex: 1;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-neutral-800);
          line-height: 1.4;
        }
        
        .company-selection-item.selected .company-name {
          color: var(--color-primary);
        }
        
        .selection-summary {
          margin-top: var(--space-4);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-neutral-200);
          text-align: center;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(255, 75, 75, 0.1);
          border: 1px solid var(--color-distress);
          border-radius: var(--radius-lg);
          color: var(--color-distress);
          margin-top: var(--space-4);
        }
        
        .input-features {
          margin-top: var(--space-16);
        }
        
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
        }
        
        .feature-card {
          text-align: center;
          padding: var(--space-6);
        }
        
        .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-4);
          color: white;
        }
        
        .feature-card h3 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-2);
          color: var(--color-neutral-900);
        }
        
        .feature-card p {
          color: var(--color-neutral-600);
          font-size: var(--font-size-sm);
        }
        
        @media (max-width: 768px) {
          .input-title {
            font-size: var(--font-size-2xl);
          }
          
          .input-subtitle {
            font-size: var(--font-size-base);
          }
          
          .feature-grid {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }
          
          .tab {
            font-size: var(--font-size-sm);
            padding: var(--space-3) var(--space-4);
          }
          
          .tab-content {
            padding: var(--space-6);
          }
          
          .company-selection-grid {
            grid-template-columns: 1fr;
            max-height: 250px;
          }
          
          .selection-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
          }
          
          .select-all-btn {
            align-self: flex-end;
          }
        }
        
        @media (max-width: 480px) {
          .input-title {
            font-size: var(--font-size-xl);
          }
          
          .dropzone {
            padding: var(--space-6);
          }
          
          .csv-selection {
            padding: var(--space-3);
          }
        }
      `}</style>
    </section>
  );
};

export default InputSection;