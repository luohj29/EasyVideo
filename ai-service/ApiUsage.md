# EasyVideo AI服务 API使用说明

## 项目概述

EasyVideo AI服务是一个基于FastAPI的人工智能服务接口，提供以下核心功能：
- **Prompt优化**：使用Qwen2.5-VL模型优化用户输入的提示词
- **图像生成**：基于FLUX模型的文生图功能
- **视频生成**：基于Wan-I2V模型的图生视频功能
- **故事板生成**：智能生成剧本和故事板

## 服务启动

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python api_server.py
```

默认服务地址：`http://localhost:8000`

## API接口详细说明

### 1. 基础接口

#### 1.1 健康检查
- **接口**: `GET /health`
- **描述**: 检查服务状态
- **响应示例**:
```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00"
}
```

#### 1.2 服务信息
- **接口**: `GET /`
- **描述**: 获取服务基本信息
- **响应示例**:
```json
{
    "service": "EasyVideo AI Service",
    "version": "1.0.0",
    "status": "running"
}
```

### 2. Prompt优化接口

#### 2.1 优化Prompt
- **接口**: `POST /prompt/optimize`
- **描述**: 使用Qwen2.5-VL模型优化用户输入的提示词
- **请求参数**:
```json
{
    "prompt": "一只可爱的小猫",
    "type": "通用型",
    "style_preferences": ["写实风格", "高清"]
}
```

- **参数说明**:
  - `prompt` (必填): 原始提示词
  - `type` (可选): 优化类型，默认"通用型"
  - `style_preferences` (可选): 风格偏好列表

- **响应示例**:
```json
{
    "optimized_prompt": "一只毛茸茸的橘色小猫，坐在阳光明媚的窗台上，眼神清澈明亮，毛发细节丰富，写实风格，高清画质，专业摄影",
    "original_prompt": "一只可爱的小猫",
    "optimization_type": "通用型"
}
```

### 3. 图像生成接口

#### 3.1 生成图像
- **接口**: `POST /image/generate`
- **描述**: 基于FLUX模型生成图像
- **请求参数**:
```json
{
    "prompt": "一只可爱的小猫坐在花园里",
    "negative_prompt": "模糊，低质量，变形",
    "width": 1024,
    "height": 1024,
    "seed": 42,
    "num_images": 1,
    "output_dir": "/path/to/output",
    "task_id": "img_task_001"
}
```

- **参数说明**:
  - `prompt` (必填): 图像描述提示词
  - `negative_prompt` (可选): 负面提示词
  - `width` (可选): 图像宽度，默认1024
  - `height` (可选): 图像高度，默认1024
  - `seed` (可选): 随机种子
  - `num_images` (可选): 生成图像数量，默认1
  - `output_dir` (必填): 输出目录
  - `task_id` (必填): 任务ID

- **响应示例**:
```json
{
    "images": ["/path/to/output/generated_image_001.png"],
    "task_id": "img_task_001"
}
```

### 4. 视频生成接口

#### 4.1 图生视频
- **接口**: `POST /video/generate`
- **描述**: 基于输入图像生成视频
- **请求参数**:
```json
{
    "image_path": "/path/to/input/image.jpg",
    "prompt": "小猫在花园里玩耍",
    "negative_prompt": "静止，模糊，低质量",
    "fps": 15,
    "duration": 4,
    "seed": 42,
    "tiled": true,
    "num_inference_steps": 20,
    "cfg_scale": 7.5,
    "motion_strength": 0.5,
    "output_dir": "/path/to/output",
    "task_id": "video_task_001"
}
```

- **参数说明**:
  - `image_path` (必填): 输入图像路径
  - `prompt` (可选): 视频描述提示词
  - `negative_prompt` (可选): 负面提示词
  - `fps` (可选): 帧率，默认15
  - `duration` (可选): 视频时长（秒），默认4
  - `seed` (可选): 随机种子
  - `tiled` (可选): 是否使用平铺模式，默认true
  - `num_inference_steps` (可选): 推理步数，默认20
  - `cfg_scale` (可选): CFG缩放，默认7.5
  - `motion_strength` (可选): 运动强度，默认0.5
  - `output_dir` (必填): 输出目录
  - `task_id` (必填): 任务ID

- **响应示例**:
```json
{
    "video_path": "/path/to/output/generated_video.mp4",
    "task_id": "video_task_001"
}
```

### 5. 任务进度查询接口

#### 5.1 获取任务进度
- **接口**: `GET /task/progress/{task_id}`
- **描述**: 查询指定任务的当前进度
- **响应示例**:
```json
{
    "task_id": "video_task_001",
    "progress": 75,
    "status": "processing",
    "message": "正在生成视频..."
}
```

#### 5.2 流式获取任务进度
- **接口**: `GET /task/progress/{task_id}/stream`
- **描述**: 通过Server-Sent Events流式获取任务进度更新
- **响应格式**: SSE流
```
data: {"progress": 25, "status": "processing", "message": "初始化模型..."}

data: {"progress": 50, "status": "processing", "message": "生成中..."}

data: {"progress": 100, "status": "completed", "message": "生成完成"}
```

### 6. 故事板生成接口

