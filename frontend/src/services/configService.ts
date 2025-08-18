import ApiService from './api';
import type { Config, SystemStatus, ModelStatus } from '@/types';

export class ConfigService {
  // 获取系统状态
  static async getSystemStatus(): Promise<SystemStatus> {
    const response = await ApiService.get<SystemStatus>('/api/system/status');
    if (!response.success) {
      throw new Error(response.error || '获取系统状态失败');
    }
    return response.data!;
  }

  // 获取模型状态
  static async getModelStatus(): Promise<ModelStatus[]> {
    const response = await ApiService.get<ModelStatus[]>('/api/system/models/status');
    if (!response.success) {
      throw new Error(response.error || '获取模型状态失败');
    }
    return response.data!;
  }

  // 获取配置
  static async getConfig(): Promise<Config> {
    const response = await ApiService.get<Config>('/api/config');
    if (!response.success) {
      throw new Error(response.error || '获取配置失败');
    }
    return response.data!;
  }

  // 更新配置
  static async updateConfig(config: Partial<Config>): Promise<Config> {
    const response = await ApiService.put<Config>('/api/config', config);
    if (!response.success) {
      throw new Error(response.error || '更新配置失败');
    }
    return response.data!;
  }

  // 重置配置为默认值
  static async resetConfig(): Promise<Config> {
    const response = await ApiService.post<Config>('/api/config/reset');
    if (!response.success) {
      throw new Error(response.error || '重置配置失败');
    }
    return response.data!;
  }

  // 验证配置
  static async validateConfig(config: Partial<Config>): Promise<{ valid: boolean; errors: string[] }> {
    const response = await ApiService.post<{ valid: boolean; errors: string[] }>('/api/config/validate', config);
    if (!response.success) {
      throw new Error(response.error || '验证配置失败');
    }
    return response.data!;
  }

  // 导出配置
  static async exportConfig(): Promise<Blob> {
    return await ApiService.download('/api/config/export', 'config.json');
  }

  // 导入配置
  static async importConfig(file: File): Promise<Config> {
    const response = await ApiService.upload<Config>('/api/config/import', file);
    if (!response.success) {
      throw new Error(response.error || '导入配置失败');
    }
    return response.data!;
  }

  // 获取模型配置
  static async getModelConfig(modelName: string): Promise<any> {
    const response = await ApiService.get(`/api/config/models/${modelName}`);
    if (!response.success) {
      throw new Error(response.error || '获取模型配置失败');
    }
    return response.data!;
  }

  // 更新模型配置
  static async updateModelConfig(modelName: string, config: any): Promise<any> {
    const response = await ApiService.put(`/api/config/models/${modelName}`, config);
    if (!response.success) {
      throw new Error(response.error || '更新模型配置失败');
    }
    return response.data!;
  }

  // 检查模型路径
  static async checkModelPath(path: string): Promise<{ exists: boolean; size?: number; error?: string }> {
    const response = await ApiService.post<{ exists: boolean; size?: number; error?: string }>('/api/config/check-path', { path });
    if (!response.success) {
      throw new Error(response.error || '检查路径失败');
    }
    return response.data!;
  }

  // 获取系统信息
  static async getSystemInfo(): Promise<any> {
    const response = await ApiService.get('/api/system/info');
    if (!response.success) {
      throw new Error(response.error || '获取系统信息失败');
    }
    return response.data!;
  }

  // 测试AI服务连接
  static async testAIConnection(): Promise<{ connected: boolean; latency?: number; error?: string }> {
    const response = await ApiService.post<{ connected: boolean; latency?: number; error?: string }>('/api/system/test-ai-connection');
    if (!response.success) {
      throw new Error(response.error || '测试连接失败');
    }
    return response.data!;
  }

  // 重启AI服务
  static async restartAIService(): Promise<{ success: boolean; message: string }> {
    const response = await ApiService.post<{ success: boolean; message: string }>('/api/system/restart-ai');
    if (!response.success) {
      throw new Error(response.error || '重启AI服务失败');
    }
    return response.data!;
  }

  // 获取日志
  static async getLogs(level?: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());
    
    const response = await ApiService.get(`/api/system/logs?${params.toString()}`);
    if (!response.success) {
      throw new Error(response.error || '获取日志失败');
    }
    return response.data!;
  }

  // 清理临时文件
  static async cleanupTempFiles(): Promise<{ cleaned: number; freed_space: number }> {
    const response = await ApiService.post<{ cleaned: number; freed_space: number }>('/api/system/cleanup');
    if (!response.success) {
      throw new Error(response.error || '清理临时文件失败');
    }
    return response.data!;
  }

  // 获取磁盘使用情况
  static async getDiskUsage(): Promise<{ total: number; used: number; free: number; percentage: number }> {
    const response = await ApiService.get<{ total: number; used: number; free: number; percentage: number }>('/api/system/disk-usage');
    if (!response.success) {
      throw new Error(response.error || '获取磁盘使用情况失败');
    }
    return response.data!;
  }

  // 获取GPU使用情况
  static async getGPUUsage(): Promise<{ name: string; memory_used: number; memory_total: number; utilization: number }> {
    const response = await ApiService.get<{ name: string; memory_used: number; memory_total: number; utilization: number }>('/api/system/gpu-usage');
    if (!response.success) {
      throw new Error(response.error || '获取GPU使用情况失败');
    }
    return response.data!;
  }

  // 获取任务队列状态
  static async getTaskQueueStatus(): Promise<{ pending: number; running: number; completed: number; failed: number }> {
    const response = await ApiService.get<{ pending: number; running: number; completed: number; failed: number }>('/api/system/task-queue');
    if (!response.success) {
      throw new Error(response.error || '获取任务队列状态失败');
    }
    return response.data!;
  }

  // 清空任务队列
  static async clearTaskQueue(): Promise<{ cleared: number }> {
    const response = await ApiService.delete<{ cleared: number }>('/api/system/task-queue');
    if (!response.success) {
      throw new Error(response.error || '清空任务队列失败');
    }
    return response.data!;
  }
}

export default ConfigService;