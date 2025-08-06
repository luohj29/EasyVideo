import os
import sys
import torch
from PIL import Image
from datetime import datetime
import numpy as np

# 添加DiffSynth-Studio到路径
sys.path.append('/root/autodl-tmp/DiffSynth-Studio')

try:
    from diffsynth.pipelines.flux_image_new import FluxImagePipeline, ModelConfig
    from diffsynth import save_video
except ImportError as e:
    print(f"Warning: DiffSynth import failed: {e}")
    FluxImagePipeline = None
    ModelConfig = None

from .utils import log_operation, generate_unique_filename, optimize_gpu_memory

class ImageGenerator:
    """图像生成器，使用FLUX模型"""
    
    def __init__(self):
        self.model_path = "/root/autodl-tmp/black-forest-labs/FLUX.1-Krea-dev"
        self.kontext_model_path = "/root/autodl-tmp/black-forest-labs/FLUX.1-Kontext-dev"
        self.pipeline = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.output_dir = "/root/autodl-tmp/easy2create/outputs/images"
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
    
    def _load_pipeline(self, use_kontext=False):
        """加载FLUX图像生成管道"""
        if self.pipeline is None and FluxImagePipeline is not None:
            try:
                log_operation("模型加载", "开始加载FLUX图像生成模型")
                
                if use_kontext and os.path.exists(self.kontext_model_path):
                    # 使用Kontext版本进行图像编辑
                    model_configs = [
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Kontext-dev", 
                                  origin_file_pattern="flux1-kontext-dev.safetensors", 
                                  offload_device="cpu"),
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Krea-dev", 
                                  origin_file_pattern="text_encoder/model.safetensors", 
                                  offload_device="cpu"),
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Krea-dev", 
                                  origin_file_pattern="text_encoder_2/", 
                                  offload_device="cpu"),
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Krea-dev", 
                                  origin_file_pattern="ae.safetensors", 
                                  offload_device="cpu"),
                    ]
                else:
                    # 使用标准版本
                    model_configs = [
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Krea-dev", 
                                  origin_file_pattern="flux1-dev.safetensors", 
                                  offload_device="cpu"),
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Krea-dev", 
                                  origin_file_pattern="text_encoder/model.safetensors", 
                                  offload_device="cpu"),
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Krea-dev", 
                                  origin_file_pattern="text_encoder_2/", 
                                  offload_device="cpu"),
                        ModelConfig(model_id="black-forest-labs/FLUX.1-Krea-dev", 
                                  origin_file_pattern="ae.safetensors", 
                                  offload_device="cpu"),
                    ]
                
                self.pipeline = FluxImagePipeline.from_pretrained(
                    torch_dtype=torch.bfloat16,
                    device=self.device,
                    model_configs=model_configs
                )
                
                # 启用显存管理
                self.pipeline.enable_vram_management(vram_limit=30)  # 限制30GB显存
                
                log_operation("模型加载", "FLUX图像生成模型加载成功")
                return True
                
            except Exception as e:
                log_operation("模型加载", f"FLUX模型加载失败: {str(e)}")
                return False
        
        return self.pipeline is not None
    
    def generate_images(self, prompt, negative_prompt="", width=1024, height=1024, 
                       seed=42, num_images=1, project_id=None, filename=None):
        """生成图像"""
        if not self._load_pipeline():
            log_operation("图像生成", "模型加载失败，无法生成图像")
            return []
        
        try:
            # 优化GPU内存
            optimize_gpu_memory()
            
            generated_images = []
            
            for i in range(num_images):
                current_seed = seed + i
                torch.manual_seed(current_seed)
                
                log_operation("图像生成", f"开始生成图像 {i+1}/{num_images}")
                
                # 生成图像
                image = self.pipeline(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    height=height,
                    width=width,
                    num_inference_steps=30,
                    guidance_scale=7.5,
                    seed=current_seed
                )
                
                # 保存图像
                if filename:
                    base_name = filename.split('.')[0]
                    if num_images > 1:
                        save_filename = f"{base_name}_{i+1}.jpg"
                    else:
                        save_filename = filename
                else:
                    base_name = f"generated_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    if num_images > 1:
                        save_filename = f"{base_name}_{i+1}.jpg"
                    else:
                        save_filename = f"{base_name}.jpg"
                
                # 确定保存路径
                if project_id:
                    project_output_dir = f"/root/autodl-tmp/easy2create/projects/{project_id}/images"
                    os.makedirs(project_output_dir, exist_ok=True)
                    save_path = os.path.join(project_output_dir, save_filename)
                else:
                    save_path = os.path.join(self.output_dir, save_filename)
                
                # 保存图像
                image.save(save_path, quality=95)
                generated_images.append(save_path)
                
                log_operation("图像生成", f"图像已保存: {save_path}")
            
            # 清理GPU内存
            optimize_gpu_memory()
            
            return generated_images
            
        except Exception as e:
            log_operation("图像生成", f"图像生成失败: {str(e)}")
            return []
    
    def edit_image(self, input_image, edit_prompt, project_id=None, filename=None):
        """编辑图像"""
        if not self._load_pipeline(use_kontext=True):
            log_operation("图像编辑", "Kontext模型加载失败，无法编辑图像")
            return None
        
        try:
            # 优化GPU内存
            optimize_gpu_memory()
            
            log_operation("图像编辑", f"开始编辑图像: {edit_prompt}")
            
            # 确保输入图像是PIL Image对象
            if isinstance(input_image, str):
                input_image = Image.open(input_image)
            
            # 调整图像尺寸
            input_image = input_image.resize((1024, 1024))
            
            # 编辑图像
            edited_image = self.pipeline(
                prompt=edit_prompt,
                kontext_images=input_image,
                embedded_guidance=2.5,
                num_inference_steps=30,
                seed=42
            )
            
            # 保存编辑后的图像
            if filename:
                save_filename = filename
            else:
                save_filename = f"edited_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            
            # 确定保存路径
            if project_id:
                project_output_dir = f"/root/autodl-tmp/easy2create/projects/{project_id}/images"
                os.makedirs(project_output_dir, exist_ok=True)
                save_path = os.path.join(project_output_dir, save_filename)
            else:
                save_path = os.path.join(self.output_dir, save_filename)
            
            # 保存图像
            edited_image.save(save_path, quality=95)
            
            log_operation("图像编辑", f"编辑后图像已保存: {save_path}")
            
            # 清理GPU内存
            optimize_gpu_memory()
            
            return save_path
            
        except Exception as e:
            log_operation("图像编辑", f"图像编辑失败: {str(e)}")
            return None
    
    def generate_image_variations(self, input_image, num_variations=3, variation_strength=0.7, project_id=None):
        """生成图像变体"""
        if not self._load_pipeline():
            return []
        
        try:
            # 确保输入图像是PIL Image对象
            if isinstance(input_image, str):
                input_image = Image.open(input_image)
            
            variations = []
            
            for i in range(num_variations):
                # 生成变体提示词
                variation_prompts = [
                    "artistic variation with different lighting",
                    "same subject with different style",
                    "alternative composition and colors",
                    "different mood and atmosphere",
                    "creative reinterpretation"
                ]
                
                prompt = variation_prompts[i % len(variation_prompts)]
                
                edited_image = self.edit_image(
                    input_image, 
                    prompt, 
                    project_id, 
                    f"variation_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                )
                
                if edited_image:
                    variations.append(edited_image)
            
            return variations
            
        except Exception as e:
            log_operation("图像变体", f"生成图像变体失败: {str(e)}")
            return []
    
    def upscale_image(self, input_image, scale_factor=2, project_id=None):
        """图像超分辨率（简单实现）"""
        try:
            # 确保输入图像是PIL Image对象
            if isinstance(input_image, str):
                input_image = Image.open(input_image)
            
            # 获取原始尺寸
            original_width, original_height = input_image.size
            
            # 计算新尺寸
            new_width = int(original_width * scale_factor)
            new_height = int(original_height * scale_factor)
            
            # 使用高质量重采样
            upscaled_image = input_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # 保存放大后的图像
            save_filename = f"upscaled_{scale_factor}x_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            
            if project_id:
                project_output_dir = f"/root/autodl-tmp/easy2create/projects/{project_id}/images"
                os.makedirs(project_output_dir, exist_ok=True)
                save_path = os.path.join(project_output_dir, save_filename)
            else:
                save_path = os.path.join(self.output_dir, save_filename)
            
            upscaled_image.save(save_path, quality=95)
            
            log_operation("图像放大", f"图像已放大{scale_factor}倍: {save_path}")
            
            return save_path
            
        except Exception as e:
            log_operation("图像放大", f"图像放大失败: {str(e)}")
            return None
    
    def batch_generate_images(self, prompts_list, **kwargs):
        """批量生成图像"""
        all_generated_images = []
        
        for i, prompt in enumerate(prompts_list):
            log_operation("批量生成", f"生成第 {i+1}/{len(prompts_list)} 张图像")
            
            images = self.generate_images(
                prompt=prompt,
                filename=f"batch_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg",
                **kwargs
            )
            
            all_generated_images.extend(images)
            
            # 每生成几张图像后清理一次内存
            if (i + 1) % 3 == 0:
                optimize_gpu_memory()
        
        return all_generated_images
    
    def get_image_info(self, image_path):
        """获取图像信息"""
        try:
            if not os.path.exists(image_path):
                return None
            
            image = Image.open(image_path)
            file_size = os.path.getsize(image_path)
            
            return {
                'path': image_path,
                'size': image.size,
                'mode': image.mode,
                'format': image.format,
                'file_size': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            log_operation("图像信息", f"获取图像信息失败: {str(e)}")
            return None
    
    def cleanup_pipeline(self):
        """清理管道内存"""
        if self.pipeline is not None:
            del self.pipeline
            self.pipeline = None
        
        optimize_gpu_memory()
        log_operation("模型清理", "FLUX图像生成模型内存已清理")
    
    def estimate_generation_time(self, num_images, width, height):
        """估算生成时间"""
        # 基础时间（秒）
        base_time_per_image = 30
        
        # 根据分辨率调整
        resolution_factor = (width * height) / (1024 * 1024)
        adjusted_time = base_time_per_image * resolution_factor
        
        # 总时间
        total_time = adjusted_time * num_images
        
        return int(total_time)