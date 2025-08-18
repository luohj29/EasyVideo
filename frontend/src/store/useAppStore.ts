import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Config, SystemStatus, Toast, Modal, LoadingState, ErrorState, User } from '@/types';

interface AppState {
  // 系统状态
  systemStatus: SystemStatus | null;
  config: Config | null;
  user: User | null;
  
  // UI状态
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  loading: LoadingState;
  error: ErrorState;
  
  // 通知和模态框
  toasts: Toast[];
  modals: Modal[];
  
  // 应用设置
  settings: {
    autoSave: boolean;
    notifications: boolean;
    language: 'zh-CN' | 'en-US';
  };
}

interface AppActions {
  // 系统状态管理
  setSystemStatus: (status: SystemStatus) => void;
  setConfig: (config: Config) => void;
  updateConfig: (updates: Partial<Config>) => void;
  setUser: (user: User | null) => void;
  
  // UI状态管理
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 加载状态管理
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  clearLoading: () => void;
  
  // 错误状态管理
  setError: (error: Error | string, errorCode?: string) => void;
  clearError: () => void;
  
  // 通知管理
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // 模态框管理
  addModal: (modal: Omit<Modal, 'id'>) => void;
  removeModal: (id: string) => void;
  clearModals: () => void;
  
  // 设置管理
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  
  // 重置状态
  reset: () => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  systemStatus: null,
  config: null,
  user: null,
  theme: 'auto',
  sidebarCollapsed: false,
  loading: {
    isLoading: false,
  },
  error: {
    hasError: false,
  },
  toasts: [],
  modals: [],
  settings: {
    autoSave: true,
    notifications: true,
    language: 'zh-CN',
  },
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // 系统状态管理
        setSystemStatus: (status) => set({ systemStatus: status }, false, 'setSystemStatus'),
        
        setConfig: (config) => set({ config }, false, 'setConfig'),
        
        updateConfig: (updates) => set(
          (state) => ({
            config: state.config ? { ...state.config, ...updates } : null,
          }),
          false,
          'updateConfig'
        ),
        
        setUser: (user) => set({ user }, false, 'setUser'),
        
        // UI状态管理
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
          
          // 应用主题到DOM
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else if (theme === 'light') {
            root.classList.remove('dark');
          } else {
            // auto模式，根据系统偏好设置
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        },
        
        toggleSidebar: () => set(
          (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
          false,
          'toggleSidebar'
        ),
        
        setSidebarCollapsed: (collapsed) => set(
          { sidebarCollapsed: collapsed },
          false,
          'setSidebarCollapsed'
        ),
        
        // 加载状态管理
        setLoading: (isLoading, message, progress) => set(
          {
            loading: {
              isLoading,
              message,
              progress,
            },
          },
          false,
          'setLoading'
        ),
        
        clearLoading: () => set(
          {
            loading: {
              isLoading: false,
            },
          },
          false,
          'clearLoading'
        ),
        
        // 错误状态管理
        setError: (error, errorCode) => set(
          {
            error: {
              hasError: true,
              error,
              errorCode,
            },
          },
          false,
          'setError'
        ),
        
        clearError: () => set(
          {
            error: {
              hasError: false,
            },
          },
          false,
          'clearError'
        ),
        
        // 通知管理
        addToast: (toast) => {
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const newToast = { ...toast, id };
          
          set(
            (state) => ({
              toasts: [...state.toasts, newToast],
            }),
            false,
            'addToast'
          );
          
          // 自动移除toast
          if (toast.duration !== 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, toast.duration || 5000);
          }
        },
        
        removeToast: (id) => set(
          (state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
          }),
          false,
          'removeToast'
        ),
        
        clearToasts: () => set({ toasts: [] }, false, 'clearToasts'),
        
        // 模态框管理
        addModal: (modal) => {
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const newModal = { ...modal, id };
          
          set(
            (state) => ({
              modals: [...state.modals, newModal],
            }),
            false,
            'addModal'
          );
        },
        
        removeModal: (id) => set(
          (state) => ({
            modals: state.modals.filter((modal) => modal.id !== id),
          }),
          false,
          'removeModal'
        ),
        
        clearModals: () => set({ modals: [] }, false, 'clearModals'),
        
        // 设置管理
        updateSettings: (updates) => set(
          (state) => ({
            settings: { ...state.settings, ...updates },
          }),
          false,
          'updateSettings'
        ),
        
        // 重置状态
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'easyvideo-app-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          settings: state.settings,
          user: state.user,
        }),
      }
    ),
    {
      name: 'EasyVideo App Store',
    }
  ));

// 便捷的选择器hooks
export const useSystemStatus = () => useAppStore((state) => state.systemStatus);
export const useConfig = () => useAppStore((state) => state.config);
export const useUser = () => useAppStore((state) => state.user);
export const useTheme = () => useAppStore((state) => state.theme);
export const useSidebar = () => useAppStore((state) => ({
  collapsed: state.sidebarCollapsed,
  toggle: state.toggleSidebar,
  setCollapsed: state.setSidebarCollapsed,
}));
export const useLoading = () => useAppStore((state) => state.loading);
export const useError = () => useAppStore((state) => state.error);
export const useToasts = () => useAppStore((state) => state.toasts);
export const useModals = () => useAppStore((state) => state.modals);
export const useSettings = () => useAppStore((state) => state.settings);

// 便捷的操作hooks
export const useAppActions = () => useAppStore((state) => ({
  setSystemStatus: state.setSystemStatus,
  setConfig: state.setConfig,
  updateConfig: state.updateConfig,
  setUser: state.setUser,
  setTheme: state.setTheme,
  setLoading: state.setLoading,
  clearLoading: state.clearLoading,
  setError: state.setError,
  clearError: state.clearError,
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts,
  addModal: state.addModal,
  removeModal: state.removeModal,
  clearModals: state.clearModals,
  updateSettings: state.updateSettings,
  reset: state.reset,
}));

export default useAppStore;