import sharp from 'sharp';
import { UpscaleTarget, ExportResolution, ResamplingKernel } from '../types/shared';

export interface CalculatedDimensions {
  width: number;
  height: number;
  scaleFactor: number;
}

/**
 * Calculates target dimensions with 100% custom support.
 * Supports presets (2x, 4x, 4K, 8K) or custom width, height, and multipliers.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  target: UpscaleTarget | ExportResolution,
  options?: {
    customScaleMultiplier?: number;
    customWidth?: number;
    customHeight?: number;
    maintainAspectRatio?: boolean;
  }
): CalculatedDimensions {
  const aspect = origWidth / origHeight;

  // Custom explicit dimensions
  if (target === 'custom' && options?.customWidth && options?.customHeight) {
    if (options.maintainAspectRatio) {
      const targetAspect = options.customWidth / options.customHeight;
      if (aspect >= targetAspect) {
        const height = Math.round(options.customWidth / aspect);
        return { width: options.customWidth, height, scaleFactor: options.customWidth / origWidth };
      } else {
        const width = Math.round(options.customHeight * aspect);
        return { width, height: options.customHeight, scaleFactor: options.customHeight / origHeight };
      }
    }
    return {
      width: Math.round(options.customWidth),
      height: Math.round(options.customHeight),
      scaleFactor: options.customWidth / origWidth
    };
  }

  // Custom multiplier (e.g. 1.5x, 3.5x, 6.0x)
  if (target === 'custom' && options?.customScaleMultiplier) {
    const mult = Math.max(0.1, Math.min(10.0, options.customScaleMultiplier));
    return {
      width: Math.round(origWidth * mult),
      height: Math.round(origHeight * mult),
      scaleFactor: mult
    };
  }

  switch (target) {
    case '2x':
      return {
        width: Math.round(origWidth * 2),
        height: Math.round(origHeight * 2),
        scaleFactor: 2
      };

    case '4x':
      return {
        width: Math.round(origWidth * 4),
        height: Math.round(origHeight * 4),
        scaleFactor: 4
      };

    case '4k': {
      // 4K UHD Standard: 3840 x 2160 bound
      const maxDim = 3840;
      if (aspect >= 1) {
        const width = maxDim;
        const height = Math.round(maxDim / aspect);
        return { width, height, scaleFactor: width / origWidth };
      } else {
        const height = maxDim;
        const width = Math.round(maxDim * aspect);
        return { width, height, scaleFactor: height / origHeight };
      }
    }

    case '8k': {
      // 8K UHD Standard: 7680 x 4320 bound
      const maxDim = 7680;
      if (aspect >= 1) {
        const width = maxDim;
        const height = Math.round(maxDim / aspect);
        return { width, height, scaleFactor: width / origWidth };
      } else {
        const height = maxDim;
        const width = Math.round(maxDim * aspect);
        return { width, height, scaleFactor: height / origHeight };
      }
    }

    case 'original':
    default:
      return {
        width: origWidth,
        height: origHeight,
        scaleFactor: 1
      };
  }
}

/**
 * Normalizes PPI / DPI input within valid bounds [72, 600]
 */
export function normalizePPI(ppi?: number): number {
  if (!ppi || isNaN(ppi)) return 72;
  return Math.min(600, Math.max(72, Math.round(ppi)));
}

/**
 * Maps resampling kernel string to Sharp kernel enum
 */
export function getSharpKernel(kernel?: ResamplingKernel): keyof sharp.KernelEnum {
  switch (kernel) {
    case 'lanczos2': return sharp.kernel.lanczos2;
    case 'bicubic': return sharp.kernel.cubic;
    case 'bilinear': return sharp.kernel.cubic;
    case 'mitchell': return sharp.kernel.mitchell;
    case 'nearest': return sharp.kernel.nearest;
    case 'lanczos3':
    default:
      return sharp.kernel.lanczos3;
  }
}

/**
 * Applies PPI / DPI metadata to a Sharp instance
 * Sharp uses density (pixels per inch)
 */
export function applyDpiMetadata(pipeline: sharp.Sharp, ppi: number): sharp.Sharp {
  const validDpi = normalizePPI(ppi);
  return pipeline.withMetadata({ density: validDpi });
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
