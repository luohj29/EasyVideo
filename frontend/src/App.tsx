import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAppStore, useAppActions } from '@/store/useAppStore';
import ConfigService from '@/services/configService';

// 布局组件
import Layout from '@/components/Layout';

// 页面组件
import StartupPage from '@/pages/StartupPage';
import ConfigPage from '@/pages/ConfigPage';
import TextToImagePage from '@/pages/TextToImagePage';
import ImageToVideoPage from '@/pages/ImageToVideoPage';
import StoryboardPage from '@/pages/StoryboardPage';
import ProjectPage from '@/pages/ProjectPage';

// 通用组件
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Modal from '@/components/Modal';

function App() {
  const { systemStatus, config, loading, error, modals } = useAppStore();
  const { setSystemStatus, setConfig, setLoading, setError, clearError } = useAppActions();

  // 初始化应用
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true, '正在初始化应用...');
        
        // 获取系统状态
        const status = await ConfigService.getSystemStatus();
        setSystemStatus(status);
        
        // 获取配置
        const appConfig = await ConfigService.getConfig();
        setConfig(appConfig);
        
        clearError();
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError(err instanceof Error ? err : new Error('应用初始化失败'));
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [setSystemStatus, setConfig, setLoading, setError, clearError]);

  // 全局错误处理
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(new Error('发生了未处理的错误'));
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setError(new Error('发生了全局错误'));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [setError]);

  // 如果正在加载，显示加载界面
  if (loading.isLoading && !systemStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {loading.message || '正在加载...'}
          </p>
          {loading.progress !== undefined && (
            <div className="mt-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loading.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 如果有错误且没有系统状态，显示错误界面
  if (error.hasError && !systemStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
            应用初始化失败
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            {error.error instanceof Error ? error.error.message : '未知错误'}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              重新加载
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<StartupPage />} />
            <Route path="config" element={<ConfigPage />} />
            <Route path="text-to-image" element={<TextToImagePage />} />
            <Route path="image-to-video" element={<ImageToVideoPage />} />
            <Route path="storyboard" element={<StoryboardPage />} />
            <Route path="projects" element={<ProjectPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        {/* 全局模态框 */}
        {modals.map((modal) => (
          <Modal key={modal.id} {...modal} />
        ))}

        {/* 全局通知 */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />

        {/* 全局加载遮罩 */}
        {loading.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="flex items-center space-x-4">
                <LoadingSpinner />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {loading.message || '处理中...'}
                  </p>
                  {loading.progress !== undefined && (
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${loading.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;