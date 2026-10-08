import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { handleUpload, handleDeleteFile } from '../controllers/upload.controller';
import { handleUpscale } from '../controllers/upscale.controller';
import { handleExtractColors, handleGenerateGradient, handleGenerateVariations } from '../controllers/gradient.controller';
import { handleNoise } from '../controllers/noise.controller';
import { handleBlur } from '../controllers/blur.controller';
import { handleExport, handleGetJob } from '../controllers/export.controller';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    product: 'Image Processing Studio',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// File Management
router.post('/upload', uploadMiddleware.single('image'), handleUpload);
router.delete('/file/:id', handleDeleteFile);

// 4 Core Image Tools
router.post('/upscale', handleUpscale);

router.post('/gradient/extract-colors', handleExtractColors);
router.post('/gradient', handleGenerateGradient);
router.post('/gradient/variations', handleGenerateVariations);

router.post('/noise', handleNoise);

router.post('/blur', handleBlur);

// Job Polling & Export
router.get('/job/:id', handleGetJob);
router.post('/export', handleExport);

export default router;
