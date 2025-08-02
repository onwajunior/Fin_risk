# Financial Risk Analyzer - MVP Scope

## MVP Vision
**"From company names to professional financial analysis in under 30 seconds"**

Transform a simple list of company names into executive-ready financial risk assessments using AI. The magic: paste "Apple, Microsoft, Tesla" and get back sophisticated analysis that would normally take hours of research.

## Core Value Proposition
- **Input**: Company names or tickers (manual or CSV upload)
- **Process**: AI-powered financial analysis using real-time data + Altman Z-Score bankruptcy prediction
- **Output**: Professional financial risk report with distress assessment and recommendations
- **Speed**: Complete analysis delivered in under 30 seconds
- **Magic**: Automatic bankruptcy risk scoring that normally requires specialized financial expertise

## Technical Stack (MVP)

### Backend Core
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Engine**: OpenAI API (GPT-4 for analysis generation)
- **Data Source**: Financial API (Alpha Vantage, Yahoo Finance, or similar)
- **File Processing**: CSV parser for batch uploads
- **PDF Generation**: Puppeteer or jsPDF for report creation

### Frontend (Minimal)
- **Framework**: Simple React app or even vanilla JS
- **Styling**: Clean, professional CSS (TailwindCSS)
- **Charts**: Chart.js for basic visualizations
- **No complex state management needed**

## MVP Features (Core Magic)

### 1. Input Methods
**Manual Entry**
- Text area for company names/tickers (comma-separated)
- Support for common formats: "AAPL", "Apple Inc", "Apple"
- Real-time validation and company name resolution

**CSV Upload**
- Single file upload with company list
- Simple format: one column with company names/tickers
- Progress indicator during processing

### 2. Financial Data Collection
**Essential Ratios (Simplified)**
- **Liquidity**: Current Ratio, Quick Ratio
- **Leverage**: Debt-to-Equity, Interest Coverage
- **Profitability**: ROE, ROA, Net Margin
- **Efficiency**: Asset Turnover

**Distress Score (Core MVP Feature)**
- **Altman Z-Score**: Bankruptcy prediction model
  - Manufacturing formula: Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E
  - Non-manufacturing formula: Z = 6.56A + 3.26B + 6.72C + 1.05D
  - Where: A=Working Capital/Total Assets, B=Retained Earnings/Total Assets, C=EBIT/Total Assets, D=Market Value Equity/Total Liabilities, E=Sales/Total Assets
- **Automatic company type detection** (manufacturing vs non-manufacturing)
- **Risk zones**: Safe Zone (>2.99), Grey Zone (1.8-2.99), Distress Zone (<1.8)

**Data Sources**
- Latest annual financial statements (most recent 10-K)
- Current market data (stock price, market cap)
- Basic company info (sector, industry, description)

### 3. AI Analysis Engine (The Magic)
**Automated Analysis Generation**
- AI processes raw financial data into human insights
- Generates executive summaries for each company
- Provides risk ratings and investment recommendations
- Contextualizes numbers with industry comparisons

**AI Prompts Structure**
```
Company: {company_name}
Industry: {industry}
Financial Ratios: {ratio_data}
Altman Z-Score: {z_score} (Risk Zone: {risk_zone})
Market Data: {market_data}

Generate a concise financial risk analysis including:
1. Overall risk rating (Low/Medium/High) - heavily weighted by Z-Score
2. Bankruptcy/distress risk assessment based on Z-Score zone
3. Key strengths (2-3 bullet points)
4. Key concerns (2-3 bullet points) - highlight distress signals if in Grey/Distress zone
5. Investment recommendation (Buy/Hold/Sell/Avoid)
6. One-sentence executive summary emphasizing financial stability
```

### 4. Report Generation
**Instant Web Report**
- Clean, professional layout
- Company overview cards with risk ratings
- Simple charts (risk distribution, key ratios)
- Color-coded risk levels (green/yellow/red)

**PDF Download**
- One-click PDF generation
- Executive summary format
- Professional styling suitable for boardrooms
- Includes analysis timestamp and data sources

## MVP User Flow

### Happy Path (30 seconds total)
1. **Input** (5 seconds): User pastes "AAPL, MSFT, TSLA" or uploads CSV
2. **Processing** (20 seconds): 
   - Resolve company names to tickers
   - Fetch financial data from APIs
   - Generate AI analysis for each company
   - Create summary report
3. **Results** (5 seconds): Display analysis + download PDF option

### Technical Flow
```
1. POST /analyze
   Body: { companies: ["AAPL", "MSFT", "TSLA"] }

2. For each company:
   - Resolve ticker symbol
   - Fetch financial data (parallel API calls)
   - Calculate key ratios
   - Generate AI analysis

3. Compile results
4. Return: { analyses: [...], summary: "...", downloadUrl: "..." }
```

