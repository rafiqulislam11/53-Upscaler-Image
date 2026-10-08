import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  uploadDir: path.resolve(__dirname, '../../../uploads'),
  outputDir: path.resolve(__dirname, '../../../outputs'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp'
  ],
  aiProvider: {
    apiKey: process.env.AI_UPSCALE_API_KEY || '',
    endpoint: process.env.AI_UPSCALE_ENDPOINT || '',
    model: process.env.AI_UPSCALE_MODEL || 'real-esrgan'
  },
  cleanupIntervalMs: 1000 * 60 * 60, // 1 hour
  fileMaxAgeMs: 1000 * 60 * 60 * 24 // 24 hours
};
