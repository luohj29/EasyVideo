import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { EventEmitter } from 'events';

const router = express.Router();

// Task management
interface Task {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: string;
  progress: number;
  prompt?: string;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

const tasks = new Map<string, Task>();
const taskEmitter = new EventEmitter();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Server-Sent Events endpoint for progress updates
router.get('/progress/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial task status
  const task = tasks.get(taskId);
  if (task) {
    res.write(`data: ${JSON.stringify(task)}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ error: 'Task not found' })}\n\n`);
    res.end();
    return;
  }

  // Listen for progress updates
  const progressListener = (data: any) => {
    if (data.taskId === taskId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (data.status === 'completed' || data.status === 'failed') {
        res.end();
      }
    }
  };

  taskEmitter.on('progress', progressListener);

  // Clean up on client disconnect
  req.on('close', () => {
    taskEmitter.removeListener('progress', progressListener);
  });
});

// Prompt optimization
router.post('/optimize-prompt', async (req, res) => {
  try {
    const { prompt, type = '通用型', style_preferences = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }
    
    // Call AI service for prompt optimization
    const response = await axios.post(`${AI_SERVICE_URL}/prompt/optimize`, {
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
  } catch (error) {
    console.error('Error optimizing prompt:', error);
    if (axios.isAxiosError(error)) {
      res.status(500).json({ 
        success: false,
        error: 'AI service unavailable', 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to optimize prompt' 
      });
    }
  }
});

// Text to image generation
router.post('/text-to-image', async (req, res) => {
  try {
    const {
      prompt,
      negative_prompt = '',
      width = 1024,
      height = 1024,
      seed,
      num_images = 1,
      project_id
    } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Prompt is required' 
      });
    }
    
    const taskId = uuidv4();
    const outputDir = path.join(__dirname, '../../../outputs/images');
    await fs.ensureDir(outputDir);
    
    // Create initial task
    const task: Task = {
      id: taskId,
      status: 'pending',
      type: 'text_to_image',
      progress: 0,
      prompt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    tasks.set(taskId, task);
    
    // Return task ID immediately
    res.json({
      success: true,
      data: {
        task_id: taskId,
        message: 'Image generation started'
      }
    });
    
    // Process image generation asynchronously
    processImageGeneration(taskId, {
      prompt,
      negative_prompt,
      width,
      height,
      seed,
      num_images,
      project_id
    });
    
  } catch (error) {
    console.error('Error starting image generation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start image generation' 
    });
  }
});

// Async function to process image generation
async function processImageGeneration(taskId: string, params: any) {
  try {
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../../../outputs/images');
    await fs.ensureDir(outputDir);
    
    // Update task status to processing
    const task = tasks.get(taskId)!;
    task.status = 'processing';
    task.progress = 10;
    task.updated_at = new Date().toISOString();
    tasks.set(taskId, task);
    taskEmitter.emit('progress', { taskId, ...task });
    
    // Real progress updates will be handled by AI service callback
    // Set up progress monitoring interval
    const progressInterval = setInterval(async () => {
      try {
        const progressResponse = await axios.get(`${AI_SERVICE_URL}/task/progress/${taskId}`);
        if (progressResponse.data && progressResponse.data.progress !== undefined) {
          const task = tasks.get(taskId)!;
          // Use actual progress from AI service, don't cap at 95%
          task.progress = progressResponse.data.progress;
          task.updated_at = new Date().toISOString();
          tasks.set(taskId, task);
          taskEmitter.emit('progress', { taskId, ...task });
          
          // If AI service reports 100% progress, mark as completed
          if (progressResponse.data.progress >= 100) {
            clearInterval(progressInterval);
            // The main generation function will handle final completion
          }
        }
      } catch (error: any) {
         // Progress monitoring error, continue with generation
         console.log('Progress monitoring error:', error && error.message ? error.message : 'Unknown error');
      }
    }, 2000); // Check progress every 2 seconds
    
    // Call AI service for image generation
    const requestData = {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt || '',
      width: params.width,
      height: params.height,
      seed: params.seed || Math.floor(Math.random() * 1000000),
      num_images: params.num_images || 1,
      output_dir: outputDir,
      task_id: taskId // Pass task ID for progress tracking
    };
    
    // Remove undefined values to ensure clean JSON
    Object.keys(requestData).forEach(key => {
      if ((requestData as any)[key] === undefined) {
        delete (requestData as any)[key];
      }
    });
    
    console.log('Sending request to AI service:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(`${AI_SERVICE_URL}/image/generate`, requestData, {
      timeout: 300000 // 5 minutes timeout
    });
    
    console.log('AI service response:', response.data);
    
    // Clear progress monitoring interval
    clearInterval(progressInterval);

    // Update task with results
    const finalTask = tasks.get(taskId)!;
    finalTask.status = 'completed';
    finalTask.progress = 100;
    finalTask.result = {
      images: response.data.images.map((imagePath: string, index: number) => ({
        id: `img_${taskId}_${index}`,
        url: imagePath.replace(path.join(__dirname, '../../../'), '/'),
        thumbnail_url: imagePath.replace(path.join(__dirname, '../../../'), '/'),
        width: params.width,
        height: params.height,
        file_size: 0,
        created_at: new Date().toISOString()
      }))
    };
    finalTask.updated_at = new Date().toISOString();
    tasks.set(taskId, finalTask);
    
    // Save to project if project_id provided
    if (params.project_id) {
      await saveToProject(params.project_id, 'image', finalTask.result);
    }
    
    taskEmitter.emit('progress', { taskId, ...finalTask });
    
  } catch (error) {
    console.error('Error processing image generation:', error);
    const task = tasks.get(taskId)!;
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : 'Unknown error';
    task.updated_at = new Date().toISOString();
    tasks.set(taskId, task);
    taskEmitter.emit('progress', { taskId, ...task });
  }
}

