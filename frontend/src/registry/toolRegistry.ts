import { ToolDefinition, ToolId } from '@shared/types';

export interface ToolMetadata extends ToolDefinition {
  accentColor: string;
  badge?: string;
  features: string[];
}

export const TOOLS: ToolMetadata[] = [
  {
    id: 'upscale',
    name: 'Upscale 4K / 8K',
    tagline: 'Super Resolution & Detail Recovery',
    description: 'Enhance image resolution up to 4K UHD and 8K with AI micro-contrast, edge preservation and 72-300 PPI print fidelity.',
    icon: 'Maximize2',
    category: 'enhancement',
    status: 'active',
    accentColor: 'from-blue-500 to-cyan-400',
    badge: '4K / 8K AI',
    features: ['2X / 4X / 4K / 8K Upscaling', '72 to 300 PPI Print Density', 'Detail & Texture Recovery', 'AI & High-Quality Local Engine']
  },
  {
    id: 'gradient',
    name: 'Image to Gradient',
    tagline: 'Dominant Palette & Mesh Generator',
    description: 'Extract dominant color palettes and generate premium Linear, Radial, Angular, and Mesh gradients with 10 automatic variations.',
    icon: 'Palette',
    category: 'artistic',
    status: 'active',
    accentColor: 'from-purple-500 to-pink-500',
    badge: '8-Color Palette',
    features: ['Automatic Color Extraction', 'Linear / Radial / Mesh Modes', 'Generate 10 Coherent Variations', '2K / 4K / 8K Wallpaper Export']
  },
  {
    id: 'noise',
    name: 'Noise / Film Grain',
    tagline: 'Authentic 35mm Analog Grain & Grit',
    description: 'Add authentic Kodak 35mm film grain, modern digital ISO noise, or color chromatic textures with realistic midtone falloff.',
    icon: 'Sparkles',
    category: 'filter',
    status: 'active',
    accentColor: 'from-amber-500 to-orange-500',
    badge: 'Analog Physics',
    features: ['35mm Film Grain Simulation', 'Monochrome & RGB Color Noise', 'Shadow & Midtone Weighting', 'Fast & High Quality Modes']
  },
  {
    id: 'blur',
    name: 'Image to Blur',
    tagline: 'Cinematic Optical Lens & Motion Blur',
    description: 'Apply Gaussian, Directional Motion, Radial, Zoom, and Background blur with an interactive manual subject mask editor.',
    icon: 'Eye',
    category: 'filter',
    status: 'active',
    accentColor: 'from-emerald-500 to-teal-400',
    badge: 'Optical Studio',
    features: ['Gaussian, Motion & Radial Blur', 'Interactive Center Coordinates', 'Background Blur with Brush Mask', 'High-Definition Export']
  }
];

// Extensible registry for future tool expansion
export const UPCOMING_TOOLS: Partial<ToolMetadata>[] = [
  { id: 'background-remover' as any, name: 'Background Remover', status: 'coming_soon', icon: 'Scissors', tagline: 'One-click AI cutout' },
  { id: 'sharpen' as any, name: 'Clarity & Sharpen', status: 'coming_soon', icon: 'Zap', tagline: 'Micro-contrast HDR' },
  { id: 'glass' as any, name: 'Frosted Glass', status: 'coming_soon', icon: 'Layers', tagline: 'Glassmorphism generator' },
  { id: 'image-to-vector' as any, name: 'Image to Vector', status: 'coming_soon', icon: 'PenTool', tagline: 'SVG vectorizer' }
];

export function getToolById(id: ToolId): ToolMetadata | undefined {
  return TOOLS.find(t => t.id === id);
}
