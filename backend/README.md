# Backend Service

The Backend Service is the middleware layer of EasyVideo that provides RESTful APIs for the frontend application and acts as a bridge between the frontend and AI services. Built with Express.js and TypeScript, it handles HTTP requests, file uploads, task management, and system monitoring.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [API Routes](#api-routes)
- [Core Services](#core-services)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

The Backend Service provides:

- **RESTful API**: Comprehensive REST endpoints for frontend communication
- **File Management**: Upload, storage, and serving of images and videos
- **Task Management**: Asynchronous task processing with progress tracking
- **System Monitoring**: Real-time system status and resource monitoring
- **Project Management**: Complete project lifecycle management
- **Configuration Management**: Dynamic configuration updates and validation
- **AI Service Integration**: Seamless communication with AI services

## Architecture

```
backend/
├── src/
│   ├── app.ts                 # Express application entry point
│   ├── routes/               # API route definitions
│   │   ├── system.ts         # System monitoring and status
│   │   ├── config.ts         # Configuration management
│   │   ├── generation.ts     # AI generation tasks
│   │   └── projects.ts       # Project management
│   ├── services/            # Business logic services
│   │   ├── configService.js  # Configuration service
│   │   └── projectService.js # Project management service
│   ├── middleware/          # Express middleware
│   ├── controllers/         # Request controllers
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
│       └── logger.js       # Logging utility
├── dist/                   # Compiled JavaScript output
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
└── .env                   # Environment variables
```

## API Routes

### System Routes (`/api/system`)

**Purpose**: Monitor system health, resources, and AI service connectivity.

#### Endpoints:

- `GET /status` - Get comprehensive system status
- `GET /info` - Get system information
- `GET /models/status` - Check AI model loading status
- `POST /test-ai-connection` - Test AI service connectivity
- `POST /restart-ai` - Restart AI service
- `GET /logs` - Retrieve system logs
- `POST /cleanup` - Clean temporary files
- `GET /disk-usage` - Get disk space information
- `GET /gpu-usage` - Get GPU utilization
- `GET /task-queue` - Get task queue status
- `DELETE /task-queue` - Clear task queue

#### Key Features:

- **GPU Monitoring**: Real-time GPU memory and utilization tracking
- **Model Status**: Check which AI models are loaded and ready
- **Disk Management**: Monitor storage usage and cleanup
- **AI Service Health**: Continuous monitoring of AI service connectivity
- **Task Queue Management**: Monitor and manage background tasks

### Generation Routes (`/api/generation`)

**Purpose**: Handle AI generation tasks with progress tracking and file management.

#### Endpoints:

- `POST /optimize-prompt` - Optimize text prompts
- `POST /text-to-image` - Generate images from text
- `POST /image-to-video` - Convert images to videos
- `POST /storyboard/script` - Generate scripts
- `POST /storyboard` - Create storyboards
- `POST /upload-image` - Upload image files
- `GET /progress/:taskId` - Server-Sent Events for progress
- `GET /task/:taskId` - Get task status
- `GET /tasks` - List all tasks
- `DELETE /task/:taskId` - Cancel/delete task
- `GET /queue/status` - Get generation queue status

#### Key Features:

- **Asynchronous Processing**: Non-blocking task execution
- **Progress Tracking**: Real-time progress updates via SSE
- **File Upload**: Secure image upload with validation
- **Task Management**: Complete task lifecycle management
- **Error Handling**: Comprehensive error tracking and reporting

### Configuration Routes (`/api/config`)

**Purpose**: Manage system configuration dynamically.

#### Endpoints:

- `GET /` - Get current configuration
- `POST /` - Update configuration
- `PUT /` - Replace entire configuration
- `POST /reset` - Reset to default configuration
- `POST /validate` - Validate configuration
- `GET /export` - Export configuration
- `POST /import` - Import configuration
- `GET /models/:modelName` - Get model configuration
- `PUT /models/:modelName` - Update model configuration
- `POST /check-path` - Validate file paths

#### Key Features:

- **Dynamic Updates**: Live configuration updates without restart
- **Validation**: Comprehensive configuration validation
- **Backup/Restore**: Configuration export and import
- **Model Management**: Individual model configuration
- **Path Validation**: Verify file and directory paths

### Project Routes (`/api/projects`)

**Purpose**: Complete project lifecycle management.

#### Endpoints:

- `GET /` - List all projects
- `POST /` - Create new project
- `GET /:id` - Get project details
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project
- `GET /:id/files` - Get project files
- `POST /:id/export` - Export project

#### Key Features:

- **Project Organization**: Structured project management
- **File Management**: Asset organization and tracking
- **Metadata Tracking**: Project statistics and history
- **Export/Import**: Project portability
- **Search and Filter**: Advanced project discovery

## Core Services

### 1. Config Service (`configService.js`)

**Purpose**: Centralized configuration management with caching and validation.

**Key Features**:
- Configuration caching with TTL
- AI service integration for config sync
- Path validation and model status checking
- Import/export functionality
- Nested configuration value access

**Main Methods**:
- `getConfig(key)`: Retrieve configuration values
- `updateConfig(updates)`: Update configuration
- `validatePaths(paths)`: Validate file paths
- `getModelConfig()`: Get model configurations
- `testConnection()`: Test AI service connectivity

### 2. Project Service (`projectService.js`)

**Purpose**: Complete project lifecycle management with file organization.

**Key Features**:
- Project creation and organization
- File management and asset tracking
- Project statistics and analytics
- History tracking and versioning
- Export and import capabilities

**Main Methods**:
- `createProject(data)`: Create new projects
- `getProjects(options)`: List projects with filtering
- `updateProject(id, updates)`: Update project data
- `getProjectFiles(id, type)`: Retrieve project assets
- `exportProject(id, options)`: Export project data

### 3. Logger Utility (`logger.js`)

**Purpose**: Comprehensive logging system with multiple output targets.

**Key Features**:
- Multiple log levels (error, warn, info, debug)
- Console and file output
- Log rotation and cleanup
- Performance logging
- Request/response logging

**Main Methods**:
- `error(message, meta)`: Log error messages
- `info(message, meta)`: Log informational messages
- `logRequest(req, res, time)`: Log HTTP requests
- `logPerformance(operation, duration)`: Log performance metrics

## Installation

### Prerequisites

- Node.js 14+
- npm or yarn
- TypeScript 4.3+

### Dependencies Installation

```bash
cd backend
npm install
```

### Development Dependencies

```bash
# Install TypeScript and development tools
npm install -D typescript ts-node @types/node
```

### Build Process

```bash
# Compile TypeScript to JavaScript
npm run build

# Type checking without compilation
npm run check
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ENABLE_CONSOLE_LOG=true
ENABLE_FILE_LOG=true

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### TypeScript Configuration

The `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "check": "tsc --noEmit"
  }
}
```

## Usage

### Development Mode

```bash
# Start development server with hot reload
npm run dev
```

### Production Mode

```bash
# Build and start production server
npm run build
npm start
```

### API Testing

**Health Check**:
```bash
curl http://localhost:8000/health
```

**System Status**:
```bash
curl http://localhost:8000/api/system/status
```

**Generate Image**:
```bash
curl -X POST http://localhost:8000/api/generation/text-to-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Beautiful sunset landscape",
    "width": 1024,
    "height": 1024
  }'
