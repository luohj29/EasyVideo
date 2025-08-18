import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppActions } from '@/store/useAppStore';

interface ModalProps {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title: string;
  content: string | React.ReactNode;
  actions?: ModalAction[];
  closable?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

interface ModalAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const sizeConfig = {
  small: 'max-w-md',
  medium: 'max-w-lg',
  large: 'max-w-2xl',
  fullscreen: 'max-w-full h-full',
};

const Modal: React.FC<ModalProps> = ({
  id,
  type,
  title,
  content,
  actions = [],
  closable = true,
  size = 'medium',
}) => {
  const { removeModal } = useAppActions();

  const handleClose = () => {
    if (closable) {
      removeModal(id);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closable]);

  // 防止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getActionButtonClass = (style: string = 'secondary') => {
    const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (style) {
      case 'primary':
        return `${baseClass} bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500`;
      case 'danger':
        return `${baseClass} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;
      default:
        return `${baseClass} bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          'bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full mx-4',
          sizeConfig[size],
          size === 'fullscreen' ? 'h-full' : 'max-h-[90vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {closable && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={clsx(
          'p-6',
          size === 'fullscreen' ? 'flex-1 overflow-auto' : 'max-h-[60vh] overflow-auto'
        )}>
          {typeof content === 'string' ? (
            <p className="text-gray-700 dark:text-gray-300">{content}</p>
          ) : (
            content
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={action.loading}
                className={clsx(
                  getActionButtonClass(action.style),
                  action.loading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {action.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>处理中...</span>
                  </div>
                ) : (
                  action.label
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;