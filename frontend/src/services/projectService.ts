import { 
  Project, 
  ProjectCreateRequest, 
  ProjectUpdateRequest, 
  ProjectListParams, 
  ProjectListResponse,
  ProjectStats,
  ProjectExportOptions,
  ProjectImportResult
} from '@/types/project';
import { apiClient } from './apiClient';

export class ProjectService {
  private static readonly BASE_URL = '/api/projects';

  /**
   * 获取项目列表
   */
  static async getProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.type) searchParams.append('type', params.type);
    if (params.status) searchParams.append('status', params.status);
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) searchParams.append('sort_order', params.sort_order);

    const url = `${this.BASE_URL}?${searchParams.toString()}`;
    const response = await apiClient.get<ProjectListResponse>(url);
    return response.data;
  }

  /**
   * 获取单个项目详情
   */
  static async getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get<Project>(`${this.BASE_URL}/${projectId}`);
    return response.data;
  }

  /**
   * 创建新项目
   */
  static async createProject(data: ProjectCreateRequest): Promise<Project> {
    const response = await apiClient.post<Project>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * 更新项目
   */
  static async updateProject(projectId: string, data: ProjectUpdateRequest): Promise<Project> {
    const response = await apiClient.put<Project>(`${this.BASE_URL}/${projectId}`, data);
    return response.data;
  }

  /**
   * 删除项目
   */
  static async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${projectId}`);
  }

  /**
   * 获取项目统计信息
   */
  static async getProjectStats(): Promise<ProjectStats> {
    const response = await apiClient.get<ProjectStats>(`${this.BASE_URL}/stats`);
    return response.data;
  }

  /**
   * 导出项目
   */
  static async exportProject(
    projectId: string, 
    options: ProjectExportOptions = {
      include_assets: true,
      include_settings: true,
      format: 'zip'
    }
  ): Promise<Blob> {
    const response = await apiClient.post(
      `${this.BASE_URL}/${projectId}/export`,
      options,
      {
        responseType: 'blob'
      }
    );
    return response.data;
  }

  /**
   * 导入项目
   */
  static async importProject(file: File): Promise<ProjectImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ProjectImportResult>(
      `${this.BASE_URL}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  /**
   * 复制项目
   */
  static async duplicateProject(projectId: string, newName?: string): Promise<Project> {
    const response = await apiClient.post<Project>(
      `${this.BASE_URL}/${projectId}/duplicate`,
      { name: newName }
    );
    return response.data;
  }

  /**
   * 归档项目
   */
  static async archiveProject(projectId: string): Promise<Project> {
    const response = await apiClient.post<Project>(`${this.BASE_URL}/${projectId}/archive`);
    return response.data;
  }

  /**
   * 恢复已归档的项目
   */
  static async unarchiveProject(projectId: string): Promise<Project> {
    const response = await apiClient.post<Project>(`${this.BASE_URL}/${projectId}/unarchive`);
    return response.data;
  }

  /**
   * 获取项目资源列表
   */
  static async getProjectAssets(projectId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.BASE_URL}/${projectId}/assets`);
    return response.data;
  }

  /**
   * 上传项目资源
   */
  static async uploadAsset(projectId: string, file: File, type: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post(
      `${this.BASE_URL}/${projectId}/assets`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  /**
   * 删除项目资源
   */
  static async deleteAsset(projectId: string, assetId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${projectId}/assets/${assetId}`);
  }

  /**
   * 搜索项目
   */
  static async searchProjects(query: string, filters?: Partial<ProjectListParams>): Promise<Project[]> {
    const params = {
      search: query,
      ...filters
    };
    
    const response = await this.getProjects(params);
    return response.projects;
  }

  /**
   * 获取最近访问的项目
   */
  static async getRecentProjects(limit: number = 5): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(`${this.BASE_URL}/recent?limit=${limit}`);
    return response.data;
  }

  /**
   * 标记项目为最近访问
   */
  static async markAsAccessed(projectId: string): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/${projectId}/access`);
  }

  /**
   * 获取项目模板
   */
  static async getProjectTemplates(): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.BASE_URL}/templates`);
    return response.data;
  }

  /**
   * 从模板创建项目
   */
  static async createFromTemplate(templateId: string, data: ProjectCreateRequest): Promise<Project> {
    const response = await apiClient.post<Project>(
      `${this.BASE_URL}/templates/${templateId}/create`,
      data
    );
    return response.data;
  }
}