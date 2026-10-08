import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { fileService } from '../services/file.service';

export async function handleUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file uploaded.' });
      return;
    }

    const metadata = await fileService.getMetadata(req.file.path, req.file.originalname);

    res.json({
      success: true,
      data: metadata,
      message: 'Image uploaded successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fileId = String(req.params.id);
    const uploadPath = fileService.getUploadPath(fileId);
    const outputPath = fileService.getOutputPath(fileId);

    if (fs.existsSync(uploadPath)) {
      await fs.promises.unlink(uploadPath);
    }
    if (fs.existsSync(outputPath)) {
      await fs.promises.unlink(outputPath);
    }

    res.json({ success: true, message: 'File removed successfully.' });
  } catch (err) {
    next(err);
  }
}
