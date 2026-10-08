/**
 * Shared Type Definitions for Image Processing Studio
 * Synchronized across Frontend and Backend - 100% Fully Customizable
 */

export type ToolId = 'upscale' | 'gradient' | 'noise' | 'blur';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: 'enhancement' | 'artistic' | 'filter';
  status: 'active' | 'beta' | 'coming_soon';
}

export type UpscaleTarget = '2x' | '4x' | '4k' | '8k' | 'custom';
export type UpscaleProviderType = 'local' | 'ai';
export type ResamplingKernel = 'lanczos3' | 'lanczos2' | 'bicubic' | 'bilinear' | 'mitchell' | 'nearest';

export interface UpscaleOptions {
  scaleTarget: UpscaleTarget;
  customScaleMultiplier?: number; // 1.0 to 10.0x
  customWidth?: number; // custom pixel width
  customHeight?: number; // custom pixel height
  maintainAspectRatio?: boolean;
  resamplingKernel?: ResamplingKernel;
  detail: number; // 0 - 100
  sharpness: number; // 0 - 100
  sharpenSigma?: number; // 0.1 to 5.0
  sharpenThreshold?: number; // 0 - 100
  clarity?: number; // 0 - 100
  noiseReduction: number; // 0 - 100
  faceEnhancement: boolean;
  faceEnhancementIntensity?: number; // 0 - 100
  colorVibrance?: number; // 0 - 100
  provider: UpscaleProviderType;
  ppi: number; // 72 to 600 PPI (Print density)
}

export type GradientType = 'linear' | 'radial' | 'angular' | 'mesh' | 'liquid' | 'soft-blur' | 'abstract';
export type GradientBlendMode = 'normal' | 'overlay' | 'soft-light' | 'screen' | 'multiply' | 'color-dodge' | 'luminosity';

export interface GradientColorStop {
  color: string;
  offset: number; // 0 to 100 (%)
  opacity?: number; // 0 to 100 (%)
}

export interface ExtractedColor {
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'dark' | 'light' | 'custom';
  percentage: number;
}

export interface GradientOptions {
  gradientType: GradientType;
  colors: string[]; // up to 12 hex colors
  stops?: GradientColorStop[]; // Granular stop positions
  blendMode?: GradientBlendMode;
  angle: number; // 0 - 360
  focalX?: number; // 0 - 100 (%)
  focalY?: number; // 0 - 100 (%)
  radialRadius?: number; // 10 - 200 (%)
  colorCount: number; // 2 - 12
  smoothness: number; // 0 - 100
  blur: number; // 0 - 100
  intensity: number; // 0 - 100
  opacity: number; // 0 - 100
  noise: number; // 0 - 100 (dither noise)
  contrast: number; // 0 - 100
  brightness: number; // 0 - 100
  invertGradient?: boolean;
  ppi: number; // 72 to 600 PPI
}

export type NoiseType =
  | 'film-grain'
  | 'fine'
  | 'medium'
  | 'heavy'
  | 'monochrome'
  | 'color'
  | 'digital'
  | 'texture';

export type FilmStock = 'kodak-tri-x' | 'ilford-hp5' | 'fuji-superia' | 'polaroid-600' | 'digital-iso' | 'custom';
export type GrainBlendMode = 'overlay' | 'soft-light' | 'screen' | 'multiply' | 'hard-light';

export interface NoiseOptions {
  noiseType: NoiseType;
  filmStock?: FilmStock;
  amount: number; // 0 - 100
  grainSize: number; // 0.5 - 8.0 px
  intensity: number; // 0 - 100
  contrast: number; // 0 - 100
  roughness: number; // 0 - 100
  opacity: number; // 0 - 100
  colorVariation: number; // 0 - 100
  shadowGrain: number; // 0 - 100
  midtonesGrain?: number; // 0 - 100
  highlightGrain: number; // 0 - 100
  dustAndScratches?: number; // 0 - 100
  grainBlendMode?: GrainBlendMode;
  preserveOriginalColors: boolean;
  seed?: number;
  animated?: boolean;
  previewQuality: 'fast' | 'high';
  ppi: number; // 72 to 600 PPI
}

export type BlurType =
  | 'gaussian'
  | 'motion'
  | 'radial'
  | 'zoom'
  | 'soft'
  | 'directional'
  | 'tiltshift'
  | 'background'
  | 'lens';

export type BokehApertureShape = 'circle' | '5-blade' | '6-blade' | '8-blade';

export interface BlurOptions {
  blurType: BlurType;
  radius: number; // 0 - 120 px
  strength: number; // 0 - 100 (%)
  angle: number; // 0 - 360 (deg)
  distance: number; // 1 - 100 (px)
  centerX: number; // 0 - 100 (%)
  centerY: number; // 0 - 100 (%)
  radialWhirl?: number; // -180 to +180 (deg)
  zoomAmount: number; // 0 - 100 (%)
  tiltShiftAngle?: number; // 0 - 180 (deg)
  tiltShiftPosition?: number; // 0 - 100 (%)
  tiltShiftWidth?: number; // 5 - 80 (%)
  tiltShiftFeather?: number; // 0 - 100 (%)
  bokehAperture?: BokehApertureShape;
  bokehThreshold?: number; // 0 - 100 (%)
  bokehBoost?: number; // 1.0 - 5.0x
  preserveEdges?: boolean;
  maskBase64?: string; // Optional manual mask PNG
  brushSize?: number;
  brushHardness?: number;
  ppi: number; // 72 to 600 PPI
}

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'tiff';
export type ExportResolution = 'original' | '2x' | '4x' | '4k' | '8k' | 'custom';

export interface ExportOptions {
  format: ExportFormat;
  quality: number; // 1 - 100
  resolution: ExportResolution;
  customWidth?: number;
  customHeight?: number;
  maintainAspectRatio?: boolean;
  pngCompressionLevel?: number; // 0 - 9
  progressiveJpg?: boolean;
  losslessWebp?: boolean;
  tiffCompression?: 'deflate' | 'lzw' | 'none';
  ppi: number; // 72 to 600 PPI (Metadata density embedding)
  filename: string;
}

export interface ImageMetadata {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  aspectRatio: number;
  ppi: number;
  createdAt: string;
}

export interface ProcessingJob {
  id: string;
  imageId: string;
  tool: ToolId;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  resultUrl?: string;
  resultWidth?: number;
  resultHeight?: number;
  resultSize?: number;
  ppi?: number;
  durationMs?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HistoryItem {
  id: string;
  tool: ToolId;
  toolName: string;
  filename: string;
  originalName: string;
  thumbnailUrl: string;
  resultUrl: string;
  date: string;
  dimensions: {
    original: { width: number; height: number };
    result: { width: number; height: number };
  };
  ppi: number;
  settings: Record<string, any>;
}

export interface StudioSettings {
  theme: 'dark' | 'light' | 'system';
  defaultExportFormat: ExportFormat;
  defaultPPI: number; // 72, 150, 300
  previewQuality: 'fast' | 'high';
  autoCleanup: boolean;
  aiProviderConfigured: boolean;
  aiProviderEndpoint?: string;
}
