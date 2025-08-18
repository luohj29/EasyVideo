// Configuration related types

export interface SystemConfig {
  models: ModelConfig;
  paths: PathConfig;
  system: SystemSettings;
  ai_services: AIServiceConfig;
  ui: UIConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
}

export interface ModelConfig {
  text_to_image: {
    default_model: string;
    available_models: string[];
    model_paths: Record<string, string>;
    default_parameters: {
      width: number;
      height: number;
      num_inference_steps: number;
      guidance_scale: number;
      scheduler: string;
    };
  };
  image_to_video: {
    default_model: string;
    available_models: string[];
    model_paths: Record<string, string>;
    default_parameters: {
      duration: number;
      fps: number;
      motion_strength: number;
      guidance_scale: number;
      num_inference_steps: number;
    };
  };
  storyboard: {
    default_model: string;
    available_models: string[];
    model_paths: Record<string, string>;
    default_parameters: {
      style: string;
      scene_count: number;
      include_camera_movements: boolean;
      include_lighting_notes: boolean;
      include_audio_cues: boolean;
    };
  };
}

export interface PathConfig {
  models_dir: string;
  outputs_dir: string;
  temp_dir: string;
  cache_dir: string;
  projects_dir: string;
  uploads_dir: string;
  exports_dir: string;
  logs_dir: string;
}

export interface SystemSettings {
  max_concurrent_generations: number;
  gpu_memory_limit: number;
  cpu_threads: number;
  cache_size: number;
  auto_cleanup: boolean;
  cleanup_interval: number;
  max_file_size: number;
  supported_formats: {
    images: string[];
    videos: string[];
    exports: string[];
  };
  logging: {
    level: 'debug' | 'info' | 'warning' | 'error';
    max_file_size: number;
    max_files: number;
    console_output: boolean;
  };
}

export interface AIServiceConfig {
  openai: {
    enabled: boolean;
    api_key?: string;
    base_url?: string;
    model: string;
    max_tokens: number;
    temperature: number;
  };
  anthropic: {
    enabled: boolean;
    api_key?: string;
    model: string;
    max_tokens: number;
    temperature: number;
  };
  local_llm: {
    enabled: boolean;
    model_path: string;
    context_length: number;
    gpu_layers: number;
  };
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  sidebar_collapsed: boolean;
  grid_size: 'small' | 'medium' | 'large';
  auto_save: boolean;
  notifications: {
    enabled: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number;
  };
  shortcuts: Record<string, string>;
}

export interface PerformanceConfig {
  image_preview_quality: 'low' | 'medium' | 'high';
  video_preview_quality: 'low' | 'medium' | 'high';
  lazy_loading: boolean;
  cache_previews: boolean;
  max_preview_size: number;
  compression_quality: number;
  batch_size: number;
  prefetch_count: number;
}

export interface SecurityConfig {
  enable_cors: boolean;
  allowed_origins: string[];
  max_upload_size: number;
  allowed_file_types: string[];
  rate_limiting: {
    enabled: boolean;
    requests_per_minute: number;
    burst_size: number;
  };
  authentication: {
    enabled: boolean;
    session_timeout: number;
    require_2fa: boolean;
  };
}

export interface SystemStatus {
  gpu: GPUStatus;
  memory: MemoryStatus;
  storage: StorageStatus;
  models: ModelStatus;
  services: ServiceStatus;
  performance: PerformanceStatus;
}

export interface GPUStatus {
  available: boolean;
  name?: string;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  utilization: number;
  temperature?: number;
  power_usage?: number;
}

export interface MemoryStatus {
  total: number;
  used: number;
  free: number;
  cached: number;
  swap_total: number;
  swap_used: number;
}

export interface StorageStatus {
  total: number;
  used: number;
  free: number;
  outputs_size: number;
  cache_size: number;
  models_size: number;
  projects_size: number;
}

export interface ModelStatus {
  text_to_image: {
    loaded: boolean;
    model_name?: string;
    memory_usage: number;
    load_time?: number;
  };
  image_to_video: {
    loaded: boolean;
    model_name?: string;
    memory_usage: number;
    load_time?: number;
  };
  storyboard: {
    loaded: boolean;
    model_name?: string;
    memory_usage: number;
    load_time?: number;
  };
}

export interface ServiceStatus {
  backend: {
    status: 'online' | 'offline' | 'error';
    uptime: number;
    version: string;
    last_check: string;
  };
  ai_service: {
    status: 'online' | 'offline' | 'error';
    uptime: number;
    version: string;
    last_check: string;
  };
  database: {
    status: 'online' | 'offline' | 'error';
    connection_count: number;
    last_check: string;
  };
}

export interface PerformanceStatus {
  cpu_usage: number;
  memory_usage: number;
  disk_io: {
    read_speed: number;
    write_speed: number;
  };
  network_io: {
    download_speed: number;
    upload_speed: number;
  };
  active_generations: number;
  queue_length: number;
  average_generation_time: number;
}

export interface ConfigUpdateRequest {
  section: keyof SystemConfig;
  data: Partial<SystemConfig[keyof SystemConfig]>;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConfigValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ConfigBackup {
  id: string;
  name: string;
  description?: string;
  config: SystemConfig;
  created_at: string;
  file_size: number;
  checksum: string;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'production' | 'testing' | 'custom';
  config: Partial<SystemConfig>;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
}