#### 6.1 生成故事板
- **接口**: `POST /storyboard/generate`
- **描述**: 根据故事描述生成故事板
- **请求参数**:
```json
{
    "story_description": "一个关于小猫冒险的故事",
    "num_scenes": 5,
    "style": "现代风格"
}
```

- **参数说明**:
  - `story_description` (必填): 故事描述
  - `num_scenes` (可选): 场景数量，默认5
  - `style` (可选): 风格类型，默认"现代风格"

- **响应示例**:
```json
{
    "scenes": [
        {
            "scene_number": 1,
            "description": "小猫在家中准备出发冒险",
            "prompt": "一只橘色小猫站在门口，背着小背包，阳光透过窗户洒进来",
            "duration": 10,
            "transition_type": "淡入"
        }
    ]
}
```

## 错误处理

所有API接口在发生错误时会返回标准的HTTP错误状态码和错误信息：

```json
{
    "detail": "错误描述信息"
}
```

常见错误码：
- `400`: 请求参数错误
- `404`: 资源未找到
- `500`: 服务器内部错误

## 使用示例

### Python客户端示例

```python
import requests
import json

# 服务地址
base_url = "http://localhost:8000"

# 1. 优化Prompt
def optimize_prompt(prompt):
    url = f"{base_url}/prompt/optimize"
    data = {
        "prompt": prompt,
        "type": "通用型",
        "style_preferences": ["写实风格", "高清"]
    }
    response = requests.post(url, json=data)
    return response.json()

# 2. 生成图像
def generate_image(prompt, output_dir, task_id):
    url = f"{base_url}/image/generate"
    data = {
        "prompt": prompt,
        "width": 1024,
        "height": 1024,
        "num_images": 1,
        "output_dir": output_dir,
        "task_id": task_id
    }
    response = requests.post(url, json=data)
    return response.json()

# 3. 查询任务进度
def get_task_progress(task_id):
    url = f"{base_url}/task/progress/{task_id}"
    response = requests.get(url)
    return response.json()

# 使用示例
if __name__ == "__main__":
    # 优化提示词
    optimized = optimize_prompt("一只可爱的小猫")
    print("优化后的提示词:", optimized["optimized_prompt"])
    
    # 生成图像
    result = generate_image(
        prompt=optimized["optimized_prompt"],
        output_dir="./outputs",
        task_id="test_task_001"
    )
    print("生成结果:", result)
    
    # 查询进度
    progress = get_task_progress("test_task_001")
    print("任务进度:", progress)
```

### JavaScript客户端示例

```javascript
// 基础配置
const baseUrl = 'http://localhost:8000';

// 优化Prompt
async function optimizePrompt(prompt) {
    const response = await fetch(`${baseUrl}/prompt/optimize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            type: '通用型',
            style_preferences: ['写实风格', '高清']
        })
    });
    return await response.json();
}

// 生成图像
async function generateImage(prompt, outputDir, taskId) {
    const response = await fetch(`${baseUrl}/image/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            width: 1024,
            height: 1024,
            num_images: 1,
            output_dir: outputDir,
            task_id: taskId
        })
    });
    return await response.json();
}

// 流式获取任务进度
function streamTaskProgress(taskId, onProgress) {
    const eventSource = new EventSource(`${baseUrl}/task/progress/${taskId}/stream`);
    
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        onProgress(data);
        
        if (data.status === 'completed' || data.status === 'failed') {
            eventSource.close();
        }
    };
    
    return eventSource;
}

// 使用示例
async function example() {
    try {
        // 优化提示词
        const optimized = await optimizePrompt('一只可爱的小猫');
        console.log('优化后的提示词:', optimized.optimized_prompt);
        
        // 生成图像
        const result = await generateImage(
            optimized.optimized_prompt,
            './outputs',
            'test_task_001'
        );
        console.log('生成结果:', result);
        
        // 监听进度
        streamTaskProgress('test_task_001', (progress) => {
            console.log('任务进度:', progress);
        });
        
    } catch (error) {
        console.error('错误:', error);
    }
}
```

## 注意事项

1. **模型加载**: 所有AI模型采用延迟加载策略，首次调用时会加载模型，可能需要较长时间
2. **内存管理**: 服务会自动清理GPU内存和任务进度记录，避免内存泄漏
3. **并发限制**: 建议控制并发请求数量，避免GPU内存不足
4. **文件路径**: 确保输出目录存在且有写入权限
5. **任务ID**: 每个任务需要唯一的task_id，用于进度跟踪

## 依赖要求

- Python 3.8+
- FastAPI
- PyTorch
- Transformers
- DiffSynth-Studio
- 其他依赖见requirements.txt

## 配置文件

服务支持通过配置文件自定义模型路径和参数，配置文件位置：`../config/config.json`

```json
{
    "models": {
        "qwen": {
            "enabled": true,
            "path": "/path/to/qwen/model"
        },
        "flux_kontext": {
            "enabled": true,
            "path": "/path/to/flux/model"
        },
        "wan_i2v": {
            "enabled": true,
            "path": "/path/to/wan/model"
        }
    },
    "paths": {
        "output_dir": "./outputs"
    }
}
```