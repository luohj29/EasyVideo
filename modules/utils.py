import os
import torch
import psutil
from pathlib import Path
from datetime import datetime
import json
import shutil
import zipfile

import torch.version

def create_directories():
    """创建必要的目录结构"""
    base_dir = Path("/root/autodl-tmp/easy2create")
    
    directories = [
        base_dir / "projects",
        base_dir / "outputs" / "images",
        base_dir / "outputs" / "videos",
        base_dir / "outputs" / "temp",
        base_dir / "models",
        base_dir / "logs"
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
    
    return base_dir

def get_gpu_memory():
    """获取GPU内存使用情况"""
    if torch.cuda.is_available():
        device = torch.cuda.current_device()
        total_memory = torch.cuda.get_device_properties(device).total_memory / (1024**3)  # GB
        allocated_memory = torch.cuda.memory_allocated(device) / (1024**3)  # GB
        cached_memory = torch.cuda.memory_reserved(device) / (1024**3)  # GB
        free_memory = total_memory - cached_memory
        
        return {
            'total': total_memory,
            'allocated': allocated_memory,
            'cached': cached_memory,
            'used': cached_memory,
            'free': free_memory
        }
    else:
        return {
            'total': 0,
            'allocated': 0,
            'cached': 0,
            'used': 0,
            'free': 0
        }

def get_system_info():
    """获取系统信息"""
    return {
        'cpu_percent': psutil.cpu_percent(),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_usage': psutil.disk_usage('/').percent,
        'gpu_info': get_gpu_memory()
    }

def save_json(data, filepath):
    """保存JSON数据"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_json(filepath):
    """加载JSON数据"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def generate_unique_filename(base_name, extension, directory):
    """生成唯一的文件名"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{base_name}_{timestamp}.{extension}"
    filepath = os.path.join(directory, filename)
    
    counter = 1
    while os.path.exists(filepath):
        filename = f"{base_name}_{timestamp}_{counter}.{extension}"
        filepath = os.path.join(directory, filename)
        counter += 1
    
    return filepath

def clean_temp_files(temp_dir, max_age_hours=24):
    """清理临时文件"""
    if not os.path.exists(temp_dir):
        return
    
    current_time = datetime.now().timestamp()
    max_age_seconds = max_age_hours * 3600
    
    for filename in os.listdir(temp_dir):
        filepath = os.path.join(temp_dir, filename)
        if os.path.isfile(filepath):
            file_age = current_time - os.path.getmtime(filepath)
            if file_age > max_age_seconds:
                try:
                    os.remove(filepath)
                except Exception as e:
                    print(f"Error removing temp file {filepath}: {e}")

def create_project_zip(project_path, output_path, include_patterns=None):
    """创建项目压缩包"""
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_path):
            for file in files:
                file_path = os.path.join(root, file)
                arc_name = os.path.relpath(file_path, project_path)
                
                # 如果指定了包含模式，检查文件是否匹配
                if include_patterns:
                    should_include = False
                    for pattern in include_patterns:
                        if pattern in file_path or file.endswith(pattern):
                            should_include = True
                            break
                    if not should_include:
                        continue
                
                zipf.write(file_path, arc_name)
    
    return output_path

def format_file_size(size_bytes):
    """格式化文件大小"""
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

def get_directory_size(directory):
    """获取目录大小"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.exists(filepath):
                total_size += os.path.getsize(filepath)
    return total_size

def validate_model_path(model_path):
    """验证模型路径是否存在"""
    if not os.path.exists(model_path):
        return False, f"模型路径不存在: {model_path}"
    
    # 检查是否包含必要的模型文件
    required_files = []
    if "FLUX" in model_path:
        required_files = ["ae.safetensors", "text_encoder", "text_encoder_2"]
    elif "Wan" in model_path:
        required_files = ["Wan2.1_VAE.pth", "high_noise_model", "low_noise_model"]
    elif "Qwen" in model_path:
        required_files = ["config.json", "tokenizer.json"]
    
    for required_file in required_files:
        file_path = os.path.join(model_path, required_file)
        if not os.path.exists(file_path):
            return False, f"缺少必要文件: {required_file}"
    
    return True, "模型路径验证通过"

def log_operation(operation, details, log_file="/root/autodl-tmp/easy2create/logs/operations.log"):
    """记录操作日志"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {operation}: {details}\n"
    
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(log_entry)

def check_dependencies():
    """检查依赖项"""
    dependencies = {
        'torch': torch.__version__,
        'cuda_available': torch.cuda.is_available(),
        'cuda_version': torch.version.cuda if torch.cuda.is_available() else None,
        'gpu_count': torch.cuda.device_count() if torch.cuda.is_available() else 0
    }
    try:
        import diffsynth
        dependencies['diffsynth'] = 'available'
    except ImportError:
        dependencies['diffsynth'] = 'not_available'
    
    try:
        import transformers
        dependencies['transformers'] = transformers.__version__
    except ImportError:
        dependencies['transformers'] = 'not_available'
    
    return dependencies

def optimize_gpu_memory():
    """优化GPU内存使用"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
        return True
    return False

def estimate_generation_time(task_type, parameters):
    """估算生成时间"""
    # 基于任务类型和参数估算时间（秒）
    base_times = {
        'text_to_image': 30,
        'image_to_image': 25,
        'text_to_video': 180,
        'image_to_video': 150,
        'prompt_optimization': 10
    }
    
    base_time = base_times.get(task_type, 60)
    
    # 根据参数调整时间
    if task_type in ['text_to_image', 'image_to_image']:
        resolution_factor = (parameters.get('width', 1024) * parameters.get('height', 1024)) / (1024 * 1024)
        base_time *= resolution_factor
        base_time *= parameters.get('num_images', 1)
    
    elif task_type in ['text_to_video', 'image_to_video']:
        duration_factor = parameters.get('duration', 4) / 4
        base_time *= duration_factor
        fps_factor = parameters.get('fps', 15) / 15
        base_time *= fps_factor
    
    return int(base_time)