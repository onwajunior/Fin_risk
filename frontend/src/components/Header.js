import React from 'react';
import { BarChart3, Shield, TrendingUp, Sparkles, Award } from 'lucide-react';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-bg">
        <div className="bg-gradient"></div>
        <div className="bg-pattern"></div>
      </div>
      <div className="container">
        <div className="header-content">
          <div className="header-branding">
            <div className="logo">
              <div className="logo-icon-wrapper">
                <BarChart3 size={36} className="logo-icon" />
                <div className="logo-glow"></div>
              </div>
              <div className="logo-text">
                <h1 className="logo-title">Financial Risk Analyzer</h1>
                <p className="logo-subtitle">Professional Analysis • Powered by AI</p>
              </div>
            </div>
          </div>
          
          <div className="header-features">
            <div className="feature-item">
              <div className="feature-icon">
                <Shield size={18} />
              </div>
              <span>Bankruptcy Risk Assessment</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Sparkles size={18} />
              </div>
              <span>AI-Powered Insights</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Award size={18} />
              </div>
              <span>Professional Grade</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .app-header {
          position: relative;
          background: var(--gradient-header);
          color: white;
          padding: var(--space-8) 0 var(--space-10) 0;
          overflow: hidden;
          min-height: 180px;
        }
        
        .header-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .bg-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gradient-header);
        }
        
        .bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 25% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 75% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
        }
        
        .header-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-8);
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
        
        .logo-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-xl);
          backdrop-filter: var(--backdrop-blur);
        }
        
        .logo-icon {
          color: white;
          z-index: 2;
        }
        
        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
          border-radius: var(--radius-xl);
          filter: blur(8px);
        }
        
        .logo-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
          background: linear-gradient(135deg, #ffffff 0%, #e6f0ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .logo-subtitle {
          margin: var(--space-1) 0 0 0;
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.8);
          font-weight: var(--font-weight-medium);
        }
        
        .header-features {
          display: flex;
          gap: var(--space-6);
          align-items: center;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-lg);
          backdrop-filter: var(--backdrop-blur);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: rgba(255, 255, 255, 0.95);
          transition: var(--transition-smooth);
        }
        
        .feature-item:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }
        
        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
        }
        
        .header-branding {
          display: flex;
          align-items: center;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .header-features {
            gap: var(--space-4);
          }
          
          .feature-item {
            padding: var(--space-2) var(--space-3);
            font-size: var(--font-size-xs);
          }
          
          .logo-title {
            font-size: var(--font-size-xl);
          }
        }
        
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: var(--space-6);
            text-align: center;
          }
          
          .header-features {
            flex-wrap: wrap;
            justify-content: center;
            gap: var(--space-3);
          }
          
          .logo {
            flex-direction: column;
            gap: var(--space-3);
          }
          
          .app-header {
            padding: var(--space-6) 0 var(--space-8) 0;
            min-height: 160px;
          }
        }
        
        @media (max-width: 480px) {
          .feature-item span {
            display: none;
          }
          
          .feature-item {
            padding: var(--space-2);
            min-width: 40px;
            justify-content: center;
          }
          
          .logo-title {
            font-size: var(--font-size-lg);
          }
          
          .logo-subtitle {
            font-size: var(--font-size-xs);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;