import React, { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import InputSection from './components/InputSection';
import AnalysisResults from './components/AnalysisResults';
import LoadingScreen from './components/LoadingScreen';
import { analyzeCompanies } from './services/api';
import './styles/App.css';

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalysis = useCallback(async (companies) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResults(null);

      console.log('Starting analysis for companies:', companies);

      const results = await analyzeCompanies(companies);
      
      if (results.success) {
        setAnalysisResults(results);
        console.log('Analysis completed successfully:', results);
      } else {
        throw new Error(results.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setAnalysisResults(null);
    setError(null);
  }, []);

  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
          },
          success: {
            iconTheme: {
              primary: '#00D4AA',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#FF4B4B',
              secondary: '#fff'
            }
          }
        }}
      />
      
      <Header />
      
      <main className="main-content">
        {isAnalyzing && <LoadingScreen />}
        
        {!isAnalyzing && !analysisResults && (
          <InputSection 
            onAnalyze={handleAnalysis}
            error={error}
          />
        )}
        
        {!isAnalyzing && analysisResults && (
          <AnalysisResults 
            results={analysisResults}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-text">
              <p className="text-sm text-neutral-600">
                © 2024 Financial Risk Analyzer. Professional analysis powered by AI.
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                This analysis is for informational purposes only and should not be considered as investment advice.
              </p>
            </div>
            
            <div className="footer-links">
              <a href="#methodology" className="footer-link">
                Methodology
              </a>
              <a href="#disclaimer" className="footer-link">
                Disclaimer
              </a>
              <a href="#contact" className="footer-link">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;