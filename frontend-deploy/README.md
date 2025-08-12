# Bioinformatics Platform Frontend Deployment

This folder contains a standalone deployment package for the bioinformatics platform frontend that can be deployed independently on servers without requiring the full project structure.

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** (for containerized deployment)
- **Docker Compose** (for easy deployment)

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

```bash
# Clone or copy this deployment folder to your server
# Navigate to the deployment directory
cd frontend-deploy

# Run the deployment script
./scripts/deploy.sh

# Access the application at http://localhost
```

### Option 2: Manual Docker Commands

```bash
# Build the Docker image
docker-compose build

# Start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 3: Local Development

```bash
# Install dependencies
npm run install:all

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Deployment Options

### Basic Deployment
```bash
./scripts/deploy.sh
```

### Custom Port Deployment
```bash
./scripts/deploy.sh -p 8080
```

### Clean Deployment (removes existing containers)
```bash
./scripts/deploy.sh --clean
```

### Development Mode
```bash
./scripts/deploy.sh -d
```

### Build Only (no deployment)
```bash
./scripts/deploy.sh --build-only
```

## 📁 Project Structure

```
frontend-deploy/
├── src/                    # React application source code
├── public/                 # Static assets
├── packages/               # Shared packages (copied from main project)
│   ├── shared-types/       # TypeScript type definitions
│   └── ui-components/      # Reusable UI components
├── scripts/                # Deployment scripts
│   └── deploy.sh          # Main deployment script
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── nginx.conf             # Nginx configuration for production
├── package.json           # Node.js dependencies and scripts
└── README.md              # This file
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run install:all` | Install all dependencies including packages |
| `npm run deploy:build` | Full deployment build (includes packages) |
| `npm run start` | Build and serve production version |

## 🐳 Docker Configuration

### Multi-stage Build
The Dockerfile uses a multi-stage build process:
1. **Builder stage**: Installs dependencies and builds the application
2. **Production stage**: Serves the built application with Nginx

### Nginx Configuration
- Serves static files efficiently
- Handles client-side routing (React Router)
- Includes security headers
- Gzip compression enabled
- Health check endpoint at `/health`

## 🔍 Health Monitoring

The application includes health monitoring:
- Health check endpoint: `http://your-server/health`
- Docker health checks built-in
- Automatic restart on failure

## 🌐 Environment Configuration

### Production Environment Variables
Set these in your deployment environment:
```bash
NODE_ENV=production
```

### API Configuration
If your frontend needs to connect to a backend API, update the API endpoints in the source code before building.

## 📊 Performance Optimizations

- **Code splitting**: Automatic code splitting with Vite
- **Asset optimization**: Images and static assets are optimized
- **Gzip compression**: Enabled in Nginx configuration
- **Caching**: Static assets are cached for 1 year
- **Bundle analysis**: Use `npm run build` to see bundle sizes

## 🔒 Security Features

- **Security headers**: CSP, X-Frame-Options, etc.
- **Hidden files protection**: .env and other sensitive files are blocked
- **No server-side vulnerabilities**: Static file serving only

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   ./scripts/deploy.sh -p 8080  # Use different port
   ```

2. **Docker build fails**
   ```bash
   ./scripts/deploy.sh --clean  # Clean and retry
   ```

3. **Health check fails**
   ```bash
   docker-compose logs  # Check logs
   ```

4. **Permission denied on script**
   ```bash
   chmod +x scripts/deploy.sh
   ```

### Viewing Logs
```bash
# Docker logs
docker-compose logs -f

# Nginx access logs
docker-compose exec frontend tail -f /var/log/nginx/access.log

# Nginx error logs
docker-compose exec frontend tail -f /var/log/nginx/error.log
```

## 🔄 Updates and Maintenance

### Updating the Application
1. Replace the contents of this folder with the new version
2. Run the deployment script:
   ```bash
   ./scripts/deploy.sh --clean
   ```

### Backup Strategy
- The application is stateless (no database)
- Container volumes can be backed up if needed
- Source code should be version controlled

## 📝 Production Checklist

Before deploying to production:

- [ ] Update API endpoints if needed
- [ ] Configure environment variables
- [ ] Set up SSL/TLS (reverse proxy recommended)
- [ ] Configure monitoring and logging
- [ ] Set up backup procedures
- [ ] Test health checks
- [ ] Configure firewall rules
- [ ] Set up domain name and DNS

## 🤝 Support

For support and issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify all prerequisites are met
4. Contact the development team

## 📄 License

This project is licensed under the MIT License - see the main project for details.

---

**Note**: This is a standalone deployment package. Changes made here will not affect the main project. To update this deployment, copy the latest version from the main project's frontend application.