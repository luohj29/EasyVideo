import express from 'express';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();
const CONFIG_PATH = path.join(__dirname, '../../../config/config.json');
const DEFAULT_CONFIG_PATH = path.join(__dirname, '../../../config/default.json');

// Get current configuration
router.get('/', async (req, res) => {
  try {
    let config;
    
    // Try to read existing config
    if (await fs.pathExists(CONFIG_PATH)) {
      config = await fs.readJson(CONFIG_PATH);
    } else {
      // Create default config if it doesn't exist
      config = getDefaultConfig();
      await fs.ensureDir(path.dirname(CONFIG_PATH));
      await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
    }
    
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({ success: false, error: 'Failed to read configuration' });
  }
});

// Update configuration
router.post('/', async (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate config structure
    if (!validateConfig(newConfig)) {
      res.status(400).json({ success: false, error: 'Invalid configuration format' });
      return;
    }
    
    // Ensure config directory exists
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    
    // Write new config
    await fs.writeJson(CONFIG_PATH, newConfig, { spaces: 2 });
    
    res.json({ success: true, data: newConfig, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ success: false, error: 'Failed to update configuration' });
  }
});

// Update configuration (PUT method)
router.put('/', async (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate config structure
    if (!validateConfig(newConfig)) {
      res.status(400).json({ success: false, error: 'Invalid configuration format' });
      return;
    }
    
    // Ensure config directory exists
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    
    // Write new config
    await fs.writeJson(CONFIG_PATH, newConfig, { spaces: 2 });
    
    res.json({ success: true, data: newConfig, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ success: false, error: 'Failed to update configuration' });
  }
});

// Reset to default configuration
router.post('/reset', async (req, res) => {
  try {
    const defaultConfig = getDefaultConfig();
    
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    await fs.writeJson(CONFIG_PATH, defaultConfig, { spaces: 2 });
    
    res.json({ success: true, data: defaultConfig, message: 'Configuration reset to defaults' });
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({ success: false, error: 'Failed to reset configuration' });
  }
});

// Validate model paths
router.post('/validate', async (req, res) => {
  try {
    const config = req.body;
    const validation = await validateModelPaths(config);
    
    res.json({ success: true, data: validation });
  } catch (error) {
    console.error('Error validating config:', error);
    res.status(500).json({ success: false, error: 'Failed to validate configuration' });
  }
});

// Get default configuration
function getDefaultConfig() {
  return {
    models: {
      qwen: {
        path: '/root/autodl-tmp/Qwen/Qwen2.5-VL-3B-Instruct',
        enabled: true,
        description: 'Prompt优化模型'
      },
      flux: {
        path: '/root/autodl-tmp/black-forest-labs/FLUX.1-Krea-dev',
        enabled: true,
        description: '图像生成模型'
      },
      flux_kontext: {
        path: '/root/autodl-tmp/black-forest-labs/FLUX.1-Kontext-dev',
        enabled: true,
        description: '图像编辑模型'
      },
      wan_i2v: {
        path: '/root/autodl-tmp/Wan-AI/Wan2.2-I2V-A14B',
        enabled: true,
        description: '图生视频模型'
      }
    },
    paths: {
      diffsynth_path: '/root/autodl-tmp/DiffSynth-Studio',
      output_dir: '/root/autodl-tmp/EasyVideo/outputs',
      projects_dir: '/root/autodl-tmp/EasyVideo/projects',
      img_dir: '/root/autodl-tmp/EasyVideo/img',
      temp_dir: '/tmp/easyvideo'
    },
    system: {
      gpu_memory_limit: 30,
      max_concurrent_tasks: 2,
      auto_cleanup: true,
      log_level: 'info',
      api_port: 8000,
      frontend_port: 3000
    },
    generation: {
      image: {
        default_size: [1024, 1024],
        max_batch_size: 5,
        default_steps: 30,
        default_guidance: 7.5
      },
      video: {
        default_fps: 15,
        default_duration: 4,
        max_batch_size: 3,
        default_steps: 50
      }
    },
    prompt_optimization: {
      enabled: true,
      default_type: '通用型',
      max_length: 500,
      cache_results: true
    }
  };
}

