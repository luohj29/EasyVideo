import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  overlay?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorConfig = {
  primary: 'text-primary-600',
  white: 'text-white',
  gray: 'text-gray-600',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  overlay = false,
  className,
}) => {
  const spinner = (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <Loader2
        className={clsx(
          'animate-spin',
          sizeConfig[size],
          colorConfig[color]
        )}
      />
      {text && (
        <p
          className={clsx(
            'mt-2 text-sm font-medium',
            color === 'white' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
          )}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// 页面级加载组件
export const PageLoading: React.FC<{ text?: string }> = ({ text = '加载中...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

// 按钮加载组件
export const ButtonLoading: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" color="white" />
      {text && <span>{text}</span>}
    </div>
  );
};

// 卡片加载组件
export const CardLoading: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2"></div>
      </div>
    </div>
  );
};

// 列表加载组件
export const ListLoading: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse flex space-x-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg w-16 h-16"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;