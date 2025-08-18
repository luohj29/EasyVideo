import json
import os
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class ConfigManager:
    """配置管理器，用于管理系统配置"""
    
    def __init__(self, config_dir: str = None):
        if config_dir is None:
            # 默认配置目录为项目根目录下的config文件夹
            self.config_dir = Path(__file__).parent.parent.parent / "config"
        else:
            self.config_dir = Path(config_dir)
        
        self.config_file = self.config_dir / "config.json"
        self.backup_dir = self.config_dir / "backups"
        
        # 确保目录存在
        self.config_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        
        # 默认配置
        self.default_config = {
            "system": {
                "version": "1.0.0",
                "debug": False,
                "log_level": "INFO",
                "max_concurrent_tasks": 3,
                "temp_dir": "/tmp/easyvideo",
                "output_dir": "./outputs",
                "project_dir": "./projects"
            },
            "models": {
                "flux": {
                    "enabled": False,
                    "path": "",
                    "device": "cuda",
                    "precision": "fp16",
                    "max_memory": "8GB"
                },
                "video": {
                    "enabled": False,
                    "path": "",
                    "device": "cuda",
                    "precision": "fp16",
                    "max_memory": "12GB"
                },
                "llm": {
                    "enabled": False,
                    "path": "",
                    "device": "cuda",
                    "max_tokens": 2048,
                    "temperature": 0.7
                }
            },
            "generation": {
                "image": {
                    "default_width": 1024,
                    "default_height": 1024,
                    "default_steps": 20,
                    "default_guidance": 7.5,
                    "max_batch_size": 4,
                    "timeout": 300
                },
                "video": {
                    "default_duration": 5.0,
                    "default_fps": 24,
                    "max_duration": 30.0,
                    "max_resolution": [1024, 576],
                    "timeout": 600
                },
                "prompt": {
                    "max_length": 500,
                    "optimization_enabled": True,
                    "style_templates": True
                }
            },
            "api": {
                "host": "0.0.0.0",
                "port": 8000,
                "cors_enabled": True,
                "rate_limit": {
                    "enabled": True,
                    "requests_per_minute": 60
                }
            },
            "storage": {
                "auto_cleanup": True,
                "cleanup_interval_hours": 24,
                "max_storage_gb": 50,
                "backup_enabled": True
            }
        }
        
        # 加载或创建配置
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                # 合并默认配置（确保新增的配置项存在）
                merged_config = self._merge_configs(self.default_config, config)
                
                logger.info(f"Configuration loaded from {self.config_file}")
                return merged_config
            else:
                # 创建默认配置文件
                self.save_config(self.default_config)
                logger.info(f"Default configuration created at {self.config_file}")
                return self.default_config.copy()
                
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            logger.info("Using default configuration")
            return self.default_config.copy()
    
    def save_config(self, config: Dict[str, Any] = None) -> bool:
        """保存配置文件"""
        try:
            if config is None:
                config = self.config
            
            # 备份当前配置
            if self.config_file.exists():
                self._backup_config()
            
            # 保存新配置
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            self.config = config
            logger.info(f"Configuration saved to {self.config_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving config: {e}")
            return False
    
    def _backup_config(self):
        """备份当前配置"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = self.backup_dir / f"config_backup_{timestamp}.json"
            
            import shutil
            shutil.copy2(self.config_file, backup_file)
            
            logger.info(f"Configuration backed up to {backup_file}")
            
            # 清理旧备份（保留最近10个）
            self._cleanup_old_backups()
            
        except Exception as e:
            logger.warning(f"Failed to backup config: {e}")
    
    def _cleanup_old_backups(self, keep_count: int = 10):
        """清理旧的配置备份"""
        try:
            backup_files = list(self.backup_dir.glob("config_backup_*.json"))
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # 删除超出保留数量的备份
            for backup_file in backup_files[keep_count:]:
                backup_file.unlink()
                logger.debug(f"Removed old backup: {backup_file}")
                
        except Exception as e:
            logger.warning(f"Failed to cleanup old backups: {e}")
    
    def _merge_configs(self, default: Dict[str, Any], user: Dict[str, Any]) -> Dict[str, Any]:
        """合并默认配置和用户配置"""
        merged = default.copy()
        
        for key, value in user.items():
            if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
                merged[key] = self._merge_configs(merged[key], value)
            else:
                merged[key] = value
        
        return merged
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """获取配置值（支持点号路径）"""
        try:
            keys = key_path.split('.')
            value = self.config
            
            for key in keys:
                if isinstance(value, dict) and key in value:
                    value = value[key]
                else:
                    return default
            
            return value
            
        except Exception as e:
            logger.warning(f"Error getting config value for {key_path}: {e}")
            return default
    
    def set(self, key_path: str, value: Any, save: bool = True) -> bool:
        """设置配置值（支持点号路径）"""
        try:
            keys = key_path.split('.')
            config = self.config
            
            # 导航到目标位置
            for key in keys[:-1]:
                if key not in config:
                    config[key] = {}
                elif not isinstance(config[key], dict):
                    config[key] = {}
                config = config[key]
            
            # 设置值
            config[keys[-1]] = value
            
            if save:
                return self.save_config()
            
            return True
            
        except Exception as e:
            logger.error(f"Error setting config value for {key_path}: {e}")
            return False
    
    def update(self, updates: Dict[str, Any], save: bool = True) -> bool:
        """批量更新配置"""
        try:
            for key_path, value in updates.items():
                self.set(key_path, value, save=False)
            
            if save:
                return self.save_config()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating config: {e}")
            return False
    
    def reset_to_default(self, section: str = None) -> bool:
        """重置配置到默认值"""
        try:
            if section:
                if section in self.default_config:
                    self.config[section] = self.default_config[section].copy()
                    logger.info(f"Reset {section} section to default")
                else:
                    logger.warning(f"Section {section} not found in default config")
                    return False
            else:
                self.config = self.default_config.copy()
                logger.info("Reset entire configuration to default")
            
            return self.save_config()
            
        except Exception as e:
            logger.error(f"Error resetting config: {e}")
            return False
    
    def validate_config(self) -> Dict[str, Any]:
        """验证配置的有效性"""
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        try:
            # 验证模型路径
            models = self.get("models", {})
            for model_name, model_config in models.items():
                if model_config.get("enabled", False):
                    model_path = model_config.get("path", "")
                    if not model_path:
                        validation_result["errors"].append(
                            f"Model {model_name} is enabled but path is empty"
                        )
                        validation_result["valid"] = False
                    elif not os.path.exists(model_path):
                        validation_result["warnings"].append(
                            f"Model {model_name} path does not exist: {model_path}"
                        )
            
            # 验证目录路径
            directories = [
                ("system.temp_dir", "临时目录"),
                ("system.output_dir", "输出目录"),
                ("system.project_dir", "项目目录")
            ]
            
            for dir_path_key, dir_name in directories:
                dir_path = self.get(dir_path_key)
                if dir_path:
                    try:
                        os.makedirs(dir_path, exist_ok=True)
                    except Exception as e:
                        validation_result["errors"].append(
                            f"Cannot create {dir_name}: {e}"
                        )
                        validation_result["valid"] = False
            
            # 验证数值范围
            numeric_validations = [
                ("api.port", 1024, 65535, "API端口"),
                ("generation.image.default_width", 256, 2048, "默认图像宽度"),
                ("generation.image.default_height", 256, 2048, "默认图像高度"),
                ("generation.video.default_duration", 1.0, 30.0, "默认视频时长"),
                ("generation.video.default_fps", 12, 60, "默认视频帧率")
            ]
            
            for key, min_val, max_val, name in numeric_validations:
                value = self.get(key)
                if value is not None:
                    if not (min_val <= value <= max_val):
                        validation_result["errors"].append(
                            f"{name}值{value}超出有效范围[{min_val}, {max_val}]"
                        )
                        validation_result["valid"] = False
            
        except Exception as e:
            validation_result["errors"].append(f"配置验证过程中发生错误: {e}")
            validation_result["valid"] = False
        
        return validation_result
    
    def get_model_config(self, model_name: str) -> Optional[Dict[str, Any]]:
        """获取特定模型的配置"""
        return self.get(f"models.{model_name}")
    
    def set_model_config(self, model_name: str, config: Dict[str, Any], save: bool = True) -> bool:
        """设置特定模型的配置"""
        return self.set(f"models.{model_name}", config, save)
    
    def enable_model(self, model_name: str, model_path: str, save: bool = True) -> bool:
        """启用模型"""
        try:
            model_config = self.get_model_config(model_name)
            if model_config is None:
                logger.error(f"Unknown model: {model_name}")
                return False
            
            model_config["enabled"] = True
            model_config["path"] = model_path
            
            return self.set_model_config(model_name, model_config, save)
            
        except Exception as e:
            logger.error(f"Error enabling model {model_name}: {e}")
            return False
    
    def disable_model(self, model_name: str, save: bool = True) -> bool:
        """禁用模型"""
        try:
            model_config = self.get_model_config(model_name)
            if model_config is None:
                logger.error(f"Unknown model: {model_name}")
                return False
            
            model_config["enabled"] = False
            
            return self.set_model_config(model_name, model_config, save)
            
        except Exception as e:
            logger.error(f"Error disabling model {model_name}: {e}")
            return False
    
    def get_system_info(self) -> Dict[str, Any]:
        """获取系统信息"""
        import platform
        import psutil
        
        try:
            return {
                "platform": platform.platform(),
                "python_version": platform.python_version(),
                "cpu_count": psutil.cpu_count(),
                "memory_total": psutil.virtual_memory().total,
                "memory_available": psutil.virtual_memory().available,
                "disk_usage": {
                    "total": psutil.disk_usage('/').total,
                    "used": psutil.disk_usage('/').used,
                    "free": psutil.disk_usage('/').free
                },
                "config_file": str(self.config_file),
                "config_valid": self.validate_config()["valid"]
            }
        except Exception as e:
            logger.error(f"Error getting system info: {e}")
            return {"error": str(e)}
    
    def export_config(self, output_path: str = None) -> str:
        """导出配置到文件"""
        try:
            if output_path is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_path = self.config_dir / f"config_export_{timestamp}.json"
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Configuration exported to {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error exporting config: {e}")
            raise
    
    def import_config(self, config_path: str, backup_current: bool = True) -> bool:
        """从文件导入配置"""
        try:
            if not os.path.exists(config_path):
                raise FileNotFoundError(f"Config file not found: {config_path}")
            
            with open(config_path, 'r', encoding='utf-8') as f:
                imported_config = json.load(f)
            
            # 验证导入的配置
            temp_config = self.config
            self.config = imported_config
            validation = self.validate_config()
            
            if not validation["valid"]:
                self.config = temp_config
                raise ValueError(f"Invalid configuration: {validation['errors']}")
            
            # 备份当前配置
            if backup_current:
                self._backup_config()
            
            # 保存导入的配置
            return self.save_config(imported_config)
            
        except Exception as e:
            logger.error(f"Error importing config: {e}")
            return False

# 测试函数
if __name__ == "__main__":
    def test_config_manager():
        # 创建配置管理器
        config_manager = ConfigManager("/tmp/test_config")
        
        # 测试获取配置
        print(f"API Port: {config_manager.get('api.port')}")
        print(f"Debug Mode: {config_manager.get('system.debug')}")
        
        # 测试设置配置
        config_manager.set("system.debug", True)
        config_manager.set("api.port", 8002)
        
        # 测试模型配置
        config_manager.enable_model("flux", "/path/to/flux/model")
        
        # 测试配置验证
        validation = config_manager.validate_config()
        print(f"Config valid: {validation['valid']}")
        if validation['errors']:
            print(f"Errors: {validation['errors']}")
        if validation['warnings']:
            print(f"Warnings: {validation['warnings']}")
        
        # 测试系统信息
        system_info = config_manager.get_system_info()
        print(f"System info: {system_info}")
    
    test_