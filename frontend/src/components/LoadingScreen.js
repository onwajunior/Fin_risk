import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Clock, Brain, FileText, Download } from 'lucide-react';

const LoadingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = useMemo(() => [
    {
      id: 'fetching',
      title: 'Fetching financial data',
      description: 'Getting latest financial statements and market data',
      icon: Clock,
      duration: 3000
    },
    {
      id: 'calculating',
      title: 'Calculating Altman Z-Scores',
      description: 'Computing bankruptcy risk indicators',
      icon: Brain,
      duration: 4000
    },
    {
      id: 'analyzing',
      title: 'Generating AI analysis',
      description: 'Creating professional risk assessment',
      icon: Brain,
      duration: 8000
    },
    {
      id: 'compiling',
      title: 'Preparing portfolio summary',
      description: 'Compiling executive dashboard',
      icon: FileText,
      duration: 3000
    },
    {
      id: 'finalizing',
      title: 'Finalizing report',
      description: 'Preparing downloadable analysis',
      icon: Download,
      duration: 2000
    }
  ], []);

  useEffect(() => {
    let stepTimer;
    let progressTimer;
    
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let elapsedTime = 0;

    const updateProgress = () => {
      progressTimer = setInterval(() => {
        elapsedTime += 100;
        const newProgress = Math.min((elapsedTime / totalDuration) * 100, 100);
        setProgress(newProgress);

        // Update current step based on elapsed time
        let accumulatedTime = 0;
        for (let i = 0; i < steps.length; i++) {
          accumulatedTime += steps[i].duration;
          if (elapsedTime < accumulatedTime) {
            setCurrentStep(i);
            break;
          }
        }

        if (newProgress >= 100) {
          clearInterval(progressTimer);
        }
      }, 100);
    };

    updateProgress();

    return () => {
      if (stepTimer) clearTimeout(stepTimer);
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [steps]);

  const getStepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="loading-screen">
      <div className="container">
        <div className="loading-content">
          <div className="loading-header">
            <div className="progress-circle">
              <svg className="progress-ring" viewBox="0 0 120 120">
                <circle
                  className="progress-ring-bg"
                  cx="60"
                  cy="60"
                  r="50"
                />
                <circle
                  className="progress-ring-fill"
                  cx="60"
                  cy="60"
                  r="50"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 50}`,
                    strokeDashoffset: `${2 * Math.PI * 50 * (1 - progress / 100)}`
                  }}
                />
              </svg>
              <div className="progress-text">
                <span className="progress-percent">{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="loading-title">
              <h2>Analyzing your portfolio</h2>
              <p>Transform the way you assess risk in just a few seconds</p>
            </div>
          </div>

          <div className="steps-container">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <div
                  key={step.id}
                  className={`step-item step-${status}`}
                >
                  <div className="step-icon">
                    {status === 'completed' ? (
                      <CheckCircle size={24} />
                    ) : (
                      <Icon size={24} />
                    )}
                  </div>
                  
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                  </div>
                  
                  <div className="step-status">
                    {status === 'completed' && (
                      <span className="status-badge status-completed">✓</span>
                    )}
                    {status === 'active' && (
                      <div className="status-spinner"></div>
                    )}
                    {status === 'pending' && (
                      <span className="status-badge status-pending">⏳</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="loading-footer">
            <p className="loading-estimate">
              Estimated time remaining: {Math.max(0, Math.round((100 - progress) / 5))} seconds
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading-screen {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-8) 0;
          background: var(--color-neutral-50);
        }
        
        .loading-content {
          max-width: 600px;
          width: 100%;
          text-align: center;
        }
        
        .loading-header {
          margin-bottom: var(--space-12);
        }
        
        .progress-circle {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto var(--space-6);
        }
        
        .progress-ring {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        
        .progress-ring-bg {
          fill: none;
          stroke: var(--color-neutral-200);
          stroke-width: 8;
        }
        
        .progress-ring-fill {
          fill: none;
          stroke: var(--color-primary);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.3s ease;
        }
        
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .progress-percent {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }
        
        .loading-title h2 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin-bottom: var(--space-2);
        }
        
        .loading-title p {
          font-size: var(--font-size-base);
          color: var(--color-neutral-600);
          margin: 0;
        }
        
        .steps-container {
          background: white;
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          margin-bottom: var(--space-8);
        }
        
        .step-item {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4) 0;
          border-bottom: 1px solid var(--color-neutral-100);
          transition: all 0.3s ease;
        }
        
        .step-item:last-child {
          border-bottom: none;
        }
        
        .step-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .step-pending .step-icon {
          background: var(--color-neutral-100);
          color: var(--color-neutral-400);
        }
        
        .step-active .step-icon {
          background: var(--gradient-primary);
          color: white;
          animation: pulse 2s infinite;
        }
        
        .step-completed .step-icon {
          background: var(--gradient-success);
          color: white;
        }
        
        .step-content {
          flex: 1;
          text-align: left;
        }
        
        .step-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-900);
          margin: 0 0 var(--space-1);
        }
        
        .step-description {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          margin: 0;
        }
        
        .step-status {
          flex-shrink: 0;
          width: 32px;
          display: flex;
          justify-content: center;
        }
        
        .status-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
        }
        
        .status-completed {
          background: var(--color-safe);
          color: white;
        }
        
        .status-pending {
          background: var(--color-neutral-200);
          color: var(--color-neutral-500);
        }
        
        .status-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--color-neutral-200);
          border-top: 2px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .step-active .step-title {
          color: var(--color-primary);
        }
        
        .step-completed .step-title {
          color: var(--color-safe);
        }
        
        .loading-footer {
          text-align: center;
        }
        
        .loading-estimate {
          font-size: var(--font-size-sm);
          color: var(--color-neutral-600);
          margin: 0;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 122, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .loading-content {
            padding: 0 var(--space-4);
          }
          
          .loading-title h2 {
            font-size: var(--font-size-xl);
          }
          
          .step-item {
            gap: var(--space-3);
            padding: var(--space-3) 0;
          }
          
          .step-icon {
            width: 40px;
            height: 40px;
          }
          
          .steps-container {
            padding: var(--space-4);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;