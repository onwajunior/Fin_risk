/**
 * API service for Financial Risk Analyzer
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      console.error('Server Error:', message);
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Analyze companies
 * @param {string[]} companies - Array of company names/tickers
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeCompanies = async (companies) => {
  try {
    const response = await api.post('/analysis/analyze', {
      companies: companies.map(company => company.trim()).filter(Boolean)
    });
    
    return response.data;
  } catch (error) {
    console.error('Analyze companies error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to analyze companies'
    );
  }
};

/**
 * Upload CSV file for batch analysis
 * @param {File} file - CSV file
 * @returns {Promise<Object>} Parsed companies
 */
export const uploadCSV = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/analysis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload CSV error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to upload CSV file'
    );
  }
};

/**
 * Get company information
 * @param {string} ticker - Company ticker
 * @returns {Promise<Object>} Company data
 */
export const getCompanyInfo = async (ticker) => {
  try {
    const response = await api.get(`/company/${ticker}`);
    return response.data;
  } catch (error) {
    console.error('Get company info error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to get company information'
    );
  }
};

/**
 * Search for companies
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
export const searchCompanies = async (query) => {
  try {
    const response = await api.post('/company/search', { query });
    return response.data;
  } catch (error) {
    console.error('Search companies error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to search companies'
    );
  }
};

/**
 * Validate company list
 * @param {string[]} companies - Array of company names/tickers
 * @returns {Promise<Object>} Validation results
 */
export const validateCompanies = async (companies) => {
  try {
    const response = await api.post('/company/validate', { companies });
    return response.data;
  } catch (error) {
    console.error('Validate companies error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to validate companies'
    );
  }
};

/**
 * Generate PDF report
 * @param {Object} analysisData - Analysis results
 * @returns {Promise<Blob>} PDF blob
 */
export const generatePDFReport = async (analysisData) => {
  try {
    const response = await api.post('/report/generate', {
      analysisData
    }, {
      responseType: 'blob',
      timeout: 60000, // 1 minute timeout for PDF generation
    });
    
    return response.data;
  } catch (error) {
    console.error('Generate PDF error:', error);
    throw new Error(
      error.response?.data?.error || 
      'Failed to generate PDF report'
    );
  }
};

/**
 * Save analysis for later download
 * @param {Object} analysisData - Analysis results
 * @returns {Promise<Object>} Save response with download URL
 */
export const saveAnalysis = async (analysisData) => {
  try {
    const response = await api.post('/report/save', { analysisData });
    return response.data;
  } catch (error) {
    console.error('Save analysis error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to save analysis'
    );
  }
};

/**
 * Download saved report
 * @param {string} reportId - Report ID
 * @returns {Promise<Blob>} PDF blob
 */
export const downloadReport = async (reportId) => {
  try {
    const response = await api.get(`/report/download/${reportId}`, {
      responseType: 'blob',
    });
    
    return response.data;
  } catch (error) {
    console.error('Download report error:', error);
    throw new Error(
      error.response?.data?.error || 
      'Failed to download report'
    );
  }
};

/**
 * Check API health
 * @returns {Promise<Object>} Health status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw new Error('API health check failed');
  }
};

/**
 * Download file helper
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;