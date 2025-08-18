// Common types and interfaces

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  url?: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  metadata?: Record<string, any>;
}

// Theme types
export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  mode: Theme;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  border_color: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  created_at: string;
  read: boolean;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// Modal types
export interface Modal {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title: string;
  content: string | React.ReactNode;
  actions?: ModalAction[];
  closable?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

export interface ModalAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  errorCode?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  type?: string;
  status?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SortOption {
  value: string;
  label: string;
  direction?: 'asc' | 'desc';
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// User interface types
export interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
  preferences: UserPreferences;
  created_at: string;
  last_login_at?: string;
  is_active: boolean;
}

export interface UserPreferences {
  theme: Theme;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    in_app: boolean;
  };
  ui: {
    sidebar_collapsed: boolean;
    grid_size: string;
    auto_save: boolean;
  };
}

// Application state types
export interface AppState {
  user: User | null;
  theme: Theme;
  sidebar_collapsed: boolean;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  modals: Modal[];
  config: any;
  system_status: any;
}

// Event types
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: string;
  source?: string;
}

export interface EventHandler<T = any> {
  (event: AppEvent & { payload: T }): void;
}

// Validation types
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  value: any;
  placeholder?: string;
  options?: { value: any; label: string }[];
  rules?: ValidationRule[];
  disabled?: boolean;
  hidden?: boolean;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Timestamp = string;

export type ID = string;

// Component prop types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  value?: any;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Hook return types
export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

export interface UseDebounceReturn<T> {
  debouncedValue: T;
  isDebouncing: boolean;
}

// Re-export all types from other modules
export * from './generation';
export * from './project';
export * from './config';

// Config type alias for compatibility
export interface Config {
  models: {
    qwen: ModelConfig;
    flux: ModelConfig;
    flux_kontext: ModelConfig;
    wan_i2v: ModelConfig;
    [key: string]: ModelConfig;
  };
  paths: {
    diffsynth_path: string;
    output_dir: string;
    projects_dir: string;
    img_dir: string;
    temp_dir: string;
    [key: string]: string;
  };
  system: {
    gpu_memory_limit: number;
    max_concurrent_tasks: number;
    auto_cleanup: boolean;
    debug_mode: boolean;
    log_level: string;
    api_port: number;
    frontend_port: number;
    [key: string]: any;
  };
  generation: {
    image: {
      default_size: [number, number];
      max_batch_size: number;
      default_steps: number;
      default_guidance: number;
    };
    video: {
      default_fps: number;
      default_duration: number;
      max_batch_size: number;
      default_steps: number;
    };
  };
  prompt_optimization: {
    enabled: boolean;
    default_type: string;
    max_length: number;
    cache_results: boolean;
  };
}

export interface ModelConfig {
  path: string;
  enabled: boolean;
  name?: string;
  description?: string;
}