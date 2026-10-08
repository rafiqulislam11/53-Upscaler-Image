import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { ExportOptions } from '../types/shared';
import { calculateTargetDimensions, normalizePPI, applyDpiMetadata } from '../utils/imageHelpers';
import { fileService } from '../services/file.service';
import { queueService } from '../services/queue.service';
import { config } from '../config';

export async function handleExport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { filename, options } = req.body as { filename: string; options: ExportOptions };

    let inputPath = path.join(config.outputDir, filename);
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(config.uploadDir, filename);
    }

    if (!fs.existsSync(inputPath)) {
      res.status(404).json({ success: false, error: 'Source image for export not found.' });
      return;
    }

    const meta = await sharp(inputPath).metadata();
    const origWidth = meta.width || 1920;
    const origHeight = meta.height || 1080;

    const targetDim = calculateTargetDimensions(origWidth, origHeight, options.resolution, {
      customWidth: options.customWidth,
      customHeight: options.customHeight,
      maintainAspectRatio: options.maintainAspectRatio !== false
    });
    const ppi = normalizePPI(options.ppi);
    const quality = Math.min(100, Math.max(1, Math.round(options.quality || 95)));

    let pipeline = sharp(inputPath);

    // Resize if scaling or custom dimensions requested
    if (options.resolution !== 'original' || options.customWidth) {
      pipeline = pipeline.resize({
        width: targetDim.width,
        height: targetDim.height,
        fit: 'fill',
        kernel: sharp.kernel.lanczos3
      });
    }

    // Embed PPI / DPI metadata (72 to 600 PPI)
    pipeline = applyDpiMetadata(pipeline, ppi);

    const safeBase = (options.filename || 'processed-image')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const format = options.format || 'png';
    const outputFilename = `${safeBase}_${options.resolution}_${ppi}ppi_${Date.now()}.${format === 'jpeg' ? 'jpg' : format}`;
    const outputPath = fileService.getOutputPath(outputFilename);

    // Format encoding with granular customizations
    if (format === 'png') {
      const compression = options.pngCompressionLevel ?? 8;
      await pipeline.png({ compressionLevel: compression }).toFile(outputPath);
    } else if (format === 'jpeg') {
      await pipeline.jpeg({ quality, mozjpeg: true, progressive: options.progressiveJpg ?? true }).toFile(outputPath);
    } else if (format === 'webp') {
      await pipeline.webp({ quality, lossless: options.losslessWebp ?? false }).toFile(outputPath);
    } else if (format === 'tiff') {
      await pipeline.tiff({ quality, compression: options.tiffCompression ?? 'deflate' }).toFile(outputPath);
    } else {
      await pipeline.png().toFile(outputPath);
    }

    const stats = await fs.promises.stat(outputPath);

    res.json({
      success: true,
      data: {
        outputUrl: `/outputs/${outputFilename}`,
        filename: outputFilename,
        format,
        width: targetDim.width,
        height: targetDim.height,
        size: stats.size,
        ppi,
        quality
      },
      message: `Exported ${targetDim.width}×${targetDim.height} at ${ppi} PPI (${format.toUpperCase()}).`
    });
  } catch (err) {
    next(err);
  }
}

export function handleGetJob(req: Request, res: Response): void {
  const jobId = String(req.params.id);
  const job = queueService.getJob(jobId);

  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found.' });
    return;
  }

  res.json({
    success: true,
    data: job
  });
}
