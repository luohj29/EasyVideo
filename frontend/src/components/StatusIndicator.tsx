import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

type StatusType = 'success' | 'warning' | 'error' | 'loading' | 'idle';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    dotColor: 'bg-green-500',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    dotColor: 'bg-yellow-500',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    dotColor: 'bg-red-500',
  },
  loading: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    dotColor: 'bg-blue-500',
  },
  idle: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    dotColor: 'bg-gray-400',
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    dot: 'w-2 h-2',
  },
  md: {
    container: 'px-3 py-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
    dot: 'w-2.5 h-2.5',
  },
  lg: {
    container: 'px-4 py-2',
    icon: 'w-5 h-5',
    text: 'text-base',
    dot: 'w-3 h-3',
  },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  tooltip,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const indicator = (
    <div
      className={clsx(
        'inline-flex items-center space-x-2 rounded-full border transition-all duration-200',
        config.bgColor,
        config.borderColor,
        sizeStyles.container,
        className
      )}
    >
      {/* Status Dot */}
      <div className="relative flex items-center">
        <div
          className={clsx(
            'rounded-full',
            config.dotColor,
            sizeStyles.dot,
            status === 'loading' && 'animate-pulse'
          )}
        />
        {status === 'loading' && (
          <div
            className={clsx(
              'absolute inset-0 rounded-full animate-ping',
              config.dotColor,
              'opacity-75'
            )}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={clsx(
            'font-medium',
            config.color,
            sizeStyles.text
          )}
        >
          {label}
        </span>
      )}

      {/* Icon */}
      <Icon
        className={clsx(
          config.color,
          sizeStyles.icon,
          status === 'loading' && 'animate-spin'
        )}
      />
    </div>
  );

  if (tooltip) {
    return (
      <div className="relative group">
        {indicator}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      </div>
    );
  }

  return indicator;
};

export default StatusIndicator;