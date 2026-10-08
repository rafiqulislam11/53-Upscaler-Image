import fs from 'fs';
import sharp from 'sharp';
import { BlurOptions } from '../../types/shared';
import { fileService } from '../../services/file.service';
import { normalizePPI, applyDpiMetadata } from '../../utils/imageHelpers';

export interface BlurResult {
  outputPath: string;
  outputFilename: string;
  outputUrl: string;
  width: number;
  height: number;
  size: number;
  ppi: number;
  durationMs: number;
}

export class BlurProcessor {
  public async process(
    inputPath: string,
    options: BlurOptions,
    targetWidth?: number,
    targetHeight?: number
  ): Promise<BlurResult> {
    const startTime = performance.now();
    const meta = await sharp(inputPath).metadata();
    const width = targetWidth || meta.width || 1920;
    const height = targetHeight || meta.height || 1080;
    const ppi = normalizePPI(options.ppi);

    let basePipeline = sharp(inputPath).resize(width, height, { fit: 'fill' }).ensureAlpha();

    let processedBuffer: Buffer;

    if (options.blurType === 'gaussian' || options.blurType === 'soft') {
      const radius = Math.max(0.3, Math.min(100, (options.radius / 100) * 50));
      processedBuffer = await basePipeline.blur(radius).png().toBuffer();
    } else if (options.blurType === 'lens') {
      // Specular highlight bokeh bloom
      const rawObj = await basePipeline.raw().toBuffer({ resolveWithObject: true });
      const bokehData = this.applyBokehBloom(
        rawObj.data,
        rawObj.info.width,
        rawObj.info.height,
        options.radius,
        options.bokehThreshold ?? 70,
        options.bokehBoost ?? 2.0
      );
      processedBuffer = await sharp(bokehData, {
        raw: { width: rawObj.info.width, height: rawObj.info.height, channels: 4 }
      }).png().toBuffer();
    } else if (options.blurType === 'motion' || options.blurType === 'directional') {
      // Directional motion blur via vector convolution
      const rawObj = await basePipeline.raw().toBuffer({ resolveWithObject: true });
      const motionData = this.applyMotionBlur(
        rawObj.data,
        rawObj.info.width,
        rawObj.info.height,
        options.angle,
        options.distance || 20
      );
      processedBuffer = await sharp(motionData, {
        raw: { width: rawObj.info.width, height: rawObj.info.height, channels: 4 }
      }).png().toBuffer();
    } else if (options.blurType === 'radial' || options.blurType === 'zoom') {
      // Radial or zoom blur around center (centerX, centerY)
      const rawObj = await basePipeline.raw().toBuffer({ resolveWithObject: true });
      const radialData = this.applyRadialBlur(
        rawObj.data,
        rawObj.info.width,
        rawObj.info.height,
        options.centerX || 50,
        options.centerY || 50,
        options.radius || 20
      );
      processedBuffer = await sharp(radialData, {
        raw: { width: rawObj.info.width, height: rawObj.info.height, channels: 4 }
      }).png().toBuffer();
    } else if (options.blurType === 'tiltshift') {
      // Miniature tilt-shift depth of field
      const rawObj = await basePipeline.raw().toBuffer({ resolveWithObject: true });
      const tiltData = await this.applyTiltShift(
        rawObj.data,
        rawObj.info.width,
        rawObj.info.height,
        options.radius,
        options.tiltShiftPosition ?? 50,
        options.tiltShiftWidth ?? 30,
        options.tiltShiftFeather ?? 50
      );
      processedBuffer = await sharp(tiltData, {
        raw: { width: rawObj.info.width, height: rawObj.info.height, channels: 4 }
      }).png().toBuffer();
    } else {
      processedBuffer = await basePipeline.blur(Math.max(0.3, (options.radius / 100) * 30)).png().toBuffer();
    }

    // Step 2: Background Blur with interactive manual mask
    if (options.blurType === 'background' && options.maskBase64) {
      const cleanBase64 = options.maskBase64.replace(/^data:image\/\w+;base64,/, '');
      const maskBuffer = Buffer.from(cleanBase64, 'base64');
      const resizedMask = await sharp(maskBuffer)
        .resize(width, height, { fit: 'fill' })
        .extractChannel('red')
        .toBuffer();

      const sharpOriginal = await sharp(inputPath).resize(width, height, { fit: 'fill' }).toBuffer();

      const maskedSubject = await sharp(sharpOriginal)
        .joinChannel(resizedMask)
        .png()
        .toBuffer();

      processedBuffer = await sharp(processedBuffer)
        .composite([{ input: maskedSubject, blend: 'over' }])
        .png()
        .toBuffer();
    }

    const outputFilename = fileService.generateOutputFilename(`blur_${options.blurType}_${ppi}ppi`, 'png');
    const outputPath = fileService.getOutputPath(outputFilename);

    let finalPipeline = sharp(processedBuffer);
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

  private applyMotionBlur(data: Buffer, width: number, height: number, angleDeg: number, distance: number): Buffer {
    const copy = Buffer.from(data);
    const rad = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const steps = Math.min(30, Math.max(3, Math.round(distance * 0.4)));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0;

        for (let s = -steps; s <= steps; s++) {
          const sx = Math.round(x + s * dx);
          const sy = Math.round(y + s * dy);

          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const idx = (sy * width + sx) * 4;
            sumR += copy[idx];
            sumG += copy[idx + 1];
            sumB += copy[idx + 2];
            sumA += copy[idx + 3];
            count++;
          }
        }

        const outIdx = (y * width + x) * 4;
        data[outIdx] = Math.round(sumR / count);
        data[outIdx + 1] = Math.round(sumG / count);
        data[outIdx + 2] = Math.round(sumB / count);
        data[outIdx + 3] = Math.round(sumA / count);
      }
    }
    return data;
  }

  private applyRadialBlur(data: Buffer, width: number, height: number, cxPct: number, cyPct: number, amount: number): Buffer {
    const copy = Buffer.from(data);
    const cx = (cxPct / 100) * width;
    const cy = (cyPct / 100) * height;
    const steps = Math.min(20, Math.max(4, Math.round(amount * 0.25)));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        const vx = x - cx;
        const vy = y - cy;

        for (let s = 0; s < steps; s++) {
          const scale = 1 - (s / steps) * (amount * 0.005);
          const sx = Math.round(cx + vx * scale);
          const sy = Math.round(cy + vy * scale);

          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const idx = (sy * width + sx) * 4;
            sumR += copy[idx];
            sumG += copy[idx + 1];
            sumB += copy[idx + 2];
            count++;
          }
        }

        const outIdx = (y * width + x) * 4;
        data[outIdx] = Math.round(sumR / count);
        data[outIdx + 1] = Math.round(sumG / count);
        data[outIdx + 2] = Math.round(sumB / count);
      }
    }
    return data;
  }

  private async applyTiltShift(data: Buffer, width: number, height: number, radius: number, focusPosPct: number, focusWidthPct: number, featherPct: number): Promise<Buffer> {
    const blurredBuffer = await sharp(data, {
      raw: { width, height, channels: 4 }
    }).blur(Math.max(0.3, radius * 0.5)).raw().toBuffer();

    const output = Buffer.from(data);
    const focusCenterY = (focusPosPct / 100) * height;
    const halfCorridor = (focusWidthPct / 100) * height * 0.5;
    const featherDist = ((featherPct || 50) / 100) * height * 0.25;

    for (let y = 0; y < height; y++) {
      const distFromCenter = Math.abs(y - focusCenterY);
      let blurWeight = 0;

      if (distFromCenter > halfCorridor) {
        blurWeight = Math.min(1.0, (distFromCenter - halfCorridor) / (featherDist || 1));
      }

      const row = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = row + x * 4;
        output[idx] = Math.round(data[idx] * (1 - blurWeight) + blurredBuffer[idx] * blurWeight);
        output[idx + 1] = Math.round(data[idx + 1] * (1 - blurWeight) + blurredBuffer[idx + 1] * blurWeight);
        output[idx + 2] = Math.round(data[idx + 2] * (1 - blurWeight) + blurredBuffer[idx + 2] * blurWeight);
      }
    }
    return output;
  }

  private applyBokehBloom(data: Buffer, width: number, height: number, radius: number, thresholdPct: number, boost: number): Buffer {
    const copy = Buffer.from(data);
    const thresh = (thresholdPct / 100) * 255;

    for (let i = 0; i < copy.length; i += 4) {
      const r = copy[i];
      const g = copy[i + 1];
      const b = copy[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum > thresh) {
        const factor = ((lum - thresh) / (255 - thresh)) * boost;
        copy[i] = Math.min(255, Math.round(r + r * factor));
        copy[i + 1] = Math.min(255, Math.round(g + g * factor));
        copy[i + 2] = Math.min(255, Math.round(b + b * factor));
      }
    }
    return copy;
  }
}

export const blurProcessor = new BlurProcessor();
