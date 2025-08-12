#!/bin/bash

# Bioinformatics Platform Frontend Setup Script
# This script prepares the environment for deployment

set -e

echo "🔧 Setting up frontend deployment environment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to display colored output
print_status() {
    case $1 in
        "success") echo "✅ $2" ;;
        "error") echo "❌ $2" ;;
        "warning") echo "⚠️  $2" ;;
        "info") echo "ℹ️  $2" ;;
    esac
}

# Check system requirements
echo "📋 Checking system requirements..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "success" "Node.js found: $NODE_VERSION"
    
    # Check if version is >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_status "error" "Node.js version 18 or higher is required"
        exit 1
    fi
else
    print_status "error" "Node.js is not installed"
    echo "Please install Node.js 18 or higher from https://nodejs.org"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "success" "npm found: $NPM_VERSION"
else
    print_status "error" "npm is not installed"
    exit 1
fi

# Check Docker (optional for local development)
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_status "success" "Docker found: $DOCKER_VERSION"
else
    print_status "warning" "Docker not found - required for containerized deployment"
fi

# Check Docker Compose (optional for local development)
if command_exists docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_status "success" "Docker Compose found: $COMPOSE_VERSION"
else
    print_status "warning" "Docker Compose not found - required for containerized deployment"
fi

# Check available ports
echo ""
echo "🔍 Checking port availability..."

check_port() {
    if nc -z localhost $1 2>/dev/null; then
        print_status "warning" "Port $1 is already in use"
        return 1
    else
        print_status "success" "Port $1 is available"
        return 0
    fi
}

# Check common ports
if command_exists nc; then
    check_port 80
    check_port 3000
    check_port 8080
else
    print_status "info" "netcat not available - skipping port check"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

if [ -f "package.json" ]; then
    print_status "info" "Installing npm dependencies..."
    npm run install:all
    print_status "success" "Dependencies installed successfully"
else
    print_status "error" "package.json not found - run this script from the frontend-deploy directory"
    exit 1
fi

# Build packages
echo ""
echo "🏗️  Building shared packages..."
npm run packages:build
print_status "success" "Packages built successfully"

# Validate configuration files
echo ""
echo "🔍 Validating configuration files..."

required_files=(
    "package.json"
    "vite.config.ts"
    "tsconfig.json"
    "Dockerfile"
    "docker-compose.yml"
    "nginx.conf"
    "scripts/deploy.sh"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "success" "$file exists"
    else
        print_status "error" "$file is missing"
        exit 1
    fi
done

# Make scripts executable
echo ""
echo "🔑 Setting script permissions..."
chmod +x scripts/*.sh
print_status "success" "Script permissions set"

# Final validation
echo ""
echo "✨ Running final validation..."

# Test TypeScript compilation
if npm run type-check; then
    print_status "success" "TypeScript compilation successful"
else
    print_status "error" "TypeScript compilation failed"
    exit 1
fi

# Test build process
echo ""
print_status "info" "Testing build process..."
if npm run build; then
    print_status "success" "Build test successful"
else
    print_status "error" "Build test failed"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "  1. For local development: npm run dev"
echo "  2. For Docker deployment: ./scripts/deploy.sh"
echo "  3. For custom port deployment: ./scripts/deploy.sh -p 8080"
echo ""
echo "For more information, see README.md"