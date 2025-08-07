import { Router } from 'express';
import authRoutes from './auth';
import projectRoutes from './projects';
import analysisRoutes from './analysis';
import fileRoutes from './files';
import systemRoutes from './system';
import sampleRoutes from './samples';
import workflowRoutes from './workflows';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/analysis', analysisRoutes);
router.use('/files', fileRoutes);
router.use('/system', systemRoutes);
router.use('/samples', sampleRoutes);
router.use('/workflows', workflowRoutes);

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
      system: '/api/system',
      samples: '/api/samples',
      workflows: '/api/workflows'
    },
    documentation: 'https://api-docs.example.com',
    timestamp: new Date()
  });
});

export default router;