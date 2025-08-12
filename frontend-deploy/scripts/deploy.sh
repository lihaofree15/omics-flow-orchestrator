#!/bin/bash

# Bioinformatics Platform Frontend Deployment Script
# This script automates the deployment process for the frontend application

set -e  # Exit on any error

echo "🚀 Starting frontend deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to display help
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy the bioinformatics platform frontend

Options:
    -h, --help          Show this help message
    -p, --port PORT     Set the port for deployment (default: 80)
    -d, --dev           Run in development mode
    --clean             Clean existing containers before deployment
    --build-only        Only build the Docker image, don't run

Examples:
    $0                  Deploy on port 80
    $0 -p 8080         Deploy on port 8080
    $0 --clean         Clean and redeploy
    $0 --build-only    Only build the image

EOF
}

# Default values
PORT=80
DEV_MODE=false
CLEAN=false
BUILD_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -d|--dev)
            DEV_MODE=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            show_help
            exit 1
            ;;
    esac
done

echo "📋 Configuration:"
echo "   Port: $PORT"
echo "   Development mode: $DEV_MODE"
echo "   Clean deployment: $CLEAN"
echo "   Build only: $BUILD_ONLY"

# Clean existing containers if requested
if [ "$CLEAN" = true ]; then
    echo "🧹 Cleaning existing containers..."
    docker-compose down --remove-orphans --volumes || true
    docker system prune -f || true
fi

# Update docker-compose port
sed -i.bak "s/- \"[0-9]*:80\"/- \"$PORT:80\"/" docker-compose.yml

if [ "$DEV_MODE" = true ]; then
    echo "🔧 Building and running in development mode..."
    npm run install:all
    npm run dev
else
    echo "🏗️  Building Docker image..."
    docker-compose build

    if [ "$BUILD_ONLY" = false ]; then
        echo "🚀 Starting deployment..."
        docker-compose up -d
        
        echo "⏳ Waiting for application to start..."
        sleep 10
        
        # Health check
        echo "🔍 Performing health check..."
        if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
            echo "✅ Deployment successful!"
            echo "🌐 Frontend is now available at: http://localhost:$PORT"
        else
            echo "❌ Health check failed. Check the logs:"
            docker-compose logs
            exit 1
        fi
    else
        echo "✅ Build completed successfully!"
    fi
fi

echo "🎉 Deployment script completed!"