import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Plus,
  Search,
  Grid,
  List,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Archive,
  Download,
  Upload,
  Star,
  Clock,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  Tag,
  Eye,
  Share2,
  Settings,
} from 'lucide-react';
import { ProjectService } from '@/services/projectService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorBoundary';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '@/types/project';
import toast from 'react-hot-toast';

interface ProjectFilters {
  status: 'all' | 'active' | 'archived';
  type: 'all' | 'text_to_image' | 'image_to_video' | 'storyboard';
  sortBy: 'created_at' | 'updated_at' | 'name';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: ProjectFilters = {
  status: 'all',
  type: 'all',
  sortBy: 'updated_at',
  sortOrder: 'desc',
};

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<ProjectCreateRequest>({
    name: '',
    description: '',
    type: 'text_to_image',
    tags: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, [filters]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ProjectService.getProjects({
        page: 1,
        limit: 100,
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
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('请输入项目名称');
      return;
    }

    try {
      const project = await ProjectService.createProject(newProject);
      setProjects(prev => [project, ...prev]);
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        type: 'text_to_image',
        tags: [],
      });
      toast.success('项目创建成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建项目失败';
      toast.error(errorMessage);
    }
  };

  const handleUpdateProject = async (projectId: string, updates: ProjectUpdateRequest) => {
    try {
      const updatedProject = await ProjectService.updateProject(projectId, updates);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      setEditingProject(null);
      toast.success('项目更新成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新项目失败';
      toast.error(errorMessage);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复。')) {
      return;
    }

    try {
      await ProjectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('项目删除成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除项目失败';
      toast.error(errorMessage);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await ProjectService.archiveProject(projectId);
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: 'archived' } : p
      ));
      toast.success('项目已归档');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '归档项目失败';
      toast.error(errorMessage);
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await ProjectService.restoreProject(projectId);
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: 'active' } : p
      ));
      toast.success('项目已恢复');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '恢复项目失败';
      toast.error(errorMessage);
    }
  };

  const handleCopyProject = async (projectId: string) => {
    try {
      const copiedProject = await ProjectService.copyProject(projectId);
      setProjects(prev => [copiedProject, ...prev]);
      toast.success('项目复制成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '复制项目失败';
      toast.error(errorMessage);
    }
  };

  const handleExportProject = async (projectId: string) => {
    try {
      const blob = await ProjectService.exportProject(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('项目导出成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导出项目失败';
      toast.error(errorMessage);
    }
  };

  const handleImportProject = async (file: File) => {
    try {
      const project = await ProjectService.importProject(file);
      setProjects(prev => [project, ...prev]);
      toast.success('项目导入成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入项目失败';
      toast.error(errorMessage);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProjects.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedProjects.length} 个项目吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await Promise.all(selectedProjects.map(id => ProjectService.deleteProject(id)));
      setProjects(prev => prev.filter(p => !selectedProjects.includes(p.id)));
      setSelectedProjects([]);
      toast.success(`成功删除 ${selectedProjects.length} 个项目`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量删除失败';
      toast.error(errorMessage);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedProjects.length === 0) return;

    try {
      await Promise.all(selectedProjects.map(id => ProjectService.archiveProject(id)));
      setProjects(prev => prev.map(p => 
        selectedProjects.includes(p.id) ? { ...p, status: 'archived' } : p
      ));
      setSelectedProjects([]);
      toast.success(`成功归档 ${selectedProjects.length} 个项目`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量归档失败';
      toast.error(errorMessage);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || project.status === filters.status;
    const matchesType = filters.type === 'all' || project.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'text_to_image':
        return <ImageIcon className="w-4 h-4" />;
      case 'image_to_video':
        return <Video className="w-4 h-4" />;
      case 'storyboard':
        return <FileText className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'text_to_image':
        return '文生图';
      case 'image_to_video':
        return '图生视频';
      case 'storyboard':
        return '分镜创作';
      default:
        return '未知';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="加载项目中..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="加载失败"
        message={error}
        onRetry={loadProjects}
      />
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
            管理您的AI视频制作项目
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            accept=".zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportProject(file);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>导入</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建项目</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
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
          
          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* View Mode */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>筛选</span>
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">全部</option>
                  <option value="active">活跃</option>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">全部类型</option>
                  <option value="text_to_image">文生图</option>
                  <option value="image_to_video">图生视频</option>
                  <option value="storyboard">分镜创作</option>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="updated_at">更新时间</option>
                  <option value="created_at">创建时间</option>
                  <option value="name">名称</option>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Actions */}
      {selectedProjects.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              已选择 {selectedProjects.length} 个项目
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchArchive}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
              >
                <Archive className="w-3 h-3" />
                <span>归档</span>
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>删除</span>
              </button>
              <button
                onClick={() => setSelectedProjects([])}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? '未找到匹配的项目' : '暂无项目'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? '尝试调整搜索条件或筛选器' : '创建您的第一个AI视频制作项目'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>新建项目</span>
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
              isSelected={selectedProjects.includes(project.id)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedProjects(prev => [...prev, project.id]);
                } else {
                  setSelectedProjects(prev => prev.filter(id => id !== project.id));
                }
              }}
              onEdit={() => setEditingProject(project)}
              onDelete={() => handleDeleteProject(project.id)}
              onArchive={() => handleArchiveProject(project.id)}
              onRestore={() => handleRestoreProject(project.id)}
              onCopy={() => handleCopyProject(project.id)}
              onExport={() => handleExportProject(project.id)}
              getProjectTypeIcon={getProjectTypeIcon}
              getProjectTypeLabel={getProjectTypeLabel}
              formatDate={formatDate}
            />
          ))}
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
                  value={newProject.name}
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
                  value={newProject.description}
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
                  value={newProject.type}
                  onChange={(e) => setNewProject(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="text_to_image">文生图</option>
                  <option value="image_to_video">图生视频</option>
                  <option value="storyboard">分镜创作</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProject({
                    name: '',
                    description: '',
                    type: 'text_to_image',
                    tags: [],
                  });
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              编辑项目
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目名称
                </label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目描述
                </label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (editingProject) {
                    handleUpdateProject(editingProject.id, {
                      name: editingProject.name,
                      description: editingProject.description,
                    });
                  }
                }}
                disabled={!editingProject?.name.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onCopy: () => void;
  onExport: () => void;
  getProjectTypeIcon: (type: string) => React.ReactNode;
  getProjectTypeLabel: (type: string) => string;
  formatDate: (date: string) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onCopy,
  onExport,
  getProjectTypeIcon,
  getProjectTypeLabel,
  formatDate,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
          />
          
          <div className="flex items-center space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${
              project.status === 'archived' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-primary-100 dark:bg-primary-900/20'
            }`}>
              {getProjectTypeIcon(project.type)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {project.name}
                </h3>
                {project.status === 'archived' && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                    已归档
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {project.description || '暂无描述'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              {getProjectTypeIcon(project.type)}
              <span>{getProjectTypeLabel(project.type)}</span>
            </span>
            
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(project.updated_at)}</span>
            </span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10 min-w-32">
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={() => { onCopy(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Copy className="w-3 h-3" />
                  <span>复制</span>
                </button>
                <button
                  onClick={() => { onExport(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Download className="w-3 h-3" />
                  <span>导出</span>
                </button>
                {project.status === 'active' ? (
                  <button
                    onClick={() => { onArchive(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Archive className="w-3 h-3" />
                    <span>归档</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { onRestore(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Archive className="w-3 h-3" />
                    <span>恢复</span>
                  </button>
                )}
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>删除</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border transition-colors ${
      isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            />
            <div className={`p-3 rounded-lg ${
              project.status === 'archived' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-primary-100 dark:bg-primary-900/20'
            }`}>
              {getProjectTypeIcon(project.type)}
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10 min-w-32">
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={() => { onCopy(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Copy className="w-3 h-3" />
                  <span>复制</span>
                </button>
                <button
                  onClick={() => { onExport(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Download className="w-3 h-3" />
                  <span>导出</span>
                </button>
                {project.status === 'active' ? (
                  <button
                    onClick={() => { onArchive(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Archive className="w-3 h-3" />
                    <span>归档</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { onRestore(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Archive className="w-3 h-3" />
                    <span>恢复</span>
                  </button>
                )}
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>删除</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
              {project.name}
            </h3>
            {project.status === 'archived' && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                已归档
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {project.description || '暂无描述'}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            {getProjectTypeIcon(project.type)}
            <span>{getProjectTypeLabel(project.type)}</span>
          </span>
          
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(project.updated_at)}</span>
          </span>
        </div>
        
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;