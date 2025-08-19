import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Monitor, Settings, Bell } from 'lucide-react';
import { useTheme, useSidebar, useSystemStatus, useAppActions } from '@/store/useAppStore';
import StatusIndicator from './StatusIndicator';
import { Link, useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  content: string;
  read: boolean;
}

const Header: React.FC = () => {
  const theme = useTheme();
  const { toggle } = useSidebar();
  const systemStatus = useSystemStatus();
  const { setTheme } = useAppActions();
  const navigate = useNavigate();

  const themeOptions = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'auto', label: '自动', icon: Monitor },
  ] as const;

  const currentThemeOption = themeOptions.find(option => option.value === theme);
  const CurrentThemeIcon = currentThemeOption?.icon || Monitor;

  // 通知列表
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // 控制通知弹窗显示
  const [showNotifications, setShowNotifications] = useState(false);

  // SSE 接收消息
  useEffect(() => {
    const evtSource = new EventSource('http://localhost:3002/notifications/stream');
    evtSource.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setNotifications(prev => [msg, ...prev]);
    };
    

    evtSource.onerror = (err) => {
      console.error('SSE error', err);
      // evtSource 会自动重连
    };

    return () => evtSource.close();
  }, []);

  // 计算是否有未读通知
  const hasUnread = notifications.some(n => !n.read);

  // 查看通知时全部标记为已读
  const handleShowNotifications = () => {
    setShowNotifications(v => !v);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  //主题
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="切换侧边栏"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EV</span>
            </div>
            <div>
              <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white hover:underline">
                EasyVideo AI
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                智能视频创作平台
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - System Status */}
        <div className="flex items-center space-x-4">
          {systemStatus && (
            <>
              <StatusIndicator
                label="GPU"
                status={systemStatus.gpu_available ? 'success' : 'error'}
                tooltip={systemStatus.gpu_available ? 'GPU可用' : 'GPU不可用'}
              />
              <StatusIndicator
                label="模型"
                status={systemStatus.models_loaded ? 'success' : 'warning'}
                tooltip={systemStatus.models_loaded ? '模型已加载' : '模型未加载'}
              />
              <StatusIndicator
                label="存储"
                status="success"
                tooltip={`可用空间: ${systemStatus.disk_space.free}`}
              />
            </>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              aria-label="通知"
              onClick={handleShowNotifications}
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                {/* 头部：关闭按钮 */}
                <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">通知</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label="关闭通知"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 text-sm text-gray-700 dark:text-gray-300 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <span>暂无通知</span>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="mb-2">{n.content}</div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="切换主题"
              onClick={() => setShowThemeMenu(v => !v)}
            >
              <CurrentThemeIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${theme === option.value
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="设置"
            onClick={() => navigate('/config')}
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
