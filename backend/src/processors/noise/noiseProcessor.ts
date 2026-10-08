import fs from 'fs';
import sharp from 'sharp';
import { NoiseOptions } from '../../types/shared';
import { fileService } from '../../services/file.service';
import { normalizePPI, applyDpiMetadata } from '../../utils/imageHelpers';

export interface NoiseResult {
  outputPath: string;
  outputFilename: string;
  outputUrl: string;
  width: number;
  height: number;
  size: number;
  ppi: number;
  durationMs: number;
}

export class NoiseProcessor {
  public async process(
    inputPath: string,
    options: NoiseOptions,
    targetWidth?: number,
    targetHeight?: number
  ): Promise<NoiseResult> {
    const startTime = performance.now();
    const meta = await sharp(inputPath).metadata();
    const width = targetWidth || meta.width || 1920;
    const height = targetHeight || meta.height || 1080;
    const ppi = normalizePPI(options.ppi);

    // Extract raw pixels for grain synthesis
    let pipeline = sharp(inputPath).resize(width, height, { fit: 'fill' }).ensureAlpha();
    const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

    const pixelBuffer = Buffer.from(data);
    const amount = (options.amount / 100) * 128;
    const intensity = (options.intensity / 100);
    const grainSize = Math.max(1, Math.round(options.grainSize));
    const isMono = options.noiseType === 'monochrome' || options.preserveOriginalColors;
    const shadowWeight = (options.shadowGrain ?? 50) / 100;
    const midtoneWeight = (options.midtonesGrain ?? 70) / 100;
    const highlightWeight = (options.highlightGrain ?? 30) / 100;
    const dustAmount = (options.dustAndScratches ?? 0) / 100;

    // Use seed for deterministic random pattern or randomize
    let seed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 100000);
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Iterate over pixel blocks based on grainSize
    for (let y = 0; y < height; y += grainSize) {
      for (let x = 0; x < width; x += grainSize) {
        // Base noise delta
        const randBase = (random() - 0.5) * 2;
        let deltaR = randBase * amount * intensity;
        let deltaG = isMono ? deltaR : (random() - 0.5) * 2 * amount * intensity;
        let deltaB = isMono ? deltaR : (random() - 0.5) * 2 * amount * intensity;

        // Film Stock Specific Color Emulsion Profiles
        if (options.filmStock === 'fuji-superia' && !isMono) {
          deltaG *= 1.25; // Fuji greens
        } else if (options.filmStock === 'kodak-tri-x') {
          deltaR *= 1.15; // Higher contrast silver halide
          deltaG = deltaR; deltaB = deltaR;
        }

        // Dust & Scratches occasional speckle
        if (dustAmount > 0 && random() < dustAmount * 0.003) {
          const dustColor = random() > 0.5 ? 255 : 0;
          deltaR = dustColor; deltaG = dustColor; deltaB = dustColor;
        }

        for (let dy = 0; dy < grainSize && y + dy < height; dy++) {
          const row = (y + dy) * width;
          for (let dx = 0; dx < grainSize && x + dx < width; dx++) {
            const idx = (row + x + dx) * 4;

            const r = pixelBuffer[idx];
            const g = pixelBuffer[idx + 1];
            const b = pixelBuffer[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Parabolic midtone curve + user granular weights
            const midDist = 1.0 - 4.0 * Math.pow((lum / 255) - 0.5, 2);
            let weight = 0.3;

            if (lum < 90) {
              weight += shadowWeight * (1 - lum / 90);
            } else if (lum > 170) {
              weight += highlightWeight * ((lum - 170) / 85);
            } else {
              weight += midtoneWeight * Math.max(0, midDist);
            }

            const opacity = options.opacity / 100;

            pixelBuffer[idx] = Math.max(0, Math.min(255, Math.round(r + deltaR * weight * opacity)));
            pixelBuffer[idx + 1] = Math.max(0, Math.min(255, Math.round(g + deltaG * weight * opacity)));
            pixelBuffer[idx + 2] = Math.max(0, Math.min(255, Math.round(b + deltaB * weight * opacity)));
          }
        }
      }
    }

    const outputFilename = fileService.generateOutputFilename(`noise_${options.noiseType}_${ppi}ppi`, 'png');
    const outputPath = fileService.getOutputPath(outputFilename);

    let finalPipeline = sharp(pixelBuffer, {
      raw: { width: info.width, height: info.height, channels: 4 }
    });

    finalPipeline = applyDpiMetadata(finalPipeline, ppi);
    await finalPipeline.png().toFile(outputPath);

    const stats = await fs.promises.stat(outputPath);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      outputPath,
      outputFilename,
      outputUrl: `/outputs/${outputFilename}`,
      width,
      height,
      size: stats.size,
      ppi,
      durationMs
    };
  }
}

export const noiseProcessor = new NoiseProcessor();
