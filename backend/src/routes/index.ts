import { Router } from 'express';
import authRoutes from './auth';
import projectRoutes from './projects';
import analysisRoutes from './analysis';
import fileRoutes from './files';
import systemRoutes from './system';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/analysis', analysisRoutes);
router.use('/files', fileRoutes);
router.use('/system', systemRoutes);

// API documentation route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bioinformatics Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      analysis: '/api/analysis',
      files: '/api/files',
      system: '/api/system'
    },
    documentation: 'https://api-docs.example.com',
    timestamp: new Date()
  });
});

export default router;