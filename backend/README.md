# Bioinformatics Platform Backend

A comprehensive backend API for a bioinformatics analysis platform built with Node.js, Express, TypeScript, and MongoDB.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 📁 **Project Management**: Create, manage, and collaborate on research projects
- 🧬 **Analysis Workflows**: Support for transcriptome, single-cell, and genomics analysis
- 📊 **File Management**: Upload, download, and manage large genomics datasets
- 📈 **System Monitoring**: Real-time system metrics and performance monitoring
- 🚀 **Job Queue**: Asynchronous processing of analysis workflows
- 🔒 **Security**: Rate limiting, CORS, helmet security headers
- 📝 **Logging**: Structured logging with Winston
- 🐳 **Docker Support**: Containerized deployment with Docker Compose

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis with Bull queue
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express Validator
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- Redis 6.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Using Docker

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **For development with admin interfaces**
   ```bash
   docker-compose --profile development up -d
   ```

3. **For production**
   ```bash
   docker-compose --profile production up -d
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/collaborators` - Add collaborator
- `DELETE /api/projects/:id/collaborators/:userId` - Remove collaborator

### Analysis Jobs
- `GET /api/analysis` - List analysis jobs
- `POST /api/analysis` - Create analysis job
- `GET /api/analysis/statistics` - Get job statistics
- `GET /api/analysis/:id` - Get job details
- `PUT /api/analysis/:id` - Update job
- `DELETE /api/analysis/:id` - Delete job
- `POST /api/analysis/:id/cancel` - Cancel job
- `GET /api/analysis/:id/logs` - Get job logs

### File Management
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### System Monitoring
- `GET /api/system/health` - Health check
- `GET /api/system/metrics/current` - Current metrics
- `GET /api/system/metrics/history` - Metrics history
- `GET /api/system/metrics/summary` - Metrics summary
- `GET /api/system/info` - System information

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # Database connection
│   └── logger.ts    # Logging configuration
├── controllers/     # Route controllers
│   ├── authController.ts
│   ├── projectController.ts
│   ├── analysisController.ts
│   ├── fileController.ts
│   └── systemController.ts
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication middleware
│   ├── validation.ts # Request validation
│   └── security.ts  # Security middleware
├── models/          # Mongoose models
│   ├── User.ts
│   ├── Project.ts
│   ├── AnalysisJob.ts
│   ├── DataFile.ts
│   └── SystemMetrics.ts
├── routes/          # Express routes
│   ├── auth.ts
│   ├── projects.ts
│   ├── analysis.ts
│   ├── files.ts
│   ├── system.ts
│   └── index.ts
├── services/        # Business logic services
│   └── jobQueue.ts  # Job queue service
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/bioinformatics_platform` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` |

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Code Style

- TypeScript with strict mode
- ESLint with recommended rules
- Prettier for code formatting
- Conventional commits

## Deployment

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose --profile production up -d
   ```

2. **Environment Configuration**
   Create a `.env` file with production values:
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://username:password@mongodb:27017/dbname
   JWT_SECRET=your-production-secret
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Monitoring

The application includes built-in monitoring features:

- **Health Checks**: `/api/system/health`
- **System Metrics**: CPU, memory, storage, and job statistics
- **Request Logging**: Structured HTTP request logs
- **Error Tracking**: Comprehensive error logging

### Admin Interfaces (Development)

- **MongoDB Express**: http://localhost:8081 (Database admin)
- **Redis Commander**: http://localhost:8082 (Redis admin)

## Security

- JWT authentication with refresh tokens
- Role-based authorization (admin, researcher, analyst, viewer)
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization
- File upload restrictions

## Performance

- Connection pooling for MongoDB
- Redis caching for sessions and job queues
- Compression middleware
- Request/response logging
- Background job processing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.