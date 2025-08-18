const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'app.log');
    this.enableConsole = process.env.ENABLE_CONSOLE_LOG !== 'false';
    this.enableFile = process.env.ENABLE_FILE_LOG !== 'false';
    
    // 确保日志目录存在
    this.ensureLogDir();
    
    // 日志级别映射
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[this.logLevel] || this.levels.info;
  }
  
  // 确保日志目录存在
  ensureLogDir() {
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      console.error('创建日志目录失败:', error);
    }
  }
  
  // 格式化时间戳
  formatTimestamp() {
    return new Date().toISOString();
  }
  
  // 格式化日志消息
  formatMessage(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }
  
  // 写入日志
  writeLog(level, message, meta = {}) {
    if (this.levels[level] > this.currentLevel) {
      return;
    }
    
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // 控制台输出
    if (this.enableConsole) {
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }
    
    // 文件输出
    if (this.enableFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('写入日志文件失败:', error);
      }
    }
  }
  
  // 错误日志
  error(message, meta = {}) {
    // 如果message是Error对象，提取错误信息
    if (message instanceof Error) {
      meta = { ...meta, stack: message.stack };
      message = message.message;
    }
    this.writeLog('error', message, meta);
  }
  
  // 警告日志
  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }
  
  // 信息日志
  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }
  
  // 调试日志
  debug(message, meta = {}) {
    this.writeLog('debug', message, meta);
  }
  
  // 设置日志级别
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.logLevel = level;
      this.currentLevel = this.levels[level];
      this.info(`日志级别设置为: ${level}`);
    } else {
      this.warn(`无效的日志级别: ${level}`);
    }
  }
  
  // 获取当前日志级别
  getLevel() {
    return this.logLevel;
  }
  
  // 清理旧日志文件
  cleanOldLogs(daysToKeep = 7) {
    try {
      const logDir = path.dirname(this.logFile);
      const files = fs.readdirSync(logDir);
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          this.info(`删除旧日志文件: ${file}`);
        }
      });
    } catch (error) {
      this.error('清理旧日志文件失败:', error);
    }
  }
  
  // 轮转日志文件
  rotateLog() {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (stats.size > maxSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = this.logFile.replace('.log', `_${timestamp}.log`);
          
          fs.renameSync(this.logFile, rotatedFile);
          this.info(`日志文件已轮转: ${rotatedFile}`);
        }
      }
    } catch (error) {
      console.error('日志文件轮转失败:', error);
    }
  }
  
  // 创建子logger
  child(meta = {}) {
    const childLogger = Object.create(this);
    childLogger.defaultMeta = { ...this.defaultMeta, ...meta };
    
    // 重写writeLog方法以包含默认meta
    const originalWriteLog = this.writeLog.bind(this);
    childLogger.writeLog = (level, message, additionalMeta = {}) => {
      const combinedMeta = { ...childLogger.defaultMeta, ...additionalMeta };
      originalWriteLog(level, message, combinedMeta);
    };
    
    return childLogger;
  }
  
  // 记录HTTP请求
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this.writeLog(level, `${req.method} ${req.url} ${res.statusCode}`, meta);
  }
  
  // 记录性能指标
  logPerformance(operation, duration, meta = {}) {
    this.info(`性能指标: ${operation}`, {
      ...meta,
      duration: `${duration}ms`,
      operation
    });
  }
  
  // 记录系统事件
  logSystemEvent(event, data = {}) {
    this.info(`系统事件: ${event}`, {
      event,
      ...data,
      timestamp: this.formatTimestamp()
    });
  }
}

// 创建默认logger实例
const logger = new Logger();

// 定期清理和轮转日志
setInterval(() => {
  logger.rotateLog();
  logger.cleanOldLogs();
}, 24 * 60 * 60 * 1000); // 每天执行一次

module.exports = logger;