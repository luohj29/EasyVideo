#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Conda环境名称
CONDA_ENV_NAME="demo"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Conda环境名称
CONDA_ENV_NAME="demo"

# 激活conda环境
activate_conda_env() {
    log_step "激活conda环境: $CONDA_ENV_NAME"
    
    # 检查conda是否可用
    if ! command -v conda &> /dev/null; then
        log_error "conda 未安装或未在PATH中，请先安装 Anaconda/Miniconda"
        exit 1
    fi
    
    # 初始化conda
    eval "$(conda shell.bash hook)"
    
    # 检查环境是否存在
    if ! conda env list | grep -q "^$CONDA_ENV_NAME "; then
        log_error "conda环境 '$CONDA_ENV_NAME' 不存在，请先创建该环境"
        log_info "创建环境命令: conda create -n $CONDA_ENV_NAME python=3.8"
        exit 1
    fi
    
    # 激活环境
    conda activate $CONDA_ENV_NAME
    if [ $? -eq 0 ]; then
        log_info "成功激活conda环境: $CONDA_ENV_NAME"
        log_info "Python版本: $(python --version)"
    else
        log_error "激活conda环境失败"
        exit 1
    fi
}

# 检查系统依赖
check_dependencies() {
    log_step "检查系统依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    log_info "Node.js 版本: $(node --version)"
    
    # 检查Python (在conda环境中)
    if ! command -v python &> /dev/null; then
        log_error "Python 未在当前环境中找到"
        exit 1
    fi
    log_info "Python 版本: $(python --version)"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    log_info "npm 版本: $(npm --version)"
}

# 安装前端依赖
install_frontend_deps() {
    log_step "安装前端依赖..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖包..."
        npm install
        if [ $? -ne 0 ]; then
            log_error "前端依赖安装失败"
            exit 1
        fi
    else
        log_info "前端依赖已存在，跳过安装"
    fi
    cd ..
}

# 安装后端依赖
install_backend_deps() {
    log_step "安装后端依赖..."
    cd backend
    if [ ! -d "node_modules" ]; then
        log_info "安装后端依赖包..."
        npm install
        if [ $? -ne 0 ]; then
            log_error "后端依赖安装失败"
            exit 1
        fi
    else
        log_info "后端依赖已存在，跳过安装"
    fi
    cd ..
}

# 安装AI服务依赖
install_ai_deps() {
    log_step "安装AI服务依赖..."
    cd ai-service
    
    # 检查requirements.txt是否存在
    if [ -f "requirements.txt" ]; then
        log_info "安装Python依赖包..."
        pip install -r requirements.txt
        if [ $? -ne 0 ]; then
            log_warn "部分Python依赖安装失败，但继续启动服务"
        fi
    else
        log_warn "requirements.txt 不存在，跳过Python依赖安装"
    fi
    cd ..
}

# 安装所有依赖
install_dependencies() {
    log_step "安装项目依赖..."
    install_frontend_deps
    install_backend_deps
    install_ai_deps
}

# 创建必要的目录
create_directories() {
    log_step "创建必要的目录..."
    
    # 创建输出目录
    mkdir -p outputs/images
    mkdir -p outputs/videos
    mkdir -p logs
    
    log_info "目录创建完成"
}

# 检查配置文件
check_config() {
    log_step "检查配置文件..."
    
    if [ ! -f "config/config.json" ]; then
        log_error "配置文件 config/config.json 不存在"
        exit 1
    fi
    
    log_info "配置文件检查完成"
}

# 启动AI服务
start_ai_service() {
    log_step "启动AI服务..."
    cd ai-service
    
    # 检查端口是否被占用
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        log_warn "端口 8000 已被占用，尝试停止现有服务"
        pkill -f "python.*api_server.py" || true
        sleep 2
    fi
    
    # 启动AI服务
    nohup python api_server.py > ../logs/ai-service.log 2>&1 &
    AI_PID=$!
    echo $AI_PID > ../logs/ai-service.pid
    
    # 等待服务启动
    sleep 3
    
    # 检查服务是否启动成功
    if ps -p $AI_PID > /dev/null; then
        log_info "AI服务启动成功 (PID: $AI_PID, 端口: 8000)"
    else
        log_error "AI服务启动失败"
        cat ../logs/ai-service.log
        exit 1
    fi
    
    cd ..
}

# 启动后端服务
start_backend_service() {
    log_step "启动后端服务..."
    cd backend
    
    # 检查端口是否被占用
    if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
        log_warn "端口 3002 已被占用，尝试停止现有服务"
        pkill -f "node.*server" || true
        sleep 2
    fi
    
    # 启动后端服务
    nohup npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    
    # 等待服务启动
    sleep 3
    
    # 检查服务是否启动成功
    if ps -p $BACKEND_PID > /dev/null; then
        log_info "后端服务启动成功 (PID: $BACKEND_PID, 端口: 3002)"
    else
        log_error "后端服务启动失败"
        cat ../logs/backend.log
        exit 1
    fi
    
    cd ..
}

# 启动前端服务
start_frontend_service() {
    log_step "启动前端服务..."
    cd frontend
    
    # 检查端口是否被占用
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
        log_warn "端口 5173 已被占用，尝试停止现有服务"
        pkill -f "vite" || true
        sleep 2
    fi
    
    # 启动前端服务
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    
    # 等待服务启动
    sleep 3
    
    # 检查服务是否启动成功
    if ps -p $FRONTEND_PID > /dev/null; then
        log_info "前端服务启动成功 (PID: $FRONTEND_PID, 端口: 5173)"
    else
        log_error "前端服务启动失败"
        cat ../logs/frontend.log
        exit 1
    fi
    
    cd ..
}

# 启动所有服务
start_services() {
    log_step "启动所有服务..."
    
    start_ai_service
    start_backend_service
    start_frontend_service
    
    log_info "所有服务启动完成"
}

# 主函数
main() {
    log_info "开始启动 EasyVideo 项目..."
    
    activate_conda_env
    check_dependencies
    install_dependencies
    create_directories
    check_config
    start_services
    
    log_info "EasyVideo 项目启动完成！"
    log_info "前端地址: http://localhost:5173"
    log_info "后端地址: http://localhost:3002"
    log_info "AI服务地址: http://localhost:8000"
    log_info "当前conda环境: $CONDA_ENV_NAME"
    log_info "使用 './stop.sh' 停止所有服务"
}

# 执行主函数
main "$@"