// Validate configuration structure
function validateConfig(config: any): boolean {
  try {
    return (
      config &&
      typeof config === 'object' &&
      config.models &&
      config.paths &&
      config.system &&
      config.generation &&
      config.prompt_optimization
    );
  } catch {
    return false;
  }
}

// Validate model paths exist
async function validateModelPaths(config: any) {
  const results: any = {
    valid: true,
    models: {},
    paths: {}
  };
  
  // Check model paths
  if (config.models) {
    for (const [key, model] of Object.entries(config.models)) {
      if (typeof model === 'object' && model !== null && 'path' in model) {
        const modelData = model as { path: string };
        const exists = await fs.pathExists(modelData.path);
        results.models[key] = {
          path: modelData.path,
          exists,
          accessible: exists
        };
        if (!exists) results.valid = false;
      }
    }
  }
  
  // Check system paths
  if (config.paths) {
    for (const [key, pathValue] of Object.entries(config.paths)) {
      if (typeof pathValue === 'string') {
        const exists = await fs.pathExists(pathValue);
        results.paths[key] = {
          path: pathValue,
          exists,
          accessible: exists
        };
        if (!exists && key !== 'temp_dir') results.valid = false;
      }
    }
  }
  
  return results;
}

// Export configuration
router.get('/export', async (req, res) => {
  try {
    let config;
    
    if (await fs.pathExists(CONFIG_PATH)) {
      config = await fs.readJson(CONFIG_PATH);
    } else {
      config = getDefaultConfig();
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="config.json"');
    res.json(config);
  } catch (error) {
    console.error('Error exporting config:', error);
    res.status(500).json({ success: false, error: 'Failed to export configuration' });
  }
});

// Import configuration
router.post('/import', async (req, res) => {
  try {
    const importedConfig = req.body;
    
    // Validate imported config
    if (!validateConfig(importedConfig)) {
      res.status(400).json({ success: false, error: 'Invalid configuration format' });
      return;
    }
    
    // Ensure config directory exists
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    
    // Write imported config
    await fs.writeJson(CONFIG_PATH, importedConfig, { spaces: 2 });
    
    res.json({ success: true, data: importedConfig, message: 'Configuration imported successfully' });
  } catch (error) {
    console.error('Error importing config:', error);
    res.status(500).json({ success: false, error: 'Failed to import configuration' });
  }
});

// Get model configuration
router.get('/models/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    
    let config;
    if (await fs.pathExists(CONFIG_PATH)) {
      config = await fs.readJson(CONFIG_PATH);
    } else {
      config = getDefaultConfig();
    }
    
    const models = config.models || {};
    const modelConfig = models[modelName];
    
    if (!modelConfig) {
      res.status(404).json({ success: false, error: `Model '${modelName}' not found` });
      return;
    }
    
    res.json({ success: true, data: modelConfig });
  } catch (error) {
    console.error('Error getting model config:', error);
    res.status(500).json({ success: false, error: 'Failed to get model configuration' });
  }
});

// Update model configuration
router.put('/models/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    const modelConfig = req.body;
    
    let config;
    if (await fs.pathExists(CONFIG_PATH)) {
      config = await fs.readJson(CONFIG_PATH);
    } else {
      config = getDefaultConfig();
    }
    
    if (!config.models) {
      config.models = {};
    }
    
    config.models[modelName] = modelConfig;
    
    // Ensure config directory exists
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    
    // Write updated config
    await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
    
    res.json({ success: true, data: modelConfig, message: `Model '${modelName}' configuration updated successfully` });
  } catch (error) {
    console.error('Error updating model config:', error);
    res.status(500).json({ success: false, error: 'Failed to update model configuration' });
  }
});

// Check model path
router.post('/check-path', async (req, res) => {
  try {
    const { path: checkPath } = req.body;
    
    if (!checkPath || typeof checkPath !== 'string') {
      res.status(400).json({ success: false, error: 'Path is required' });
      return;
    }
    
    const exists = await fs.pathExists(checkPath);
    let size;
    let error;
    
    if (exists) {
      try {
        const stats = await fs.stat(checkPath);
        size = stats.size;
      } catch (err) {
        error = 'Unable to get file size';
      }
    }
    
    res.json({
      success: true,
      data: {
        exists,
        size,
        error
      }
    });
  } catch (error) {
    console.error('Error checking path:', error);
    res.status(500).json({ success: false, error: 'Failed to check path' });
  }
});

export default router;