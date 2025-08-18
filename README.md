# EasyVideo - AI视频制作软件

一个基于AI的视频制作软件，支持文生图、图生视频、剧本生成等功能。

## 🚀 功能特性

- **文生图功能**: 基于FLUX模型的高质量图像生成
- **图生视频**: 将静态图像转换为动态视频
- **剧本生成**: AI辅助生成视频剧本和故事板
- **项目管理**: 完整的项目创建、编辑、导出功能
- **实时预览**: 支持生成过程的实时预览
- **多格式支持**: 支持多种图像和视频格式

## 📋 系统要求

### 基础要求
- Node.js 12.22.9+ (已针对此版本优化)
- Python 3.7+
- npm 6+
- 4GB+ RAM
- 10GB+ 可用磁盘空间

### GPU要求（可选，用于AI模型加速）
- NVIDIA GPU with CUDA support
- 8GB+ VRAM (推荐)
- CUDA 11.0+

## 🛠️ 安装与启动

### 快速启动

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd EasyVideo
   ```

2. **一键启动**
   ```bash
   ./start.sh
   ```
   
   首次运行会自动安装所有依赖，然后启动所有服务。

3. **访问应用**
   - 前端界面: http://localhost:5173
   - 后端API: http://localhost:3001
   - AI服务: http://localhost:8001

### 手动安装

如果需要手动安装各个组件：

1. **安装前端依赖**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

3. **安装AI服务依赖**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   ```

## ⚙️ 配置

### 环境变量配置

1. 复制环境变量模板：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，配置必要的参数：
   ```bash
   # 服务端口
   BACKEND_PORT=3001
   AI_SERVICE_PORT=8001
   FRONTEND_PORT=5173
   
   # AI模型路径（可选）
   FLUX_MODEL_PATH=/path/to/flux/model
   VIDEO_MODEL_PATH=/path/to/video/model
   
   # GPU配置
   CUDA_VISIBLE_DEVICES=0
   ```

### 系统配置

主配置文件位于 `config/config.json`，包含以下配置项：

- **系统配置**: 日志级别、并发任务数、目录路径等
- **模型配置**: AI模型的启用状态、路径、设备等
- **生成配置**: 图像和视频生成的默认参数
- **API配置**: 服务端口、CORS、限流等
- **存储配置**: 自动清理、备份等

## 🎯 使用指南

### 基本工作流程

1. **创建项目**
   - 在首页点击"新建项目"
   - 填写项目名称和描述
   - 选择项目模板

2. **生成内容**
   - **文生图**: 输入描述文字，生成图像
   - **图生视频**: 上传图像，生成动态视频
   - **剧本生成**: 输入主题，生成完整剧本

3. **编辑和优化**
   - 调整生成参数
   - 预览和编辑结果
   - 添加特效和转场

4. **导出项目**
   - 选择导出格式
   - 设置输出质量
   - 下载最终作品

### 高级功能

#### AI模型配置

如果您有本地AI模型，可以在配置中启用：

1. 编辑 `config/config.json`
2. 设置模型路径和参数：
   ```json
   {
     "models": {
       "flux": {
         "enabled": true,
         "path": "/path/to/flux/model",
         "device": "cuda",
         "precision": "fp16"
       }
     }
   }
   ```

#### 批量处理

支持批量生成图像和视频：

1. 准备批量任务配置文件
2. 使用API接口提交批量任务
3. 监控任务进度和结果

## 🔧 开发指南

### 项目结构

```
EasyVideo/
├── frontend/          # React前端应用
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/        # 页面
│   │   ├── hooks/        # 自定义Hook
│   │   └── utils/        # 工具函数
│   └── package.json
├── backend/           # Node.js后端服务
│   ├── src/
│   │   ├── routes/       # 路由
│   │   ├── middleware/   # 中间件
│   │   └── utils/        # 工具函数
│   └── package.json
├── ai-service/        # Python AI服务
│   ├── modules/          # AI模块
│   ├── api_server.py     # API服务器
│   └── requirements.txt
├── config/            # 配置文件
├── outputs/           # 输出文件
├── projects/          # 项目文件
└── docs/             # 文档
```

### 开发模式启动

1. **前端开发**
   ```bash
   cd frontend
   npm run dev
   ```

2. **后端开发**
   ```bash
   cd backend
   npm run dev
   ```

3. **AI服务开发**
   ```bash
   cd ai-service
   python api_server.py
   ```

### API文档

#### 后端API (http://localhost:3001)

- `GET /api/system/status` - 系统状态
- `POST /api/generation/optimize-prompt` - 优化提示词
- `POST /api/generation/text-to-image` - 文生图
- `POST /api/generation/image-to-video` - 图生视频
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目

#### AI服务API (http://localhost:8001)

- `GET /health` - 健康检查
- `POST /optimize-prompt` - 优化提示词
- `POST /generate-image` - 生成图像
- `POST /generate-video` - 生成视频
- `POST /generate-storyboard` - 生成故事板

## 🐛 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. **端口被占用**
   ```bash
   # 检查端口占用
   lsof -i :3001
   lsof -i :5173
   lsof -i :8001
   
   # 停止所有服务
   ./stop.sh
   ```

3. **GPU内存不足**
   - 降低批处理大小
   - 使用较小的模型
   - 启用模型量化

4. **生成速度慢**
   - 检查GPU驱动和CUDA版本
   - 优化模型精度设置
   - 增加系统内存

### 日志查看

```bash
# 查看所有服务日志
tail -f logs/*.log

# 查看特定服务日志
tail -f logs/frontend.log
tail -f logs/backend.log
tail -f logs/ai-service.log
```

### 性能优化

1. **系统优化**
   - 增加系统内存
   - 使用SSD存储
   - 优化GPU设置

2. **应用优化**
   - 调整并发任务数
   - 启用缓存机制
   - 优化模型参数

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架
- [FastAPI](https://fastapi.tiangolo.com/) - AI服务框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Vite](https://vitejs.dev/) - 构建工具

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)
4. 联系开发团队

---

**EasyVideo** - 让AI视频制作变得简单！ 🎬✨