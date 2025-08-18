import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API客户端配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证token（如果有的话）
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加请求ID用于追踪
    if (config.headers) {
      config.headers['X-Request-ID'] = generateRequestId();
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('[API Response Error]', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
    });
    
    // 处理特定的HTTP状态码
    if (error.response?.status === 401) {
      // 未授权，清除token并重定向到登录页
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // 禁止访问
      console.warn('Access forbidden');
    } else if (error.response?.status >= 500) {
      // 服务器错误
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

// 生成请求ID
function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// API响应类型
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  code?: number;
}

// API错误类型
export interface ApiError {
  message: string;
  code?: number;
  details?: any;
}

// 通用API方法
export class ApiClient {
  /**
   * GET请求
   */
  static async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return apiClient.get<T>(url, config);
  }

  /**
   * POST请求
   */
  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return apiClient.post<T>(url, data, config);
  }

  /**
   * PUT请求
   */
  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return apiClient.put<T>(url, data, config);
  }

  /**
   * PATCH请求
   */
  static async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return apiClient.patch<T>(url, data, config);
  }

  /**
   * DELETE请求
   */
  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return apiClient.delete<T>(url, config);
  }

  /**
   * 上传文件
   */
  static async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  }

  /**
   * 下载文件
   */
  static async download(
    url: string,
    filename?: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    const response = await apiClient.get(url, {
      ...config,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 设置认证token
   */
  static setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
    (apiClient.defaults.headers as any).Authorization = `Bearer ${token}`;
  }

  /**
   * 清除认证token
   */
  static clearAuthToken(): void {
    localStorage.removeItem('auth_token');
    delete (apiClient.defaults.headers as any).Authorization;
  }

  /**
   * 获取当前认证token
   */
  static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * 检查是否已认证
   */
  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

// 导出默认实例
export { apiClient };
export default ApiClient;