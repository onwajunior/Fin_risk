#!/bin/bash

# Financial Risk Analyzer - Installation Script
# This script sets up the Financial Risk Analyzer on your system

set -e

echo "🏦 Financial Risk Analyzer - Installation Script"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 16 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            print_warning "Node.js version 16+ is recommended. Current version: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Install backend dependencies
install_backend() {
    print_status "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed successfully"
}

# Install frontend dependencies
install_frontend() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed successfully"
}

# Create environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Financial Risk Analyzer Environment Configuration

# Server Configuration
NODE_ENV=development
PORT=3001

# OpenAI API Configuration (Required)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Financial Data API Keys (Optional - app will use mock data if not provided)
# Alpha Vantage: https://www.alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# Finnhub: https://finnhub.io/register
FINNHUB_API_KEY=your_finnhub_api_key_here

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001/api
EOF
        print_success "Environment file created: .env"
        print_warning "Please edit .env file and add your API keys"
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Build frontend for production
build_frontend() {
    print_status "Building frontend for production..."
    cd frontend
    npm run build
    cd ..
    print_success "Frontend built successfully"
}

# Create uploads directory
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p uploads
    print_success "Directories created"
}

# Display completion message
display_completion() {
    echo ""
    echo "🎉 Installation completed successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Edit the .env file and add your API keys:"
    echo "   - OpenAI API key (required for AI analysis)"
    echo "   - Alpha Vantage API key (optional, for real financial data)"
    echo ""
    echo "2. Start the development servers:"
    echo "   npm run dev                 # Backend only"
    echo "   npm run dev:full           # Backend + Frontend"
    echo ""
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo "   API:      http://localhost:3001/api"
    echo ""
    echo "4. For production deployment:"
    echo "   npm start                  # Production server"
    echo "   npm run deploy:vercel      # Deploy to Vercel"
    echo ""
    echo "📚 Documentation: See README.md for detailed instructions"
    echo "🐛 Issues: Report bugs at https://github.com/your-repo/issues"
    echo ""
    print_success "Happy analyzing! 📊"
}

# Main installation process
main() {
    echo "Starting installation process..."
    echo ""
    
    check_nodejs
    check_npm
    install_backend
    install_frontend
    setup_environment
    create_directories
    build_frontend
    
    display_completion
}

# Run main function
main