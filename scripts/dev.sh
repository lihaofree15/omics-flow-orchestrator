#!/bin/bash

# Development script for Bioinformatics Platform
# Starts both frontend and backend in development mode

set -e

echo "🚀 Starting Bioinformatics Platform in development mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_dev() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

# Check dependencies
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies for all packages
print_status "Installing dependencies..."

# Install shared packages dependencies
print_dev "Installing shared packages dependencies..."
cd packages/shared-types && npm install && cd - > /dev/null
cd packages/ui-components && npm install && cd - > /dev/null
cd packages/bioinformatics-utils && npm install && cd - > /dev/null

# Install app dependencies
print_dev "Installing frontend dependencies..."
cd apps/frontend && npm install && cd - > /dev/null

print_dev "Installing backend dependencies..."
cd apps/backend && npm install && cd - > /dev/null

# Function to cleanup background processes
cleanup() {
    print_warning "Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

print_status "Starting development servers..."

# Start backend in background
print_dev "Starting backend server on port 3001..."
cd apps/backend
npm run dev &
BACKEND_PID=$!
cd - > /dev/null

# Give backend time to start
sleep 3

# Start frontend in background
print_dev "Starting frontend server on port 5173..."
cd apps/frontend
npm run dev &
FRONTEND_PID=$!
cd - > /dev/null

# Wait a bit for servers to start
sleep 5

echo ""
print_status "🎉 Development servers are running!"
echo ""
echo "  📱 Frontend: http://localhost:5173"
echo "  🔧 Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop the servers
wait