import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

const router = express.Router();
const execAsync = promisify(exec);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Get system status
router.get('/status', async (req, res) => {
  try {
    const gpuStatus = await getGPUStatus();
    const modelsLoaded = await checkModelsLoaded();
    const diskSpace = await getDiskSpace();
    
    // Transform to match frontend SystemStatus interface
    const status = {
      gpu_available: gpuStatus.available,
      gpu_info: gpuStatus.available ? `${gpuStatus.name} - ${gpuStatus.memory_used}/${gpuStatus.memory_total} (${gpuStatus.usage_percentage}%)` : gpuStatus.error,
      models_loaded: modelsLoaded,
      disk_space: diskSpace,
      timestamp: new Date().toISOString(),
      // Additional fields for compatibility
      gpu_status: gpuStatus,
      gpu: {
        available: gpuStatus.available,
        name: gpuStatus.name,
        memory_total: gpuStatus.available ? parseFloat(gpuStatus.memory_total.replace('GB', '')) * 1024 : 0, // Convert to MB
        memory_used: gpuStatus.available ? parseFloat(gpuStatus.memory_used.replace('GB', '')) * 1024 : 0, // Convert to MB
        memory_free: gpuStatus.available ? (parseFloat(gpuStatus.memory_total.replace('GB', '')) - parseFloat(gpuStatus.memory_used.replace('GB', ''))) * 1024 : 0,
        utilization: gpuStatus.utilization || 0
      },
      storage: {
        total: diskSpace.total,
        free: diskSpace.free,
        used: 'Unknown' // Would need additional calculation
      }
    };
    
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ success: false, error: 'Failed to get system status' });
  }
});

// Check GPU status
async function getGPUStatus() {
  try {
    const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits');
    const lines = stdout.trim().split('\n');
    
    if (lines.length === 0 || !lines[0]) {
      throw new Error('No GPU data returned');
    }
    
    // Parse the first GPU (support multiple GPUs in the future)
    const [name, used, total, utilization] = lines[0].split(', ');
    const usedMB = parseInt(used);
    const totalMB = parseInt(total);
    const util = parseInt(utilization);
    
    return {
      available: true,
      name: name.trim(),
      memory_used: `${(usedMB / 1024).toFixed(1)}GB`,
      memory_total: `${(totalMB / 1024).toFixed(1)}GB`,
      usage_percentage: Math.round((usedMB / totalMB) * 100),
      utilization: util
    };
  } catch (error) {
    console.error('GPU status check error:', error);
    return {
      available: false,
      name: 'N/A',
      memory_used: 'N/A',
      memory_total: 'N/A',
      usage_percentage: 0,
      utilization: 0,
      error: error instanceof Error ? error.message : 'GPU not available or nvidia-smi not found'
    };
  }
}

// Check if models are loaded (check if model paths exist and AI service status)
async function checkModelsLoaded() {
  try {
    // First check if AI service is running and has models loaded
    try {
      const aiResponse = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
      if (aiResponse.data && aiResponse.data.services) {
        const services = aiResponse.data.services;
        // Check if any AI services are loaded
        const hasLoadedServices = Object.values(services).some(service => service === true);
        if (hasLoadedServices) {
          return true;
        }
      }
    } catch (aiError) {
      console.log('AI service not available, checking local config:', aiError instanceof Error ? aiError.message : 'Unknown error');
    }
    
    // Fallback to checking local config
    const configPath = path.join(__dirname, '../../../config/config.json');
    
    if (!await fs.pathExists(configPath)) {
      return false;
    }
    
    const config = await fs.readJson(configPath);
    const models = config.models || {};
    
    let loadedCount = 0;
    let totalCount = 0;
    
    for (const [key, model] of Object.entries(models)) {
      if (typeof model === 'object' && model !== null && 'path' in model && 'enabled' in model) {
        totalCount++;
        const modelData = model as { path: string; enabled: boolean };
        if (modelData.enabled && await fs.pathExists(modelData.path)) {
          loadedCount++;
        }
      }
    }
    
    return totalCount > 0 && loadedCount > 0; // At least one model should be loaded
  } catch (error) {
    console.error('Error checking models:', error);
    return false;
  }
}

// Get disk space information
async function getDiskSpace() {
  try {
    const { stdout } = await execAsync('df -h /root/autodl-tmp --output=avail,size');
    const lines = stdout.trim().split('\n');
    if (lines.length >= 2) {
      const [avail, size] = lines[1].trim().split(/\s+/);
      return {
        free: avail,
        total: size
      };
    }
  } catch (error) {
    console.error('Error getting disk space:', error);
  }
  
  return {
    free: 'Unknown',
    total: 'Unknown'
  };
}

// Get system info
router.get('/info', async (req, res) => {
  try {
    const info = {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    res.json({ success: true, data: info });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ success: false, error: 'Failed to get system info' });
  }
});

