import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { extractDominantColors } from '../processors/gradient/colorExtractor';
import { gradientGenerator } from '../processors/gradient/gradientGenerator';
import { GradientOptions } from '../types/shared';
import { queueService } from '../services/queue.service';
import { config } from '../config';

export async function handleExtractColors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { filename, maxColors } = req.body;
    let inputPath = path.join(config.uploadDir, filename);
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(config.outputDir, filename);
    }

    if (!fs.existsSync(inputPath)) {
      res.status(404).json({ success: false, error: 'Source image file not found.' });
      return;
    }

    const colors = await extractDominantColors(inputPath, maxColors || 8);
    res.json({
      success: true,
      data: colors,
      message: `Extracted ${colors.length} dominant colors from image.`
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGenerateGradient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { filename, options } = req.body as { filename: string; options: GradientOptions };

    let inputPath = path.join(config.uploadDir, filename);
    if (!fs.existsSync(inputPath)) {
      inputPath = path.join(config.outputDir, filename);
    }

    if (!fs.existsSync(inputPath)) {
      res.status(404).json({ success: false, error: 'Source image file not found.' });
      return;
    }

    const job = queueService.createJob(filename, 'gradient');
    queueService.updateProgress(job.id, 30, 'Synthesizing multi-stop color gradient mesh...');

    const result = await gradientGenerator.generate(inputPath, options);

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
      message: `Generated ${options.gradientType.toUpperCase()} gradient with ${result.ppi} PPI density.`
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGenerateVariations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { colors } = req.body as { colors: string[] };
    if (!colors || colors.length === 0) {
      res.status(400).json({ success: false, error: 'Colors palette is required.' });
      return;
    }

    const variations = gradientGenerator.generateVariations(colors);
    res.json({
      success: true,
      data: variations,
      message: 'Generated 10 coherent color variations.'
    });
  } catch (err) {
    next(err);
  }
}