## MVP API Endpoints

### Core Endpoints
```javascript
POST /api/analyze
- Input: { companies: string[] }
- Output: { results: Analysis[], processingTime: number }

GET /api/company/:ticker
- Output: { company: CompanyData, ratios: FinancialRatios }

GET /api/download/:reportId
- Output: PDF file download

POST /api/upload
- Input: CSV file
- Output: { companies: string[], preview: true }
```

### Data Models
```javascript
// Analysis Result
{
  company: {
    name: string,
    ticker: string,
    industry: string,
    marketCap: number,
    companyType: 'manufacturing' | 'non-manufacturing'
  },
  ratios: {
    currentRatio: number,
    quickRatio: number,
    debtToEquity: number,
    interestCoverage: number,
    roe: number,
    roa: number,
    netMargin: number,
    assetTurnover: number
  },
  distressScore: {
    altmanZScore: number,
    riskZone: 'Safe Zone' | 'Grey Zone' | 'Distress Zone',
    formula: 'manufacturing' | 'non-manufacturing',
    interpretation: string
  },
  aiAnalysis: {
    riskRating: 'Low' | 'Medium' | 'High',
    distressAssessment: string,
    strengths: string[],
    concerns: string[],
    recommendation: 'Buy' | 'Hold' | 'Sell' | 'Avoid',
    summary: string
  },
  timestamp: string
}
```

## MVP Constraints & Simplifications

### What's Included
- ✅ Latest financial data only (no historical analysis)
- ✅ 8 core financial ratios (liquidity, leverage, profitability, efficiency)
- ✅ **Altman Z-Score bankruptcy prediction** with automatic company-type detection
- ✅ AI-generated insights and recommendations (heavily incorporating distress analysis)
- ✅ Basic PDF report generation
- ✅ Batch processing (up to 10 companies)
- ✅ Simple, clean UI with color-coded risk zones

### What's Excluded (Future Versions)
- ❌ Historical trend analysis
- ❌ Complex chart types
- ❌ User accounts/authentication
- ❌ Data persistence/storage
- ❌ Advanced market metrics (Merton model, etc.)
- ❌ Multiple file format support
- ❌ Real-time updates
- ❌ Peer comparison charts

## Success Metrics (MVP)

### Performance Targets
- **Speed**: Complete analysis in under 30 seconds for 5 companies
- **Accuracy**: AI analysis should feel relevant and professional
- **Reliability**: 95% uptime, graceful error handling
- **Usability**: Zero learning curve - paste and go

### User Experience Goals
- Users say "wow, this feels magical"
- Analysis quality comparable to junior analyst work
- PDF reports suitable for sharing with executives
- No technical knowledge required

## Technical Implementation Strategy

### Phase 1: Core Backend (Week 1)
- Set up Express server with OpenAI integration
- Implement financial data fetching
- Create basic ratio calculations
- **Implement Altman Z-Score calculation with company-type detection**
- Build AI analysis pipeline with distress score integration

### Phase 2: Report Generation (Week 2)
- Design clean web report layout
- Implement PDF generation
- Add basic error handling
- CSV upload functionality

### Phase 3: Polish & Performance (Week 3)
- Optimize API response times
- Improve error messages
- Add loading states
- Final UI polish

### Phase 4: Deployment (Week 4)
- Deploy to Vercel
- Set up environment variables
- Performance monitoring
- User testing

## Risk Mitigation (MVP)

### Technical Risks
- **API Rate Limits**: Implement caching and request queuing
- **Data Quality**: Validate financial data before AI processing
- **AI Consistency**: Use structured prompts and validation
- **Performance**: Parallel processing and response caching

### User Experience Risks
- **Expectations**: Clear messaging about MVP limitations
- **Error Handling**: Friendly messages for unsupported companies
- **Loading Times**: Progress indicators and realistic time estimates

## MVP Success Definition
The MVP is successful if:
1. **Time Goal**: Users get meaningful analysis in under 30 seconds
2. **Quality Goal**: AI analysis reads like professional financial commentary
3. **Distress Score Goal**: Altman Z-Score calculations are accurate and provide clear risk zone classifications
4. **Usability Goal**: Non-financial users can understand the bankruptcy risk assessment
5. **Magic Goal**: Users share the tool with colleagues because it "just works" and provides insights they couldn't get elsewhere

## Post-MVP Roadmap Hooks
- Database integration for caching and user data
- Historical analysis and trend detection
- Advanced charting and visualizations
- Portfolio-level analysis and recommendations
- Integration with additional data sources
- Mobile-responsive design improvements 