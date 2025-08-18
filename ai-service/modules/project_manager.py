import os
import json
import shutil
import zipfile
from datetime import datetime
from typing import Dict, List, Optional

from .utils import (
    log_operation, save_json, load_json, 
    get_directory_size, format_file_size,
    create_directories, clean_temp_files
)

class ProjectManager:
    """项目管理器，负责项目的创建、保存、加载和管理"""
    
    def __init__(self):
        self.projects_dir = "/root/autodl-tmp/easy2create/projects"
        self.templates_dir = "/root/autodl-tmp/easy2create/templates"
        self.exports_dir = "/root/autodl-tmp/easy2create/exports"
        
        # 确保目录存在
        # create_directories([
        #     self.projects_dir,
        #     self.templates_dir,
        #     self.exports_dir
        # ])
        create_directories()
        
    def create_project(self, project_name: str, project_type: str = "storyboard", 
                      description: str = "") -> Optional[str]:
        """创建新项目"""
        try:
            # 生成项目ID
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            project_id = f"{project_type}_{timestamp}"
            
            # 创建项目目录
            project_path = os.path.join(self.projects_dir, project_id)
            
            # 项目子目录结构
            subdirs = [
                "images",
                "videos", 
                "scripts",
                "exports",
                "temp"
            ]
            
            for subdir in subdirs:
                os.makedirs(os.path.join(project_path, subdir), exist_ok=True)
            
            # 创建项目配置文件
            project_config = {
                "project_id": project_id,
                "project_name": project_name,
                "project_type": project_type,
                "description": description,
                "created_time": datetime.now().isoformat(),
                "last_modified": datetime.now().isoformat(),
                "version": "1.0",
                "status": "active",
                "settings": {
                    "image_size": [1024, 576],
                    "video_fps": 15,
                    "video_duration": 4,
                    "style": "电影级",
                    "quality": "high"
                },
                "statistics": {
                    "total_images": 0,
                    "total_videos": 0,
                    "total_scenes": 0,
                    "generation_time": 0
                },
                "files": {
                    "images": [],
                    "videos": [],
                    "scripts": []
                }
            }
            
            config_path = os.path.join(project_path, "project_config.json")
            save_json(project_config, config_path)
            
            log_operation("项目管理", f"项目创建成功: {project_name} ({project_id})")
            return project_id
            
        except Exception as e:
            log_operation("项目管理", f"项目创建失败: {str(e)}")
            return None
    
    def load_project(self, project_id: str) -> Optional[Dict]:
        """加载项目"""
        try:
            project_path = os.path.join(self.projects_dir, project_id)
            config_path = os.path.join(project_path, "project_config.json")
            
            if not os.path.exists(config_path):
                log_operation("项目管理", f"项目配置文件不存在: {project_id}")
                return None
            
            project_config = load_json(config_path)
            
            if project_config:
                # 更新文件列表
                project_config = self._update_project_files(project_config, project_path)
                
                # 更新统计信息
                project_config = self._update_project_statistics(project_config, project_path)
                
                log_operation("项目管理", f"项目加载成功: {project_id}")
                return project_config
            else:
                log_operation("项目管理", f"项目配置加载失败: {project_id}")
                return None
                
        except Exception as e:
            log_operation("项目管理", f"项目加载失败: {str(e)}")
            return None
    
    def save_project(self, project_config: Dict) -> bool:
        """保存项目"""
        try:
            project_id = project_config.get("project_id")
            if not project_id:
                log_operation("项目管理", "项目ID无效")
                return False
            
            project_path = os.path.join(self.projects_dir, project_id)
            config_path = os.path.join(project_path, "project_config.json")
            
            # 更新最后修改时间
            project_config["last_modified"] = datetime.now().isoformat()
            
            # 更新文件列表和统计信息
            project_config = self._update_project_files(project_config, project_path)
            project_config = self._update_project_statistics(project_config, project_path)
            
            # 保存配置
            save_json(project_config, config_path)
            
            log_operation("项目管理", f"项目保存成功: {project_id}")
            return True
            
        except Exception as e:
            log_operation("项目管理", f"项目保存失败: {str(e)}")
            return False
    
    def list_projects(self) -> List[Dict]:
        """列出所有项目"""
        try:
            projects = []
            
            if not os.path.exists(self.projects_dir):
                return projects
            
            for item in os.listdir(self.projects_dir):
                item_path = os.path.join(self.projects_dir, item)
                if os.path.isdir(item_path):
                    config_path = os.path.join(item_path, "project_config.json")
                    if os.path.exists(config_path):
                        project_config = load_json(config_path)
                        if project_config:
                            # 添加项目大小信息
                            project_size = get_directory_size(item_path)
                            project_config["project_size"] = project_size
                            project_config["project_size_formatted"] = format_file_size(project_size)
                            
                            projects.append(project_config)
            
            # 按创建时间排序
            projects.sort(key=lambda x: x.get("created_time", ""), reverse=True)
            
            log_operation("项目管理", f"找到 {len(projects)} 个项目")
            return projects
            
        except Exception as e:
            log_operation("项目管理", f"列出项目失败: {str(e)}")
            return []
    
    def delete_project(self, project_id: str) -> bool:
        """删除项目"""
        try:
            project_path = os.path.join(self.projects_dir, project_id)
            
            if not os.path.exists(project_path):
                log_operation("项目管理", f"项目不存在: {project_id}")
                return False
            
            # 删除项目目录
            shutil.rmtree(project_path)
            
            log_operation("项目管理", f"项目删除成功: {project_id}")
            return True
            
        except Exception as e:
            log_operation("项目管理", f"项目删除失败: {str(e)}")
            return False
    
    def duplicate_project(self, project_id: str, new_name: str) -> Optional[str]:
        """复制项目"""
        try:
            # 加载原项目
            original_project = self.load_project(project_id)
            if not original_project:
                log_operation("项目管理", f"原项目不存在: {project_id}")
                return None
            
            # 创建新项目
            new_project_id = self.create_project(
                new_name, 
                original_project.get("project_type", "storyboard"),
                f"复制自: {original_project.get('project_name', '')}" 
            )
            
            if not new_project_id:
                log_operation("项目管理", "新项目创建失败")
                return None
            
            # 复制文件
            original_path = os.path.join(self.projects_dir, project_id)
            new_path = os.path.join(self.projects_dir, new_project_id)
            
            # 复制图像和视频文件
            for subdir in ["images", "videos", "scripts"]:
                original_subdir = os.path.join(original_path, subdir)
                new_subdir = os.path.join(new_path, subdir)
                
                if os.path.exists(original_subdir):
                    for file in os.listdir(original_subdir):
                        original_file = os.path.join(original_subdir, file)
                        new_file = os.path.join(new_subdir, file)
                        if os.path.isfile(original_file):
                            shutil.copy2(original_file, new_file)
            
            log_operation("项目管理", f"项目复制成功: {project_id} -> {new_project_id}")
            return new_project_id
            
        except Exception as e:
            log_operation("项目管理", f"项目复制失败: {str(e)}")
            return None
    
    def export_project(self, project_id: str, export_format: str = "zip") -> Optional[str]:
        """导出项目"""
        try:
            project_path = os.path.join(self.projects_dir, project_id)
            
            if not os.path.exists(project_path):
                log_operation("项目管理", f"项目不存在: {project_id}")
                return None
            
            # 生成导出文件名
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            export_filename = f"{project_id}_export_{timestamp}.{export_format}"
            export_path = os.path.join(self.exports_dir, export_filename)
            
            if export_format == "zip":
                # 创建ZIP文件
                with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(project_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, project_path)
                            zipf.write(file_path, arcname)
                
                log_operation("项目管理", f"项目导出成功: {export_path}")
                return export_path
            else:
                log_operation("项目管理", f"不支持的导出格式: {export_format}")
                return None
                
        except Exception as e:
            log_operation("项目管理", f"项目导出失败: {str(e)}")
            return None
    
    def import_project(self, import_path: str) -> Optional[str]:
        """导入项目"""
        try:
            if not os.path.exists(import_path):
                log_operation("项目管理", f"导入文件不存在: {import_path}")
                return None
            
            # 生成新项目ID
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            project_id = f"imported_{timestamp}"
            project_path = os.path.join(self.projects_dir, project_id)
            
            if import_path.endswith('.zip'):
                # 解压ZIP文件
                with zipfile.ZipFile(import_path, 'r') as zipf:
                    zipf.extractall(project_path)
                
                # 检查项目配置文件
                config_path = os.path.join(project_path, "project_config.json")
                if os.path.exists(config_path):
                    project_config = load_json(config_path)
                    if project_config:
                        # 更新项目ID和时间
                        project_config["project_id"] = project_id
                        project_config["imported_time"] = datetime.now().isoformat()
                        project_config["last_modified"] = datetime.now().isoformat()
                        
                        # 保存更新的配置
                        save_json(project_config, config_path)
                        
                        log_operation("项目管理", f"项目导入成功: {project_id}")
                        return project_id
                
                log_operation("项目管理", "导入的文件不是有效的项目")
                # 清理无效的导入
                if os.path.exists(project_path):
                    shutil.rmtree(project_path)
                return None
            else:
                log_operation("项目管理", "不支持的导入文件格式")
                return None
                
        except Exception as e:
            log_operation("项目管理", f"项目导入失败: {str(e)}")
            return None
    
    def cleanup_project_temp_files(self, project_id: str) -> bool:
        """清理项目临时文件"""
        try:
            project_path = os.path.join(self.projects_dir, project_id)
            temp_path = os.path.join(project_path, "temp")
            
            if os.path.exists(temp_path):
                clean_temp_files(temp_path)
                log_operation("项目管理", f"项目临时文件清理完成: {project_id}")
                return True
            
            return True
            
        except Exception as e:
            log_operation("项目管理", f"清理项目临时文件失败: {str(e)}")
            return False
    
    def get_project_statistics(self, project_id: str) -> Optional[Dict]:
        """获取项目统计信息"""
        try:
            project_config = self.load_project(project_id)
            if not project_config:
                return None
            
            project_path = os.path.join(self.projects_dir, project_id)
            
            # 统计文件数量和大小
            stats = {
                "project_id": project_id,
                "project_name": project_config.get("project_name", ""),
                "created_time": project_config.get("created_time", ""),
                "last_modified": project_config.get("last_modified", ""),
                "total_size": get_directory_size(project_path),
                "file_counts": {},
                "file_sizes": {}
            }
            
            # 统计各类文件
            for subdir in ["images", "videos", "scripts", "exports"]:
                subdir_path = os.path.join(project_path, subdir)
                if os.path.exists(subdir_path):
                    file_count = len([f for f in os.listdir(subdir_path) 
                                    if os.path.isfile(os.path.join(subdir_path, f))])
                    subdir_size = get_directory_size(subdir_path)
                    
                    stats["file_counts"][subdir] = file_count
                    stats["file_sizes"][subdir] = subdir_size
                    stats["file_sizes"][f"{subdir}_formatted"] = format_file_size(subdir_size)
            
            stats["total_size_formatted"] = format_file_size(stats["total_size"])
            
            return stats
            
        except Exception as e:
            log_operation("项目管理", f"获取项目统计信息失败: {str(e)}")
            return None
    
    def _update_project_files(self, project_config: Dict, project_path: str) -> Dict:
        """更新项目文件列表"""
        try:
            files = {"images": [], "videos": [], "scripts": []}
            
            for file_type in files.keys():
                subdir_path = os.path.join(project_path, file_type)
                if os.path.exists(subdir_path):
                    for file in os.listdir(subdir_path):
                        file_path = os.path.join(subdir_path, file)
                        if os.path.isfile(file_path):
                            file_info = {
                                "filename": file,
                                "path": file_path,
                                "size": os.path.getsize(file_path),
                                "modified_time": datetime.fromtimestamp(
                                    os.path.getmtime(file_path)
                                ).isoformat()
                            }
                            files[file_type].append(file_info)
            
            project_config["files"] = files
            return project_config
            
        except Exception as e:
            log_operation("项目管理", f"更新项目文件列表失败: {str(e)}")
            return project_config
    
    def _update_project_statistics(self, project_config: Dict, project_path: str) -> Dict:
        """更新项目统计信息"""
        try:
            stats = project_config.get("statistics", {})
            
            # 统计文件数量
            stats["total_images"] = len(project_config.get("files", {}).get("images", []))
            stats["total_videos"] = len(project_config.get("files", {}).get("videos", []))
            stats["total_scripts"] = len(project_config.get("files", {}).get("scripts", []))
            
            # 计算总大小
            stats["total_size"] = get_directory_size(project_path)
            stats["total_size_formatted"] = format_file_size(stats["total_size"])
            
            project_config["statistics"] = stats
            return project_config
            
        except Exception as e:
            log_operation("项目管理", f"更新项目统计信息失败: {str(e)}")
            return project_config
    
    def get_project_path(self, project_id: str) -> str:
        """获取项目路径"""
        return os.path.join(self.projects_dir, project_id)
    
    def get_project_subdir(self, project_id: str, subdir: str) -> str:
        """获取项目子目录路径"""
        return os.path.join(self.projects_dir, project_id, subdir)

    def save_prompt(self, project_id: str, user_prompt: str, optimized_prompt: str) -> bool:
        """保存用户提示词和优化后的提示词"""
        try:
            project_config = self.load_project(project_id)
            if not project_config:
                log_operation("项目管理", f"保存提示词失败: 项目不存在 {project_id}")
                return False

            if "prompts" not in project_config:
                project_config["prompts"] = []

            prompt_entry = {
                "timestamp": datetime.now().isoformat(),
                "user_prompt": user_prompt,
                "optimized_prompt": optimized_prompt
            }
            project_config["prompts"].append(prompt_entry)

            # 保存更新后的项目配置
            if self.save_project(project_config):
                log_operation("项目管理", f"提示词保存成功: {project_id}")
                return True
            else:
                log_operation("项目管理", f"提示词保存失败: 无法保存项目配置 {project_id}")
                return False

        except Exception as e:
            log_operation("项目管理", f"保存提示词失败: {str(e)}")
            return False
