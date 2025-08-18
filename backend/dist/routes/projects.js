"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const router = express_1.default.Router();
const PROJECTS_DIR = path_1.default.join(__dirname, '../../../projects');
router.get('/', async (req, res) => {
    try {
        await fs_extra_1.default.ensureDir(PROJECTS_DIR);
        const projectDirs = await fs_extra_1.default.readdir(PROJECTS_DIR);
        const projects = [];
        for (const dir of projectDirs) {
            const projectPath = path_1.default.join(PROJECTS_DIR, dir);
            const projectFile = path_1.default.join(projectPath, 'project.json');
            if (await fs_extra_1.default.pathExists(projectFile)) {
                try {
                    const project = await fs_extra_1.default.readJson(projectFile);
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
                }
                catch (error) {
                    console.error(`Error reading project ${dir}:`, error);
                }
            }
        }
        projects.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        res.json({
            success: true,
            data: projects
        });
    }
    catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get projects'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, description = '' } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Project name is required'
            });
        }
        const projectId = `proj_${Date.now()}_${(0, uuid_1.v4)().slice(0, 8)}`;
        const projectDir = path_1.default.join(PROJECTS_DIR, projectId);
        const projectFile = path_1.default.join(projectDir, 'project.json');
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
        await fs_extra_1.default.ensureDir(projectDir);
        await fs_extra_1.default.ensureDir(path_1.default.join(projectDir, 'images'));
        await fs_extra_1.default.ensureDir(path_1.default.join(projectDir, 'videos'));
        await fs_extra_1.default.writeJson(projectFile, project, { spaces: 2 });
        res.status(201).json({
            success: true,
            data: project
        });
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create project'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const projectFile = path_1.default.join(PROJECTS_DIR, id, 'project.json');
        if (!await fs_extra_1.default.pathExists(projectFile)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        const project = await fs_extra_1.default.readJson(projectFile);
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get project'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const projectFile = path_1.default.join(PROJECTS_DIR, id, 'project.json');
        if (!await fs_extra_1.default.pathExists(projectFile)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        const existingProject = await fs_extra_1.default.readJson(projectFile);
        const updatedProject = {
            ...existingProject,
            ...req.body,
            id,
            updated_at: new Date().toISOString()
        };
        await fs_extra_1.default.writeJson(projectFile, updatedProject, { spaces: 2 });
        res.json({
            success: true,
            data: updatedProject
        });
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update project'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const projectDir = path_1.default.join(PROJECTS_DIR, id);
        if (!await fs_extra_1.default.pathExists(projectDir)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        await fs_extra_1.default.remove(projectDir);
        res.json({
            success: true,
            data: { message: 'Project deleted successfully' }
        });
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete project'
        });
    }
});
router.get('/:id/files', async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;
        const projectDir = path_1.default.join(PROJECTS_DIR, id);
        if (!await fs_extra_1.default.pathExists(projectDir)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        const files = {};
        if (!type || type === 'all' || type === 'images') {
            const imagesDir = path_1.default.join(projectDir, 'images');
            if (await fs_extra_1.default.pathExists(imagesDir)) {
                const imageFiles = await fs_extra_1.default.readdir(imagesDir);
                files.images = imageFiles.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file)).map(file => ({
                    name: file,
                    path: `/projects/${id}/images/${file}`,
                    size: 0
                }));
            }
            else {
                files.images = [];
            }
        }
        if (!type || type === 'all' || type === 'videos') {
            const videosDir = path_1.default.join(projectDir, 'videos');
            if (await fs_extra_1.default.pathExists(videosDir)) {
                const videoFiles = await fs_extra_1.default.readdir(videosDir);
                files.videos = videoFiles.filter(file => /\.(mp4|avi|mov|webm)$/i.test(file)).map(file => ({
                    name: file,
                    path: `/projects/${id}/videos/${file}`,
                    size: 0
                }));
            }
            else {
                files.videos = [];
            }
        }
        res.json({
            success: true,
            data: files
        });
    }
    catch (error) {
        console.error('Error getting project files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get project files'
        });
    }
});
router.post('/:id/export', async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'zip' } = req.body;
        const projectDir = path_1.default.join(PROJECTS_DIR, id);
        if (!await fs_extra_1.default.pathExists(projectDir)) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        const projectFile = path_1.default.join(projectDir, 'project.json');
        const project = await fs_extra_1.default.readJson(projectFile);
        res.json({
            success: true,
            data: {
                message: 'Project export prepared',
                project,
                export_format: format,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error exporting project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export project'
        });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map