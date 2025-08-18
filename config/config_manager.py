import json
import os
from typing import Dict, Any, Optional
from pathlib import Path

class ConfigManager:
    """配置管理器，负责读取和管理系统配置"""
    
    def __init__(self, config_dir: str = None):
        if config_dir is None:
            config_dir = os.path.dirname(os.path.abspath(__file__))
        
        self.config_dir = Path(config_dir)
        self.config_file = self.config_dir / "config.json"
        self.default_file = self.config_dir / "default.json"
        self._config = None
        self._load_config()
    
    def _load_config(self) -> None:
        """加载配置文件"""
        try:
            # 首先尝试加载主配置文件
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
            else:
                # 如果主配置文件不存在，使用默认配置
                with open(self.default_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                # 保存默认配置为主配置
                self.save_config()
        except Exception as e:
            print(f"配置文件加载失败: {e}")
            self._config = {}
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置值，支持点号分隔的嵌套键"""
        keys = key.split('.')
        value = self._config
        
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key: str, value: Any) -> None:
        """设置配置值，支持点号分隔的嵌套键"""
        keys = key.split('.')
        config = self._config
        
        # 导航到最后一级的父级
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        # 设置最终值
        config[keys[-1]] = value
    
    def save_config(self) -> bool:
        """保存配置到文件"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self._config, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"配置文件保存失败: {e}")
            return False
    
    def get_model_config(self, model_name: str) -> Optional[Dict[str, Any]]:
        """获取指定模型的配置"""
        return self.get(f"models.{model_name}")
    
    def is_model_enabled(self, model_name: str) -> bool:
        """检查模型是否启用"""
        model_config = self.get_model_config(model_name)
        return model_config and model_config.get('enabled', False)
    
    def get_model_path(self, model_name: str) -> Optional[str]:
        """获取模型路径"""
        model_config = self.get_model_config(model_name)
        if not model_config:
            return None
        
        path = model_config.get('path')
        if not path:
            return None
        
        # 如果是相对路径，转换为绝对路径
        if not os.path.isabs(path):
            # 相对于config目录的父目录（即EasyVideo项目根目录）
            base_dir = os.path.dirname(self.config_dir)
            path = os.path.abspath(os.path.join(base_dir, path))
        
        return path
    
    def get_path(self, path_name: str) -> Optional[str]:
        """获取系统路径，自动处理相对路径转换"""
        path_value = self.get(f'paths.{path_name}')
        if not path_value:
            return None
        
        # 如果是相对路径，转换为绝对路径
        if not os.path.isabs(path_value):
            base_dir = os.path.dirname(self.config_dir)
            path_value = os.path.abspath(os.path.join(base_dir, path_value))
        
        return path_value
    
    def validate_paths(self) -> Dict[str, bool]:
        """验证配置中的路径是否存在"""
        results = {}
        
        # 验证模型路径
        for model_name in self.get('models', {}).keys():
            path = self.get_model_path(model_name)
            if path:
                results[f"model_{model_name}"] = os.path.exists(path)
            else:
                results[f"model_{model_name}"] = False
        
        # 验证系统路径
        for path_name, path_value in self.get('paths', {}).items():
            if path_value:
                # 如果是相对路径，转换为绝对路径
                if not os.path.isabs(path_value):
                    base_dir = os.path.dirname(self.config_dir)
                    path_value = os.path.abspath(os.path.join(base_dir, path_value))
                results[f"path_{path_name}"] = os.path.exists(path_value)
            else:
                results[f"path_{path_name}"] = False
        
        return results
    
    def get_config(self) -> Dict[str, Any]:
        """获取完整配置"""
        return self._config.copy()
    
    def get_all_config(self) -> Dict[str, Any]:
        """获取完整配置"""
        return self._config.copy()
    
    def reset_to_default(self) -> bool:
        """重置为默认配置"""
        try:
            with open(self.default_file, 'r', encoding='utf-8') as f:
                self._config = json.load(f)
            return self.save_config()
        except Exception as e:
            print(f"重置配置失败: {e}")
            return False

# 全局配置管理器实例
config_manager = ConfigManager()

# 便捷函数
def get_config(key: str, default: Any = None) -> Any:
    """获取配置值"""
    return config_manager.get(key, default)

def set_config(key: str, value: Any) -> None:
    """设置配置值"""
    config_manager.set(key, value)

def save_config() -> bool:
    """保存配置"""
    return config_manager.save_config()

def get_model_path(model_name: str) -> Optional[str]:
    """获取模型路径"""
    return config_manager.get_model_path(model_name)

def is_model_enabled(model_name: str) -> bool:
    """检查模型是否启用"""
    return config_manager.is_model_enabled(model_name)