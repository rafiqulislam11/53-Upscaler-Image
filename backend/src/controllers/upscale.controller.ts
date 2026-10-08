import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { UpscaleProviderFactory } from '../processors/upscale';
import { UpscaleOptions } from '../types/shared';
import { queueService } from '../services/queue.service';
import { config } from '../config';

export async function handleUpscale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { filename, options } = req.body as { filename: string; options: UpscaleOptions };

    if (!filename) {
      res.status(400).json({ success: false, error: 'Image filename is required.' });
      return;
    }

    // Locate source file (check uploadDir or outputDir)
    let inputPath = path.join(config.uploadDir, filename);
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(config.outputDir, filename);
    }

    if (!fs.existsSync(inputPath)) {
      res.status(404).json({ success: false, error: 'Source image file not found.' });
      return;
    }

    const job = queueService.createJob(filename, 'upscale');
    const provider = UpscaleProviderFactory.getProvider(options.provider || 'local');

    // Run processing
    const result = await provider.upscale(inputPath, options, (progress, step) => {
      queueService.updateProgress(job.id, progress, step);
    });

    queueService.completeJob(
      job.id,
      result.outputUrl,
      result.width,
      result.height,
      result.size,
      result.ppi,
      result.durationMs
    );

    res.json({
      success: true,
      jobId: job.id,
      data: result,
      message: result.providerMessage
    });
  } catch (err) {
    next(err);
  }
}
