import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { blurProcessor } from '../processors/blur/blurProcessor';
import { BlurOptions } from '../types/shared';
import { queueService } from '../services/queue.service';
import { config } from '../config';

export async function handleBlur(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { filename, options } = req.body as { filename: string; options: BlurOptions };

    let inputPath = path.join(config.uploadDir, filename);
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(config.outputDir, filename);
    }

    if (!fs.existsSync(inputPath)) {
      res.status(404).json({ success: false, error: 'Source image file not found.' });
      return;
    }

    const job = queueService.createJob(filename, 'blur');
    queueService.updateProgress(job.id, 25, `Applying ${options.blurType} blur optical filter...`);

    const result = await blurProcessor.process(inputPath, options);

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
      message: `Applied ${options.blurType} blur with ${result.ppi} PPI density.`
    });
  } catch (err) {
    next(err);
  }
}
