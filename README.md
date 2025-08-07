# EasyVideo - AI视频可视化创作应用

一个完整的AI视频创作平台，集成了Prompt优化、图像生成、视频生成、分镜创作和项目管理等功能。

## 功能特性

### 🎬 分镜创作
- **智能分镜脚本生成**：基于故事描述自动生成详细分镜脚本
- **分镜图像生成**：为每个分镜生成首尾关键帧图像
- **分镜视频制作**：将分镜图像转换为流畅视频
- **视频拼接合成**：自动合并所有分镜为完整视频
- **转场效果**：支持添加专业转场效果

### 🖼️ 图像生成
- **文本到图像**：使用FLUX模型生成高质量图像
- **图像编辑**：支持图像修改和优化
- **图像变体**：生成同一主题的多种变体
- **超分辨率**：提升图像分辨率和质量
- **批量生成**：一次生成多张图像

### 🎥 视频生成
- **文本到视频**：使用Wan2.2模型生成视频
- **图像到视频**：将静态图像转换为动态视频
- **视频合并**：合并多个视频片段
- **视频信息获取**：查看视频详细信息

### ✨ Prompt优化
- **智能优化**：使用Qwen2.5-VL模型优化提示词
- **多种公式**：支持通用型、细节型、剧情型、艺术型四种优化公式
- **批量优化**：一次优化多个提示词
- **优化历史**：保存和查看优化记录

### 📁 项目管理
- **项目创建**：创建和管理多个项目
- **文件组织**：自动整理图像、视频和脚本文件
- **项目导出**：导出完整项目包
- **项目导入**：导入已有项目
- **统计信息**：查看项目详细统计

## 技术架构

### 模型支持
- **Prompt优化**：Qwen2.5-VL-3B-Instruct
- **图像生成**：FLUX.1-Krea-dev, FLUX.1-Kontext-dev
- **视频生成**：Wan2.2-T2V-A14B, Wan2.2-I2V-A14B, Wan2.2-TI2V-5B

### 框架依赖
- **UI框架**：Streamlit
- **AI框架**：DiffSynth-Studio
- **图像处理**：PIL, OpenCV
- **视频处理**：OpenCV, FFmpeg

## 安装部署

### 环境要求
- Python 3.8+
- CUDA 11.8+ (GPU推荐)
- 32GB GPU显存 (推荐)
- 16GB+ 系统内存

### 安装步骤

1. **克隆项目**
```bash
cd easy2create
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```
Tips：
diffsynth库需要从最新的github仓库下载：<https://github.com/modelscope/DiffSynth-Studio>
```bash
git clone https://github.com/modelscope/DiffSynth-Studio.git  
cd DiffSynth-Studio
pip install -e .
```

3. **验证模型路径**
确保以下模型已下载到指定位置：
- `./Qwen/Qwen2.5-VL-3B-Instruct`
- `./Wan-AI/Wan2.2-T2V-A14B`
- `./Wan-AI/Wan2.2-I2V-A14B`
- `./black-forest-labs/FLUX.1-Krea-dev`
- `./black-forest-labs/FLUX.1-Kontext-dev`

4. **启动应用**
```bash
streamlit run app.py --server.port 8501 --server.address 0.0.0.0
```

## 使用指南

### 快速开始

1. **访问应用**
   - 打开浏览器访问 `http://localhost:8501`

2. **创建项目**
   - 在项目管理页面创建新项目
   - 设置项目名称和描述

3. **分镜创作**
   - 进入分镜创作页面
   - 输入故事描述
   - 设置分镜数量和风格
   - 点击"一键生成完整分镜视频"

4. **基础创作**
   - 使用图像生成页面创建单张图像
   - 使用视频生成页面创建单个视频
   - 使用Prompt优化页面优化提示词

### 高级功能

#### 分镜创作工作流
1. **脚本生成**：输入故事描述，AI自动生成分镜脚本
2. **图像生成**：为每个分镜生成首尾关键帧
3. **视频制作**：将关键帧转换为流畅视频
4. **后期合成**：合并所有分镜，添加转场效果

#### Prompt优化策略
- **通用型**：适用于一般场景描述
- **细节型**：强调细节和质感
- **剧情型**：适用于故事情节描述
- **艺术型**：强调艺术风格和美感

#### 项目管理最佳实践
- 为每个创作主题创建独立项目
- 定期清理临时文件
- 导出重要项目进行备份
- 使用统计功能监控资源使用

## 目录结构

```
easy2create/
├── app.py                 # 主应用入口
├── requirements.txt       # 依赖包列表
├── prompt_way.md         # Prompt优化指南
├── README.md             # 项目说明文档
├── modules/              # 核心模块
│   ├── __init__.py
│   ├── utils.py          # 工具函数
│   ├── prompt_optimizer.py    # Prompt优化器
│   ├── image_generator.py     # 图像生成器
│   ├── video_generator.py     # 视频生成器
│   ├── storyboard_generator.py # 分镜生成器
│   └── project_manager.py     # 项目管理器
├── outputs/              # 输出文件目录
│   ├── images/           # 生成的图像
│   ├── videos/           # 生成的视频
│   └── storyboards/      # 分镜文件
├── projects/             # 项目文件目录
├── templates/            # 模板文件
├── exports/              # 导出文件
└── logs/                 # 日志文件
```

## 性能优化

### GPU内存管理
- 自动显存管理，限制使用32GB
- 模型按需加载和卸载
- 支持模型offload到CPU

### 生成时间估算
- 图像生成：约30-60秒/张
- 视频生成：约2-5分钟/段
- 分镜视频：根据场景数量线性增长

### 质量设置建议
- **高质量**：适用于最终作品
- **标准质量**：适用于预览和测试
- **快速模式**：适用于概念验证

## 故障排除

### 常见问题

1. **模型加载失败**
   - 检查模型路径是否正确
   - 确认模型文件完整性
   - 检查GPU显存是否充足

2. **生成质量不佳**
   - 优化Prompt描述
   - 调整生成参数
   - 尝试不同的优化公式

3. **内存不足**
   - 降低批量生成数量
   - 启用模型offload
   - 清理临时文件

4. **生成速度慢**
   - 检查GPU使用率
   - 优化Prompt长度
   - 使用快速模式

### 日志查看
```bash
# 查看应用日志
tail -f logs/operations.log

# 查看错误日志
tail -f logs/errors.log
```

## 更新日志

### v1.0.0 (2024-12-19)
- 初始版本发布
- 支持完整分镜创作工作流
- 集成Qwen2.5-VL Prompt优化
- 支持FLUX图像生成
- 支持Wan2.2视频生成
- 完整的项目管理系统
- Streamlit可视化界面

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

### 开发环境设置
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

## 致谢

感谢以下开源项目的支持：
- [DiffSynth-Studio](https://github.com/modelscope/DiffSynth-Studio)
- [Streamlit](https://streamlit.io/)
- [Qwen2.5-VL](https://github.com/QwenLM/Qwen2.5)
- [FLUX](https://github.com/black-forest-labs/flux)
- [Wan-AI](https://github.com/Wan-AI)

---

**EasyVideo** - 让AI视频创作变得简单高效！
