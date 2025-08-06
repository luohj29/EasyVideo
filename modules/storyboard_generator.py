import os
import json
from datetime import datetime
from PIL import Image
import torch

from .prompt_optimizer import PromptOptimizer
from .image_generator import ImageGenerator
from .video_generator import VideoGenerator
from .utils import log_operation, save_json, load_json, generate_unique_filename

class StoryboardGenerator:
    """分镜生成器，负责分镜脚本生成、分镜图像生成和分镜视频制作"""
    
    def __init__(self):
        self.prompt_optimizer = PromptOptimizer()
        self.image_generator = ImageGenerator()
        self.video_generator = VideoGenerator()
        self.output_dir = "/root/autodl-tmp/easy2create/outputs/storyboards"
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_storyboard_script(self, story_description, num_scenes=5, style="电影级"):
        """生成分镜脚本"""
        try:
            log_operation("分镜生成", f"开始生成分镜脚本: {story_description[:50]}...")
            
            # 构建分镜生成提示词
            system_prompt = f"""
你是一个专业的分镜师和导演，擅长将故事描述转换为详细的分镜脚本。
请根据用户提供的故事描述，生成 {num_scenes} 个分镜场景。

每个分镜场景需要包含以下信息：
1. 场景编号
2. 场景描述（详细的视觉描述）
3. 镜头类型（特写、中景、远景等）
4. 镜头角度（正面、侧面、俯视、仰视等）
5. 镜头运动（静止、推拉、摇移、跟随等）
6. 时长（建议秒数）
7. 情绪氛围
8. 关键元素

风格要求：{style}

请以JSON格式返回，结构如下：
{{
  "title": "故事标题",
  "total_scenes": {num_scenes},
  "style": "{style}",
  "scenes": [
    {{
      "scene_id": 1,
      "description": "详细的场景描述",
      "shot_type": "镜头类型",
      "camera_angle": "镜头角度",
      "camera_movement": "镜头运动",
      "duration": 4,
      "mood": "情绪氛围",
      "key_elements": ["关键元素1", "关键元素2"]
    }}
  ]
}}
"""
            
            user_prompt = f"故事描述：{story_description}"
            
            # 使用Qwen模型生成分镜脚本
            storyboard_script = self.prompt_optimizer.optimize_prompt(
                user_prompt, 
                formula_type="剧情型",
                system_prompt=system_prompt
            )
            
            # 尝试解析JSON
            try:
                script_data = json.loads(storyboard_script)
            except json.JSONDecodeError:
                # 如果JSON解析失败，创建基础结构
                script_data = {
                    "title": "AI生成故事",
                    "total_scenes": num_scenes,
                    "style": style,
                    "scenes": []
                }
                
                # 简单分割文本创建场景
                lines = storyboard_script.split('\n')
                scene_count = 0
                current_scene = None
                
                for line in lines:
                    line = line.strip()
                    if line and scene_count < num_scenes:
                        if current_scene is None:
                            current_scene = {
                                "scene_id": scene_count + 1,
                                "description": line,
                                "shot_type": "中景",
                                "camera_angle": "正面",
                                "camera_movement": "静止",
                                "duration": 4,
                                "mood": "自然",
                                "key_elements": []
                            }
                            script_data["scenes"].append(current_scene)
                            scene_count += 1
                            current_scene = None
            
            # 确保有足够的场景
            while len(script_data["scenes"]) < num_scenes:
                scene_id = len(script_data["scenes"]) + 1
                script_data["scenes"].append({
                    "scene_id": scene_id,
                    "description": f"场景 {scene_id}: {story_description}",
                    "shot_type": "中景",
                    "camera_angle": "正面",
                    "camera_movement": "静止",
                    "duration": 4,
                    "mood": "自然",
                    "key_elements": []
                })
            
            log_operation("分镜生成", f"分镜脚本生成完成，共 {len(script_data['scenes'])} 个场景")
            return script_data
            
        except Exception as e:
            log_operation("分镜生成", f"分镜脚本生成失败: {str(e)}")
            return None
    
    def generate_scene_images(self, storyboard_script, project_id=None, 
                             image_style="电影级", image_size=(1024, 576)):
        """为每个分镜场景生成首尾图像"""
        try:
            log_operation("分镜图像", "开始生成分镜场景图像")
            
            if not storyboard_script or "scenes" not in storyboard_script:
                log_operation("分镜图像", "分镜脚本无效")
                return None
            
            scenes_with_images = []
            
            for scene in storyboard_script["scenes"]:
                scene_id = scene["scene_id"]
                description = scene["description"]
                shot_type = scene.get("shot_type", "中景")
                camera_angle = scene.get("camera_angle", "正面")
                mood = scene.get("mood", "自然")
                
                log_operation("分镜图像", f"生成场景 {scene_id} 图像")
                
                # 构建图像生成提示词
                image_prompt = f"{description}, {shot_type}, {camera_angle}, {mood}氛围, {image_style}风格, 高质量, 详细"
                
                # 优化提示词
                optimized_prompt = self.prompt_optimizer.optimize_prompt(
                    image_prompt, 
                    formula_type="艺术型"
                )
                
                # 生成首帧图像
                start_image_path = self.image_generator.generate_image(
                    prompt=optimized_prompt,
                    size=image_size,
                    project_id=project_id,
                    filename=f"scene_{scene_id:02d}_start.png"
                )
                
                # 生成尾帧图像（稍微修改提示词）
                end_prompt = f"{optimized_prompt}, 场景结尾, 动作完成"
                end_image_path = self.image_generator.generate_image(
                    prompt=end_prompt,
                    size=image_size,
                    project_id=project_id,
                    filename=f"scene_{scene_id:02d}_end.png"
                )
                
                # 更新场景信息
                scene_with_images = scene.copy()
                scene_with_images.update({
                    "start_image": start_image_path,
                    "end_image": end_image_path,
                    "optimized_prompt": optimized_prompt,
                    "image_generation_time": datetime.now().isoformat()
                })
                
                scenes_with_images.append(scene_with_images)
                
                log_operation("分镜图像", f"场景 {scene_id} 图像生成完成")
            
            # 更新分镜脚本
            updated_script = storyboard_script.copy()
            updated_script["scenes"] = scenes_with_images
            updated_script["image_generation_completed"] = True
            updated_script["image_generation_time"] = datetime.now().isoformat()
            
            log_operation("分镜图像", f"所有分镜场景图像生成完成")
            return updated_script
            
        except Exception as e:
            log_operation("分镜图像", f"分镜场景图像生成失败: {str(e)}")
            return None
    
    def generate_scene_videos(self, storyboard_script, project_id=None, fps=15):
        """为每个分镜场景生成视频"""
        try:
            log_operation("分镜视频", "开始生成分镜场景视频")
            
            if not storyboard_script or "scenes" not in storyboard_script:
                log_operation("分镜视频", "分镜脚本无效")
                return None
            
            scenes_with_videos = []
            
            for scene in storyboard_script["scenes"]:
                scene_id = scene["scene_id"]
                description = scene["description"]
                duration = scene.get("duration", 4)
                camera_movement = scene.get("camera_movement", "静止")
                
                log_operation("分镜视频", f"生成场景 {scene_id} 视频")
                
                # 构建视频生成提示词
                video_prompt = f"{description}, {camera_movement}, 流畅运动, 高质量视频"
                
                # 优化视频提示词
                optimized_video_prompt = self.prompt_optimizer.optimize_prompt(
                    video_prompt, 
                    formula_type="剧情型"
                )
                
                video_path = None
                
                # 如果有起始图像，使用图像到视频生成
                if "start_image" in scene and scene["start_image"] and os.path.exists(scene["start_image"]):
                    video_path = self.video_generator.generate_image_to_video(
                        image=scene["start_image"],
                        prompt=optimized_video_prompt,
                        fps=fps,
                        duration=duration,
                        project_id=project_id,
                        filename=f"scene_{scene_id:02d}_video.mp4"
                    )
                else:
                    # 使用文本到视频生成
                    video_path = self.video_generator.generate_text_to_video(
                        prompt=optimized_video_prompt,
                        fps=fps,
                        duration=duration,
                        project_id=project_id,
                        filename=f"scene_{scene_id:02d}_video.mp4"
                    )
                
                # 更新场景信息
                scene_with_video = scene.copy()
                scene_with_video.update({
                    "video_path": video_path,
                    "video_prompt": optimized_video_prompt,
                    "video_generation_time": datetime.now().isoformat(),
                    "video_fps": fps,
                    "video_duration": duration
                })
                
                scenes_with_videos.append(scene_with_video)
                
                if video_path:
                    log_operation("分镜视频", f"场景 {scene_id} 视频生成完成: {video_path}")
                else:
                    log_operation("分镜视频", f"场景 {scene_id} 视频生成失败")
            
            # 更新分镜脚本
            updated_script = storyboard_script.copy()
            updated_script["scenes"] = scenes_with_videos
            updated_script["video_generation_completed"] = True
            updated_script["video_generation_time"] = datetime.now().isoformat()
            
            log_operation("分镜视频", f"所有分镜场景视频生成完成")
            return updated_script
            
        except Exception as e:
            log_operation("分镜视频", f"分镜场景视频生成失败: {str(e)}")
            return None
    
    def merge_storyboard_videos(self, storyboard_script, project_id=None, 
                               add_transitions=True, transition_duration=0.5):
        """合并分镜视频为完整视频"""
        try:
            log_operation("视频合并", "开始合并分镜视频")
            
            if not storyboard_script or "scenes" not in storyboard_script:
                log_operation("视频合并", "分镜脚本无效")
                return None
            
            # 收集所有视频路径
            video_paths = []
            for scene in storyboard_script["scenes"]:
                if "video_path" in scene and scene["video_path"] and os.path.exists(scene["video_path"]):
                    video_paths.append(scene["video_path"])
            
            if not video_paths:
                log_operation("视频合并", "没有找到可合并的视频文件")
                return None
            
            # 确定输出路径
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f"storyboard_final_{timestamp}.mp4"
            
            if project_id:
                project_output_dir = f"/root/autodl-tmp/easy2create/projects/{project_id}/videos"
                os.makedirs(project_output_dir, exist_ok=True)
                output_path = os.path.join(project_output_dir, output_filename)
            else:
                output_path = os.path.join(self.output_dir, output_filename)
            
            # 合并视频
            if add_transitions:
                final_video_path = self.video_generator.add_transitions(
                    video_paths, output_path, transition_duration
                )
            else:
                final_video_path = self.video_generator.merge_videos(
                    video_paths, output_path
                )
            
            if final_video_path:
                log_operation("视频合并", f"分镜视频合并完成: {final_video_path}")
                
                # 更新分镜脚本
                updated_script = storyboard_script.copy()
                updated_script["final_video_path"] = final_video_path
                updated_script["merge_completed"] = True
                updated_script["merge_time"] = datetime.now().isoformat()
                updated_script["total_scenes_merged"] = len(video_paths)
                
                return updated_script
            else:
                log_operation("视频合并", "分镜视频合并失败")
                return None
            
        except Exception as e:
            log_operation("视频合并", f"分镜视频合并失败: {str(e)}")
            return None
    
    def create_complete_storyboard(self, story_description, num_scenes=5, 
                                  style="电影级", project_id=None, 
                                  image_size=(1024, 576), fps=15,
                                  add_transitions=True):
        """创建完整的分镜视频（一键生成）"""
        try:
            log_operation("完整分镜", f"开始创建完整分镜视频: {story_description[:50]}...")
            
            # 1. 生成分镜脚本
            storyboard_script = self.generate_storyboard_script(
                story_description, num_scenes, style
            )
            
            if not storyboard_script:
                log_operation("完整分镜", "分镜脚本生成失败")
                return None
            
            # 保存分镜脚本
            if project_id:
                script_dir = f"/root/autodl-tmp/easy2create/projects/{project_id}"
                os.makedirs(script_dir, exist_ok=True)
                script_path = os.path.join(script_dir, "storyboard_script.json")
            else:
                script_path = os.path.join(self.output_dir, f"storyboard_script_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            
            save_json(storyboard_script, script_path)
            
            # 2. 生成分镜图像
            storyboard_with_images = self.generate_scene_images(
                storyboard_script, project_id, style, image_size
            )
            
            if not storyboard_with_images:
                log_operation("完整分镜", "分镜图像生成失败")
                return storyboard_script
            
            # 更新保存
            save_json(storyboard_with_images, script_path)
            
            # 3. 生成分镜视频
            storyboard_with_videos = self.generate_scene_videos(
                storyboard_with_images, project_id, fps
            )
            
            if not storyboard_with_videos:
                log_operation("完整分镜", "分镜视频生成失败")
                return storyboard_with_images
            
            # 更新保存
            save_json(storyboard_with_videos, script_path)
            
            # 4. 合并最终视频
            final_storyboard = self.merge_storyboard_videos(
                storyboard_with_videos, project_id, add_transitions
            )
            
            if not final_storyboard:
                log_operation("完整分镜", "视频合并失败")
                return storyboard_with_videos
            
            # 最终保存
            save_json(final_storyboard, script_path)
            
            log_operation("完整分镜", "完整分镜视频创建成功")
            return final_storyboard
            
        except Exception as e:
            log_operation("完整分镜", f"完整分镜视频创建失败: {str(e)}")
            return None
    
    def load_storyboard_project(self, project_path):
        """加载分镜项目"""
        try:
            if os.path.exists(project_path):
                return load_json(project_path)
            else:
                log_operation("项目加载", f"项目文件不存在: {project_path}")
                return None
        except Exception as e:
            log_operation("项目加载", f"加载分镜项目失败: {str(e)}")
            return None
    
    def get_storyboard_progress(self, storyboard_script):
        """获取分镜制作进度"""
        if not storyboard_script or "scenes" not in storyboard_script:
            return {
                "total_scenes": 0,
                "script_completed": False,
                "images_completed": 0,
                "videos_completed": 0,
                "merge_completed": False,
                "progress_percentage": 0
            }
        
        total_scenes = len(storyboard_script["scenes"])
        images_completed = sum(1 for scene in storyboard_script["scenes"] 
                             if "start_image" in scene and scene["start_image"])
        videos_completed = sum(1 for scene in storyboard_script["scenes"] 
                             if "video_path" in scene and scene["video_path"])
        
        script_completed = True
        merge_completed = storyboard_script.get("merge_completed", False)
        
        # 计算进度百分比
        total_steps = total_scenes * 3 + 1  # 脚本 + 图像 + 视频 + 合并
        completed_steps = 1  # 脚本完成
        completed_steps += images_completed  # 图像完成数
        completed_steps += videos_completed  # 视频完成数
        if merge_completed:
            completed_steps += 1  # 合并完成
        
        progress_percentage = int((completed_steps / total_steps) * 100)
        
        return {
            "total_scenes": total_scenes,
            "script_completed": script_completed,
            "images_completed": images_completed,
            "videos_completed": videos_completed,
            "merge_completed": merge_completed,
            "progress_percentage": progress_percentage
        }
    
    def cleanup_resources(self):
        """清理资源"""
        self.prompt_optimizer.cleanup_model()
        self.image_generator.cleanup_pipeline()
        self.video_generator.cleanup_pipelines()
        log_operation("资源清理", "分镜生成器资源已清理")