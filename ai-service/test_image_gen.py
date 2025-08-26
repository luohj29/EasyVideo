import modules.image_generator as image_gen
import asyncio
import logging

if __name__ == "__main__":
    async def test_generator():
        generator = image_gen.ImageGenerator()
        
        # 测试单张图像生成
        images = await generator.generate(
            prompt="snapchat portrait of a brunette 20-year old woman, in a messy room with a poster on the wall reading 'DEEPFAKE', soft directional lighting",
            negative_prompt="blurry, low resolution, distorted, extra limbs, deformed hands, unrealistic colors, text, watermark, logo, cropped, bad anatomy, oversaturated",
            width=1024,
            height=1024,
            num_images=1,
            output_dir="./test_images",
            inference_steps=20,
            CFG_scale=2.0,
            task_id="test_001"
        )
        
        print(f"Generated images: {images}")
        
        # 测试参数验证
        valid = generator.validate_parameters(1024, 1024, 3)
        print(f"Parameters valid: {valid}")
        
        # 测试时间估算
        time_est = generator.estimate_generation_time(2, 1024, 1024)
        print(f"Estimated time: {time_est} seconds")
    
    asyncio.run(test_generator())