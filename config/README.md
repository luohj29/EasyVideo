# EasyVideo Configuration

The configuration module of EasyVideo provides centralized management of system settings, model configurations, and operational parameters. It handles configuration loading, validation, and persistence across the entire application.

## Overview

The config module serves as the central configuration hub for EasyVideo, managing:
- AI model paths and settings
- System resource limits and performance parameters
- File system paths and directory structures
- Generation defaults and constraints
- API and service configurations

## Architecture

### Configuration Files

```
config/
├── config.json         # Active configuration file
├── default.json        # Default configuration template
├── config_manager.py   # Configuration management class
└── __pycache__/        # Python bytecode cache
```

### Configuration Structure

The configuration is organized into logical sections:

#### 1. Models Configuration
Defines AI model paths and availability:
```json
{
  "models": {
    "qwen": {
      "path": "/path/to/qwen/model",
      "enabled": true,
      "description": "Prompt optimization model"
    },
    "flux": {
      "path": "/path/to/flux/model",
      "enabled": true,
      "description": "Image generation model"
    },
    "flux_kontext": {
      "path": "/path/to/flux_kontext/model",
      "enabled": true,
      "description": "Image editing model"
    },
    "wan_i2v": {
      "path": "/path/to/wan_i2v/model",
      "enabled": true,
      "description": "Image-to-video model"
    }
  }
}
```

#### 2. System Paths
Defines directory structures and file locations:
```json
{
  "paths": {
    "diffsynth_path": "../DiffSynth-Studio",
    "output_dir": "./outputs",
    "projects_dir": "./projects",
    "img_dir": "./img",
    "temp_dir": "/tmp/easyvideo"
  }
}
```

#### 3. System Configuration
Controls resource usage and performance:
```json
{
  "system": {
    "gpu_memory_limit": 49,
    "max_concurrent_tasks": 2,
    "auto_cleanup": true,
    "log_level": "info",
    "api_port": 8000,
    "frontend_port": 3000
  }
}
```

#### 4. Generation Settings
Defines default parameters for AI generation:
```json
{
  "generation": {
    "image": {
      "default_size": [1024, 1024],
      "max_batch_size": 5,
      "default_steps": 30,
      "default_guidance": 7.5
    },
    "video": {
      "default_fps": 15,
      "default_duration": 4,
      "max_batch_size": 3,
      "default_steps": 50
    }
  }
}
```

#### 5. Prompt Optimization
Controls prompt enhancement features:
```json
{
  "prompt_optimization": {
    "enabled": true,
    "default_type": "通用型",
    "max_length": 500,
    "cache_results": true
  }
}
```

## Configuration Manager

### ConfigManager Class

The `ConfigManager` class provides a comprehensive interface for configuration management:

```python
class ConfigManager:
    def __init__(self, config_dir: str = None)
    def get(self, key: str, default: Any = None) -> Any
    def set(self, key: str, value: Any) -> None
    def save_config(self) -> bool
    def get_model_config(self, model_name: str) -> Optional[Dict[str, Any]]
    def is_model_enabled(self, model_name: str) -> bool
    def get_model_path(self, model_name: str) -> Optional[str]
    def get_path(self, path_name: str) -> Optional[str]
    def validate_paths(self) -> Dict[str, bool]
    def reset_to_default(self) -> bool
```

### Key Features

#### 1. Hierarchical Configuration Access
- **Dot Notation**: Access nested values using `"models.qwen.path"`
- **Default Values**: Automatic fallback to default values
- **Type Safety**: Maintains data types during get/set operations

#### 2. Path Management
- **Relative Path Resolution**: Converts relative paths to absolute paths
- **Path Validation**: Checks if configured paths exist
- **Cross-Platform Support**: Handles different OS path separators

#### 3. Model Configuration
- **Model Availability**: Check if models are enabled and accessible
- **Path Resolution**: Resolve model paths relative to project structure
- **Configuration Validation**: Ensure model configurations are valid

#### 4. Persistence
- **Auto-Save**: Automatic configuration persistence
- **Backup and Restore**: Reset to default configuration when needed
- **Error Handling**: Graceful handling of configuration file issues

## Configuration Files

### config.json
The active configuration file containing current system settings. This file is automatically created from `default.json` if it doesn't exist and is updated when configuration changes are made through the application.

### default.json
The default configuration template that serves as:
- **Initial Configuration**: Base settings for new installations
- **Reset Template**: Reference for restoring default settings
- **Documentation**: Example of proper configuration structure

### Key Differences
- **default.json**: Conservative settings suitable for most systems
- **config.json**: Optimized settings for the current deployment

## Usage Examples

### Basic Configuration Access
```python
from config.config_manager import config_manager

# Get a simple value
api_port = config_manager.get('system.api_port', 8000)

# Get model configuration
qwen_config = config_manager.get_model_config('qwen')

# Check if model is enabled
if config_manager.is_model_enabled('flux'):
    model_path = config_manager.get_model_path('flux')
```

### Configuration Updates
```python
# Update a configuration value
config_manager.set('system.gpu_memory_limit', 32)

# Save changes to file
config_manager.save_config()

# Reset to defaults
config_manager.reset_to_default()
```

### Path Validation
```python
# Validate all configured paths
path_status = config_manager.validate_paths()
for path_name, is_valid in path_status.items():
    if not is_valid:
        print(f"Invalid path: {path_name}")
```

### Using Convenience Functions
```python
from config.config_manager import get_config, set_config, save_config

# Simplified access
max_tasks = get_config('system.max_concurrent_tasks', 1)
set_config('generation.image.default_steps', 25)
save_config()
```

