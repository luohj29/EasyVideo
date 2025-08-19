import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Settings,
  Image,
  Video,
  FileText,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSidebar } from '@/store/useAppStore';
import { clsx } from 'clsx';

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'startup',
    label: '首页',
    path: '/',
    icon: Home,
  },
  {
    id: 'config',
    label: '配置管理',
    path: '/config',
    icon: Settings,
  },
  {
    id: 'text-to-image',
    label: '文生图',
    path: '/text-to-image',
    icon: Image,
  },
  {
    id: 'image-to-video',
    label: '图生视频',
    path: '/image-to-video',
    icon: Video,
  },
  {
    id: 'storyboard',
    label: '分镜创作',
    path: '/storyboard',
    icon: FileText,
  },
  {
    id: 'projects',
    label: '项目管理',
    path: '/projects',
    icon: FolderOpen,
  },
];

const Sidebar: React.FC = () => {
  const { collapsed, toggle } = useSidebar();
  const location = useLocation();

  return (
    <aside
      className={clsx(
        'fixed left-0 top-16 bottom-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out',
        collapsed ? '-translate-x-full' : 'translate-x-0'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            导航菜单
          </h2>
        )}
        {/* <button
          onClick={toggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          )}
        </button> */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    )
                  }
                >
                  <Icon
                    className={clsx(
                      'w-5 h-5 transition-colors',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    )}
                  />
                  
                  {!collapsed && (
                    <>
                      <span className="font-medium truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              EasyVideo AI v1.0.0
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              智能视频创作平台
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">EV</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;