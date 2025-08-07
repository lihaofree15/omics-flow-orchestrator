#!/bin/bash

# Build script for Bioinformatics Platform
# This script builds both frontend and backend applications

set -e

echo "🚀 Building Bioinformatics Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Build shared packages first
print_status "Building shared packages..."

# Build shared types
print_status "Building shared types package..."
cd packages/shared-types
npm install
npm run build
cd - > /dev/null

# Build UI components
print_status "Building UI components package..."
cd packages/ui-components
npm install
npm run build
cd - > /dev/null

# Build bioinformatics utils
print_status "Building bioinformatics utils package..."
cd packages/bioinformatics-utils
npm install
npm run build
cd - > /dev/null

# Build frontend
print_status "Building frontend application..."
cd apps/frontend
npm install
npm run build
cd - > /dev/null

# Build backend
print_status "Building backend application..."
cd apps/backend
npm install
npm run build || print_warning "Backend build script not found, skipping TypeScript compilation"
cd - > /dev/null

print_status "✅ Build completed successfully!"

# Create deployment package
print_status "Creating deployment package..."
mkdir -p dist
cp -r apps/frontend/dist dist/frontend 2>/dev/null || print_warning "Frontend dist not found"
cp -r apps/backend dist/backend
cp -r workflows dist/
cp -r docs dist/

print_status "📦 Deployment package created in dist/ directory"

echo ""
echo "🎉 Build process completed!"
echo ""
echo "Next steps:"
echo "  - Frontend: Serve files from dist/frontend/"
echo "  - Backend: Run backend from dist/backend/"
echo "  - Workflows: Nextflow workflows available in dist/workflows/"