## Configuration Parameters

### Model Settings

| Parameter | Type | Description | Default |
|-----------|------|-------------|----------|
| `models.{model}.path` | string | Absolute or relative path to model | "" |
| `models.{model}.enabled` | boolean | Whether model is available | false |
| `models.{model}.description` | string | Human-readable model description | "" |

### System Settings

| Parameter | Type | Description | Default |
|-----------|------|-------------|----------|
| `system.gpu_memory_limit` | integer | GPU memory limit in GB | 16 |
| `system.max_concurrent_tasks` | integer | Maximum parallel generation tasks | 1 |
| `system.auto_cleanup` | boolean | Automatic temporary file cleanup | true |
| `system.log_level` | string | Logging verbosity (debug/info/warn/error) | "info" |
| `system.api_port` | integer | AI service API port | 8000 |
| `system.frontend_port` | integer | Frontend development server port | 3000 |

### Path Settings

| Parameter | Type | Description | Default |
|-----------|------|-------------|----------|
| `paths.diffsynth_path` | string | Path to DiffSynth-Studio | "" |
| `paths.output_dir` | string | Generated content output directory | "./outputs" |
| `paths.projects_dir` | string | Project files directory | "./projects" |
| `paths.img_dir` | string | Image assets directory | "./img" |
| `paths.temp_dir` | string | Temporary files directory | "/tmp/easyvideo" |

### Generation Settings

#### Image Generation
| Parameter | Type | Description | Default |
|-----------|------|-------------|----------|
| `generation.image.default_size` | array | Default image dimensions [width, height] | [1024, 1024] |
| `generation.image.max_batch_size` | integer | Maximum images per batch | 3 |
| `generation.image.default_steps` | integer | Default inference steps | 20 |
| `generation.image.default_guidance` | float | Default guidance scale | 7.5 |

#### Video Generation
| Parameter | Type | Description | Default |
|-----------|------|-------------|----------|
| `generation.video.default_fps` | integer | Default frames per second | 15 |
| `generation.video.default_duration` | integer | Default video duration in seconds | 4 |
| `generation.video.max_batch_size` | integer | Maximum videos per batch | 1 |
| `generation.video.default_steps` | integer | Default inference steps | 30 |

### Prompt Optimization

| Parameter | Type | Description | Default |
|-----------|------|-------------|----------|
| `prompt_optimization.enabled` | boolean | Enable prompt optimization | true |
| `prompt_optimization.default_type` | string | Default optimization type | "通用型" |
| `prompt_optimization.max_length` | integer | Maximum prompt length | 500 |
| `prompt_optimization.cache_results` | boolean | Cache optimization results | true |

## Installation and Setup

### Initial Configuration

1. **Copy Default Configuration**
   ```bash
   cd config
   cp default.json config.json
   ```

2. **Update Model Paths**
   Edit `config.json` to set correct model paths:
   ```json
   {
     "models": {
       "qwen": {
         "path": "/path/to/your/qwen/model",
         "enabled": true
       }
     }
   }
   ```

3. **Validate Configuration**
   ```python
   from config.config_manager import config_manager
   status = config_manager.validate_paths()
   print(status)
   ```

### Environment-Specific Configuration

#### Development Environment
```json
{
  "system": {
    "gpu_memory_limit": 8,
    "max_concurrent_tasks": 1,
    "log_level": "debug"
  }
}
```

#### Production Environment
```json
{
  "system": {
    "gpu_memory_limit": 48,
    "max_concurrent_tasks": 4,
    "log_level": "info"
  }
}
```

## Best Practices

### Configuration Management
1. **Version Control**: Keep `default.json` in version control, exclude `config.json`
2. **Environment Variables**: Use environment variables for sensitive configurations
3. **Validation**: Always validate configuration after changes
4. **Backup**: Create backups before major configuration changes

### Performance Tuning
1. **GPU Memory**: Set `gpu_memory_limit` based on available VRAM
2. **Concurrent Tasks**: Adjust `max_concurrent_tasks` based on system resources
3. **Batch Sizes**: Optimize batch sizes for your hardware capabilities

### Security Considerations
1. **Path Security**: Ensure model paths are secure and accessible
2. **Port Configuration**: Use non-standard ports for production deployments
3. **Access Control**: Implement proper file permissions for configuration files

## Troubleshooting

### Common Issues

1. **Configuration File Not Found**
   ```
   Error: config.json not found
   Solution: Copy default.json to config.json
   ```

2. **Invalid Model Paths**
   ```
   Error: Model path does not exist
   Solution: Update model paths in config.json
   ```

3. **Permission Errors**
   ```
   Error: Cannot write to config file
   Solution: Check file permissions and ownership
   ```

4. **JSON Syntax Errors**
   ```
   Error: Invalid JSON format
   Solution: Validate JSON syntax using a JSON validator
   ```

### Debugging

```python
# Enable debug logging
config_manager.set('system.log_level', 'debug')

# Check configuration status
print(config_manager.get_config())

# Validate all paths
path_status = config_manager.validate_paths()
for path, valid in path_status.items():
    print(f"{path}: {'✓' if valid else '✗'}")
```

### Recovery

```python
# Reset to default configuration
config_manager.reset_to_default()

# Or manually restore from backup
import shutil
shutil.copy('config.backup.json', 'config.json')
```

## Integration

The configuration module integrates with all other EasyVideo components:

- **AI Service**: Model paths and generation parameters
- **Backend**: API ports and system settings
- **Frontend**: Display configuration options
- **Project Management**: Default paths and settings

This centralized approach ensures consistent configuration across the entire application while providing flexibility for different deployment scenarios.