// Get model status
router.get('/models/status', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../../config/config.json');
    let config = {};
    
    if (await fs.pathExists(configPath)) {
      config = await fs.readJson(configPath);
    }
    
    const models = (config as any).models || {};
    const modelStatus = [];
    
    for (const [key, model] of Object.entries(models)) {
      if (typeof model === 'object' && model !== null && 'path' in model) {
        const modelData = model as { path: string; enabled: boolean; description?: string };
        const exists = await fs.pathExists(modelData.path);
        modelStatus.push({
          name: key,
          path: modelData.path,
          enabled: modelData.enabled,
          description: modelData.description || '',
          loaded: exists && modelData.enabled,
          status: exists ? (modelData.enabled ? 'loaded' : 'disabled') : 'missing'
        });
      }
    }
    
    res.json({ success: true, data: modelStatus });
  } catch (error) {
    console.error('Error getting model status:', error);
    res.status(500).json({ success: false, error: 'Failed to get model status' });
  }
});

// Test AI service connection
router.post('/test-ai-connection', async (req, res) => {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    const latency = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        connected: response.status === 200,
        latency,
        status: response.data
      }
    });
  } catch (error) {
    console.error('Error testing AI connection:', error);
    res.json({
      success: true,
      data: {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    });
  }
});

// Restart AI service (mock implementation)
router.post('/restart-ai', async (req, res) => {
  try {
    // This is a mock implementation - in production you might use PM2 or similar
    res.json({
      success: true,
      data: {
        success: true,
        message: 'AI service restart requested (mock implementation)'
      }
    });
  } catch (error) {
    console.error('Error restarting AI service:', error);
    res.status(500).json({ success: false, error: 'Failed to restart AI service' });
  }
});

// Get logs
router.get('/logs', async (req, res) => {
  try {
    const level = req.query.level as string;
    const limit = parseInt(req.query.limit as string) || 100;
    
    // Mock log data - in production you would read from actual log files
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'System started successfully' },
      { timestamp: new Date().toISOString(), level: 'info', message: 'AI service connected' },
      { timestamp: new Date().toISOString(), level: 'debug', message: 'Model loading completed' }
    ].filter(log => !level || log.level === level).slice(0, limit);
    
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
});

// Cleanup temporary files
router.post('/cleanup', async (req, res) => {
  try {
    const tempDir = '/tmp/easyvideo';
    let cleaned = 0;
    let freedSpace = 0;
    
    if (await fs.pathExists(tempDir)) {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        freedSpace += stats.size;
        await fs.remove(filePath);
        cleaned++;
      }
    }
    
    res.json({
      success: true,
      data: {
        cleaned,
        freed_space: freedSpace
      }
    });
  } catch (error) {
    console.error('Error cleaning up:', error);
    res.status(500).json({ success: false, error: 'Failed to cleanup temporary files' });
  }
});

// Get disk usage
router.get('/disk-usage', async (req, res) => {
  try {
    const { stdout } = await execAsync('df -B1 /root/autodl-tmp --output=avail,size,used');
    const lines = stdout.trim().split('\n');
    if (lines.length >= 2) {
      const [avail, size, used] = lines[1].trim().split(/\s+/).map(Number);
      const percentage = Math.round((used / size) * 100);
      
      res.json({
        success: true,
        data: {
          total: size,
          used,
          free: avail,
          percentage
        }
      });
    } else {
      throw new Error('Unable to parse disk usage');
    }
  } catch (error) {
    console.error('Error getting disk usage:', error);
    res.status(500).json({ success: false, error: 'Failed to get disk usage' });
  }
});

// Get GPU usage
router.get('/gpu-usage', async (req, res) => {
  try {
    const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits');
    const [name, memoryUsed, memoryTotal, utilization] = stdout.trim().split(', ');
    
    res.json({
      success: true,
      data: {
        name: name.trim(),
        memory_used: parseInt(memoryUsed),
        memory_total: parseInt(memoryTotal),
        utilization: parseInt(utilization)
      }
    });
  } catch (error) {
    console.error('Error getting GPU usage:', error);
    res.json({
      success: true,
      data: {
        name: 'GPU not available',
        memory_used: 0,
        memory_total: 0,
        utilization: 0
      }
    });
  }
});

// Get task queue status
router.get('/task-queue', async (req, res) => {
  try {
    // Mock task queue data - in production this would come from a real queue system
    const queueStatus = {
      pending: 0,
      running: 0,
      completed: 5,
      failed: 0
    };
    
    res.json({ success: true, data: queueStatus });
  } catch (error) {
    console.error('Error getting task queue status:', error);
    res.status(500).json({ success: false, error: 'Failed to get task queue status' });
  }
});

// Clear task queue
router.delete('/task-queue', async (req, res) => {
  try {
    // Mock implementation - in production this would clear a real queue
    const cleared = 0;
    
    res.json({ success: true, data: { cleared } });
  } catch (error) {
    console.error('Error clearing task queue:', error);
    res.status(500).json({ success: false, error: 'Failed to clear task queue' });
  }
});

export default router;