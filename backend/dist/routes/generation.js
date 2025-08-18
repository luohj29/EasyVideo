"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const events_1 = require("events");
const router = express_1.default.Router();
const tasks = new Map();
const taskEmitter = new events_1.EventEmitter();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    }
});
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
router.get('/progress/:taskId', (req, res) => {
    const { taskId } = req.params;
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });
    const task = tasks.get(taskId);
    if (task) {
        res.write(`data: ${JSON.stringify(task)}\n\n`);
    }
    else {
        res.write(`data: ${JSON.stringify({ error: 'Task not found' })}\n\n`);
        res.end();
        return;
    }
    const progressListener = (data) => {
        if (data.taskId === taskId) {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            if (data.status === 'completed' || data.status === 'failed') {
                res.end();
            }
        }
    };
    taskEmitter.on('progress', progressListener);
    req.on('close', () => {
        taskEmitter.removeListener('progress', progressListener);
    });
});
router.post('/optimize-prompt', async (req, res) => {
    try {
        const { prompt, type = '通用型', style_preferences = [] } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/prompt/optimize`, {
            prompt,
            optimize_type: type,
            enhance_details: true
        }, {
            timeout: 30000
        });
        res.json({
            success: true,
            data: {
                optimized_prompt: response.data.optimized_prompt,
                original_prompt: prompt,
                optimization_type: type,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error optimizing prompt:', error);
        if (axios_1.default.isAxiosError(error)) {
            res.status(500).json({
                success: false,
                error: 'AI service unavailable',
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to optimize prompt'
            });
        }
    }
});
router.post('/text-to-image', async (req, res) => {
    try {
        const { prompt, negative_prompt = '', width = 1024, height = 1024, seed, num_images = 1, project_id } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }
        const taskId = (0, uuid_1.v4)();
        const outputDir = path_1.default.join(__dirname, '../../../outputs/images');
        await fs_extra_1.default.ensureDir(outputDir);
        const task = {
            id: taskId,
            status: 'pending',
            type: 'text_to_image',
            progress: 0,
            prompt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        tasks.set(taskId, task);
        res.json({
            success: true,
            data: {
                task_id: taskId,
                message: 'Image generation started'
            }
        });
        processImageGeneration(taskId, {
            prompt,
            negative_prompt,
            width,
            height,
            seed,
            num_images,
            project_id
        });
    }
    catch (error) {
        console.error('Error starting image generation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start image generation'
        });
    }
});
async function processImageGeneration(taskId, params) {
    try {
        const outputDir = path_1.default.join(__dirname, '../../../outputs/images');
        await fs_extra_1.default.ensureDir(outputDir);
        const task = tasks.get(taskId);
        task.status = 'processing';
        task.progress = 10;
        task.updated_at = new Date().toISOString();
        tasks.set(taskId, task);
        taskEmitter.emit('progress', { taskId, ...task });
        const progressInterval = setInterval(async () => {
            try {
                const progressResponse = await axios_1.default.get(`${AI_SERVICE_URL}/task/progress/${taskId}`);
                if (progressResponse.data && progressResponse.data.progress !== undefined) {
                    const task = tasks.get(taskId);
                    task.progress = progressResponse.data.progress;
                    task.updated_at = new Date().toISOString();
                    tasks.set(taskId, task);
                    taskEmitter.emit('progress', { taskId, ...task });
                    if (progressResponse.data.progress >= 100) {
                        clearInterval(progressInterval);
                    }
                }
            }
            catch (error) {
                console.log('Progress monitoring error:', error && error.message ? error.message : 'Unknown error');
            }
        }, 2000);
        const requestData = {
            prompt: params.prompt,
            negative_prompt: params.negative_prompt || '',
            width: params.width,
            height: params.height,
            seed: params.seed || Math.floor(Math.random() * 1000000),
            num_images: params.num_images || 1,
            output_dir: outputDir,
            task_id: taskId
        };
        Object.keys(requestData).forEach(key => {
            if (requestData[key] === undefined) {
                delete requestData[key];
            }
        });
        console.log('Sending request to AI service:', JSON.stringify(requestData, null, 2));
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/image/generate`, requestData, {
            timeout: 300000
        });
        console.log('AI service response:', response.data);
        clearInterval(progressInterval);
        const finalTask = tasks.get(taskId);
        finalTask.status = 'completed';
        finalTask.progress = 100;
        finalTask.result = {
            images: response.data.images.map((imagePath, index) => ({
                id: `img_${taskId}_${index}`,
                url: imagePath.replace(path_1.default.join(__dirname, '../../../'), '/'),
                thumbnail_url: imagePath.replace(path_1.default.join(__dirname, '../../../'), '/'),
                width: params.width,
                height: params.height,
                file_size: 0,
                created_at: new Date().toISOString()
            }))
        };
        finalTask.updated_at = new Date().toISOString();
        tasks.set(taskId, finalTask);
        if (params.project_id) {
            await saveToProject(params.project_id, 'image', finalTask.result);
        }
        taskEmitter.emit('progress', { taskId, ...finalTask });
    }
    catch (error) {
        console.error('Error processing image generation:', error);
        const task = tasks.get(taskId);
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error';
        task.updated_at = new Date().toISOString();
        tasks.set(taskId, task);
        taskEmitter.emit('progress', { taskId, ...task });
    }
}
router.post('/image-to-video', upload.single('image'), async (req, res) => {
    try {
        const { image_id, motion_prompt, fps = 15, duration = 4, seed, project_id } = req.body;
        const prompt = motion_prompt || '';
        let imagePath;
        if (req.file) {
            const imageId = (0, uuid_1.v4)();
            const imageExt = path_1.default.extname(req.file.originalname) || '.jpg';
            imagePath = path_1.default.join(__dirname, '../../../img', `${imageId}${imageExt}`);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(imagePath));
            await fs_extra_1.default.writeFile(imagePath, req.file.buffer);
        }
        else if (req.body.image_path) {
            imagePath = req.body.image_path;
            if (!await fs_extra_1.default.pathExists(imagePath)) {
                return res.status(400).json({
                    success: false,
                    error: 'Image file not found'
                });
            }
        }
        else if (image_id) {
            imagePath = path_1.default.join(__dirname, '../../../img', `${image_id}.jpg`);
            if (!await fs_extra_1.default.pathExists(imagePath)) {
                return res.status(400).json({
                    success: false,
                    error: 'Image file not found for the provided image_id'
                });
            }
        }
        else {
            return res.status(400).json({
                success: false,
                error: 'Image file, path, or image_id is required'
            });
        }
        const taskId = (0, uuid_1.v4)();
        const outputDir = path_1.default.join(__dirname, '../../../outputs/videos');
        await fs_extra_1.default.ensureDir(outputDir);
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/video/generate`, {
            image_path: imagePath,
            prompt,
            fps,
            duration,
            seed
        }, {
            timeout: 300000
        });
        const task = {
            id: taskId,
            status: 'completed',
            type: 'image_to_video',
            progress: 100,
            prompt,
            source_image: imagePath,
            parameters: { fps, duration, seed },
            result: {
                videos: [{
                        id: `vid_${taskId}`,
                        url: response.data.video_path.replace(path_1.default.join(__dirname, '../../../'), '/'),
                        thumbnail_url: response.data.video_path.replace(path_1.default.join(__dirname, '../../../'), '/').replace('.mp4', '_thumb.jpg'),
                        duration: duration,
                        fps: fps,
                        file_size: 0,
                        created_at: new Date().toISOString()
                    }]
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            project_id
        };
        if (project_id) {
            await saveToProject(project_id, 'video', task.result);
        }
        res.json({
            success: true,
            data: {
                task_id: taskId,
                task: task,
                status: 'completed',
                message: 'Video generation completed successfully'
            }
        });
    }
    catch (error) {
        console.error('Error generating video:', error);
        if (axios_1.default.isAxiosError(error)) {
            res.status(500).json({
                success: false,
                error: 'AI service unavailable',
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to generate video'
            });
        }
    }
});
router.post('/storyboard/script', async (req, res) => {
    try {
        const { story_description, num_scenes = 5, style = '现代风格' } = req.body;
        if (!story_description) {
            return res.status(400).json({
                success: false,
                error: 'Story description is required'
            });
        }
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/storyboard/generate`, {
            script: story_description,
            scene_count: num_scenes,
            style
        }, {
            timeout: 60000
        });
        res.json({
            success: true,
            data: {
                storyboard_id: (0, uuid_1.v4)(),
                scenes: response.data.scenes,
                story_description,
                style,
                num_scenes,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error generating storyboard:', error);
        if (axios_1.default.isAxiosError(error)) {
            res.status(500).json({
                success: false,
                error: 'AI service unavailable',
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to generate storyboard'
            });
        }
    }
});
router.get('/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const mockTask = {
            id: taskId,
            status: 'completed',
            type: 'text_to_image',
            progress: 100,
            result: {
                images: [
                    {
                        id: `img_${taskId}`,
                        url: `/outputs/images/mock_${taskId}.jpg`,
                        thumbnail_url: `/outputs/images/mock_${taskId}_thumb.jpg`,
                        width: 1024,
                        height: 1024,
                        file_size: 2048576,
                        created_at: new Date().toISOString()
                    }
                ]
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        res.json({
            success: true,
            data: mockTask
        });
    }
    catch (error) {
        console.error('Error getting task status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get task status'
        });
    }
});
router.get('/tasks', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        const mockTasks = [
            {
                id: 'task_1',
                status: 'completed',
                type: 'text_to_image',
                progress: 100,
                created_at: new Date(Date.now() - 3600000).toISOString(),
                updated_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 'task_2',
                status: 'running',
                type: 'image_to_video',
                progress: 45,
                created_at: new Date(Date.now() - 1800000).toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        res.json({
            success: true,
            data: {
                tasks: mockTasks,
                total: mockTasks.length,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    }
    catch (error) {
        console.error('Error getting task list:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get task list'
        });
    }
});
router.get('/queue/status', async (req, res) => {
    try {
        const queueStatus = {
            pending: 2,
            running: 1,
            completed: 15,
            failed: 0,
            estimated_wait_time: 120
        };
        res.json({
            success: true,
            data: queueStatus
        });
    }
    catch (error) {
        console.error('Error getting queue status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get queue status'
        });
    }
});
async function saveToProject(projectId, type, data) {
    try {
        const projectDir = path_1.default.join(__dirname, '../../../projects', projectId);
        const projectFile = path_1.default.join(projectDir, 'project.json');
        await fs_extra_1.default.ensureDir(projectDir);
        let project = {};
        if (await fs_extra_1.default.pathExists(projectFile)) {
            project = await fs_extra_1.default.readJson(projectFile);
        }
        if (!project[`${type}s`]) {
            project[`${type}s`] = [];
        }
        project[`${type}s`].push(data);
        project.updated_at = new Date().toISOString();
        await fs_extra_1.default.writeJson(projectFile, project, { spaces: 2 });
    }
    catch (error) {
        console.error('Error saving to project:', error);
    }
}
router.delete('/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        if (!['image', 'video', 'storyboard'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be image, video, or storyboard'
            });
        }
        const outputDir = path_1.default.join(__dirname, '../../../outputs', `${type}s`);
        const files = await fs_extra_1.default.readdir(outputDir).catch(() => []);
        const targetFiles = files.filter(file => file.includes(id));
        for (const file of targetFiles) {
            await fs_extra_1.default.remove(path_1.default.join(outputDir, file));
        }
        tasks.delete(id);
        res.json({
            success: true,
            data: { message: `${type} deleted successfully` }
        });
    }
    catch (error) {
        console.error('Error deleting generation result:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete generation result'
        });
    }
});
router.get('/:type/:id/download', async (req, res) => {
    try {
        const { type, id } = req.params;
        if (!['image', 'video', 'storyboard'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be image, video, or storyboard'
            });
        }
        const outputDir = path_1.default.join(__dirname, '../../../outputs', `${type}s`);
        const files = await fs_extra_1.default.readdir(outputDir).catch(() => []);
        const targetFile = files.find(file => file.includes(id));
        if (!targetFile) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
        const filePath = path_1.default.join(outputDir, targetFile);
        const fileExtension = path_1.default.extname(targetFile);
        const mimeType = fileExtension === '.mp4' ? 'video/mp4' : 'image/png';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="generated-${type}-${id}${fileExtension}"`);
        const fileStream = fs_extra_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error('Error downloading generation result:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download generation result'
        });
    }
});
router.delete('/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = tasks.get(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        if (task.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel completed task'
            });
        }
        task.status = 'failed';
        task.error = 'Task cancelled by user';
        task.updated_at = new Date().toISOString();
        tasks.set(taskId, task);
        taskEmitter.emit('progress', {
            taskId,
            status: 'failed',
            error: 'Task cancelled by user'
        });
        res.json({
            success: true,
            data: { message: 'Task cancelled successfully' }
        });
    }
    catch (error) {
        console.error('Error cancelling task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel task'
        });
    }
});
router.post('/task/:taskId/retry', async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = tasks.get(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        if (task.status !== 'failed') {
            return res.status(400).json({
                success: false,
                error: 'Can only retry failed tasks'
            });
        }
        task.status = 'pending';
        task.progress = 0;
        task.error = undefined;
        task.updated_at = new Date().toISOString();
        tasks.set(taskId, task);
        if (task.type === 'text_to_image' && task.prompt) {
            processImageGeneration(taskId, {
                prompt: task.prompt,
                negative_prompt: '',
                width: 1024,
                height: 1024,
                num_images: 1
            });
        }
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        console.error('Error retrying task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retry task'
        });
    }
});
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const allTasks = Array.from(tasks.values())
            .filter(task => task.status === 'completed')
            .filter(task => !type || task.type === type)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const total = allTasks.length;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedTasks = allTasks.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: {
                items: paginatedTasks,
                total,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error getting generation history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get generation history'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const allTasks = Array.from(tasks.values());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTasks = allTasks.filter(task => new Date(task.created_at) >= today);
        const stats = {
            total_generations: allTasks.filter(t => t.status === 'completed').length,
            today_generations: todayTasks.filter(t => t.status === 'completed').length,
            pending_tasks: allTasks.filter(t => t.status === 'pending').length,
            running_tasks: allTasks.filter(t => t.status === 'processing').length,
            failed_tasks: allTasks.filter(t => t.status === 'failed').length,
            success_rate: allTasks.length > 0 ?
                (allTasks.filter(t => t.status === 'completed').length / allTasks.length * 100).toFixed(2) : '0.00'
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting generation stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get generation stats'
        });
    }
});
const presets = new Map();
router.get('/presets/:type', async (req, res) => {
    try {
        const { type } = req.params;
        if (!['image', 'video', 'storyboard'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be image, video, or storyboard'
            });
        }
        const typePresets = Array.from(presets.values())
            .filter(preset => preset.type === type);
        res.json({
            success: true,
            data: typePresets
        });
    }
    catch (error) {
        console.error('Error getting presets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get presets'
        });
    }
});
router.post('/presets/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { name, config } = req.body;
        if (!['image', 'video', 'storyboard'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be image, video, or storyboard'
            });
        }
        if (!name || !config) {
            return res.status(400).json({
                success: false,
                error: 'Name and config are required'
            });
        }
        const presetId = (0, uuid_1.v4)();
        const preset = {
            id: presetId,
            type,
            name,
            config,
            created_at: new Date().toISOString()
        };
        presets.set(presetId, preset);
        res.json({
            success: true,
            data: { id: presetId }
        });
    }
    catch (error) {
        console.error('Error saving preset:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save preset'
        });
    }
});
router.delete('/presets/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        if (!['image', 'video', 'storyboard'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be image, video, or storyboard'
            });
        }
        const preset = presets.get(id);
        if (!preset || preset.type !== type) {
            return res.status(404).json({
                success: false,
                error: 'Preset not found'
            });
        }
        presets.delete(id);
        res.json({
            success: true,
            data: { message: 'Preset deleted successfully' }
        });
    }
    catch (error) {
        console.error('Error deleting preset:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete preset'
        });
    }
});
let queuePaused = false;
router.delete('/queue', async (req, res) => {
    try {
        const pendingTasks = Array.from(tasks.values())
            .filter(task => task.status === 'pending');
        let cleared = 0;
        for (const task of pendingTasks) {
            tasks.delete(task.id);
            cleared++;
        }
        res.json({
            success: true,
            data: { cleared }
        });
    }
    catch (error) {
        console.error('Error clearing queue:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear queue'
        });
    }
});
router.post('/queue/:action', async (req, res) => {
    try {
        const { action } = req.params;
        if (!['pause', 'resume'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Must be pause or resume'
            });
        }
        queuePaused = action === 'pause';
        res.json({
            success: true,
            data: {
                success: true,
                status: queuePaused ? 'paused' : 'running'
            }
        });
    }
    catch (error) {
        console.error('Error toggling queue:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle queue'
        });
    }
});
router.get('/models', async (req, res) => {
    try {
        const models = {
            text_to_image: ['stable-diffusion-xl', 'stable-diffusion-v1-5', 'midjourney-v6'],
            image_to_video: ['stable-video-diffusion', 'runway-gen2', 'pika-labs'],
            prompt_optimization: ['gpt-4', 'claude-3', 'gemini-pro']
        };
        res.json({
            success: true,
            data: models
        });
    }
    catch (error) {
        console.error('Error getting models:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get models'
        });
    }
});
router.post('/switch-model', async (req, res) => {
    try {
        const { type, model } = req.body;
        if (!type || !model) {
            return res.status(400).json({
                success: false,
                error: 'Type and model are required'
            });
        }
        console.log(`Switching ${type} model to ${model}`);
        res.json({
            success: true,
            data: {
                success: true,
                message: `Model switched to ${model} for ${type}`
            }
        });
    }
    catch (error) {
        console.error('Error switching model:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to switch model'
        });
    }
});
exports.default = router;
//# sourceMappingURL=generation.js.map