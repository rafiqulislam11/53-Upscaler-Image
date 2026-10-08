import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeName = `upload_${uuidv4().substring(0, 8)}_${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload JPG, PNG, WebP or TIFF.`));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024 // 50MB
  }
});
