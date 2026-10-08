import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import apiRoutes from './routes/api.routes';
import { errorHandler } from './middleware/errorHandler';
import { fileService } from './services/file.service';

const app = express();

// Ensure storage directories exist
fileService.ensureDirectories();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads and outputs
app.use('/uploads', express.static(config.uploadDir));
app.use('/outputs', express.static(config.outputDir));

// API Routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (_req, res) => {
  res.json({
    name: 'Image Processing Studio API',
    tagline: 'Upscale • Gradient • Grain • Blur',
    docs: '/api/health',
    status: 'running'
  });
});

// Error handling
app.use(errorHandler);

// Periodic cleanup of temporary files
setInterval(() => {
  fileService.cleanupOldFiles().then(count => {
    if (count > 0) {
      console.log(`[Storage] Auto-cleaned ${count} expired temporary files.`);
    }
  }).catch(err => {
    console.error('[Storage] Cleanup error:', err);
  });
}, config.cleanupIntervalMs);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Image Processing Studio Backend running on :${PORT}`);
  console.log(`📁 Uploads dir: ${config.uploadDir}`);
  console.log(`📁 Outputs dir: ${config.outputDir}`);
  console.log(`⚡ API Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

export default app;