// Delete task endpoint
router.delete('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required'
      });
    }
    
    // Check if task exists
    const task = tasks.get(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Remove task from memory
    tasks.delete(taskId);
    
    // Emit deletion event for any listeners
    taskEmitter.emit('task_deleted', { taskId });
    
    res.json({
      success: true,
      data: {
        task_id: taskId,
        message: 'Task deleted successfully'
      }
    });
    
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
});

// Image to video generation
router.post('/image-to-video', upload.single('image'), async (req, res) => {
  try {
    const {
      image_id,
      motion_prompt,
      negative_prompt = "static, blurry, low quality",
      fps = 15,
      duration = 4,
      seed,
      tiled = true,
      num_inference_steps = 20,
      cfg_scale = 7.5,
      motion_strength = 0.5,
      project_id,
      task_id,
      output_dir
    } = req.body;
    
    // motion_prompt is optional for image-to-video
    const prompt = motion_prompt || '';
    
    let imagePath: string;
    
    // Handle image upload or path
    if (req.file) {
      // Save uploaded image
      const imageId = uuidv4();
      const imageExt = path.extname(req.file.originalname) || '.jpg';
      imagePath = path.join(__dirname, '../../../img', `${imageId}${imageExt}`);
      await fs.ensureDir(path.dirname(imagePath));
      await fs.writeFile(imagePath, req.file.buffer);
    } else if (req.body.image_path) {
      imagePath = req.body.image_path;
      if (!await fs.pathExists(imagePath)) {
        return res.status(400).json({ 
          success: false,
          error: 'Image file not found' 
        });
      }
    } else if (image_id) {
      // Handle image_id from frontend
      imagePath = path.join(__dirname, '../../../img', `${image_id}.jpg`);
      if (!await fs.pathExists(imagePath)) {
        return res.status(400).json({ 
          success: false,
          error: 'Image file not found for the provided image_id' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Image file, path, or image_id is required' 
      });
    }
    
    const taskId = task_id || uuidv4();
    const outputDir = output_dir ? path.join(__dirname, '../../../outputs', output_dir) : path.join(__dirname, '../../../outputs/videos');
    await fs.ensureDir(outputDir);
    
    // Call AI service for video generation
    const response = await axios.post(`${AI_SERVICE_URL}/video/generate`, {
      image_path: imagePath,
      prompt,
      negative_prompt,
      fps,
      duration,
      seed,
      tiled,
      num_inference_steps,
      cfg_scale,
      motion_strength,
      output_dir: outputDir,
      task_id: taskId
    }, {
      timeout: 300000 // 5 minutes timeout
    });
    
    // Create task response format that matches frontend expectations
    const task = {
      id: taskId,
      status: 'completed',
      type: 'image_to_video',
      progress: 100,
      prompt,
      source_image: imagePath,
      parameters: { fps, duration, seed, negative_prompt, tiled, num_inference_steps, cfg_scale, motion_strength },
      result: {
          videos: [{
            id: `vid_${taskId}`,
            url: response.data.video_path.replace('/root/autodl-tmp/EasyVideo/', '/static/'),
            thumbnail_url: response.data.video_path.replace('/root/autodl-tmp/EasyVideo/', '/static/').replace('.mp4', '_thumb.jpg'),
            duration: duration,
            fps: fps,
            width: 640,
            height: 480,
            motion_prompt: prompt,
            file_size: 0, // Would be calculated in real implementation
            created_at: new Date().toISOString()
          }]
        },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project_id
    };
    
    // Save to project if project_id provided
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
  } catch (error) {
    console.error('Error generating video:', error);
    if (axios.isAxiosError(error)) {
      res.status(500).json({ 
        success: false,
        error: 'AI service unavailable', 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate video' 
      });
    }
  }
});

// Storyboard script generation
router.post('/storyboard/script', async (req, res) => {
  try {
    const {
      story_description,
      num_scenes = 5,
      style = '现代风格'
    } = req.body;
    
    if (!story_description) {
      return res.status(400).json({ 
        success: false,
        error: 'Story description is required' 
      });
    }
    
    // Call AI service for storyboard generation
    const response = await axios.post(`${AI_SERVICE_URL}/storyboard/generate`, {
      script: story_description,
      scene_count: num_scenes,
      style
    }, {
      timeout: 60000
    });
    
    res.json({
      success: true,
      data: {
        storyboard_id: uuidv4(),
        scenes: response.data.scenes,
        story_description,
        style,
        num_scenes,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    if (axios.isAxiosError(error)) {
      res.status(500).json({ 
        success: false,
        error: 'AI service unavailable', 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate storyboard' 
      });
    }
  }
});

// Storyboard generation endpoint
router.post('/storyboard', async (req, res) => {
  try {
    const {
      concept,
      style = 'cinematic',
      duration = 60,
      scene_count = 5,
      include_camera_movements = true,
      include_lighting_notes = true,
      include_audio_cues = false
    } = req.body;
    
    if (!concept) {
      return res.status(400).json({ 
        success: false,
        error: 'Concept is required' 
      });
    }
    
    const taskId = uuidv4();
    const task: Task = {
      id: taskId,
      status: 'pending',
      type: 'storyboard',
      progress: 0,
      prompt: concept,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    tasks.set(taskId, task);
    
    // Process storyboard generation asynchronously
    processStoryboardGeneration(taskId, {
      concept,
      style,
      duration,
      scene_count,
      include_camera_movements,
      include_lighting_notes,
      include_audio_cues
    });
    
    res.json({
      task_id: taskId,
      status: 'pending',
      message: 'Storyboard generation started'
    });
  } catch (error) {
    console.error('Error starting storyboard generation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start storyboard generation' 
    });
  }
});

// Image upload endpoint
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }
    
    const filename = `${uuidv4()}.${req.file.originalname.split('.').pop()}`;
    const outputDir = path.join(process.cwd(), '../outputs/images');
    await fs.ensureDir(outputDir);
    
    const filePath = path.join(outputDir, filename);
    await fs.writeFile(filePath, req.file.buffer);
    
    res.json({
      success: true,
      data: {
        image_id: uuidv4(),
        image_path: filePath,
        thumbnail_url: `/outputs/images/${filename}`,
        filename,
        path: filePath,
        url: `/outputs/images/${filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// Process storyboard generation
async function processStoryboardGeneration(taskId: string, params: any) {
  const task = tasks.get(taskId);
  if (!task) return;
  
  try {
    task.status = 'processing';
    task.progress = 10;
    task.updated_at = new Date().toISOString();
    taskEmitter.emit('progress', { taskId, progress: 10, status: 'processing' });
    
    // Call AI service for storyboard generation
    const response = await axios.post(`${AI_SERVICE_URL}/storyboard/generate`, {
      script: params.concept,
      scene_count: params.scene_count,
      style: params.style,
      duration: params.duration,
      include_camera_movements: params.include_camera_movements,
      include_lighting_notes: params.include_lighting_notes,
      include_audio_cues: params.include_audio_cues
    }, {
      timeout: 120000
    });
    
    task.status = 'completed';
    task.progress = 100;
    task.result = {
      storyboard: {
        id: uuidv4(),
        title: `Storyboard for: ${params.concept}`,
        concept: params.concept,
        style: params.style,
        duration: params.duration,
        scenes: response.data.scenes || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    task.updated_at = new Date().toISOString();
    
    taskEmitter.emit('progress', { taskId, progress: 100, status: 'completed', result: task.result });
  } catch (error) {
    console.error(`Error processing storyboard generation for task ${taskId}:`, error);
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : 'Unknown error';
    task.updated_at = new Date().toISOString();
    
    taskEmitter.emit('progress', { taskId, progress: 0, status: 'failed', error: task.error });
  }
}

// Helper function to save results to project

// Get task status
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // In a real implementation, this would query a database or task queue
    // For now, we'll return a mock response
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
  } catch (error) {
    console.error('Error getting task status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get task status' 
    });
  }
});

// Get task list
router.get('/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    
    // Mock task list - in a real implementation, this would query a database
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
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error getting task list:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get task list' 
    });
  }
});

// Get queue status
router.get('/queue/status', async (req, res) => {
  try {
    // Mock queue status - in a real implementation, this would query a task queue
    const queueStatus = {
      pending: 2,
      running: 1,
      completed: 15,
      failed: 0,
      estimated_wait_time: 120 // seconds
    };
    
    res.json({
      success: true,
      data: queueStatus
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get queue status' 
    });
  }
});

async function saveToProject(projectId: string, type: string, data: any) {
  try {
    const projectDir = path.join(__dirname, '../../../projects', projectId);
    const projectFile = path.join(projectDir, 'project.json');
    
    await fs.ensureDir(projectDir);
    
    let project: any = {};
    if (await fs.pathExists(projectFile)) {
      project = await fs.readJson(projectFile);
    }
    
    if (!project[`${type}s`]) {
      project[`${type}s`] = [];
    }
    
    project[`${type}s`].push(data);
    project.updated_at = new Date().toISOString();
    
    await fs.writeJson(projectFile, project, { spaces: 2 });
  } catch (error) {
    console.error('Error saving to project:', error);
  }
}

export default router;