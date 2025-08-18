#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试视频生成功能
"""

import requests
import json
import time
import os
from pathlib import Path

# API配置
AI_SERVICE_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:3000"

def test_ai_service_health():
    """测试AI服务健康状态"""
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health")
        print(f"AI服务健康检查: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"AI服务状态: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return True
        return False
    except Exception as e:
        print(f"AI服务连接失败: {e}")
        return False

def test_video_generation():
    """测试图生视频功能"""
    try:
        # 创建测试图片路径
        test_image_path = "/root/autodl-tmp/EasyVideo/test_image.jpg"
        
        # 如果测试图片不存在，创建一个简单的测试图片
        if not os.path.exists(test_image_path):
            from PIL import Image, ImageDraw
            # 创建一个简单的测试图片
            img = Image.new('RGB', (512, 512), color='lightblue')
            draw = ImageDraw.Draw(img)
            draw.rectangle([100, 100, 400, 400], fill='red')
            draw.text((200, 250), "Test Image", fill='white')
            img.save(test_image_path)
            print(f"创建测试图片: {test_image_path}")
        
        # 测试视频生成
        data = {
            "image_path": test_image_path,
            "prompt": "A beautiful sunset scene with gentle motion",
            "duration": 3.0,
            "fps": 16,
            "motion_strength": 0.5
        }
        
        print("开始测试图生视频...")
        print(f"请求数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            f"{AI_SERVICE_URL}/video/generate",
            json=data,
            timeout=300  # 5分钟超时
        )
        
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"视频生成成功: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            # 检查生成的视频文件是否存在
            if 'video_path' in result:
                video_path = result['video_path']
                if os.path.exists(video_path):
                    file_size = os.path.getsize(video_path)
                    print(f"视频文件存在: {video_path}, 大小: {file_size} bytes")
                else:
                    print(f"视频文件不存在: {video_path}")
            
            return True
        else:
            print(f"视频生成失败: {response.text}")
            return False
            
    except Exception as e:
        print(f"视频生成测试失败: {e}")
        return False

def test_model_status():
    """测试模型状态"""
    try:
        response = requests.get(f"{AI_SERVICE_URL}/models/status")
        print(f"模型状态检查: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"模型状态: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return True
        return False
    except Exception as e:
        print(f"模型状态检查失败: {e}")
        return False

def main():
    print("=== 视频生成功能测试 ===")
    
    # 1. 测试AI服务健康状态
    print("\n1. 测试AI服务健康状态")
    if not test_ai_service_health():
        print("AI服务不可用，退出测试")
        return
    
    # 2. 测试模型状态
    print("\n2. 测试模型状态")
    test_model_status()
    
    # 3. 测试视频生成
    print("\n3. 测试图生视频功能")
    if test_video_generation():
        print("\n✅ 视频生成测试通过")
    else:
        print("\n❌ 视频生成测试失败")
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    main()