```

**Upload Image**:
```bash
curl -X POST http://localhost:8000/api/generation/upload-image \
  -F "image=@/path/to/image.jpg"
```

### Progress Monitoring

```javascript
// Monitor task progress with Server-Sent Events
const eventSource = new EventSource('/api/generation/progress/task-id');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.progress);
};
```

## Development

### Project Structure

The backend follows a layered architecture:

- **Routes Layer**: HTTP endpoint definitions and request handling
- **Services Layer**: Business logic and external service integration
- **Utils Layer**: Common utilities and helper functions
- **Middleware Layer**: Request processing and validation

### Adding New Routes

1. **Create Route File**:
   ```typescript
   // src/routes/newFeature.ts
   import express from 'express';
   
   const router = express.Router();
   
   router.get('/', async (req, res) => {
     // Implementation
   });
   
   export default router;
   ```

2. **Register Route**:
   ```typescript
   // src/app.ts
   import newFeatureRoutes from './routes/newFeature';
   app.use('/api/new-feature', newFeatureRoutes);
   ```

### Adding New Services

1. **Create Service Class**:
   ```javascript
   // src/services/newService.js
   class NewService {
     constructor() {
       this.init();
     }
     
     async processData(data) {
       // Implementation
     }
   }
   
   module.exports = new NewService();
   ```

2. **Use in Routes**:
   ```typescript
   import newService from '../services/newService';
   
   router.post('/process', async (req, res) => {
     const result = await newService.processData(req.body);
     res.json({ success: true, data: result });
   });
   ```

### Error Handling

```typescript
// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});
```

### Middleware Development

```typescript
// Custom middleware example
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Authentication logic
  next();
};

app.use('/api/protected', authMiddleware);
```

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- routes/system.test.ts
```

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
PORT=8001 npm run dev
```

**2. TypeScript Compilation Errors**
```bash
# Check for type errors
npm run check

# Clean and rebuild
rm -rf dist/
npm run build
```

**3. AI Service Connection Issues**
```bash
# Test AI service connectivity
curl http://localhost:8000/api/system/test-ai-connection

# Check AI service logs
# Verify AI_SERVICE_URL environment variable
```

**4. File Upload Issues**
```bash
# Check file permissions
ls -la uploads/

# Verify upload directory exists
mkdir -p uploads/

# Check file size limits in configuration
```

**5. Database/Storage Issues**
```bash
# Check disk space
df -h

# Clean temporary files
curl -X POST http://localhost:8000/api/system/cleanup

# Verify project directory permissions
ls -la projects/
```

### Logging and Debugging

**Enable Debug Logging**:
```bash
LOG_LEVEL=debug npm run dev
```

**View Logs**:
```bash
# Real-time log monitoring
tail -f logs/app.log

# Search logs
grep "ERROR" logs/app.log
```

**API Debugging**:
```bash
# Enable request logging
ENABLE_CONSOLE_LOG=true npm run dev

# Use curl with verbose output
curl -v http://localhost:8000/api/system/status
```

### Performance Optimization

- **Memory Management**: Monitor Node.js memory usage
- **Request Caching**: Implement response caching for static data
- **Database Optimization**: Optimize file system operations
- **Load Balancing**: Use PM2 for production deployment

### Production Deployment

```bash
# Using PM2
npm install -g pm2
pm2 start dist/app.js --name "easyvideo-backend"

# Using Docker
docker build -t easyvideo-backend .
docker run -p 8000:8000 easyvideo-backend
```

---

**Note**: This Backend Service is designed to work with the EasyVideo frontend and AI service components. Ensure all services are properly configured and running for full functionality.