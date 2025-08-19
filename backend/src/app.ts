// server.ts (在已有代码基础上添加)
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import EventEmitter from 'events';

// 导入原有路由
import systemRoutes from './routes/system';
import configRoutes from './routes/config';
import generationRoutes from './routes/generation';
import projectRoutes from './routes/projects';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/outputs', express.static(path.join(__dirname, '../../outputs')));
app.use('/projects', express.static(path.join(__dirname, '../../projects')));

// Routes
app.use('/api/system', systemRoutes);
app.use('/api/config', configRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/projects', projectRoutes);

// --------------------- SSE 消息推送 ---------------------
const notificationEmitter = new EventEmitter();

// SSE 路由
app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // 立即发送头部

  console.log('Client connected to SSE');

  const onNotification = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  notificationEmitter.on('notification', onNotification);

  req.on('close', () => {
    console.log('Client disconnected from SSE');
    notificationEmitter.off('notification', onNotification);
    res.end();
  });
});

// 模拟发送通知接口（前端可 POST 调用或内部调用）
app.post('/api/notifications/send', (req, res) => {
  const message = {
    id: Date.now(),
    content: req.body.content || `新消息 ${new Date().toLocaleTimeString()}`,
    read: false,
  };
  notificationEmitter.emit('notification', message);
  res.json({ status: 'ok', message });
});
// ---------------------------------------------------------

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Ensure required directories exist
const ensureDirectories = async () => {
  const dirs = [
    path.join(__dirname, '../../outputs/images'),
    path.join(__dirname, '../../outputs/videos'),
    path.join(__dirname, '../../projects'),
    path.join(__dirname, '../../config'),
    path.join(__dirname, '../../img')
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// Start server
const startServer = async () => {
  try {
    await ensureDirectories();
    
    app.listen(PORT, () => {
      console.log(`🚀 EasyVideo Backend Server running on port ${PORT}`);
      console.log(`📁 Static files served from outputs and projects directories`);
      console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🔔 SSE notifications available at http://localhost:${PORT}/api/notifications/stream`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
