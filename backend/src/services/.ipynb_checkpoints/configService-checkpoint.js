const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class ConfigService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.configCache = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  // 获取AI服务状态
  async getAIServiceStatus() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000
      });
      return {
        status: 'online',
        data: response.data
      };
    } catch (error) {
      logger.error('AI服务连接失败:', error.message);
      return {
        status: 'offline',
        error: error.message
      };
    }
  }

  // 获取配置
  async getConfig(key = null) {
    try {
      // 检查缓存
      if (this.configCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        if (key) {
          return this.getNestedValue(this.configCache, key);
        }
        return this.configCache;
      }

      // 从AI服务获取配置
      const response = await axios.get(`${this.aiServiceUrl}/config`, {
        timeout: 10000
      });

      if (response.data.success) {
        // 更新缓存
        this.configCache = response.data.data;
        this.cacheExpiry = Date.now() + this.cacheTimeout;

        if (key) {
          return this.getNestedValue(this.configCache, key);
        }
        return this.configCache;
      } else {
        throw new Error(response.data.message || '获取配置失败');
      }
    } catch (error) {
      logger.error('获取配置失败:', error.message);
      throw error;
    }
  }

  // 更新配置
  async updateConfig(updates) {
    try {
      const response = await axios.put(`${this.aiServiceUrl}/config`, updates, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // 清除缓存
        this.clearCache();
        return response.data;
      } else {
        throw new Error(response.data.message || '更新配置失败');
      }
    } catch (error) {
      logger.error('更新配置失败:', error.message);
      throw error;
    }
  }

  // 验证路径
  async validatePaths(paths) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/config/validate-paths`, {
        paths
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('验证路径失败:', error.message);
      throw error;
    }
  }

  // 重置配置
  async resetConfig() {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/config/reset`, {}, {
        timeout: 10000
      });

      if (response.data.success) {
        // 清除缓存
        this.clearCache();
        return response.data;
      } else {
        throw new Error(response.data.message || '重置配置失败');
      }
    } catch (error) {
      logger.error('重置配置失败:', error.message);
      throw error;
    }
  }

  // 导出配置
  async exportConfig() {
    try {
      const config = await this.getConfig();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `config_backup_${timestamp}.json`;
      
      return {
        success: true,
        data: {
          config,
          fileName,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('导出配置失败:', error.message);
      throw error;
    }
  }

  // 导入配置
  async importConfig(configData) {
    try {
      // 验证配置数据
      if (!configData || typeof configData !== 'object') {
        throw new Error('无效的配置数据');
      }

      // 更新配置
      const result = await this.updateConfig(configData);
      
      logger.info('配置导入成功');
      return result;
    } catch (error) {
      logger.error('导入配置失败:', error.message);
      throw error;
    }
  }

  // 获取模型配置
  async getModelConfig() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/config/models`, {
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      logger.error('获取模型配置失败:', error.message);
      throw error;
    }
  }

  // 更新模型配置
  async updateModelConfig(modelConfig) {
    try {
      const response = await axios.put(`${this.aiServiceUrl}/config/models`, modelConfig, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // 清除缓存
        this.clearCache();
        return response.data;
      } else {
        throw new Error(response.data.message || '更新模型配置失败');
      }
    } catch (error) {
      logger.error('更新模型配置失败:', error.message);
      throw error;
    }
  }

  // 检查模型状态
  async checkModelStatus() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/config/models/status`, {
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      logger.error('检查模型状态失败:', error.message);
      throw error;
    }
  }

  // 获取嵌套值
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }

  // 设置嵌套值
  setNestedValue(obj, key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, prop) => {
      if (!current[prop] || typeof current[prop] !== 'object') {
        current[prop] = {};
      }
      return current[prop];
    }, obj);
    target[lastKey] = value;
  }

  // 清除缓存
  clearCache() {
    this.configCache = null;
    this.cacheExpiry = null;
    logger.debug('配置缓存已清除');
  }

  // 获取系统信息
  async getSystemInfo() {
    try {
      const config = await this.getConfig();
      const aiStatus = await this.getAIServiceStatus();
      
      return {
        success: true,
        data: {
          aiService: aiStatus,
          config: {
            modelPaths: config.model_paths || {},
            systemSettings: config.system_settings || {},
            paths: config.paths || {}
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('获取系统信息失败:', error.message);
      return {
        success: false,
        error: error.message,
        data: {
          aiService: { status: 'offline' },
          config: null,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // 测试连接
  async testConnection() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          status: 'connected',
          responseTime,
          aiServiceUrl: this.aiServiceUrl,
          version: response.data.version || 'unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          status: 'disconnected',
          error: error.message,
          aiServiceUrl: this.aiServiceUrl
        }
      };
    }
  }
}

// 创建单例实例
const configService = new ConfigService();

module.exports = configService;