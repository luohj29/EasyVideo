# AI Service

The AI Service is the core backend component of EasyVideo that provides AI-powered video creation capabilities through a FastAPI-based REST API. It handles text-to-image generation, image-to-video conversion, prompt optimization, and project management.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Modules](#core-modules)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

The AI Service provides a comprehensive set of AI capabilities for video creation:

- **Text-to-Image Generation**: Convert text prompts into high-quality images using FLUX models
- **Image-to-Video Generation**: Transform static images into dynamic videos using Wan-I2V models
- **Prompt Optimization**: Enhance user prompts using Qwen language models
- **Image Editing**: Advanced image manipulation and enhancement
- **Project Management**: Organize and manage video creation projects
- **Storyboard Generation**: Create detailed storyboards from scripts

## Architecture

```
ai-service/
├── api_server.py          # FastAPI application entry point
├── main.py               # Alternative entry point with extended functionality
├── requirements.txt      # Python dependencies
├── models/              # AI model storage directory
│   └── Wan-AI/         # Video generation models
└── modules/            # Core functionality modules
    ├── __init__.py
    ├── config_manager.py    # Configuration management
    ├── image_editor.py      # Image editing capabilities
    ├── image_generator.py   # Text-to-image generation
    ├── project_manager.py   # Project lifecycle management
    ├── prompt_optimizer.py  # Prompt enhancement
    ├── storyboard_generator.py # Script and storyboard creation
    ├── utils.py            # Utility functions
    └── video_generator.py   # Image-to-video generation
```

## Core Modules

### 1. Image Generator (`image_generator.py`)

**Purpose**: Converts text prompts into high-quality images using FLUX models.

**Key Features**:
- Support for multiple FLUX model variants (Krea, Kontext)
- Configurable image dimensions and generation parameters
- Batch image generation capabilities
- GPU memory optimization
- Automatic prompt enhancement integration

**Main Methods**:
- `generate()`: Generate images from text prompts
- `validate_parameters()`: Validate generation parameters
- `estimate_generation_time()`: Estimate processing time

### 2. Video Generator (`video_generator.py`)

**Purpose**: Transforms static images into dynamic videos using Wan-I2V models.

**Key Features**:
- Image-to-video conversion with customizable parameters
- Support for various video formats and frame rates
- Progress tracking and callback support
- GPU memory management
- Configurable video duration and quality settings

**Main Methods**:
- `generate()`: Convert images to videos
- `set_progress_callback()`: Set progress monitoring
- `validate_parameters()`: Validate video parameters

### 3. Prompt Optimizer (`prompt_optimizer.py`)

**Purpose**: Enhances user prompts using Qwen language models for better AI generation results.

**Key Features**:
- Multiple optimization types (General, Artistic, Cinematic)
- Style preference integration
- Batch prompt optimization
- Lazy model loading for memory efficiency
- Support for different task types (image, video)

**Main Methods**:
- `optimize()`: Enhance single prompts
- `batch_optimize()`: Process multiple prompts
- `get_optimization_types()`: Available optimization modes

### 4. Image Editor (`image_editor.py`)

**Purpose**: Provides advanced image editing and manipulation capabilities.

**Key Features**:
- FLUX Kontext-based image editing
- Prompt-guided image modifications
- Support for various image formats
- Configurable editing parameters
- Quality preservation during editing

**Main Methods**:
- `edit_image()`: Apply prompt-based edits
- `validate_parameters()`: Validate editing parameters
- `get_supported_formats()`: Supported file formats

### 5. Project Manager (`project_manager.py`)

**Purpose**: Manages the complete lifecycle of video creation projects.

**Key Features**:
- Project creation and organization
- File and asset management
- Project export and import capabilities
- Statistics and analytics tracking
- Template system for common project types

**Main Methods**:
- `create_project()`: Initialize new projects
- `load_project()`: Load existing projects
- `export_project()`: Export projects to various formats
- `get_project_statistics()`: Project analytics

### 6. Storyboard Generator (`storyboard_generator.py`)

**Purpose**: Creates detailed storyboards and scripts for video production.

**Key Features**:
- Automated script generation from themes
- Scene breakdown and timing allocation
- Camera movement and shot type suggestions
- Visual style recommendations
- Export to multiple formats (JSON, text)

**Main Methods**:
- `generate_script()`: Create scripts from themes
- `generate_storyboard()`: Generate visual storyboards
- `export_script()`: Export in various formats

### 7. Config Manager (`config_manager.py`)

**Purpose**: Centralized configuration management for all AI services.

**Key Features**:
- JSON-based configuration storage
- Automatic backup and versioning
- Model path and parameter management
- System settings validation
- Runtime configuration updates

**Main Methods**:
- `get()`: Retrieve configuration values
- `set()`: Update configuration values
- `validate_config()`: Validate configuration integrity

### 8. Utils (`utils.py`)

**Purpose**: Provides common utility functions used across all modules.

**Key Features**:
- GPU memory monitoring and optimization
- File system operations
- System information gathering
- Logging and operation tracking
- Dependency validation

**Main Functions**:
- `get_gpu_memory()`: Monitor GPU usage
- `create_directories()`: Setup directory structure
- `optimize_gpu_memory()`: Free GPU memory
- `check_dependencies()`: Validate system requirements

## API Endpoints

### Health and Status
- `GET /` - Service information
- `GET /health` - Health check with system status
- `GET /config` - Current configuration
- `POST /config` - Update configuration

### AI Generation
- `POST /prompt/optimize` - Optimize text prompts
- `POST /image/generate` - Generate images from text
- `POST /image/edit` - Edit existing images
- `POST /video/generate` - Generate videos from images
- `POST /storyboard/generate` - Create storyboards

### Project Management
- `POST /project/create` - Create new project
- `GET /project/list` - List all projects
- `POST /upload/image` - Upload image assets

## Installation

### Prerequisites

- Python 3.8+
- CUDA-compatible GPU (recommended)
- 8GB+ GPU memory for optimal performance

### Dependencies

Install required packages:

```bash
cd ai-service
pip install -r requirements.txt
```

### Model Setup

1. **Download AI Models**:
   ```bash
   # Create models directory
   mkdir -p models/Wan-AI
   
   # Download required models (follow model-specific instructions)
   # - FLUX models for image generation
   # - Wan-I2V models for video generation
   # - Qwen models for prompt optimization
   ```

2. **Configure Model Paths**:
   Update `../config/config.json` with correct model paths:
   ```json
   {
     "models": {
       "flux": {
         "enabled": true,
         "path": "path/to/flux/model"
       },
       "video": {
         "enabled": true,
         "path": "./models/Wan-AI/Wan2.1-T2V-1.3B"
       },
       "qwen": {
         "enabled": true,
         "path": "path/to/qwen/model"
       }
     }
   }
   ```

## Configuration

The AI Service uses a centralized configuration system managed by `ConfigManager`. Key configuration sections:

### System Settings
```json
{
  "system": {
    "api_port": 8000,
    "max_concurrent_tasks": 3,
    "gpu_memory_limit": "8GB",
    "temp_dir": "/tmp/easyvideo",
    "output_dir": "./outputs"
  }
}
```

### Model Configuration
```json
{
  "models": {
    "flux": {
      "enabled": true,
      "path": "path/to/flux",
      "device": "cuda",
      "precision": "fp16"
    }
  }
}
```

### Generation Parameters
```json
{
  "generation": {
    "image": {
      "default_width": 1024,
      "default_height": 1024,
      "default_steps": 30
    },
    "video": {
      "default_fps": 15,
      "default_duration": 4
    }
  }
}
```

## Usage

### Starting the Service

```bash
# Using api_server.py
python api_server.py

# Using main.py (extended functionality)
python main.py

# Using uvicorn directly
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

### Example API Calls

**Generate Image**:
```bash
curl -X POST "http://localhost:8000/image/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024,
    "steps": 30
  }'
