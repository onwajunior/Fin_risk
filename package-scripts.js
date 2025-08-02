/**
 * Package scripts configuration for Financial Risk Analyzer
 */

module.exports = {
  scripts: {
    // Development
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "nodemon server.js",
    "dev:frontend": "cd frontend && npm start",
    
    // Production
    "build": "npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "start": "NODE_ENV=production node server.js",
    
    // Installation
    "install:all": "npm install && cd frontend && npm install",
    "postinstall": "npm run build:frontend",
    
    // Testing and Quality
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "echo \"Backend tests not yet implemented\"",
    "test:frontend": "cd frontend && npm test",
    
    // Linting
    "lint": "eslint . --ext .js,.jsx",
    "lint:fix": "eslint . --ext .js,.jsx --fix",
    
    // Deployment
    "deploy": "npm run build && npm run deploy:vercel",
    "deploy:vercel": "vercel --prod",
    
    // Utilities
    "clean": "rm -rf node_modules frontend/node_modules frontend/build",
    "reset": "npm run clean && npm run install:all",
    
    // Health checks
    "health": "curl -f http://localhost:3001/api/health || exit 1",
    "check:env": "node -e \"require('./config/environment').validateEnvironment()\""
  }
};