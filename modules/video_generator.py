import os
import sys
import torch
from PIL import Image
from datetime import datetime
import cv2
import numpy as np

# 添加DiffSynth-Studio到路径
sys.path.append('/root/autodl-tmp/DiffSynth-Studio')

try:
    from diffsynth.pipelines.wan_video_new import WanVideoPipeline, ModelConfig
    from diffsynth import save_video
except ImportError as e:
    print(f"Warning: DiffSynth import failed: {e}")
    WanVideoPipeline = None
    ModelConfig = None
    save_video = None

from .utils import log_operation, generate_unique_filename, optimize_gpu_memory

class VideoGenerator:
    """视频生成器，使用Wan2.2模型"""
    
    def __init__(self):
        self.t2v_model_path = "/root/autodl-tmp/Wan-AI/Wan2.2-T2V-A14B"
        self.i2v_model_path = "/root/autodl-tmp/Wan-AI/Wan2.2-I2V-A14B"
        self.ti2v_model_path = "/root/autodl-tmp/Wan-AI/Wan2.2-TI2V-5B"
        self.t2v_pipeline = None
        self.i2v_pipeline = None
        self.ti2v_pipeline = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.output_dir = "/root/autodl-tmp/easy2create/outputs/videos"
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
    
    def _load_t2v_pipeline(self):
        """加载文本到视频生成管道"""
        if self.t2v_pipeline is None and WanVideoPipeline is not None:
            try:
                log_operation("模型加载", "开始加载Wan2.2-T2V-A14B模型")
                
                model_configs = [
                    ModelConfig(model_id="Wan-AI/Wan2.2-T2V-A14B", 
                              origin_file_pattern="high_noise_model/diffusion_pytorch_model*.safetensors", 
                              offload_device="cpu"),
                    ModelConfig(model_id="Wan-AI/Wan2.2-T2V-A14B", 
                              origin_file_pattern="low_noise_model/diffusion_pytorch_model*.safetensors", 
                              offload_device="cpu"),
                    ModelConfig(model_id="Wan-AI/Wan2.2-T2V-A14B", 
                              origin_file_pattern="models_t5_umt5-xxl-enc-bf16.pth", 
                              offload_device="cpu"),
                    ModelConfig(model_id="Wan-AI/Wan2.2-T2V-A14B", 
                              origin_file_pattern="Wan2.1_VAE.pth", 
                              offload_device="cpu"),
                ]
                
                self.t2v_pipeline = WanVideoPipeline.from_pretrained(
                    torch_dtype=torch.bfloat16,
                    device=self.device,
                    model_configs=model_configs
                )
                
                # 启用显存管理
                self.t2v_pipeline.enable_vram_management(vram_limit=30)
                
                log_operation("模型加载", "Wan2.2-T2V-A14B模型加载成功")
                return True
                
            except Exception as e:
                log_operation("模型加载", f"Wan2.2-T2V-A14B模型加载失败: {str(e)}")
                return False
        
        return self.t2v_pipeline is not None
    
    def _load_i2v_pipeline(self):
        """加载图像到视频生成管道"""
        if self.i2v_pipeline is None and WanVideoPipeline is not None:
            try:
                log_operation("模型加载", "开始加载Wan2.2-I2V-A14B模型")
                
                model_configs = [
                    ModelConfig(model_id="Wan-AI/Wan2.2-I2V-A14B", 
                              origin_file_pattern="high_noise_model/diffusion_pytorch_model*.safetensors", 
                              offload_device="cpu"),
                    ModelConfig(model_id="Wan-AI/Wan2.2-I2V-A14B", 
                              origin_file_pattern="low_noise_model/diffusion_pytorch_model*.safetensors", 
                              offload_device="cpu"),
                    ModelConfig(model_id="Wan-AI/Wan2.2-I2V-A14B", 
                              origin_file_pattern="models_t5_umt5-xxl-enc-bf16.pth", 
                              offload_device="cpu"),
                    ModelConfig(model_id="Wan-AI/Wan2.2-I2V-A14B", 
                              origin_file_pattern="Wan2.1_VAE.pth", 
                              offload_device="cpu"),
                ]
                
                self.i2v_pipeline = WanVideoPipeline.from_pretrained(
                    torch_dtype=torch.bfloat16,
                    device=self.device,
                    model_configs=model_configs
                )
                
                # 启用显存管理
                self.i2v_pipeline.enable_vram_management(vram_limit=30)
                
                log_operation("模型加载", "Wan2.2-I2V-A14B模型加载成功")
                return True
                
            except Exception as e:
                log_operation("模型加载", f"Wan2.2-I2V-A14B模型加载失败: {str(e)}")
                return False
        
        return self.i2v_pipeline is not None
    
    def generate_text_to_video(self, prompt, negative_prompt="", fps=15, duration=4, 
                              seed=42, project_id=None, filename=None):
        """文本到视频生成"""
        if not self._load_t2v_pipeline():
            log_operation("视频生成", "T2V模型加载失败，无法生成视频")
            return None
        
        try:
            # 优化GPU内存
            optimize_gpu_memory()
            
            log_operation("视频生成", f"开始文本到视频生成: {prompt}")
            
            # 设置随机种子
            torch.manual_seed(seed)
            
            # 默认负面提示词
            if not negative_prompt:
                negative_prompt = "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走"
            
            # 生成视频
            video = self.t2v_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                seed=seed,
                tiled=True,
                num_inference_steps=50,
                guidance_scale=7.5
            )
            
            # 保存视频
            if filename:
                save_filename = filename
            else:
                save_filename = f"t2v_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            
            # 确定保存路径
            if project_id:
                project_output_dir = f"/root/autodl-tmp/easy2create/projects/{project_id}/videos"
                os.makedirs(project_output_dir, exist_ok=True)
                save_path = os.path.join(project_output_dir, save_filename)
            else:
                save_path = os.path.join(self.output_dir, save_filename)
            
            # 保存视频
            if save_video:
                save_video(video, save_path, fps=fps, quality=5)
            else:
                # 备用保存方法
                self._save_video_opencv(video, save_path, fps)
            
            log_operation("视频生成", f"文本到视频生成完成: {save_path}")
            
            # 清理GPU内存
            optimize_gpu_memory()
            
            return save_path
            
        except Exception as e:
            log_operation("视频生成", f"文本到视频生成失败: {str(e)}")
            return None
    
    def generate_image_to_video(self, image, prompt, negative_prompt="", fps=15, 
                               duration=4, seed=42, project_id=None, filename=None):
        """图像到视频生成"""
        if not self._load_i2v_pipeline():
            log_operation("视频生成", "I2V模型加载失败，无法生成视频")
            return None
        
        try:
            # 优化GPU内存
            optimize_gpu_memory()
            
            log_operation("视频生成", f"开始图像到视频生成: {prompt}")
            
            # 确保输入图像是PIL Image对象
            if isinstance(image, str):
                input_image = Image.open(image)
            else:
                input_image = image
            
            # 调整图像尺寸
            input_image = input_image.resize((832, 480))
            
            # 设置随机种子
            torch.manual_seed(seed)
            
            # 默认负面提示词
            if not negative_prompt:
                negative_prompt = "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走"
            
            # 生成视频
            video = self.i2v_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                seed=seed,
                tiled=True,
                input_image=input_image,
                num_inference_steps=50,
                guidance_scale=7.5
            )
            
            # 保存视频
            if filename:
                save_filename = filename
            else:
                save_filename = f"i2v_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            
            # 确定保存路径
            if project_id:
                project_output_dir = f"/root/autodl-tmp/easy2create/projects/{project_id}/videos"
                os.makedirs(project_output_dir, exist_ok=True)
                save_path = os.path.join(project_output_dir, save_filename)
            else:
                save_path = os.path.join(self.output_dir, save_filename)
            
            # 保存视频
            if save_video:
                save_video(video, save_path, fps=fps, quality=5)
            else:
                # 备用保存方法
                self._save_video_opencv(video, save_path, fps)
            
            log_operation("视频生成", f"图像到视频生成完成: {save_path}")
            
            # 清理GPU内存
            optimize_gpu_memory()
            
            return save_path
            
        except Exception as e:
            log_operation("视频生成", f"图像到视频生成失败: {str(e)}")
            return None
    
    def _save_video_opencv(self, video_tensor, output_path, fps=15):
        """使用OpenCV保存视频（备用方法）"""
        try:
            # 转换tensor到numpy数组
            if torch.is_tensor(video_tensor):
                video_array = video_tensor.cpu().numpy()
            else:
                video_array = np.array(video_tensor)
            
            # 确保数组形状正确 (frames, height, width, channels)
            if video_array.ndim == 4:
                frames, height, width, channels = video_array.shape
            else:
                raise ValueError(f"Unexpected video array shape: {video_array.shape}")
            
            # 确保像素值在正确范围内
            if video_array.max() <= 1.0:
                video_array = (video_array * 255).astype(np.uint8)
            else:
                video_array = video_array.astype(np.uint8)
            
            # 创建视频写入器
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            # 写入每一帧
            for frame in video_array:
                # OpenCV使用BGR格式
                if channels == 3:
                    frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                else:
                    frame_bgr = frame
                out.write(frame_bgr)
            
            # 释放资源
            out.release()
            
            log_operation("视频保存", f"使用OpenCV保存视频: {output_path}")
            
        except Exception as e:
            log_operation("视频保存", f"OpenCV保存视频失败: {str(e)}")
            raise e
    
    def merge_videos(self, video_paths, output_path, fps=15):
        """合并多个视频"""
        try:
            log_operation("视频合并", f"开始合并 {len(video_paths)} 个视频")
            
            # 读取第一个视频获取尺寸信息
            first_video = cv2.VideoCapture(video_paths[0])
            width = int(first_video.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(first_video.get(cv2.CAP_PROP_FRAME_HEIGHT))
            first_video.release()
            
            # 创建输出视频写入器
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            # 逐个读取并写入视频
            for video_path in video_paths:
                if not os.path.exists(video_path):
                    log_operation("视频合并", f"视频文件不存在: {video_path}")
                    continue
                
                cap = cv2.VideoCapture(video_path)
                
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    # 调整帧尺寸
                    frame = cv2.resize(frame, (width, height))
                    out.write(frame)
                
                cap.release()
            
            # 释放资源
            out.release()
            
            log_operation("视频合并", f"视频合并完成: {output_path}")
            return output_path
            
        except Exception as e:
            log_operation("视频合并", f"视频合并失败: {str(e)}")
            return None
    
    def add_transitions(self, video_paths, output_path, transition_duration=0.5, fps=15):
        """为视频添加转场效果"""
        try:
            log_operation("视频转场", f"开始为 {len(video_paths)} 个视频添加转场")
            
            # 计算转场帧数
            transition_frames = int(transition_duration * fps)
            
            # 读取所有视频帧
            all_frames = []
            
            for i, video_path in enumerate(video_paths):
                if not os.path.exists(video_path):
                    continue
                
                cap = cv2.VideoCapture(video_path)
                frames = []
                
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    frames.append(frame)
                
                cap.release()
                
                # 添加当前视频的帧
                if i == 0:
                    # 第一个视频，直接添加所有帧
                    all_frames.extend(frames)
                else:
                    # 后续视频，添加淡入效果
                    if len(all_frames) >= transition_frames and len(frames) >= transition_frames:
                        # 创建转场效果
                        for j in range(transition_frames):
                            alpha = j / transition_frames
                            prev_frame = all_frames[-(transition_frames - j)]
                            curr_frame = frames[j]
                            
                            # 调整尺寸
                            if prev_frame.shape != curr_frame.shape:
                                curr_frame = cv2.resize(curr_frame, (prev_frame.shape[1], prev_frame.shape[0]))
                            
                            # 混合帧
                            blended_frame = cv2.addWeighted(prev_frame, 1 - alpha, curr_frame, alpha, 0)
                            all_frames[-(transition_frames - j)] = blended_frame
                        
                        # 添加剩余帧
                        all_frames.extend(frames[transition_frames:])
                    else:
                        # 如果帧数不足，直接添加
                        all_frames.extend(frames)
            
            # 保存合并后的视频
            if all_frames:
                height, width = all_frames[0].shape[:2]
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                
                for frame in all_frames:
                    out.write(frame)
                
                out.release()
                
                log_operation("视频转场", f"转场视频保存完成: {output_path}")
                return output_path
            
        except Exception as e:
            log_operation("视频转场", f"添加转场失败: {str(e)}")
            return None
    
    def get_video_info(self, video_path):
        """获取视频信息"""
        try:
            if not os.path.exists(video_path):
                return None
            
            cap = cv2.VideoCapture(video_path)
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = frame_count / fps if fps > 0 else 0
            file_size = os.path.getsize(video_path)
            
            cap.release()
            
            return {
                'path': video_path,
                'width': width,
                'height': height,
                'fps': fps,
                'frame_count': frame_count,
                'duration': duration,
                'file_size': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            log_operation("视频信息", f"获取视频信息失败: {str(e)}")
            return None
    
    def cleanup_pipelines(self):
        """清理管道内存"""
        if self.t2v_pipeline is not None:
            del self.t2v_pipeline
            self.t2v_pipeline = None
        
        if self.i2v_pipeline is not None:
            del self.i2v_pipeline
            self.i2v_pipeline = None
        
        if self.ti2v_pipeline is not None:
            del self.ti2v_pipeline
            self.ti2v_pipeline = None
        
        optimize_gpu_memory()
        log_operation("模型清理", "Wan2.2视频生成模型内存已清理")
    
    def estimate_generation_time(self, task_type, duration, fps):
        """估算视频生成时间"""
        # 基础时间（秒）
        base_times = {
            'text_to_video': 180,  # 3分钟
            'image_to_video': 150  # 2.5分钟
        }
        
        base_time = base_times.get(task_type, 180)
        
        # 根据时长和帧率调整
        duration_factor = duration / 4  # 基准4秒
        fps_factor = fps / 15  # 基准15fps
        
        total_time = base_time * duration_factor * fps_factor
        
        return int(total_time)