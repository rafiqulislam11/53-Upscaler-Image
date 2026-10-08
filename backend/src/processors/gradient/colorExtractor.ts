import sharp from 'sharp';
import { ExtractedColor } from '../../types/shared';

interface ColorBin {
  r: number;
  g: number;
  b: number;
  count: number;
}

/**
 * Extracts dominant color palette (Primary, Secondary, Accent, Dark, Light) up to 8 colors
 * using color quantization and luminance distribution analysis.
 */
export async function extractDominantColors(imagePath: string, maxColors = 8): Promise<ExtractedColor[]> {
  // Downsample to 100x100 for fast, representative color clustering
  const { data, info } = await sharp(imagePath)
    .resize(100, 100, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  const bins: Map<string, ColorBin> = new Map();

  let darkest = { r: 255, g: 255, b: 255, lum: 999 };
  let lightest = { r: 0, g: 0, b: 0, lum: -1 };

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 50) continue; // ignore transparent pixels

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < darkest.lum) darkest = { r, g, b, lum };
    if (lum > lightest.lum) lightest = { r, g, b, lum };

    // Quantize into 32-step buckets
    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;

    const existing = bins.get(key);
    if (existing) {
      existing.r = Math.round((existing.r * existing.count + r) / (existing.count + 1));
      existing.g = Math.round((existing.g * existing.count + g) / (existing.count + 1));
      existing.b = Math.round((existing.b * existing.count + b) / (existing.count + 1));
      existing.count += 1;
    } else {
      bins.set(key, { r, g, b, count: 1 });
    }
  }

  // Sort bins by frequency
  const sortedBins = Array.from(bins.values()).sort((a, b) => b.count - a.count);

  const colors: ExtractedColor[] = [];
  const roles: ExtractedColor['role'][] = ['primary', 'secondary', 'accent'];

  for (let i = 0; i < Math.min(3, sortedBins.length); i++) {
    const bin = sortedBins[i];
    colors.push({
      hex: rgbToHex(bin.r, bin.g, bin.b),
      role: roles[i],
      percentage: Number(((bin.count / totalPixels) * 100).toFixed(1))
    });
  }

  // Add dark color
  colors.push({
    hex: rgbToHex(darkest.r, darkest.g, darkest.b),
    role: 'dark',
    percentage: 10
  });

  // Add light color
  colors.push({
    hex: rgbToHex(lightest.r, lightest.g, lightest.b),
    role: 'light',
    percentage: 10
  });

  // Add additional accents up to maxColors
  for (let i = 3; i < sortedBins.length && colors.length < maxColors; i++) {
    const bin = sortedBins[i];
    const hex = rgbToHex(bin.r, bin.g, bin.b);
    if (!colors.some(c => c.hex.toLowerCase() === hex.toLowerCase())) {
      colors.push({
        hex,
        role: 'custom',
        percentage: Number(((bin.count / totalPixels) * 100).toFixed(1))
      });
    }
  }

  // Ensure minimum 5 colors
  const defaultFallbacks = ['#12A8FF', '#7B2FFF', '#FF4D8D', '#111827', '#F3F4F6'];
  for (let i = colors.length; i < Math.min(maxColors, 5); i++) {
    colors.push({
      hex: defaultFallbacks[i] || '#3B82F6',
      role: 'custom',
      percentage: 5
    });
  }

  return colors;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
