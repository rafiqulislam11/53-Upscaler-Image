import fs from 'fs';
import sharp from 'sharp';
import { GradientOptions, GradientType, GradientColorStop } from '../../types/shared';
import { fileService } from '../../services/file.service';
import { normalizePPI, applyDpiMetadata } from '../../utils/imageHelpers';

export interface GradientGenerationResult {
  outputPath: string;
  outputFilename: string;
  outputUrl: string;
  width: number;
  height: number;
  size: number;
  ppi: number;
  durationMs: number;
}

export class GradientGenerator {
  public async generate(
    inputPath: string,
    options: GradientOptions,
    targetWidth?: number,
    targetHeight?: number
  ): Promise<GradientGenerationResult> {
    const startTime = performance.now();
    const meta = await sharp(inputPath).metadata();
    const width = targetWidth || meta.width || 1920;
    const height = targetHeight || meta.height || 1080;
    const ppi = normalizePPI(options.ppi);

    let colors = options.colors.length >= 2 ? options.colors : ['#12A8FF', '#7B2FFF', '#FF4D8D'];
    if (options.invertGradient) {
      colors = [...colors].reverse();
    }

    // Generate high resolution gradient SVG buffer with full custom options
    const svgBuffer = this.createGradientSVG(
      width,
      height,
      options.gradientType,
      colors,
      options.stops,
      options.angle,
      options.focalX ?? 50,
      options.focalY ?? 50,
      options.radialRadius ?? 70
    );

    let gradientPipeline = sharp(svgBuffer);

    // Apply blur if requested
    if (options.blur > 0) {
      const blurSigma = Math.max(0.3, (options.blur / 100) * 40);
      gradientPipeline = gradientPipeline.blur(blurSigma);
    }

    // Apply intensity / brightness / contrast modulation
    const brightnessMult = 0.5 + (options.brightness / 100);
    const contrastMult = 0.5 + (options.contrast / 100);
    gradientPipeline = gradientPipeline.modulate({
      brightness: brightnessMult,
      saturation: contrastMult
    });

    // Apply PPI metadata
    gradientPipeline = applyDpiMetadata(gradientPipeline, ppi);

    const outputFilename = fileService.generateOutputFilename(`gradient_${options.gradientType}_${ppi}ppi`, 'png');
    const outputPath = fileService.getOutputPath(outputFilename);

    // Composite over original image with custom blend mode & opacity
    if (options.opacity < 100 || options.blendMode) {
      const gradientPngBuffer = await gradientPipeline.png().toBuffer();

      const baseResized = await sharp(inputPath)
        .resize(width, height, { fit: 'fill' })
        .toBuffer();

      const blend = options.blendMode === 'multiply' ? 'multiply'
        : options.blendMode === 'screen' ? 'screen'
        : options.blendMode === 'overlay' ? 'overlay'
        : options.blendMode === 'soft-light' ? 'soft-light'
        : 'over';

      let composited = sharp(baseResized).composite([
        {
          input: gradientPngBuffer,
          blend: blend as any
        }
      ]);
      composited = applyDpiMetadata(composited, ppi);
      await composited.png().toFile(outputPath);
    } else {
      await gradientPipeline.png().toFile(outputPath);
    }

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

  /**
   * Generates 10 coherent color variations from a base palette
   */
  public generateVariations(baseColors: string[]): Array<{ id: number; colors: string[]; angle: number; type: GradientType }> {
    const variations: Array<{ id: number; colors: string[]; angle: number; type: GradientType }> = [];
    const types: GradientType[] = ['linear', 'radial', 'angular', 'mesh', 'liquid', 'soft-blur', 'abstract'];

    for (let i = 0; i < 10; i++) {
      // Rotate / permute colors deterministically
      const shifted = [...baseColors];
      const shiftCount = (i * 2 + 1) % shifted.length;
      const permuted = [...shifted.slice(shiftCount), ...shifted.slice(0, shiftCount)];

      // Vary angle
      const angle = (45 + i * 36) % 360;
      const type = types[i % types.length];

      variations.push({
        id: i + 1,
        colors: permuted,
        angle,
        type
      });
    }

    return variations;
  }

  private createGradientSVG(
    width: number,
    height: number,
    type: GradientType,
    colors: string[],
    stops?: GradientColorStop[],
    angle = 135,
    focalX = 50,
    focalY = 50,
    radialRadius = 70
  ): Buffer {
    let stopsSvg = '';

    if (stops && stops.length >= 2) {
      stopsSvg = stops
        .map(s => `<stop offset="${s.offset}%" stop-color="${s.color}" stop-opacity="${(s.opacity ?? 100) / 100}" />`)
        .join('\n');
    } else {
      stopsSvg = colors
        .map((col, idx) => {
          const offset = Math.round((idx / (colors.length - 1)) * 100);
          return `<stop offset="${offset}%" stop-color="${col}" />`;
        })
        .join('\n');
    }

    let defsSvg = '';
    let shapeSvg = '';

    const rad = (angle * Math.PI) / 180;
    const x1 = Math.round(50 - Math.cos(rad) * 50);
    const y1 = Math.round(50 - Math.sin(rad) * 50);
    const x2 = Math.round(50 + Math.cos(rad) * 50);
    const y2 = Math.round(50 + Math.sin(rad) * 50);

    if (type === 'linear') {
      defsSvg = `
        <linearGradient id="grad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          ${stopsSvg}
        </linearGradient>
      `;
      shapeSvg = `<rect width="${width}" height="${height}" fill="url(#grad)" />`;
    } else if (type === 'radial') {
      defsSvg = `
        <radialGradient id="grad" cx="${focalX}%" cy="${focalY}%" r="${radialRadius}%">
          ${stopsSvg}
        </radialGradient>
      `;
      shapeSvg = `<rect width="${width}" height="${height}" fill="url(#grad)" />`;
    } else if (type === 'mesh' || type === 'liquid' || type === 'abstract') {
      const c1 = colors[0] || '#12A8FF';
      const c2 = colors[1] || '#7B2FFF';
      const c3 = colors[2] || '#FF4D8D';
      const c4 = colors[3] || '#FFC857';

      defsSvg = `
        <radialGradient id="m1" cx="${Math.min(90, focalX * 0.5)}%" cy="${Math.min(90, focalY * 0.5)}%" r="${radialRadius}%">
          <stop offset="0%" stop-color="${c1}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${c1}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="m2" cx="${Math.max(10, 100 - focalX * 0.4)}%" cy="${Math.min(90, focalY * 0.4)}%" r="${radialRadius}%">
          <stop offset="0%" stop-color="${c2}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${c2}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="m3" cx="${Math.max(10, 100 - focalX * 0.5)}%" cy="${Math.max(10, 100 - focalY * 0.4)}%" r="${radialRadius}%">
          <stop offset="0%" stop-color="${c3}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${c3}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="m4" cx="${Math.min(90, focalX * 0.6)}%" cy="${Math.max(10, 100 - focalY * 0.5)}%" r="${radialRadius}%">
          <stop offset="0%" stop-color="${c4}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${c4}" stop-opacity="0" />
        </radialGradient>
      `;

      shapeSvg = `
        <rect width="${width}" height="${height}" fill="${c1}" />
        <rect width="${width}" height="${height}" fill="url(#m2)" />
        <rect width="${width}" height="${height}" fill="url(#m3)" />
        <rect width="${width}" height="${height}" fill="url(#m4)" />
        <rect width="${width}" height="${height}" fill="url(#m1)" />
      `;
    } else {
      defsSvg = `
        <linearGradient id="grad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          ${stopsSvg}
        </linearGradient>
      `;
      shapeSvg = `<rect width="${width}" height="${height}" fill="url(#grad)" />`;
    }

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>${defsSvg}</defs>
        ${shapeSvg}
      </svg>
    `;

    return Buffer.from(svg);
  }
}

export const gradientGenerator = new GradientGenerator();