```

**Generate Video**:
```bash
curl -X POST "http://localhost:8000/video/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "image_path": "/path/to/image.jpg",
    "prompt": "Camera slowly zooms in",
    "duration": 4,
    "fps": 15
  }'
```

**Optimize Prompt**:
```bash
curl -X POST "http://localhost:8000/prompt/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "beautiful landscape",
    "optimize_type": "艺术型"
  }'
```

### Using Modules Directly

```python
from modules.image_generator import ImageGenerator
from modules.video_generator import VideoGenerator

# Initialize generators
image_gen = ImageGenerator()
video_gen = VideoGenerator()

# Generate image
image_path = await image_gen.generate(
    prompt="A serene lake at sunset",
    width=1024,
    height=1024
)

# Generate video from image
video_path = await video_gen.generate(
    image_path=image_path,
    prompt="Gentle water ripples",
    duration=4
)
```

## Development

### Code Structure

The AI Service follows a modular architecture:

- **API Layer** (`api_server.py`, `main.py`): FastAPI endpoints and request handling
- **Service Layer** (`modules/`): Core business logic and AI model integration
- **Configuration Layer** (`config_manager.py`): Centralized configuration management
- **Utility Layer** (`utils.py`): Common functions and system utilities

### Adding New Features

1. **Create New Module**:
   ```python
   # modules/new_feature.py
   class NewFeature:
       def __init__(self):
           self._load_config()
       
       async def process(self, input_data):
           # Implementation
           pass
   ```

2. **Add API Endpoint**:
   ```python
   # In api_server.py
   @app.post("/new-feature/process")
   async def process_new_feature(request: NewFeatureRequest):
       service = ensure_service_loaded("new_feature")
       result = await service.process(request.data)
       return {"result": result}
   ```

3. **Update Configuration**:
   ```json
   {
     "new_feature": {
       "enabled": true,
       "parameters": {}
     }
   }
   ```

### Testing

```bash
# Run individual module tests
python -m modules.image_generator
python -m modules.video_generator

# Test API endpoints
python -m pytest tests/
```

### Performance Optimization

- **Memory Management**: Use lazy loading for AI models
- **GPU Optimization**: Monitor and optimize GPU memory usage
- **Caching**: Implement result caching for repeated requests
- **Async Processing**: Use async/await for I/O operations

## Troubleshooting

### Common Issues

**1. CUDA Out of Memory**
```bash
# Solution: Reduce batch size or model precision
# Update config.json:
{
  "models": {
    "flux": {
      "precision": "fp16",
      "max_memory": "6GB"
    }
  }
}
```

**2. Model Loading Errors**
```bash
# Check model paths in configuration
# Verify model files exist and are accessible
# Check GPU compatibility
```

**3. API Connection Issues**
```bash
# Check if service is running
curl http://localhost:8000/health

# Verify port configuration
# Check firewall settings
```

**4. Import Errors**
```bash
# Install missing dependencies
pip install -r requirements.txt

# Check Python path configuration
# Verify DiffSynth-Studio installation
```

### Logging

Logs are available in:
- Console output (development)
- `/root/autodl-tmp/easy2create/logs/` (production)
- Individual module logs

### Performance Monitoring

```python
# Check GPU memory usage
from modules.utils import get_gpu_memory
print(get_gpu_memory())

# Monitor system resources
from modules.utils import get_system_info
print(get_system_info())
```

---

**Note**: This AI Service is designed to work in conjunction with the EasyVideo frontend and backend components. For complete system setup, refer to the main project README.