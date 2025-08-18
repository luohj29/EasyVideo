import React from 'react';
import { Menu, Sun, Moon, Monitor, Settings, Bell } from 'lucide-react';
import { useTheme, useSidebar, useSystemStatus, useAppActions } from '@/store/useAppStore';
import StatusIndicator from './StatusIndicator';

const Header: React.FC = () => {
  const theme = useTheme();
  const { toggle } = useSidebar();
  const systemStatus = useSystemStatus();
  const { setTheme } = useAppActions();

  const themeOptions = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'auto', label: '自动', icon: Monitor },
  ] as const;

  const currentThemeOption = themeOptions.find(option => option.value === theme);
  const CurrentThemeIcon = currentThemeOption?.icon || Monitor;

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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                EasyVideo AI
              </h1>
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
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            aria-label="通知"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme Switcher */}
          <div className="relative group">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="切换主题"
            >
              <CurrentThemeIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Theme Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      theme === option.value
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
          </div>

          {/* Settings */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="设置"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;