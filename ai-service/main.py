from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import sys
import asyncio
import uvicorn
from pathlib import Path

# 添加DiffSynth-Studio路径到Python路径（必须在其他导入之前）
sys.path.append('/root/autodl-tmp/DiffSynth-Studio')

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# 导入配置管理器
from config.config_manager import config_manager

# 导入原有模块
from modules.prompt_optimizer import PromptOptimizer
from modules.image_generator import ImageGenerator
from modules.image_editor import ImageEditor
from modules.video_generator import VideoGenerator
from modules.project_manager import ProjectManager
from modules.storyboard_generator import StoryboardGenerator

app = FastAPI(
    title="EasyVideo AI Service",
    description="AI视频制作服务API",
    version="2.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局变量存储服务实例
services = {
    "prompt_optimizer": None,
    "image_generator": None,
    "image_editor": None,
    "video_generator": None,
    "project_manager": None,
    "storyboard_generator": None
}

# 按需加载模型的辅助函数
def ensure_service_loaded(service_name: str):
    """确保指定服务已加载"""
    if services[service_name] is not None:
        return services[service_name]
    
    try:
        if service_name == "prompt_optimizer":
            if not config_manager.is_model_enabled("qwen"):
                raise HTTPException(status_code=503, detail="Qwen模型未启用")
            print(f"按需加载 {service_name} 服务...")
            services[service_name] = PromptOptimizer()
            
        elif service_name == "image_generator":
            if not config_manager.is_model_enabled("flux"):
                raise HTTPException(status_code=503, detail="FLUX模型未启用")
            print(f"按需加载 {service_name} 服务...")
            services[service_name] = ImageGenerator()
            
        elif service_name == "image_editor":
            if not config_manager.is_model_enabled("flux"):
                raise HTTPException(status_code=503, detail="FLUX模型未启用")
            print(f"按需加载 {service_name} 服务...")
            services[service_name] = ImageEditor()
            
        elif service_name == "video_generator":
            if not config_manager.is_model_enabled("wan_i2v"):
                raise HTTPException(status_code=503, detail="Wan I2V模型未启用")
            print(f"按需加载 {service_name} 服务...")
            services[service_name] = VideoGenerator()
            
        else:
            raise ValueError(f"未知服务: {service_name}")
            
        print(f"{service_name} 服务加载完成")
        return services[service_name]
        
    except Exception as e:
        print(f"加载 {service_name} 服务失败: {e}")
        raise HTTPException(status_code=500, detail=f"服务加载失败: {str(e)}")

# Pydantic模型定义
class PromptOptimizeRequest(BaseModel):
    prompt: str
    optimize_type: str = "通用型"
    enhance_details: bool = True

class ImageGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    width: int = 1024
    height: int = 1024
    num_images: int = 1
    steps: int = 30
    guidance_scale: float = 7.5
    seed: Optional[int] = None

class ImageEditRequest(BaseModel):
    image_path: str
    prompt: str
    guidance_scale: float = 2.5
    seed: Optional[int] = None

class VideoGenerateRequest(BaseModel):
    prompt: Optional[str] = None
    image_path: Optional[str] = None
    fps: int = 15
    duration: int = 4
    steps: int = 50
    seed: Optional[int] = None

class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: str = "video"

class StoryboardRequest(BaseModel):
    script: str
    scene_count: int = 6
    style: str = "电影级"

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化服务"""
    try:
        # 只初始化不需要模型的服务
        services["project_manager"] = ProjectManager()
        services["storyboard_generator"] = StoryboardGenerator()
        
        print("AI服务初始化完成")
    except Exception as e:
        print(f"AI服务初始化失败: {e}")

@app.get("/")
async def root():
    """根路径"""
    return {"message": "EasyVideo AI Service", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    """健康检查"""
    import torch
    
    # GPU状态检查
    gpu_info = {
        "available": torch.cuda.is_available(),
        "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "current_device": torch.cuda.current_device() if torch.cuda.is_available() else None,
        "memory_info": {}
    }
    
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            memory_allocated = torch.cuda.memory_allocated(i) / 1024**3  # GB
            memory_reserved = torch.cuda.memory_reserved(i) / 1024**3   # GB
            memory_total = torch.cuda.get_device_properties(i).total_memory / 1024**3  # GB
            gpu_info["memory_info"][f"gpu_{i}"] = {
                "name": torch.cuda.get_device_name(i),
                "allocated_gb": round(memory_allocated, 2),
                "reserved_gb": round(memory_reserved, 2),
                "total_gb": round(memory_total, 2),
                "free_gb": round(memory_total - memory_reserved, 2)
            }
    
    # 检查模型加载状态
    models_status = {
        "qwen": False,
        "flux": False,
        "wan_i2v": False
    }
    
    # 检查Qwen模型（prompt优化）
    if services.get("prompt_optimizer") and hasattr(services["prompt_optimizer"], 'model_loaded'):
        models_status["qwen"] = services["prompt_optimizer"].model_loaded
    
    # 检查FLUX模型（文生图）
    if services.get("image_generator") and hasattr(services["image_generator"], 'model_loaded'):
        models_status["flux"] = services["image_generator"].model_loaded
    
    # 检查Wan I2V模型（图生视频）
    if services.get("video_generator") and hasattr(services["video_generator"], 'model_loaded'):
        models_status["wan_i2v"] = services["video_generator"].model_loaded
    
    status = {
        "status": "healthy",
        "services": {},
        "models": models_status,
        "config": config_manager.validate_paths(),
        "gpu": gpu_info
    }
    
    for service_name, service in services.items():
        status["services"][service_name] = service is not None
    
    return status

@app.get("/config")
async def get_config():
    """获取配置信息"""
    return config_manager.get_all_config()

@app.post("/config")
async def update_config(config_data: Dict[str, Any]):
    """更新配置"""
    try:
        for key, value in config_data.items():
            config_manager.set(key, value)
        
        if config_manager.save_config():
            return {"message": "配置更新成功"}
        else:
            raise HTTPException(status_code=500, detail="配置保存失败")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"配置更新失败: {str(e)}")

@app.post("/prompt/optimize")
async def optimize_prompt(request: PromptOptimizeRequest):
    """优化提示词"""
    try:
        # 按需加载服务
        optimizer = ensure_service_loaded("prompt_optimizer")
        
        result = await optimizer.optimize(
            request.prompt,
            request.optimize_type
        )
        return {"optimized_prompt": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt优化失败: {str(e)}")

@app.post("/image/generate")
async def generate_image(request: ImageGenerateRequest):
    """生成图像"""
    try:
        # 按需加载服务
        generator = ensure_service_loaded("image_generator")
        
        # 设置输出目录
        output_dir = config_manager.get("paths.output_dir", "/root/autodl-tmp/EasyVideo/outputs") + "/images"
        os.makedirs(output_dir, exist_ok=True)
        
        result = await generator.generate(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt or "",
            width=request.width,
            height=request.height,
            seed=request.seed,
            num_images=request.num_images,
            output_dir=output_dir,
            task_id="api_request"
        )
        return {"images": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图像生成失败: {str(e)}")

@app.post("/image/edit")
async def edit_image(request: ImageEditRequest):
    """编辑图像"""
    try:
        # 按需加载服务
        editor = ensure_service_loaded("image_editor")
        
        # 设置输出目录
        output_dir = config_manager.get("paths.output_dir", "/root/autodl-tmp/EasyVideo/outputs") + "/images"
        os.makedirs(output_dir, exist_ok=True)
        
        result = await editor.edit(
            image_path=request.image_path,
            prompt=request.prompt,
            guidance_scale=request.guidance_scale,
            seed=request.seed,
            output_dir=output_dir,
            task_id="api_request"
        )
        return {"image": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图像编辑失败: {str(e)}")

@app.post("/video/generate")
async def generate_video(request: VideoGenerateRequest):
    """生成视频"""
    try:
        # 按需加载服务
        generator = ensure_service_loaded("video_generator")
        
        if request.image_path:
            # 图生视频
            result = await generator.generate_from_image(
                image_path=request.image_path,
                prompt=request.prompt or "",
                duration=float(request.duration),
                fps=request.fps,
                motion_strength=0.5,
                output_dir="",
                task_id="api_request"
            )
        else:
            # 文生视频
            if not request.prompt:
                raise HTTPException(status_code=400, detail="文生视频需要提供prompt")
            result = await generator.generate_from_text(
                prompt=request.prompt,
                duration=float(request.duration),
                fps=request.fps,
                output_dir="",
                task_id="api_request"
            )
        
        return {"video_path": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"视频生成失败: {str(e)}")

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """上传图像文件"""
    try:
        # 检查文件类型
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="只支持图像文件")
        
        # 保存文件
        img_dir = Path(config_manager.get("paths.img_dir", "./img"))
        img_dir.mkdir(exist_ok=True)
        
        file_path = img_dir / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {"file_path": str(file_path), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

@app.post("/project/create")
async def create_project(request: ProjectCreateRequest):
    """创建项目"""
    try:
        project_id = services["project_manager"].create_project(
            request.name,
            request.description,
            request.project_type
        )
        return {"project_id": project_id, "message": "项目创建成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"项目创建失败: {str(e)}")

@app.get("/project/list")
async def list_projects():
    """获取项目列表"""
    try:
        projects = services["project_manager"].list_projects()
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取项目列表失败: {str(e)}")

@app.post("/storyboard/generate")
async def generate_storyboard(request: StoryboardRequest):
    """生成分镜脚本"""
    try:
        # 首先生成剧本
        script_result = await services["storyboard_generator"].generate_script(
            theme=request.script,
            duration=60,
            style=request.style
        )
        
        # 然后基于剧本生成分镜
        if script_result.get("success"):
            script_data = script_result.get("script", {})
            storyboard_result = await services["storyboard_generator"].generate_storyboard(
                script=script_data,
                visual_style=request.style
            )
        else:
            raise Exception(f"剧本生成失败: {script_result.get('error', '未知错误')}")
        
        return {
            "script": script_result,
            "storyboard": storyboard_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分镜生成失败: {str(e)}")

if __name__ == "__main__":
    port = config_manager.get("system.api_port", 8000)
    uvicorn.run(app, host="0.0.0.0", port=port)