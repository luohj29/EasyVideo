import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Image,
  Video,
  FileText,
  Settings,
  FolderOpen,
  Cpu,
  HardDrive,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useSystemStatus, useAppActions } from '@/store/useAppStore';
import { ConfigService } from '@/services/configService';
import StatusIndicator from '@/components/StatusIndicator';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorBoundary';

interface QuickActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  bgGradient: string;
}

const quickActions: QuickActionCard[] = [
  {
    id: 'text-to-image',
    title: '文生图',
    description: '通过文字描述生成精美图像',
    icon: Image,
    path: '/text-to-image',
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'image-to-video',
    title: '图生视频',
    description: '将静态图像转换为动态视频',
    icon: Video,
    path: '/image-to-video',
    color: 'text-purple-600',
    bgGradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'storyboard',
    title: '分镜创作',
    description: '智能生成视频分镜脚本',
    icon: FileText,
    path: '/storyboard',
    color: 'text-green-600',
    bgGradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'projects',
    title: '项目管理',
    description: '管理和组织您的创作项目',
    icon: FolderOpen,
    path: '/projects',
    color: 'text-orange-600',
    bgGradient: 'from-orange-500 to-red-500',
  },
];

const StartupPage: React.FC = () => {
  const systemStatus = useSystemStatus();
  const { setSystemStatus, setError } = useAppActions();
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        if (!isMountedRef.current) return;
        setLoading(true);
        setErrorState(null);
        
        const status = await ConfigService.getSystemStatus();
        if (!isMountedRef.current) return;
        setSystemStatus(status);
      } catch (err) {
        if (!isMountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : '获取系统状态失败';
        setErrorState(errorMessage);
        setError(errorMessage);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    checkSystemStatus();
  }, [setSystemStatus, setError]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" text="正在检查系统状态..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            EasyVideo AI
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          欢迎使用智能视频创作平台，让AI助力您的创意表达
        </p>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-primary-600" />
          <span>系统状态</span>
        </h2>
        
        {systemStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GPU Status */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className={`p-3 rounded-lg ${
                systemStatus.gpu_available 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <Cpu className={`w-6 h-6 ${
                  systemStatus.gpu_available 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">GPU状态</h3>
                <p className={`text-sm ${
                  systemStatus.gpu_available 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {systemStatus.gpu_available ? '可用' : '不可用'}
                </p>
                {systemStatus.gpu_info && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {systemStatus.gpu_info}
                  </p>
                )}
              </div>
            </div>

            {/* Models Status */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className={`p-3 rounded-lg ${
                systemStatus.models_loaded 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-yellow-100 dark:bg-yellow-900/20'
              }`}>
                <CheckCircle className={`w-6 h-6 ${
                  systemStatus.models_loaded 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">模型状态</h3>
                <p className={`text-sm ${
                  systemStatus.models_loaded 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {systemStatus.models_loaded ? '已加载' : '未加载'}
                </p>
              </div>
            </div>

            {/* Storage Status */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">存储空间</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  可用: {systemStatus.disk_space.free}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  总计: {systemStatus.disk_space.total}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="加载系统状态..." />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <ArrowRight className="w-6 h-6 text-primary-600" />
          <span>快速开始</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                to={action.path}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative p-6">
                  {/* Icon */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.bgGradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {action.description}
                  </p>
                  
                  {/* Arrow */}
                  <div className="mt-4 flex justify-end">
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Configuration Link */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                系统配置
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                配置模型路径、系统参数和AI服务设置
              </p>
            </div>
          </div>
          <Link
            to="/config"
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <span>进入配置</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StartupPage;