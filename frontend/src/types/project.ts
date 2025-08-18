export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'text-to-image' | 'image-to-video' | 'storyboard';
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  user_id?: string;
  settings?: Record<string, any>;
  assets?: ProjectAsset[];
  metadata?: ProjectMetadata;
}

export interface ProjectAsset {
  id: string;
  project_id: string;
  type: 'image' | 'video' | 'text' | 'config';
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ProjectMetadata {
  total_assets: number;
  total_size: number;
  last_accessed: string;
  tags?: string[];
  version?: string;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  type: 'text-to-image' | 'image-to-video' | 'storyboard';
  settings?: Record<string, any>;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  settings?: Record<string, any>;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'text-to-image' | 'image-to-video' | 'storyboard';
  status?: 'draft' | 'active' | 'completed' | 'archived';
  sort_by?: 'created_at' | 'updated_at' | 'name';
  sort_order?: 'asc' | 'desc';
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_assets: number;
  total_storage_used: number;
}

export interface ProjectExportOptions {
  include_assets: boolean;
  include_settings: boolean;
  format: 'zip' | 'json';
}

export interface ProjectImportResult {
  project: Project;
  imported_assets: number;
  skipped_assets: number;
  errors: string[];
}