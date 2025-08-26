import asyncio
from modules.video_generator import VideoGenerator

async def main():
    generator = VideoGenerator()
    image_path = "/root/autodl-tmp/EasyVideo/naked.png"  # 请确保此图片存在于 ai-service 目录下
    prompt = "A beatutiful woman is dancing in thr room"
    task_id = "test_video_001"

    # 可选：定义进度回调
    def progress_callback(progress, status):
        print(f"进度: {progress}% - {status}")

    generator.set_progress_callback(task_id, progress_callback)

    try:
        output_path = await generator.generate_from_image(
            image_path=image_path,
            prompt=prompt,
            duration=5.0,
            fps=16,
            task_id=task_id
        )
        print("生成视频路径：", output_path)
    except Exception as e:
        print("视频生成失败：", e)

if __name__ == "__main__":
    asyncio.run(main())