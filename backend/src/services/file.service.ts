import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { ImageMetadata } from '../types/shared';
import { normalizePPI } from '../utils/imageHelpers';

export class FileService {
  constructor() {
    this.ensureDirectories();
  }

  public ensureDirectories(): void {
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
  }

  public async getMetadata(filePath: string, originalName?: string, id?: string): Promise<ImageMetadata> {
    const fileStats = await fs.promises.stat(filePath);
    const sharpMeta = await sharp(filePath).metadata();

    const fileId = id || uuidv4();
    const width = sharpMeta.width || 1000;
    const height = sharpMeta.height || 1000;
    const filename = path.basename(filePath);

    // Read density/DPI if available, default to 72
    const ppi = normalizePPI(sharpMeta.density);

    return {
      id: fileId,
      filename,
      originalName: originalName || filename,
      path: filePath,
      url: `/uploads/${filename}`,
      mimeType: `image/${sharpMeta.format || 'jpeg'}`,
      size: fileStats.size,
      width,
      height,
      aspectRatio: Number((width / height).toFixed(4)),
      ppi,
      createdAt: new Date().toISOString()
    };
  }

  public generateOutputFilename(prefix: string, ext = 'png'): string {
    return `${prefix}_${uuidv4().substring(0, 8)}_${Date.now()}.${ext}`;
  }

  public getOutputPath(filename: string): string {
    return path.join(config.outputDir, filename);
  }

  public getUploadPath(filename: string): string {
    return path.join(config.uploadDir, filename);
  }

  public async cleanupOldFiles(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();
    const dirs = [config.uploadDir, config.outputDir];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = await fs.promises.readdir(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stats = await fs.promises.stat(fullPath);
          if (now - stats.mtimeMs > config.fileMaxAgeMs) {
            await fs.promises.unlink(fullPath);
            cleaned++;
          }
        } catch {
          // ignore error if file was deleted
        }
      }
    }
    return cleaned;
  }
}

export const fileService = new FileService();
