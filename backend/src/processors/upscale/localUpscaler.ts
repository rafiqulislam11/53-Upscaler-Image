import fs from 'fs';
import sharp from 'sharp';
import { IUpscaleProvider, UpscaleResult } from './upscaleProvider.interface';
import { UpscaleOptions } from '../../types/shared';
import { calculateTargetDimensions, normalizePPI, applyDpiMetadata, getSharpKernel } from '../../utils/imageHelpers';
import { fileService } from '../../services/file.service';

export class LocalUpscaler implements IUpscaleProvider {
  public readonly id = 'local';
  public readonly name = 'High-Quality Local Upscaler';

  public async isAvailable(): Promise<boolean> {
    return true; // Always available without external API keys
  }

  public async upscale(
    inputPath: string,
    options: UpscaleOptions,
    onProgress?: (percent: number, step: string) => void
  ): Promise<UpscaleResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Analyzing input image geometry...');

    const metadata = await sharp(inputPath).metadata();
    const origWidth = metadata.width || 1000;
    const origHeight = metadata.height || 1000;

    // 100% customizable dimensions
    const targetDim = calculateTargetDimensions(origWidth, origHeight, options.scaleTarget, {
      customScaleMultiplier: options.customScaleMultiplier,
      customWidth: options.customWidth,
      customHeight: options.customHeight,
      maintainAspectRatio: options.maintainAspectRatio !== false
    });
    const ppi = normalizePPI(options.ppi);
    const kernel = getSharpKernel(options.resamplingKernel);

    onProgress?.(25, `Configuring ${options.resamplingKernel || 'lanczos3'} resampler to ${targetDim.width} × ${targetDim.height}...`);

    let pipeline = sharp(inputPath, { failOn: 'none' });

    // Step 1: Pre-resample noise reduction if requested
    if (options.noiseReduction > 0) {
      onProgress?.(35, 'Applying pre-filter noise reduction...');
      const blurSigma = Math.max(0.3, (options.noiseReduction / 100) * 1.5);
      pipeline = pipeline.blur(blurSigma);
    }

    // Step 2: High-fidelity interpolation using custom kernel
    onProgress?.(50, `Executing high-resolution resampling (${targetDim.scaleFactor.toFixed(2)}x)...`);
    pipeline = pipeline.resize({
      width: targetDim.width,
      height: targetDim.height,
      fit: 'fill',
      kernel,
      fastShrinkOnLoad: false
    });

    // Step 3: Unsharp mask / Detail enhancement & Sharpness
    const sharpenFactor = (options.sharpness / 100) * 2.5;
    const detailFactor = (options.detail / 100) * 1.8;
    const totalSharpen = Math.max(0.2, sharpenFactor + detailFactor);

    if (totalSharpen > 0.3) {
      onProgress?.(70, 'Applying unsharp masking and micro-contrast enhancement...');
      const sigma = options.sharpenSigma || Math.max(0.5, totalSharpen * 0.8);
      pipeline = pipeline.sharpen({
        sigma,
        m1: Math.max(1.0, totalSharpen * 1.5),
        m2: Math.max(2.0, totalSharpen * 2.5)
      });
    }

    // Step 4: Micro-contrast, clarity & vibrance modulation
    const brightnessMult = 1.0 + (options.clarity ? (options.clarity / 100) * 0.05 : 0);
    const saturationMult = 1.0 + (options.colorVibrance ? (options.colorVibrance / 100) * 0.2 : 0);

    // Step 5: Face / Skin enhancement tuning
    if (options.faceEnhancement) {
      onProgress?.(80, 'Refining skin tones and edge contrast...');
      const intensity = (options.faceEnhancementIntensity || 50) / 100;
      pipeline = pipeline.modulate({
        brightness: brightnessMult * (1.0 + intensity * 0.03),
        saturation: saturationMult * (1.0 + intensity * 0.06)
      });
    } else if (options.clarity || options.colorVibrance) {
      pipeline = pipeline.modulate({
        brightness: brightnessMult,
        saturation: saturationMult
      });
    }

    // Step 6: PPI / DPI Density Embedding (72 to 600 PPI)
    onProgress?.(90, `Embedding ${ppi} PPI density metadata for print fidelity...`);
    pipeline = applyDpiMetadata(pipeline, ppi);

    // Step 7: Output generation
    const outputFilename = fileService.generateOutputFilename(`upscale_${options.scaleTarget}_${ppi}ppi`, 'png');
    const outputPath = fileService.getOutputPath(outputFilename);

    await pipeline.png({ compressionLevel: 8 }).toFile(outputPath);

    const outStats = await fs.promises.stat(outputPath);
    const durationMs = Math.round(performance.now() - startTime);

    onProgress?.(100, 'Upscaling complete!');

    return {
      outputPath,
      outputFilename,
      outputUrl: `/outputs/${outputFilename}`,
      width: targetDim.width,
      height: targetDim.height,
      size: outStats.size,
      ppi,
      providerUsed: 'local',
      providerMessage: 'AI provider not configured — using high-quality local upscaling (Lanczos3 + Unsharp Masking + Micro-Contrast).',
      durationMs
    };
  }
}
