import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const PROJECTS_DIR = path.join(__dirname, '../../../projects');

// Get all projects
router.get('/', async (req, res) => {
  try {
    await fs.ensureDir(PROJECTS_DIR);
    const projectDirs = await fs.readdir(PROJECTS_DIR);
    const projects = [];
    
    for (const dir of projectDirs) {
      const projectPath = path.join(PROJECTS_DIR, dir);
      const projectFile = path.join(projectPath, 'project.json');
      
      if (await fs.pathExists(projectFile)) {
        try {
          const project = await fs.readJson(projectFile);
          projects.push({
            id: project.id || dir,
            name: project.name || dir,
            description: project.description || '',
            created_at: project.created_at,
            updated_at: project.updated_at,
            image_count: (project.images || []).length,
            video_count: (project.videos || []).length,
            storyboard_count: (project.storyboards || []).length
          });
        } catch (error) {
          console.error(`Error reading project ${dir}:`, error);
        }
      }
    }
    
    // Sort by updated_at descending
    projects.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get projects' 
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Project name is required' 
      });
    }
    
    const projectId = `proj_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const projectDir = path.join(PROJECTS_DIR, projectId);
    const projectFile = path.join(projectDir, 'project.json');
    
    const project = {
      id: projectId,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      output_dir: projectDir,
      images: [],
      videos: [],
      storyboards: []
    };
    
    await fs.ensureDir(projectDir);
    await fs.ensureDir(path.join(projectDir, 'images'));
    await fs.ensureDir(path.join(projectDir, 'videos'));
    await fs.writeJson(projectFile, project, { spaces: 2 });
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create project' 
    });
  }
});

// Get specific project
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectFile = path.join(PROJECTS_DIR, id, 'project.json');
    
    if (!await fs.pathExists(projectFile)) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    const project = await fs.readJson(projectFile);
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get project' 
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectFile = path.join(PROJECTS_DIR, id, 'project.json');
    
    if (!await fs.pathExists(projectFile)) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    const existingProject = await fs.readJson(projectFile);
    const updatedProject = {
      ...existingProject,
      ...req.body,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    };
    
    await fs.writeJson(projectFile, updatedProject, { spaces: 2 });
    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update project' 
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectDir = path.join(PROJECTS_DIR, id);
    
    if (!await fs.pathExists(projectDir)) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    await fs.remove(projectDir);
    res.json({
      success: true,
      data: { message: 'Project deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete project' 
    });
  }
});

// Get project files
router.get('/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'images', 'videos', or 'all'
    const projectDir = path.join(PROJECTS_DIR, id);
    
    if (!await fs.pathExists(projectDir)) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    const files: any = {};
    
    if (!type || type === 'all' || type === 'images') {
      const imagesDir = path.join(projectDir, 'images');
      if (await fs.pathExists(imagesDir)) {
        const imageFiles = await fs.readdir(imagesDir);
        files.images = imageFiles.filter(file => 
          /\.(jpg|jpeg|png|webp)$/i.test(file)
        ).map(file => ({
          name: file,
          path: `/projects/${id}/images/${file}`,
          size: 0 // Could add file size if needed
        }));
      } else {
        files.images = [];
      }
    }
    
    if (!type || type === 'all' || type === 'videos') {
      const videosDir = path.join(projectDir, 'videos');
      if (await fs.pathExists(videosDir)) {
        const videoFiles = await fs.readdir(videosDir);
        files.videos = videoFiles.filter(file => 
          /\.(mp4|avi|mov|webm)$/i.test(file)
        ).map(file => ({
          name: file,
          path: `/projects/${id}/videos/${file}`,
          size: 0
        }));
      } else {
        files.videos = [];
      }
    }
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error getting project files:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get project files' 
    });
  }
});

// Export project
router.post('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'zip' } = req.body;
    const projectDir = path.join(PROJECTS_DIR, id);
    
    if (!await fs.pathExists(projectDir)) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    // For now, just return the project data
    // In a full implementation, you might create a ZIP file
    const projectFile = path.join(projectDir, 'project.json');
    const project = await fs.readJson(projectFile);
    
    res.json({
      success: true,
      data: {
        message: 'Project export prepared',
        project,
        export_format: format,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error exporting project:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to export project' 
    });
  }
});

export default router;