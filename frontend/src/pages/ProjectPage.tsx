import React, { useState, useEffect } from 'react';
import {
  Folder,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Upload,
  Trash2,
  Edit3,
  Eye,
  Share2,
  Calendar,
  Clock,
  User,
  FileText,
  Image as ImageIcon,
  Video,
  Settings,
  MoreVertical,
} from 'lucide-react';
import { ProjectService } from '@/services/projectService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorBoundary';
import { Project, ProjectAsset, ProjectCreateRequest } from '@/types/project';
import toast from 'react-hot-toast';

interface ProjectFilters {
  status: 'all' | 'active' | 'completed' | 'archived';
  type: 'all' | 'text-to-image' | 'image-to-video' | 'storyboard';
  sortBy: 'created_at' | 'updated_at' | 'name';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: ProjectFilters = {
  status: 'all',
  type: 'all',
  sortBy: 'updated_at',
  sortOrder: 'desc',
};

const ProjectPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newProject, setNewProject] = useState<Partial<ProjectCreateRequest>>({
    name: '',
    description: '',
    type: 'text-to-image',
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadProjectsWithCleanup = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await ProjectService.getProjects({
          page: 1,
          limit: 50,
          search: searchQuery,
          status: filters.status === 'all' ? undefined : filters.status,
          type: filters.type === 'all' ? undefined : filters.type,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
        });
        
        if (isMounted) {
          setProjects(response.projects);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : '加载项目失败';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadProjectsWithCleanup();
    
    return () => {
      isMounted = false;
    };
  }, [filters, searchQuery]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ProjectService.getProjects({
        page: 1,
        limit: 50,
        search: searchQuery,
        status: filters.status === 'all' ? undefined : filters.status,
        type: filters.type === 'all' ? undefined : filters.type,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder,
      });
      
      setProjects(response.projects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载项目失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name?.trim()) {
      toast.error('请输入项目名称');
      return;
    }

    try {
      const project = await ProjectService.createProject({
        name: newProject.name.trim(),
        description: newProject.description || '',
        type: newProject.type || 'text-to-image',
      });
      
      setProjects(prev => [project, ...(prev || [])]);
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', type: 'text-to-image' });
      toast.success('项目创建成功');
    } catch (err) {
      toast.error('创建项目失败');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复。')) {
      return;
    }

    try {
      await ProjectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('项目已删除');
    } catch (err) {
      toast.error('删除项目失败');
    }
  };

  const handleExportProject = async (project: Project) => {
    try {
      const blob = await ProjectService.exportProject(project.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}-export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('项目导出成功');
    } catch (err) {
      toast.error('导出项目失败');
    }
  };

  const filteredProjects = (projects || []).filter(project => {
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'text-to-image':
        return ImageIcon;
      case 'image-to-video':
        return Video;
      case 'storyboard':
        return FileText;
      default:
        return Folder;
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'text-to-image':
        return '文生图';
      case 'image-to-video':
        return '图生视频';
      case 'storyboard':
        return '分镜脚本';
      default:
        return '未知类型';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'archived':
        return '已归档';
      default:
        return '草稿';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" text="正在加载项目..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <ErrorDisplay error={error} onRetry={loadProjects} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Folder className="w-8 h-8 text-primary-600" />
            <span>项目管理</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            管理您的AI视频创作项目
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>新建项目</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>筛选</span>
            </button>
            
            {/* View Mode */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  状态
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">全部状态</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
              
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  类型
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">全部类型</option>
                  <option value="text-to-image">文生图</option>
                  <option value="image-to-video">图生视频</option>
                  <option value="storyboard">分镜脚本</option>
                </select>
              </div>
              
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  排序方式
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="updated_at">最后更新</option>
                  <option value="created_at">创建时间</option>
                  <option value="name">项目名称</option>
                </select>
              </div>
              
              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  排序顺序
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? '未找到匹配的项目' : '还没有项目'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery ? '尝试调整搜索条件或筛选器' : '创建您的第一个AI视频项目'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>新建项目</span>
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredProjects.map((project) => {
            const TypeIcon = getProjectTypeIcon(project.type);
            
            return (
              <div
                key={project.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Project Thumbnail/Icon */}
                <div className={`relative ${
                  viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'h-48'
                } bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center`}>
                  <TypeIcon className="w-8 h-8 text-white" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getStatusColor(project.status)
                    }`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
                
                {/* Project Info */}
                <div className={`p-4 flex-1 ${
                  viewMode === 'list' ? 'flex items-center justify-between' : ''
                }`}>
                  <div className={viewMode === 'list' ? 'flex-1' : ''}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {project.name}
                      </h3>
                      
                      {viewMode === 'grid' && (
                        <div className="relative">
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-gray-600 dark:text-gray-300 text-sm ${
                      viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2'
                    } mb-3`}>
                      {project.description || '暂无描述'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <TypeIcon className="w-3 h-3" />
                        <span>{getProjectTypeLabel(project.type)}</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className={`flex items-center space-x-2 ${
                    viewMode === 'list' ? 'ml-4' : 'mt-4'
                  }`}>
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleExportProject(project)}
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="导出项目"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="删除项目"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              新建项目
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目名称
                </label>
                <input
                  type="text"
                  value={newProject.name || ''}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入项目名称"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目描述
                </label>
                <textarea
                  value={newProject.description || ''}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入项目描述（可选）"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目类型
                </label>
                <select
                  value={newProject.type || 'text-to-image'}
                  onChange={(e) => setNewProject(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="text-to-image">文生图</option>
                  <option value="image-to-video">图生视频</option>
                  <option value="storyboard">分镜脚本</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProject({ name: '', description: '', type: 'text-to-image' });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name?.trim()}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {selectedProject.name}
              </h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="sr-only">关闭</span>
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    项目信息
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">类型:</span>
                      <span className="text-gray-900 dark:text-white">{getProjectTypeLabel(selectedProject.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">状态:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getStatusColor(selectedProject.status)
                      }`}>
                        {getStatusLabel(selectedProject.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">创建时间:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedProject.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">最后更新:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedProject.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    项目描述
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedProject.description || '暂无描述'}
                  </p>
                </div>
              </div>
              
              {/* Project Assets */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  项目资源
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    暂无项目资源
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;