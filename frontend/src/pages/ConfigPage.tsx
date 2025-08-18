import React, { useEffect, useState, useRef } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Server,
  Cpu,
  HardDrive,
  Plus,
  Edit3,
  X,
} from 'lucide-react';
import { useConfig, useAppActions } from '@/store/useAppStore';
import { ConfigService } from '@/services/configService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorBoundary';
import StatusIndicator from '@/components/StatusIndicator';
import { Config } from '@/types';
import toast from 'react-hot-toast';

const ConfigPage: React.FC = () => {
  const config = useConfig();
  const { setConfig, setLoading, setError } = useAppActions();
  const [localConfig, setLocalConfig] = useState<Config | null>(null);
  const [loading, setLoadingState] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'models' | 'paths' | 'system' | 'ai-service'>('models');
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelKey, setNewModelKey] = useState('');
  const [newModelConfig, setNewModelConfig] = useState({
    path: '',
    enabled: true,
    name: '',
    description: ''
  });
  const [showAddPath, setShowAddPath] = useState(false);
  const [newPathKey, setNewPathKey] = useState('');
  const [newPathValue, setNewPathValue] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (!isMountedRef.current) return;
        setLoadingState(true);
        setErrorState(null);
        
        const configData = await ConfigService.getConfig();
        if (!isMountedRef.current) return;
        setConfig(configData);
        setLocalConfig(configData);
      } catch (err) {
        if (!isMountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : '加载配置失败';
        setErrorState(errorMessage);
        setError(errorMessage);
      } finally {
        if (isMountedRef.current) {
          setLoadingState(false);
        }
      }
    };

    loadConfig();
  }, [setConfig, setError]);

  const handleSave = async () => {
    if (!localConfig) return;

    try {
      setSaving(true);
      await ConfigService.updateConfig(localConfig);
      setConfig(localConfig);
      toast.success('配置保存成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存配置失败';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setLocalConfig({ ...config });
      toast.success('配置已重置');
    }
  };

  const handleModelConfigChange = (modelType: keyof Config['models'], field: string, value: any) => {
    if (!localConfig) return;
    
    setLocalConfig({
      ...localConfig,
      models: {
        ...localConfig.models,
        [modelType]: {
          ...localConfig.models[modelType],
          [field]: value,
        },
      },
    });
  };

  const handlePathChange = (pathType: keyof Config['paths'], value: string) => {
    if (!localConfig) return;
    
    setLocalConfig({
      ...localConfig,
      paths: {
        ...localConfig.paths,
        [pathType]: value,
      },
    });
  };

  const handleSystemChange = (field: keyof Config['system'], value: any) => {
    if (!localConfig) return;
    
    setLocalConfig({
      ...localConfig,
      system: {
        ...localConfig.system,
        [field]: value,
      },
    });
  };

  const handleAddModel = () => {
    if (!localConfig || !newModelKey.trim()) return;
    
    if (localConfig.models[newModelKey]) {
      toast.error('模型名称已存在');
      return;
    }
    
    setLocalConfig({
      ...localConfig,
      models: {
        ...localConfig.models,
        [newModelKey]: { ...newModelConfig }
      }
    });
    
    // 重置表单
    setNewModelKey('');
    setNewModelConfig({
      path: '',
      enabled: true,
      name: '',
      description: ''
    });
    setShowAddModel(false);
    toast.success('模型添加成功');
  };

  const handleDeleteModel = (modelKey: string) => {
    if (!localConfig) return;
    
    const { [modelKey]: deleted, ...remainingModels } = localConfig.models;
    setLocalConfig({
      ...localConfig,
      models: remainingModels
    });
    toast.success('模型删除成功');
  };

  const handleCancelAddModel = () => {
    setShowAddModel(false);
    setNewModelKey('');
    setNewModelConfig({
      path: '',
      enabled: true,
      name: '',
      description: ''
    });
  };

  const handleAddPath = () => {
    if (!localConfig || !newPathKey.trim()) return;
    
    if (localConfig.paths[newPathKey]) {
      toast.error('路径名称已存在');
      return;
    }
    
    setLocalConfig({
      ...localConfig,
      paths: {
        ...localConfig.paths,
        [newPathKey]: newPathValue
      }
    });
    
    // 重置表单
    setNewPathKey('');
    setNewPathValue('');
    setShowAddPath(false);
    toast.success('路径添加成功');
  };

  const handleDeletePath = (pathKey: string) => {
    if (!localConfig) return;
    
    // 防止删除核心路径
    const corePaths = ['diffsynth_path', 'output_dir', 'projects_dir', 'img_dir', 'temp_dir'];
    if (corePaths.includes(pathKey)) {
      toast.error('无法删除核心路径配置');
      return;
    }
    
    const { [pathKey]: deleted, ...remainingPaths } = localConfig.paths;
    setLocalConfig({
      ...localConfig,
      paths: remainingPaths
    });
    toast.success('路径删除成功');
  };

  const handleCancelAddPath = () => {
    setShowAddPath(false);
    setNewPathKey('');
    setNewPathValue('');
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      await ConfigService.testAIServiceConnection();
      toast.success('AI服务连接测试成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI服务连接测试失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExportConfig = async () => {
    try {
      const blob = await ConfigService.exportConfig();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `easyvideo-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('配置导出成功');
    } catch (err) {
      toast.error('配置导出失败');
    }
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('config', file);
      const importedConfig = await ConfigService.importConfig(formData);
      setLocalConfig(importedConfig);
      toast.success('配置导入成功');
    } catch (err) {
      toast.error('配置导入失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" text="正在加载配置..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!localConfig) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <ErrorDisplay error="配置数据不可用" />
      </div>
    );
  }

  const tabs = [
    { id: 'models', label: '模型配置', icon: Cpu },
    { id: 'paths', label: '路径设置', icon: FolderOpen },
    { id: 'system', label: '系统设置', icon: Settings },
    { id: 'ai-service', label: 'AI服务', icon: Server },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Settings className="w-8 h-8 text-primary-600" />
            <span>系统配置</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            配置模型路径、系统参数和AI服务设置
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Import/Export */}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
              id="import-config"
            />
            <label
              htmlFor="import-config"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>导入</span>
            </label>
            <button
              onClick={handleExportConfig}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
          </div>
          
          {/* Actions */}
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重置</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {saving ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? '保存中...' : '保存配置'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Models Tab */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  模型配置
                </h3>
                <button
                  onClick={() => setShowAddModel(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加模型</span>
                </button>
              </div>
              
              {/* Add Model Form */}
              {showAddModel && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-blue-900 dark:text-blue-100">
                      添加新模型
                    </h4>
                    <button
                      onClick={handleCancelAddModel}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型标识符 *
                      </label>
                      <input
                        type="text"
                        value={newModelKey}
                        onChange={(e) => setNewModelKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="例如: my_custom_model"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型名称
                      </label>
                      <input
                        type="text"
                        value={newModelConfig.name || ''}
                        onChange={(e) => setNewModelConfig({...newModelConfig, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="输入模型显示名称"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型路径 *
                      </label>
                      <input
                        type="text"
                        value={newModelConfig.path}
                        onChange={(e) => setNewModelConfig({...newModelConfig, path: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="输入模型文件路径，例如: /path/to/model"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型描述
                      </label>
                      <input
                        type="text"
                        value={newModelConfig.description || ''}
                        onChange={(e) => setNewModelConfig({...newModelConfig, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="输入模型描述信息"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="new-model-enabled"
                        checked={newModelConfig.enabled}
                        onChange={(e) => setNewModelConfig({...newModelConfig, enabled: e.target.checked})}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="new-model-enabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        启用此模型
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleAddModel}
                      disabled={!newModelKey.trim() || !newModelConfig.path.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加模型</span>
                    </button>
                    <button
                      onClick={handleCancelAddModel}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              
              {/* Existing Models */}
              {localConfig?.models && Object.entries(localConfig.models).map(([modelType, modelConfig]) => (
                <div key={modelType} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white capitalize">
                      {modelConfig.name || modelType.replace('_', ' ')} 模型
                    </h4>
                    <button
                      onClick={() => handleDeleteModel(modelType)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="删除模型"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型路径
                      </label>
                      <input
                        type="text"
                        value={modelConfig.path}
                        onChange={(e) => handleModelConfigChange(modelType as keyof Config['models'], 'path', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="输入模型文件路径"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型名称
                      </label>
                      <input
                        type="text"
                        value={modelConfig.name || ''}
                        onChange={(e) => handleModelConfigChange(modelType as keyof Config['models'], 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="输入模型名称"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        模型描述
                      </label>
                      <input
                        type="text"
                        value={modelConfig.description || ''}
                        onChange={(e) => handleModelConfigChange(modelType as keyof Config['models'], 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="输入模型描述信息"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${modelType}-enabled`}
                        checked={modelConfig.enabled}
                        onChange={(e) => handleModelConfigChange(modelType as keyof Config['models'], 'enabled', e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor={`${modelType}-enabled`} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        启用此模型
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paths Tab */}
          {activeTab === 'paths' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  路径设置
                </h3>
                <button
                  onClick={() => setShowAddPath(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加路径</span>
                </button>
              </div>
              
              {/* Add Path Form */}
              {showAddPath && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-green-900 dark:text-green-100">
                      添加新路径
                    </h4>
                    <button
                      onClick={handleCancelAddPath}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        路径标识符 *
                      </label>
                      <input
                        type="text"
                        value={newPathKey}
                        onChange={(e) => setNewPathKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="例如: custom_models_dir"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        路径值 *
                      </label>
                      <input
                        type="text"
                        value={newPathValue}
                        onChange={(e) => setNewPathValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="输入完整路径，例如: /path/to/directory"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleAddPath}
                      disabled={!newPathKey.trim() || !newPathValue.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加路径</span>
                    </button>
                    <button
                      onClick={handleCancelAddPath}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localConfig?.paths && Object.entries(localConfig.paths).map(([pathType, pathValue]) => {
                  const corePaths = ['diffsynth_path', 'output_dir', 'projects_dir', 'img_dir', 'temp_dir'];
                  const isCorePath = corePaths.includes(pathType);
                  
                  return (
                    <div key={pathType} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {pathType.replace('_', ' ')}
                          {isCorePath && <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(核心)</span>}
                        </label>
                        {!isCorePath && (
                          <button
                            onClick={() => handleDeletePath(pathType)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="删除路径"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={pathValue}
                          onChange={(e) => handlePathChange(pathType as keyof Config['paths'], e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder={`输入${pathType.replace('_', ' ')}路径`}
                        />
                        <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                          <FolderOpen className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                系统设置
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最大并发任务数
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={localConfig.system.max_concurrent_tasks}
                    onChange={(e) => handleSystemChange('max_concurrent_tasks', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GPU内存限制 (GB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={localConfig.system.gpu_memory_limit}
                    onChange={(e) => handleSystemChange('gpu_memory_limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto-cleanup"
                    checked={localConfig.system.auto_cleanup}
                    onChange={(e) => handleSystemChange('auto_cleanup', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="auto-cleanup" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    自动清理临时文件
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="debug-mode"
                    checked={localConfig.system.debug_mode}
                    onChange={(e) => handleSystemChange('debug_mode', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="debug-mode" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    调试模式
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* AI Service Tab */}
          {activeTab === 'ai-service' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI服务设置
                </h3>
                <button
                  onClick={handleTestConnection}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>测试连接</span>
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  服务状态
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatusIndicator
                    status="success"
                    label="API服务"
                    tooltip="API服务运行正常"
                  />
                  <StatusIndicator
                    status="success"
                    label="模型加载"
                    tooltip="模型已成功加载"
                  />
                  <StatusIndicator
                    status="warning"
                    label="GPU使用率"
                    tooltip="GPU使用率较高"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API端口
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="65535"
                    value={8000}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    工作进程数
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;