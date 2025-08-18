#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试图生视频和分镜生成功能
"""

import requests
import json
import time
import os
from pathlib import Path

# 服务地址
BACKEND_URL = "http://localhost:3002"
AI_SERVICE_URL = "http://localhost:8000"

def test_ai_service_health():
    """测试AI服务健康状态"""
    print("\n=== 测试AI服务健康状态 ===")
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health")
        print(f"AI服务状态: {response.status_code}")
        if response.status_code == 200:
            print(f"响应: {response.json()}")
            return True
    except Exception as e:
        print(f"AI服务连接失败: {e}")
    return False

def test_backend_health():
    """测试后端服务健康状态"""
    print("\n=== 测试后端服务健康状态 ===")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"后端服务状态: {response.status_code}")
        if response.status_code == 200:
            print(f"响应: {response.json()}")
            return True
        else:
            print(f"❌ 后端服务返回错误状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"后端服务连接失败: {e}")
        return False

def test_storyboard_generation():
    """测试分镜生成功能"""
    print("\n=== 测试分镜生成功能 ===")
    try:
        # 直接测试AI服务的分镜生成
        payload = {
            "script": "一个关于友谊的温馨故事",
            "scene_count": 4,
            "style": "温馨"
        }
        
        response = requests.post(f"{AI_SERVICE_URL}/storyboard/generate", json=payload)
        print(f"分镜生成状态: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("分镜生成成功!")
            print(f"剧本场景数: {len(result.get('script', {}).get('scenes', []))}")
            print(f"分镜场景数: {len(result.get('storyboard', {}).get('scenes', []))}")
            return True
        else:
            print(f"分镜生成失败: {response.text}")
    except Exception as e:
        print(f"分镜生成测试失败: {e}")
    return False

def test_image_upload():
    """测试图片上传功能"""
    print("\n=== 测试图片上传功能 ===")
    try:
        # 创建一个测试图片文件
        test_image_path = "/tmp/test_image.jpg"
        
        # 创建一个简单的测试图片（1x1像素的JPEG）
        import base64
        from PIL import Image
        
        # 创建一个小的测试图片
        img = Image.new('RGB', (100, 100), color='red')
        img.save(test_image_path, 'JPEG')
        
        # 上传图片
        with open(test_image_path, 'rb') as f:
            files = {'image': ('test.jpg', f, 'image/jpeg')}
            response = requests.post(f"{BACKEND_URL}/api/generation/upload-image", files=files)
        
        print(f"图片上传状态: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("图片上传成功!")
            print(f"图片ID: {result.get('image_id')}")
            print(f"图片路径: {result.get('image_path')}")
            
            # 清理测试文件
            os.remove(test_image_path)
            return result.get('image_id')
        else:
            print(f"图片上传失败: {response.text}")
            # 清理测试文件
            if os.path.exists(test_image_path):
                os.remove(test_image_path)
    except Exception as e:
        print(f"图片上传测试失败: {e}")
        # 清理测试文件
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
    return None

def test_image_to_video(image_id):
    """测试图生视频功能"""
    print("\n=== 测试图生视频功能 ===")
    if not image_id:
        print("没有有效的图片ID，跳过图生视频测试")
        return False
        
    try:
        payload = {
            "image_id": image_id,
            "motion_prompt": "轻柔的风吹动",
            "fps": 15,
            "duration": 3,
            "seed": 42,
            "motion_strength": 0.5,
            "guidance_scale": 7.5,
            "num_inference_steps": 25
        }
        
        response = requests.post(f"{BACKEND_URL}/api/generation/image-to-video", json=payload)
        print(f"图生视频状态: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("图生视频任务创建成功!")
            print(f"任务ID: {result.get('id')}")
            print(f"任务状态: {result.get('status')}")
            print(f"任务类型: {result.get('type')}")
            return True
        else:
            print(f"图生视频失败: {response.text}")
    except Exception as e:
        print(f"图生视频测试失败: {e}")
    return False

def main():
    """主测试函数"""
    print("开始测试EasyVideo功能...")
    
    # 测试服务健康状态
    ai_healthy = test_ai_service_health()
    backend_healthy = test_backend_health()
    
    if not ai_healthy:
        print("\n❌ AI服务不可用，请检查AI服务是否正常启动")
        return
        
    if not backend_healthy:
        print("\n❌ 后端服务不可用，请检查后端服务是否正常启动")
        return
    
    # 测试分镜生成
    storyboard_success = test_storyboard_generation()
    
    # 测试图片上传
    image_id = test_image_upload()
    
    # 测试图生视频
    video_success = test_image_to_video(image_id)
    
    # 总结测试结果
    print("\n=== 测试结果总结 ===")
    print(f"AI服务健康状态: {'✅ 正常' if ai_healthy else '❌ 异常'}")
    print(f"后端服务健康状态: {'✅ 正常' if backend_healthy else '❌ 异常'}")
    print(f"分镜生成功能: {'✅ 正常' if storyboard_success else '❌ 异常'}")
    print(f"图片上传功能: {'✅ 正常' if image_id else '❌ 异常'}")
    print(f"图生视频功能: {'✅ 正常' if video_success else '❌ 异常'}")
    
    if all([ai_healthy, backend_healthy, storyboard_success, image_id, video_success]):
        print("\n🎉 所有功能测试通过！")
    else:
        print("\n⚠️  部分功能存在问题，请检查日志")

if __name__ == "__main__":
    main()