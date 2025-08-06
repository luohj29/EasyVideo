import streamlit as st
import os
import sys
import torch
import json
from datetime import datetime
from pathlib import Path
from PIL import Image
import numpy as np
from streamlit_option_menu import option_menu

# 添加DiffSynth-Studio到路径
sys.path.append('/root/autodl-tmp/DiffSynth-Studio')

# 导入自定义模块
from modules.prompt_optimizer import PromptOptimizer
from modules.image_generator import ImageGenerator
from modules.video_generator import VideoGenerator
from modules.storyboard_generator import StoryboardGenerator
from modules.project_manager import ProjectManager
from modules.utils import create_directories, get_gpu_memory

# 页面配置
st.set_page_config(
    page_title="Easy2Create - AI视频创作工具",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自定义CSS样式（用来为结构化文档，如HTML和XML应用添加样式（如：字体、颜色、大小））
st.markdown("""
<style>
.main-header {
    font-size: 2.5rem;
    font-weight: bold;
    text-align: center;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 2rem;
}

.feature-card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin: 1rem 0;
    border-left: 4px solid #667eea;
}

.status-success {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 0.75rem;
    border-radius: 0.25rem;
    margin: 1rem 0;
}

.status-error {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 0.25rem;
    margin: 1rem 0;
}

.gpu-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    border-radius: 10px;
    margin: 1rem 0;
}
</style>
""", unsafe_allow_html=True)

def initialize_app():
    """初始化应用程序"""
    if 'initialized' not in st.session_state:
        # 创建必要的目录
        create_directories()
        
        # 初始化组件（自定义）。字典，保护点击页面重新运行时不丢失
        st.session_state.prompt_optimizer = PromptOptimizer()
        st.session_state.image_generator = ImageGenerator()
        st.session_state.video_generator = VideoGenerator()
        st.session_state.storyboard_generator = StoryboardGenerator()
        st.session_state.project_manager = ProjectManager()
        
        st.session_state.initialized = True
        st.session_state.current_project = None
        st.session_state.generated_images = []
        st.session_state.generated_videos = []
        st.session_state.storyboard_data = []

def main():
    """主函数"""
    initialize_app()
    
    # 主标题
    st.markdown('<h1 class="main-header">🎬 Easy2Create - AI视频创作工具</h1>', unsafe_allow_html=True)
    
    # GPU信息显示
    gpu_memory = get_gpu_memory()
    st.markdown(f'''
    <div class="gpu-info">
        <h4>🖥️ GPU状态</h4>
        <p>显存使用: {gpu_memory['used']:.1f}GB / {gpu_memory['total']:.1f}GB</p>
        <p>可用显存: {gpu_memory['free']:.1f}GB</p>
    </div>
    ''', unsafe_allow_html=True)
    
    # 侧边栏导航
    with st.sidebar:
        #question1
        # st.image("D:/vscodecode/zhixing1/easy2create/zhixing_caption.png", width=200)
        st.image("/root/autodl-tmp/easy2create/zhixing_caption.png", width=200)

        selected = option_menu(
            "功能导航",
            ["项目管理", "Prompt优化", "图像生成", "视频生成", "分镜创作", "项目导出"],
            icons=["folder", "magic", "image", "play-circle", "film", "download"],
            menu_icon="cast",
            default_index=0,
            styles={
            # 👉 container 设置成 100vh，就会撑满整个侧边栏高度
            "container": {
                "padding": "0!important",
                "background-color": "#2d2d2d",   # 改成深色背景，字体白色更清晰
                "height": "100vh"
            },
            "icon": {"color": "orange", "font-size": "18px"},
            "nav-link": {
                "font-size": "16px",
                "text-align": "left",
                "margin": "0px",
                "--hover-color": "#444"
            },
            # 👉 选中项也要配合深色背景
            "nav-link-selected": {
                "background-color": "#667eea",
                "color": "white"
            },
            # 👉 普通链接文字也改成白色
            "nav-link": {"color": "white"}
        }
        )
    
    # 根据选择显示不同页面
    if selected == "项目管理":
        show_project_management()
    elif selected == "Prompt优化":
        show_prompt_optimization()
    elif selected == "图像生成":
        show_image_generation()
    elif selected == "视频生成":
        show_video_generation()
    elif selected == "分镜创作":
        show_storyboard_creation()
    elif selected == "项目导出":
        show_project_export()

def show_project_management():
    """项目管理页面"""
    st.header("📁 项目管理")
    
    col1, col2 = st.columns([2, 1]) #左右2：1布局（两列布局）
    
    with col1:
        st.subheader("创建新项目")
        project_name = st.text_input("项目名称", placeholder="输入项目名称")
        project_desc = st.text_area("项目描述", placeholder="描述您的视频创作项目")
        
        if st.button("创建项目", type="primary"):
            if project_name:
                project_id = st.session_state.project_manager.create_project(project_name, project_desc)
                st.session_state.current_project = project_id
                st.success(f"项目 '{project_name}' 创建成功！")
                st.rerun()
    
    with col2:
        st.subheader("现有项目") #展示现有项目
        projects = st.session_state.project_manager.list_projects()
        
        if projects:
            for project in projects:
                with st.expander(f"📁 {project['project_name']}"):
                    st.write(f"**描述:** {project['description']}")
                    st.write(f"**创建时间:** {project['created_time']}")
                    if st.button(f"加载项目", key=f"load_{project['project_id']}"):
                        st.session_state.current_project = project['project_id']
                        st.success(f"已加载项目: {project['project_name']}")
                        st.rerun()
        else:
            st.info("暂无项目，请创建新项目")
    
    # 当前项目信息
    # if st.session_state.current_project:
    #     current_project = st.session_state.project_manager.load_project(st.session_state.current_project)
    #     if current_project:
    #         st.markdown("---")
    #         st.subheader(f"当前项目: {current_project['project_name']}")
    #         st.write(f"**描述:** {current_project['description']}")
    #         st.write(f"**项目路径:** {current_project['path']}")
    if st.session_state.current_project:
        cur_id = st.session_state.current_project
        current_project = st.session_state.project_manager.load_project(cur_id)
        if current_project:
            st.markdown("---")
            st.subheader(f"当前项目: {current_project['project_name']}")
            st.write(f"**描述:** {current_project['description']}")

            # 用 get_project_path() 拿到磁盘路径
            proj_path = st.session_state.project_manager.get_project_path(cur_id)
            st.write(f"**项目路径:** {proj_path}")

def show_prompt_optimization():
    """Prompt优化页面"""
    st.header("✨ Prompt优化")
    
    if not st.session_state.current_project:
        st.warning("请先创建或加载一个项目")
        return
    
    st.markdown("""
    <div class="feature-card">
        <h4>🎯 智能Prompt优化</h4>
        <p>基于Qwen2.5-VL-3B-Instruct模型，结合专业的提示词公式，为您的创意提供最优化的描述。</p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1]) #左右1：1分栏
    
    with col1:
        st.subheader("输入原始创意")
        user_prompt = st.text_area(
            "描述您的创意",
            placeholder="例如：一只小猫在花园里玩耍",
            height=150
        )
        
        prompt_type = st.selectbox(
            "选择提示词类型",
            ["通用型", "细节型", "剧情型", "艺术型"],
            help="不同类型适用于不同的创作需求"
        )
        
        style_preference = st.multiselect(
            "风格偏好",
            ["写实风格", "卡通风格", "水墨画风格", "赛博朋克风格", "电影风格", "超现实主义风格"],
            default=["写实风格"]
        )
        
        if st.button("优化Prompt", type="primary"):
            if user_prompt:
                with st.spinner("正在优化Prompt..."):
                    optimized_prompt = st.session_state.prompt_optimizer.optimize_prompt(
                        user_prompt, prompt_type, style_preference
                    )
                    st.session_state.optimized_prompt = optimized_prompt
                    st.success("Prompt优化完成！")
    
    with col2:
        st.subheader("优化结果")
        if hasattr(st.session_state, 'optimized_prompt'):
            st.text_area(
                "优化后的Prompt",
                value=st.session_state.optimized_prompt,
                height=200,
                key="optimized_display"
            )
            
            if st.button("保存到项目"):
                st.session_state.project_manager.save_prompt(
                    st.session_state.current_project,
                    user_prompt,
                    st.session_state.optimized_prompt
                )
                st.success("Prompt已保存到项目")
        else:
            st.info("请先输入创意并点击优化")

def show_image_generation():
    """图像生成页面"""
    st.header("🖼️ 图像生成")
    
    if not st.session_state.current_project:
        st.warning("请先创建或加载一个项目")
        return
    
    st.markdown("""
    <div class="feature-card">
        <h4>🎨 FLUX图像生成</h4>
        <p>使用FLUX.1-dev模型生成高质量图像，支持文本到图像和图像编辑功能。</p>
    </div>
    """, unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["文本生图", "图像编辑"])
    
    with tab1:
        col1, col2 = st.columns([1, 1])
        
        with col1:
            prompt = st.text_area(
                "图像描述",
                value=getattr(st.session_state, 'optimized_prompt', ''),
                height=100,
                placeholder="输入图像描述或使用优化后的Prompt"
            )
            
            negative_prompt = st.text_area(
                "负面提示词",
                value="低质量，模糊，变形，丑陋",
                height=80
            )
            
            col_w, col_h = st.columns(2)
            with col_w:
                width = st.selectbox("宽度", [512, 768, 1024, 1280], index=2)
            with col_h:
                height = st.selectbox("高度", [512, 768, 1024, 1280], index=2)
            
            seed = st.number_input("随机种子", value=42, min_value=0)
            num_images = st.slider("生成数量", 1, 4, 1)
            
            if st.button("生成图像", type="primary"):
                if prompt:
                    with st.spinner("正在生成图像..."):
                        images = st.session_state.image_generator.generate_images(
                            prompt=prompt,
                            negative_prompt=negative_prompt,
                            width=width,
                            height=height,
                            seed=seed,
                            num_images=num_images,
                            project_id=st.session_state.current_project
                        )
                        st.session_state.generated_images.extend(images)
                        st.success(f"成功生成 {len(images)} 张图像！")
        
        with col2:
            st.subheader("生成结果")
            if st.session_state.generated_images:
                for i, img_path in enumerate(st.session_state.generated_images[-4:]):
                    if os.path.exists(img_path):
                        image = Image.open(img_path)
                        st.image(image, caption=f"生成图像 {i+1}", use_column_width=True)
                        
                        col_download, col_use = st.columns(2)
                        with col_download:
                            with open(img_path, "rb") as file:
                                st.download_button(
                                    "下载",
                                    file.read(),
                                    file_name=os.path.basename(img_path),
                                    mime="image/jpeg",
                                    key=f"download_img_{i}"
                                )
                        with col_use:
                            if st.button("用于视频生成", key=f"use_img_{i}"):
                                st.session_state.selected_image = img_path
                                st.success("图像已选择用于视频生成")
            else:
                st.info("暂无生成的图像")
    
    with tab2:
        st.subheader("图像编辑")
        uploaded_file = st.file_uploader("上传图像", type=["jpg", "jpeg", "png"])
        
        if uploaded_file:
            image = Image.open(uploaded_file)
            st.image(image, caption="原始图像", width=300)
            
            edit_prompt = st.text_area("编辑描述", placeholder="描述您想要的修改")
            
            if st.button("编辑图像"):
                if edit_prompt:
                    with st.spinner("正在编辑图像..."):
                        edited_image = st.session_state.image_generator.edit_image(
                            image, edit_prompt, st.session_state.current_project
                        )
                        if edited_image:
                            st.image(edited_image, caption="编辑后图像", width=300)
                            st.success("图像编辑完成！")

def show_video_generation():
    """视频生成页面"""
    st.header("🎬 视频生成")
    
    if not st.session_state.current_project:
        st.warning("请先创建或加载一个项目")
        return
    
    st.markdown("""
    <div class="feature-card">
        <h4>🎥 Wan2.2视频生成</h4>
        <p>使用Wan2.2-T2V-A14B和I2V-A14B模型，支持文本到视频和图像到视频生成。</p>
    </div>
    """, unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["文本生视频", "图像生视频"])
    
    with tab1:
        col1, col2 = st.columns([1, 1])
        
        with col1:
            prompt = st.text_area(
                "视频描述",
                value=getattr(st.session_state, 'optimized_prompt', ''),
                height=100,
                placeholder="描述您想要的视频内容"
            )
            
            negative_prompt = st.text_area(
                "负面提示词",
                value="色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量",
                height=80
            )
            
            col_fps, col_duration = st.columns(2)
            with col_fps:
                fps = st.selectbox("帧率", [15, 24, 30], index=0)
            with col_duration:
                duration = st.slider("时长(秒)", 2, 10, 4)
            
            seed = st.number_input("随机种子", value=42, min_value=0, key="video_seed")
            
            if st.button("生成视频", type="primary"):
                if prompt:
                    with st.spinner("正在生成视频，请耐心等待..."):
                        video_path = st.session_state.video_generator.generate_text_to_video(
                            prompt=prompt,
                            negative_prompt=negative_prompt,
                            fps=fps,
                            duration=duration,
                            seed=seed,
                            project_id=st.session_state.current_project
                        )
                        if video_path:
                            st.session_state.generated_videos.append(video_path)
                            st.success("视频生成完成！")
        
        with col2:
            st.subheader("生成结果")
            if st.session_state.generated_videos:
                for i, video_path in enumerate(st.session_state.generated_videos[-3:]):
                    if os.path.exists(video_path):
                        st.video(video_path)
                        
                        with open(video_path, "rb") as file:
                            st.download_button(
                                "下载视频",
                                file.read(),
                                file_name=os.path.basename(video_path),
                                mime="video/mp4",
                                key=f"download_video_{i}"
                            )
            else:
                st.info("暂无生成的视频")
    
    with tab2:
        st.subheader("图像生视频")
        
        # 选择图像源
        image_source = st.radio(
            "选择图像源",
            ["上传图像", "使用生成的图像"]
        )
        
        input_image = None
        if image_source == "上传图像":
            uploaded_file = st.file_uploader("上传图像", type=["jpg", "jpeg", "png"], key="i2v_upload")
            if uploaded_file:
                input_image = Image.open(uploaded_file)
                st.image(input_image, caption="输入图像", width=300)
        else:
            if hasattr(st.session_state, 'selected_image') and st.session_state.selected_image:
                input_image = Image.open(st.session_state.selected_image)
                st.image(input_image, caption="选择的图像", width=300)
            else:
                st.info("请先在图像生成页面选择一张图像")
        
        if input_image:
            motion_prompt = st.text_area(
                "运动描述",
                placeholder="描述图像中物体的运动方式",
                height=80
            )
            
            if st.button("生成视频", key="i2v_generate"):
                if motion_prompt:
                    with st.spinner("正在从图像生成视频..."):
                        video_path = st.session_state.video_generator.generate_image_to_video(
                            image=input_image,
                            prompt=motion_prompt,
                            project_id=st.session_state.current_project
                        )
                        if video_path:
                            st.session_state.generated_videos.append(video_path)
                            st.success("视频生成完成！")
                            st.video(video_path)

def show_storyboard_creation():
    """分镜创作页面"""
    st.header("🎭 分镜创作")
    
    if not st.session_state.current_project:
        st.warning("请先创建或加载一个项目")
        return
    
    st.markdown("""
    <div class="feature-card">
        <h4>🎬 智能分镜生成</h4>
        <p>根据剧本自动生成分镜，为每个分镜优化prompt并生成对应的图像和视频。</p>
    </div>
    """, unsafe_allow_html=True)
    
    tab1, tab2, tab3 = st.tabs(["剧本输入", "分镜编辑", "视频合成"])
    
    with tab1:
        st.subheader("输入剧本")
        script = st.text_area(
            "剧本内容",
            placeholder="输入您的剧本，系统将自动分析并生成分镜...",
            height=200
        )
        
        col1, col2 = st.columns(2)
        with col1:
            scene_duration = st.slider("每个分镜时长(秒)", 2, 8, 4)
        with col2:
            max_scenes = st.slider("最大分镜数", 3, 10, 6)
        
        if st.button("生成分镜", type="primary"):
            if script:
                with st.spinner("正在分析剧本并生成分镜..."):
                    storyboard = st.session_state.storyboard_generator.generate_storyboard(
                        script, scene_duration, max_scenes
                    )
                    st.session_state.storyboard_data = storyboard
                    st.success(f"成功生成 {len(storyboard)} 个分镜！")
    
    with tab2:
        st.subheader("分镜编辑")
        
        if st.session_state.storyboard_data:
            for i, scene in enumerate(st.session_state.storyboard_data):
                with st.expander(f"分镜 {i+1}: {scene['title']}", expanded=True):
                    col1, col2 = st.columns([2, 1])
                    
                    with col1:
                        # 编辑分镜信息
                        scene['title'] = st.text_input(f"标题", value=scene['title'], key=f"title_{i}")
                        scene['description'] = st.text_area(f"描述", value=scene['description'], key=f"desc_{i}")
                        scene['optimized_prompt'] = st.text_area(f"优化后的Prompt", value=scene['optimized_prompt'], key=f"prompt_{i}")
                        scene['duration'] = st.slider(f"时长(秒)", 2, 10, scene['duration'], key=f"duration_{i}")
                    
                    with col2:
                        # 生成分镜内容
                        if st.button(f"生成图像", key=f"gen_img_{i}"):
                            with st.spinner(f"正在生成分镜 {i+1} 的图像..."):
                                image_path = st.session_state.image_generator.generate_images(
                                    prompt=scene['optimized_prompt'],
                                    project_id=st.session_state.current_project,
                                    filename=f"scene_{i+1}_image.jpg"
                                )
                                if image_path:
                                    scene['image_path'] = image_path[0]
                                    st.success("图像生成完成")
                        
                        if 'image_path' in scene and os.path.exists(scene['image_path']):
                            st.image(scene['image_path'], width=200)
                            
                            if st.button(f"生成视频", key=f"gen_video_{i}"):
                                with st.spinner(f"正在生成分镜 {i+1} 的视频..."):
                                    video_path = st.session_state.video_generator.generate_image_to_video(
                                        image=Image.open(scene['image_path']),
                                        prompt=scene['optimized_prompt'],
                                        project_id=st.session_state.current_project,
                                        filename=f"scene_{i+1}_video.mp4"
                                    )
                                    if video_path:
                                        scene['video_path'] = video_path
                                        st.success("视频生成完成")
                        
                        if 'video_path' in scene and os.path.exists(scene['video_path']):
                            st.video(scene['video_path'])
        else:
            st.info("请先在剧本输入页面生成分镜")
    
    with tab3:
        st.subheader("视频合成")
        
        if st.session_state.storyboard_data:
            # 检查所有分镜是否都有视频
            completed_scenes = [scene for scene in st.session_state.storyboard_data if 'video_path' in scene]
            
            st.write(f"已完成分镜: {len(completed_scenes)} / {len(st.session_state.storyboard_data)}")
            
            if len(completed_scenes) > 1:
                if st.button("合成最终视频", type="primary"):
                    with st.spinner("正在合成最终视频..."):
                        final_video = st.session_state.storyboard_generator.merge_videos(
                            completed_scenes,
                            st.session_state.current_project
                        )
                        if final_video:
                            st.success("视频合成完成！")
                            st.video(final_video)
                            
                            with open(final_video, "rb") as file:
                                st.download_button(
                                    "下载最终视频",
                                    file.read(),
                                    file_name="final_video.mp4",
                                    mime="video/mp4"
                                )
            else:
                st.info("请至少完成2个分镜的视频生成")
        else:
            st.info("请先生成分镜")

def show_project_export():
    """项目导出页面"""
    st.header("📤 项目导出")
    
    if not st.session_state.current_project:
        st.warning("请先创建或加载一个项目")
        return
    
    current_project = st.session_state.project_manager.load_project(st.session_state.current_project)
    
    if current_project:
        st.subheader(f"导出项目: {current_project['project_name']}")
        
        # 项目统计
        project_stats = st.session_state.project_manager.get_project_statistics(st.session_state.current_project)
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("生成图像", project_stats['file_counts']['images'])
        with col2:
            st.metric("生成视频", project_stats['file_counts']['videos'])
        with col3:
            st.metric("分镜脚本", project_stats['file_counts']['scripts'])
        with col4:
            st.metric("分镜数量", project_stats['file_counts']['exports'])
        
        # 导出选项
        st.subheader("导出选项")
        
        export_images = st.checkbox("导出图像", value=True)
        export_videos = st.checkbox("导出视频", value=True)
        export_prompts = st.checkbox("导出Prompt记录", value=True)
        export_storyboard = st.checkbox("导出分镜数据", value=True)
        
        if st.button("打包导出", type="primary"):
            with st.spinner("正在打包项目文件..."):
                zip_path = st.session_state.project_manager.export_project(
                    st.session_state.current_project,
                    export_images,
                    export_videos,
                    export_prompts,
                    export_storyboard
                )
                
                if zip_path and os.path.exists(zip_path):
                    with open(zip_path, "rb") as file:
                        st.download_button(
                            "下载项目包",
                            file.read(),
                            file_name=f"{current_project['project_name']}_export.zip",
                            mime="application/zip"
                        )
                    st.success("项目导出完成！")

if __name__ == "__main__":
    main()