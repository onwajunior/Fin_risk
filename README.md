# Financial Risk Analyzer

> **Professional AI-powered financial risk analysis platform for C-suite executives**

Transform company names into comprehensive financial risk assessments in under 30 seconds. Get sophisticated analysis that would normally take hours of research, including Altman Z-Score bankruptcy prediction, AI insights, and executive-ready reports.

![Financial Risk Analyzer](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Key Features

### 🧠 **AI-Powered Analysis**
- **OpenAI Integration**: Professional insights and recommendations from GPT-4
- **Dynamic Analysis**: No hardcoded data - all analysis is intelligent and adaptive
- **Executive Summaries**: Ready for boardroom presentations

### 📊 **Bankruptcy Risk Assessment**
- **Altman Z-Score**: Automatic calculation with company-type detection
- **Risk Zones**: Safe Zone, Grey Zone, Distress Zone classification
- **Formula Selection**: Manufacturing vs Non-Manufacturing automatic detection

### 💼 **Professional Reporting**
- **PDF Generation**: High-quality, downloadable reports
- **Executive Dashboard**: Clean, fintech-inspired UI
- **Risk Visualization**: Color-coded risk indicators and progress bars

### ⚡ **Rapid Processing**
- **Batch Analysis**: CSV upload for up to 50 companies
- **Real-time Data**: Live financial statements and market data
- **Speed**: Complete analysis in under 30 seconds

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Express.js**: RESTful API server
- **OpenAI API**: AI analysis generation
- **Financial Data APIs**: Alpha Vantage, Yahoo Finance fallbacks
- **PDF Generation**: Puppeteer for professional reports
- **CSV Processing**: Multer + CSV parser for batch uploads

### Frontend (React)
- **Modern React**: Hooks-based architecture
- **Fintech UI**: Premium design inspired by financial applications
- **Responsive**: Mobile-first approach
- **Real-time**: Loading states and progress indicators

### Key Services
- **Financial Data Service**: Company resolution and data fetching
- **Ratio Calculator**: 8 core financial ratios + Altman Z-Score
- **AI Analysis Service**: OpenAI integration with fallback logic
- **Report Generator**: Professional PDF creation

## 📈 Financial Metrics Calculated

### Liquidity Ratios
- Current Ratio
- Quick Ratio (Acid-Test)
- Cash Ratio
- Working Capital Ratio

### Leverage/Solvency Ratios
- Debt-to-Equity Ratio
- Debt-to-Assets Ratio
- Interest Coverage Ratio
- Times Interest Earned

### Profitability Ratios
- Return on Assets (ROA)
- Return on Equity (ROE)
- Gross/Operating/Net Margins
- Return on Investment (ROI)

### Efficiency Ratios
- Asset Turnover
- Inventory Turnover
- Working Capital Turnover

### Altman Z-Score (Bankruptcy Prediction)
- **Manufacturing**: Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E
- **Non-Manufacturing**: Z = 6.56A + 3.26B + 6.72C + 1.05D
- **Automatic Detection**: Smart company-type classification

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- OpenAI API key (required for AI analysis)
- Financial data API keys (optional - will use mock data if not provided)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/financial-risk-analyzer.git
cd financial-risk-analyzer
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

3. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your API keys
OPENAI_API_KEY=your_openai_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here  # Optional
FINNHUB_API_KEY=your_finnhub_key_here              # Optional
```

4. **Start Development**
```bash
# Start backend server (runs on port 3001)
npm run dev

# In another terminal, start frontend (runs on port 3000)
cd frontend && npm start
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🔧 API Endpoints

### Analysis
- `POST /api/analysis/analyze` - Analyze companies
- `POST /api/analysis/upload` - Upload CSV for batch analysis

### Company Data
- `GET /api/company/:ticker` - Get company information
- `POST /api/company/search` - Search companies
- `POST /api/company/validate` - Validate company list

### Reports
- `POST /api/report/generate` - Generate PDF report
- `GET /api/report/download/:id` - Download saved report

## 💡 Usage Examples

### Manual Entry
```
Input: "AAPL, Microsoft, Tesla"
Output: Complete risk analysis with Z-Scores, AI insights, and PDF report
```

### CSV Upload
```csv
Company
Apple Inc
MSFT
Tesla Motors
```

### API Usage
```javascript
const response = await fetch('/api/analysis/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companies: ['AAPL', 'MSFT', 'TSLA']
  })
});

const analysis = await response.json();
```

## 🎨 Design System

### Color Psychology
- 🟢 **Safe Zone**: #00D4AA (Z-Score > 2.99)
- 🟡 **Grey Zone**: #FFB800 (Z-Score 1.8-2.99)
- 🔴 **Distress Zone**: #FF4B4B (Z-Score < 1.8)
- 🔵 **Primary**: #007AFF (Actions)

### Typography
- **Font**: Inter (modern, readable)
- **Scale**: 8pt grid system
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Components
- **Cards**: Elevated with subtle shadows
- **Buttons**: Touch-friendly (44px minimum)
- **Progress Bars**: Visual ratio representations
- **Risk Badges**: Color-coded indicators

## 🔒 Security & Performance

### Security Features
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Comprehensive data sanitization
- **CORS Protection**: Configured origins
- **Helmet**: Security headers
- **File Upload**: Size limits and type validation

### Performance Optimizations
- **Caching**: 5-minute cache for API responses
- **Batch Processing**: Parallel company analysis
- **Error Handling**: Graceful degradation
- **Mock Data**: Fallback when APIs unavailable

## 📊 Sample Analysis Output

```json
{
  "success": true,
  "totalCompanies": 3,
  "successfulAnalyses": 3,
  "results": [
    {
      "company": {
        "name": "Apple Inc.",
        "ticker": "AAPL",
        "industry": "Technology",
        "companyType": "non-manufacturing"
      },
      "analysis": {
        "distressScore": {
          "altmanZScore": 4.85,
          "riskZone": "Safe Zone",
          "interpretation": "Low bankruptcy risk"
        },
        "aiAnalysis": {
          "riskRating": "Low",
          "recommendation": "Buy",
          "executiveSummary": "Apple demonstrates exceptional financial strength..."
        }
      }
    }
  ],
  "portfolioSummary": {
    "totalCompanies": 3,
    "averageZScore": 3.47,
    "riskDistribution": {
      "safeZone": { "count": 2, "percentage": 67 },
      "greyZone": { "count": 1, "percentage": 33 },
      "distressZone": { "count": 0, "percentage": 0 }
    },
    "portfolioRisk": "Low"
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```dockerfile
# Build and run with Docker
docker build -t financial-risk-analyzer .
docker run -p 3001:3001 financial-risk-analyzer
```

### Environment Variables (Production)
```bash
NODE_ENV=production
OPENAI_API_KEY=your_production_key
ALPHA_VANTAGE_API_KEY=your_production_key
FRONTEND_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This analysis is for informational purposes only and should not be considered as investment advice. The Altman Z-Score and other financial metrics are historical indicators and do not guarantee future performance. All investment decisions should be made after consulting with qualified financial professionals.

## 🙏 Acknowledgments

- **Altman Z-Score**: Based on Edward Altman's bankruptcy prediction model
- **OpenAI**: Powering intelligent financial analysis
- **Financial Data**: Alpha Vantage, Yahoo Finance APIs
- **Design**: Inspired by premium fintech applications

---

**Built with ❤️ for financial professionals who need rapid, reliable risk assessment.**