const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const configService = require('./configService');

class ProjectService {
  constructor() {
    this.projectsDir = null;
    this.initPromise = this.init();
  }

  // 初始化服务
  async init() {
    try {
      this.projectsDir = await configService.getConfig('paths.projects_dir');
      await fs.ensureDir(this.projectsDir);
      logger.info('项目服务初始化成功');
    } catch (error) {
      logger.error('项目服务初始化失败:', error);
      throw error;
    }
  }

  // 确保初始化完成
  async ensureInit() {
    await this.initPromise;
  }

  // 获取项目列表
  async getProjects(options = {}) {
    await this.ensureInit();
    
    try {
      const { page = 1, limit = 20, sortBy = 'createdTime', sortOrder = 'desc', search = '' } = options;
      
      const projects = [];
      const items = await fs.readdir(this.projectsDir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const projectPath = path.join(this.projectsDir, item.name);
          const metaPath = path.join(projectPath, 'project.json');
          
          if (await fs.pathExists(metaPath)) {
            try {
              const metadata = await fs.readJson(metaPath);
              
              // 搜索过滤
              if (search && !metadata.name.toLowerCase().includes(search.toLowerCase()) && 
                  !metadata.description.toLowerCase().includes(search.toLowerCase())) {
                continue;
              }
              
              // 获取项目统计信息
              const stats = await this.getProjectStats(item.name);
              
              projects.push({
                ...metadata,
                stats
              });
            } catch (error) {
              logger.error(`读取项目元数据失败 ${item.name}:`, error);
            }
          }
        }
      }
      
      // 排序
      projects.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'createdTime' || sortBy === 'updatedTime') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });
      
      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProjects = projects.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          projects: paginatedProjects,
          pagination: {
            page,
            limit,
            total: projects.length,
            totalPages: Math.ceil(projects.length / limit)
          }
        }
      };
    } catch (error) {
      logger.error('获取项目列表失败:', error);
      throw error;
    }
  }

  // 创建项目
  async createProject(projectData) {
    await this.ensureInit();
    
    try {
      const projectId = uuidv4();
      const projectPath = path.join(this.projectsDir, projectId);
      
      // 创建项目目录结构
      await fs.ensureDir(projectPath);
      await fs.ensureDir(path.join(projectPath, 'images'));
      await fs.ensureDir(path.join(projectPath, 'videos'));
      await fs.ensureDir(path.join(projectPath, 'storyboards'));
      await fs.ensureDir(path.join(projectPath, 'exports'));
      
      // 创建项目元数据
      const metadata = {
        id: projectId,
        name: projectData.name || '未命名项目',
        description: projectData.description || '',
        type: projectData.type || 'general',
        tags: projectData.tags || [],
        settings: {
          imageGeneration: {
            defaultWidth: 1024,
            defaultHeight: 1024,
            defaultSteps: 20,
            defaultGuidanceScale: 7.5,
            ...projectData.settings?.imageGeneration
          },
          videoGeneration: {
            defaultDuration: 5,
            defaultFps: 24,
            defaultWidth: 1024,
            defaultHeight: 576,
            ...projectData.settings?.videoGeneration
          },
          promptOptimization: {
            enabled: true,
            formula: 'general',
            ...projectData.settings?.promptOptimization
          }
        },
        createdTime: new Date().toISOString(),
        updatedTime: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // 保存项目元数据
      await fs.writeJson(path.join(projectPath, 'project.json'), metadata, { spaces: 2 });
      
      // 创建空的历史记录文件
      await fs.writeJson(path.join(projectPath, 'history.json'), {
        images: [],
        videos: [],
        storyboards: []
      }, { spaces: 2 });
      
      logger.info(`项目创建成功: ${projectId}`);
      
      return {
        success: true,
        data: metadata,
        message: '项目创建成功'
      };
    } catch (error) {
      logger.error('创建项目失败:', error);
      throw error;
    }
  }

  // 获取项目详情
  async getProject(projectId) {
    await this.ensureInit();
    
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      const metaPath = path.join(projectPath, 'project.json');
      
      if (!(await fs.pathExists(metaPath))) {
        throw new Error('项目不存在');
      }
      
      const metadata = await fs.readJson(metaPath);
      const stats = await this.getProjectStats(projectId);
      const history = await this.getProjectHistory(projectId);
      
      return {
        success: true,
        data: {
          ...metadata,
          stats,
          history
        }
      };
    } catch (error) {
      logger.error('获取项目详情失败:', error);
      throw error;
    }
  }

  // 更新项目
  async updateProject(projectId, updates) {
    await this.ensureInit();
    
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      const metaPath = path.join(projectPath, 'project.json');
      
      if (!(await fs.pathExists(metaPath))) {
        throw new Error('项目不存在');
      }
      
      const metadata = await fs.readJson(metaPath);
      
      // 更新元数据
      const updatedMetadata = {
        ...metadata,
        ...updates,
        id: projectId, // 确保ID不被修改
        updatedTime: new Date().toISOString()
      };
      
      // 保存更新后的元数据
      await fs.writeJson(metaPath, updatedMetadata, { spaces: 2 });
      
      logger.info(`项目更新成功: ${projectId}`);
      
      return {
        success: true,
        data: updatedMetadata,
        message: '项目更新成功'
      };
    } catch (error) {
      logger.error('更新项目失败:', error);
      throw error;
    }
  }

  // 删除项目
  async deleteProject(projectId) {
    await this.ensureInit();
    
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      
      if (!(await fs.pathExists(projectPath))) {
        throw new Error('项目不存在');
      }
      
      // 删除项目目录
      await fs.remove(projectPath);
      
      logger.info(`项目删除成功: ${projectId}`);
      
      return {
        success: true,
        message: '项目删除成功'
      };
    } catch (error) {
      logger.error('删除项目失败:', error);
      throw error;
    }
  }

  // 获取项目文件
  async getProjectFiles(projectId, type = 'all') {
    await this.ensureInit();
    
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      
      if (!(await fs.pathExists(projectPath))) {
        throw new Error('项目不存在');
      }
      
      const files = {
        images: [],
        videos: [],
        storyboards: [],
        exports: []
      };
      
      const directories = type === 'all' ? ['images', 'videos', 'storyboards', 'exports'] : [type];
      
      for (const dir of directories) {
        const dirPath = path.join(projectPath, dir);
        if (await fs.pathExists(dirPath)) {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const item of items) {
            if (item.isFile()) {
              const filePath = path.join(dirPath, item.name);
              const stats = await fs.stat(filePath);
              
              files[dir].push({
                name: item.name,
                path: filePath,
                size: stats.size,
                createdTime: stats.birthtime,
                modifiedTime: stats.mtime
              });
            }
          }
        }
      }
      
      return {
        success: true,
        data: type === 'all' ? files : files[type]
      };
    } catch (error) {
      logger.error('获取项目文件失败:', error);
      throw error;
    }
  }

  // 删除项目文件
  async deleteProjectFile(projectId, fileName, fileType) {
    await this.ensureInit();
    
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      const filePath = path.join(projectPath, fileType, fileName);
      
      if (!(await fs.pathExists(filePath))) {
        throw new Error('文件不存在');
      }
      
      await fs.remove(filePath);
      
      logger.info(`项目文件删除成功: ${projectId}/${fileType}/${fileName}`);
      
      return {
        success: true,
        message: '文件删除成功'
      };
    } catch (error) {
      logger.error('删除项目文件失败:', error);
      throw error;
    }
  }

  // 获取项目统计信息
  async getProjectStats(projectId) {
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      
      const stats = {
        images: 0,
        videos: 0,
        storyboards: 0,
        exports: 0,
        totalSize: 0
      };
      
      const directories = ['images', 'videos', 'storyboards', 'exports'];
      
      for (const dir of directories) {
        const dirPath = path.join(projectPath, dir);
        if (await fs.pathExists(dirPath)) {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const item of items) {
            if (item.isFile()) {
              stats[dir]++;
              const filePath = path.join(dirPath, item.name);
              const fileStats = await fs.stat(filePath);
              stats.totalSize += fileStats.size;
            }
          }
        }
      }
      
      return stats;
    } catch (error) {
      logger.error('获取项目统计信息失败:', error);
      return {
        images: 0,
        videos: 0,
        storyboards: 0,
        exports: 0,
        totalSize: 0
      };
    }
  }

  // 获取项目历史记录
  async getProjectHistory(projectId) {
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      const historyPath = path.join(projectPath, 'history.json');
      
      if (await fs.pathExists(historyPath)) {
        return await fs.readJson(historyPath);
      } else {
        return {
          images: [],
          videos: [],
          storyboards: []
        };
      }
    } catch (error) {
      logger.error('获取项目历史记录失败:', error);
      return {
        images: [],
        videos: [],
        storyboards: []
      };
    }
  }

  // 添加历史记录
  async addToHistory(projectId, type, data) {
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      const historyPath = path.join(projectPath, 'history.json');
      
      let history = await this.getProjectHistory(projectId);
      
      if (!history[type]) {
        history[type] = [];
      }
      
      history[type].unshift({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // 限制历史记录数量
      if (history[type].length > 100) {
        history[type] = history[type].slice(0, 100);
      }
      
      await fs.writeJson(historyPath, history, { spaces: 2 });
      
      return {
        success: true,
        message: '历史记录添加成功'
      };
    } catch (error) {
      logger.error('添加历史记录失败:', error);
      throw error;
    }
  }

  // 导出项目
  async exportProject(projectId, options = {}) {
    await this.ensureInit();
    
    try {
      const projectPath = path.join(this.projectsDir, projectId);
      
      if (!(await fs.pathExists(projectPath))) {
        throw new Error('项目不存在');
      }
      
      const { includeFiles = true, format = 'zip' } = options;
      
      // 获取项目数据
      const project = await this.getProject(projectId);
      
      const exportData = {
        project: project.data,
        exportTime: new Date().toISOString(),
        version: '1.0.0'
      };
      
      if (includeFiles) {
        const files = await this.getProjectFiles(projectId);
        exportData.files = files.data;
      }
      
      return {
        success: true,
        data: exportData,
        message: '项目导出成功'
      };
    } catch (error) {
      logger.error('导出项目失败:', error);
      throw error;
    }
  }

  // 复制项目
  async copyProject(projectId, newName) {
    await this.ensureInit();
    
    try {
      const sourceProject = await this.getProject(projectId);
      
      if (!sourceProject.success) {
        throw new Error('源项目不存在');
      }
      
      // 创建新项目
      const newProject = await this.createProject({
        name: newName || `${sourceProject.data.name} - 副本`,
        description: sourceProject.data.description,
        type: sourceProject.data.type,
        tags: sourceProject.data.tags,
        settings: sourceProject.data.settings
      });
      
      // 复制文件
      const sourcePath = path.join(this.projectsDir, projectId);
      const targetPath = path.join(this.projectsDir, newProject.data.id);
      
      const directories = ['images', 'videos', 'storyboards'];
      
      for (const dir of directories) {
        const sourceDir = path.join(sourcePath, dir);
        const targetDir = path.join(targetPath, dir);
        
        if (await fs.pathExists(sourceDir)) {
          await fs.copy(sourceDir, targetDir);
        }
      }
      
      logger.info(`项目复制成功: ${projectId} -> ${newProject.data.id}`);
      
      return {
        success: true,
        data: newProject.data,
        message: '项目复制成功'
      };
    } catch (error) {
      logger.error('复制项目失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const projectService = new ProjectService();

module.exports = projectService;