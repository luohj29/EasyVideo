#!/bin/bash

# EasyVideo 项目停止脚本
# 用于停止所有运行的服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 停止服务函数
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            log_info "停止 $service_name (PID: $pid)..."
            kill $pid
            
            # 等待进程结束
            local count=0
            while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # 如果进程仍在运行，强制杀死
            if ps -p $pid > /dev/null 2>&1; then
                log_warning "强制停止 $service_name..."
                kill -9 $pid
            fi
            
            log_success "$service_name 已停止"
        else
            log_warning "$service_name 进程不存在 (PID: $pid)"
        fi
        
        # 删除PID文件
        rm -f "$pid_file"
    else
        log_warning "$service_name PID文件不存在: $pid_file"
    fi
}

# 通过端口停止服务
stop_by_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        log_info "发现 $service_name 运行在端口 $port (PID: $pid)"
        kill $pid
        log_success "已停止端口 $port 上的 $service_name"
    fi
}

# 停止所有服务
stop_all_services() {
    log_info "停止 EasyVideo 所有服务..."
    
    # 停止前端服务
    stop_service "前端服务" "logs/frontend.pid"
    
    # 停止后端服务
    stop_service "后端服务" "logs/backend.pid"
    
    # 停止AI服务
    stop_service "AI服务" "logs/ai-service.pid"
    
    # 通过端口停止可能遗留的服务
    log_info "检查并停止端口上的遗留服务..."
    stop_by_port 5173 "前端服务"
    stop_by_port 3002 "后端服务"
    stop_by_port 8000 "AI服务"
    
    # 停止可能的Node.js和Python进程
    log_info "清理相关进程..."
    
    # 查找并停止相关的Node.js进程
    local node_pids=$(pgrep -f "vite\|ts-node\|nodemon" 2>/dev/null || true)
    if [ -n "$node_pids" ]; then
        log_info "停止相关Node.js进程: $node_pids"
        echo $node_pids | xargs kill 2>/dev/null || true
    fi
    
    # 查找并停止相关的Python进程
    local python_pids=$(pgrep -f "api_server.py\|uvicorn" 2>/dev/null || true)
    if [ -n "$python_pids" ]; then
        log_info "停止相关Python进程: $python_pids"
        echo $python_pids | xargs kill 2>/dev/null || true
    fi
    
    log_success "所有服务已停止"
}

# 清理日志文件
clean_logs() {
    read -p "是否清理日志文件? (y/N): " clean_logs_choice
    if [[ $clean_logs_choice =~ ^[Yy]$ ]]; then
        log_info "清理日志文件..."
        rm -f logs/*.log
        rm -f logs/*.pid
        log_success "日志文件已清理"
    fi
}

# 显示服务状态
show_status() {
    log_info "检查服务状态..."
    
    echo ""
    echo "端口占用情况:"
    echo "  端口 5173 (前端): $(lsof -ti:5173 2>/dev/null && echo '占用' || echo '空闲')"
    echo "  端口 3002 (后端): $(lsof -ti:3002 2>/dev/null && echo '占用' || echo '空闲')"
    echo "  端口 8000 (AI服务): $(lsof -ti:8000 2>/dev/null && echo '占用' || echo '空闲')"
    
    echo ""
    echo "PID文件状态:"
    echo "  前端PID文件: $([ -f 'logs/frontend.pid' ] && echo '存在' || echo '不存在')"
    echo "  后端PID文件: $([ -f 'logs/backend.pid' ] && echo '存在' || echo '不存在')"
    echo "  AI服务PID文件: $([ -f 'logs/ai-service.pid' ] && echo '存在' || echo '不存在')"
    
    echo ""
    echo "相关进程:"
    echo "  Node.js进程: $(pgrep -f 'vite\|ts-node\|nodemon' 2>/dev/null | wc -l) 个"
    echo "  Python进程: $(pgrep -f 'api_server.py\|uvicorn' 2>/dev/null | wc -l) 个"
}

# 主函数
main() {
    echo "="*50
    log_info "EasyVideo 项目停止脚本"
    echo "="*50
    
    # 检查是否在项目根目录
    if [ ! -f "start.sh" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 创建logs目录（如果不存在）
    mkdir -p logs
    
    case "${1:-stop}" in
        "stop")
            stop_all_services
            clean_logs
            ;;
        "status")
            show_status
            ;;
        "force")
            log_warning "强制停止所有相关服务..."
            stop_all_services
            # 强制杀死所有相关进程
            pkill -f "vite\|ts-node\|nodemon\|api_server.py\|uvicorn" 2>/dev/null || true
            log_success "强制停止完成"
            ;;
        "help")
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  stop    停止所有服务 (默认)"
            echo "  status  显示服务状态"
            echo "  force   强制停止所有相关进程"
            echo "  help    显示此帮助信息"
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            echo "运行 '$0 help' 查看帮助信息"
            exit 1
            ;;
    esac
    
    echo "="*50
    log_success "操作完成！"
    echo "="*50
}

# 处理中断信号
trap 'log_warning "操作被中断"; exit 1' INT TERM

# 运行主函数
main "$@"