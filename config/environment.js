/**
 * Environment configuration for Financial Risk Analyzer
 */

module.exports = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY,
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
  finnhubApiKey: process.env.FINNHUB_API_KEY,
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Cache configuration
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS) || 300, // 5 minutes
  
  // PDF generation
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Validation
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development',
  
  // Required environment variables check
  validateEnvironment: () => {
    const required = [];
    const warnings = [];
    
    if (!process.env.OPENAI_API_KEY) {
      warnings.push('OPENAI_API_KEY not set - AI analysis will use fallback logic');
    }
    
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      warnings.push('ALPHA_VANTAGE_API_KEY not set - using mock financial data');
    }
    
    return { required, warnings };
  }
};