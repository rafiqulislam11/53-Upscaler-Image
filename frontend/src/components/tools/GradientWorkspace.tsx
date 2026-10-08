import React, { useState, useEffect } from 'react';
import { Palette, Wand2, Sliders, Sparkles, RefreshCw, Layers, ArrowLeftRight, Crosshair } from 'lucide-react';
import { ImageMetadata, GradientOptions, GradientType, ExtractedColor, GradientBlendMode, GradientColorStop } from '@shared/types';
import { BeforeAfterComparison } from '../common/BeforeAfterComparison';
import { CommonControls } from '../common/CommonControls';
import { UniversalImageUploader } from '../common/UniversalImageUploader';
import { ApiService } from '../../services/api.service';

const GRADIENT_PRESETS: Record<string, string[]> = {
  'Premium': ['#1e1b4b', '#4338ca', '#06b6d4', '#f8fafc'],
  'Vibrant': ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6'],
  'Soft': ['#fce7f3', '#fbcfe8', '#e0e7ff', '#f0fdf4'],
  'Dark': ['#09090b', '#18181b', '#27272a', '#3f3f46'],
  'Neon': ['#000000', '#00f2fe', '#4facfe', '#ff0844'],
  'Pastel': ['#fef3c7', '#fbcfe8', '#ddd6fe', '#bae6fd'],
  'Corporate': ['#0f172a', '#1e293b', '#2563eb', '#60a5fa'],
  'Glass': ['#111827', '#374151', '#6b7280', '#9ca3af'],
  'Sunset': ['#31103f', '#731963', '#d94b43', '#f2ae72'],
  'Aurora': ['#051923', '#003554', '#006494', '#0582ca', '#00a6fb']
};

interface GradientWorkspaceProps {
  currentImage: ImageMetadata | null;
  onImageUploaded: (img: ImageMetadata) => void;
  onImageRemoved: () => void;
  onOpenExport: (filename: string, defaultName: string) => void;
  onAddToHistory: (item: any) => void;
}

export const GradientWorkspace: React.FC<GradientWorkspaceProps> = ({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  onOpenExport,
  onAddToHistory
}) => {
  // 100% Customizable Gradient State
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [blendMode, setBlendMode] = useState<GradientBlendMode>('overlay');
  const [stops, setStops] = useState<GradientColorStop[]>([
    { color: '#12A8FF', offset: 0, opacity: 100 },
    { color: '#7B2FFF', offset: 40, opacity: 100 },
    { color: '#FF4D8D', offset: 75, opacity: 100 },
    { color: '#FFC857', offset: 100, opacity: 100 }
  ]);
  const [angle, setAngle] = useState(135);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [radialRadius, setRadialRadius] = useState(70);

  const [smoothness, setSmoothness] = useState(80);
  const [blur, setBlur] = useState(10);
  const [intensity, setIntensity] = useState(100);
  const [opacity, setOpacity] = useState(85);
  const [contrast, setContrast] = useState(50);
  const [brightness, setBrightness] = useState(50);
  const [invertGradient, setInvertGradient] = useState(false);
  const [ditherNoise, setDitherNoise] = useState(15);
  const [ppi, setPpi] = useState<number>(300);

  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedFilename, setProcessedFilename] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Undo/Redo history
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Extract colors when a new image is loaded
  useEffect(() => {
    if (currentImage) {
      handleExtractColors();
    }
  }, [currentImage?.filename]);

  const handleExtractColors = async () => {
    if (!currentImage) return;
    try {
      setIsExtracting(true);
      const extracted = await ApiService.extractColors(currentImage.filename, 8);
      setExtractedColors(extracted);
      if (extracted.length >= 2) {
        const newStops: GradientColorStop[] = extracted.slice(0, 4).map((c, i) => ({
          color: c.hex,
          offset: Math.round((i / 3) * 100),
          opacity: 100
        }));
        setStops(newStops);
      }
    } catch (err: any) {
      console.warn('Color extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApply = async () => {
    if (!currentImage) return;

    try {
      setIsProcessing(true);

      const options: GradientOptions = {
        gradientType,
        colors: stops.map(s => s.color),
        stops,
        blendMode,
        angle,
        focalX,
        focalY,
        radialRadius,
        colorCount: stops.length,
        smoothness,
        blur,
        intensity,
        opacity,
        noise: ditherNoise,
        contrast,
        brightness,
        invertGradient,
        ppi
      };

      const res = await ApiService.generateGradient(currentImage.filename, options);
      const resultData = res.data;

      setProcessedUrl(resultData.outputUrl);
      setProcessedFilename(resultData.outputFilename);

      // Save state to undo stack
      const snapshot = { gradientType, stops: JSON.parse(JSON.stringify(stops)), angle, opacity, blur, ppi, processedUrl: resultData.outputUrl };
      setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), snapshot]);
      setHistoryIndex(prev => prev + 1);

      onAddToHistory({
        tool: 'gradient',
        toolName: 'Image to Gradient',
        filename: resultData.outputFilename,
        originalName: currentImage.originalName,
        thumbnailUrl: resultData.outputUrl,
        resultUrl: resultData.outputUrl,
        dimensions: {
          original: { width: currentImage.width, height: currentImage.height },
          result: { width: resultData.width, height: resultData.height }
        },
        ppi: resultData.ppi || ppi,
        settings: options
      });
    } catch (err: any) {
      alert(err.message || 'Gradient generation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate10Variations = async () => {
    try {
      setIsProcessing(true);
      const vars = await ApiService.generateGradientVariations(stops.map(s => s.color));
      setVariations(vars);
    } catch (err: any) {
      alert(err.message || 'Could not generate variations.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyVariation = (v: any) => {
    const newStops: GradientColorStop[] = v.colors.map((c: string, idx: number) => ({
      color: c,
      offset: Math.round((idx / (v.colors.length - 1)) * 100),
      opacity: 100
    }));
    setStops(newStops);
    setAngle(v.angle);
    setGradientType(v.type);
    setTimeout(handleApply, 50);
  };

  const applyPreset = (presetName: string) => {
    if (GRADIENT_PRESETS[presetName]) {
      const presetColors = GRADIENT_PRESETS[presetName];
      const newStops: GradientColorStop[] = presetColors.map((c, idx) => ({
        color: c,
        offset: Math.round((idx / (presetColors.length - 1)) * 100),
        opacity: 100
      }));
      setStops(newStops);
    }
  };

  const handleColorChange = (index: number, newHex: string) => {
    const updated = [...stops];
    updated[index].color = newHex;
    setStops(updated);
  };

  const handleOffsetChange = (index: number, newOffset: number) => {
    const updated = [...stops];
    updated[index].offset = newOffset;
    setStops(updated);
  };

  const handleOpacityChange = (index: number, newOpacity: number) => {
    const updated = [...stops];
    updated[index].opacity = newOpacity;
    setStops(updated);
  };

  const addColorStop = () => {
    if (stops.length < 12) {
      const lastOffset = stops[stops.length - 1]?.offset ?? 80;
      setStops([...stops, { color: '#06b6d4', offset: Math.min(100, lastOffset + 15), opacity: 100 }]);
    }
  };

  const removeColorStop = (index: number) => {
    if (stops.length > 2) {
      setStops(stops.filter((_, i) => i !== index));
    }
  };

  const handleReset = () => {
    setGradientType('linear');
    setBlendMode('overlay');
    setStops([
      { color: '#12A8FF', offset: 0, opacity: 100 },
      { color: '#7B2FFF', offset: 40, opacity: 100 },
      { color: '#FF4D8D', offset: 75, opacity: 100 },
      { color: '#FFC857', offset: 100, opacity: 100 }
    ]);
    setAngle(135);
    setFocalX(50);
    setFocalY(50);
    setRadialRadius(70);
    setOpacity(85);
    setBlur(10);
    setInvertGradient(false);
    setPpi(300);
    setProcessedUrl(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setGradientType(prev.gradientType);
      setStops(prev.stops);
      setAngle(prev.angle);
      setOpacity(prev.opacity);
      setProcessedUrl(prev.processedUrl);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setGradientType(next.gradientType);
      setStops(next.stops);
      setAngle(next.angle);
      setOpacity(next.opacity);
      setProcessedUrl(next.processedUrl);
      setHistoryIndex(historyIndex + 1);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-dark-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Image to Gradient</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              100% CUSTOMIZABLE
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Granular stop offsets, focal center X/Y coordinates, blend modes, anti-banding dither, and 72-600 PPI density.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left Column: Image & Comparison Viewer */}
        <div className="lg:col-span-8 flex flex-col space-y-3 min-h-[420px]">
          <UniversalImageUploader
            currentImage={currentImage}
            onImageUploaded={onImageUploaded}
            onImageRemoved={onImageRemoved}
            isLoading={isProcessing}
          />

          {currentImage ? (
            <div className="flex-1 min-h-[360px]">
              <BeforeAfterComparison
                originalUrl={currentImage.url}
                processedUrl={processedUrl}
                originalLabel="Original Image"
                processedLabel={`Gradient (${gradientType.toUpperCase()})`}
                aspectRatio={currentImage.aspectRatio}
                ppi={ppi}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-[360px] bg-white dark:bg-dark-850 rounded-2xl border border-dashed border-slate-300 dark:border-dark-700 flex flex-col items-center justify-center p-8 text-center">
              <Palette className="w-10 h-10 text-purple-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Upload image to extract color gradients
              </p>
            </div>
          )}

          {currentImage && (
            <CommonControls
              canUndo={historyIndex > 0}
              canRedo={historyIndex < historyStack.length - 1}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReset={handleReset}
              onApply={handleApply}
              onDownload={() => onOpenExport(processedFilename || currentImage.filename, `${currentImage.originalName.replace(/\.[^/.]+$/, '')}_gradient`)}
              isProcessing={isProcessing}
            />
          )}

          {/* 10 Variations Carousel / Grid */}
          {variations.length > 0 && (
            <div className="bg-white dark:bg-dark-850 p-4 rounded-xl border border-slate-200 dark:border-dark-700 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Generated 10 Coherent Variations
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Click to preview</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {variations.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => applyVariation(v)}
                    className="group relative h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-dark-700 hover:scale-105 transition-all shadow-xs"
                    style={{
                      background: `linear-gradient(${v.angle}deg, ${v.colors.join(', ')})`
                    }}
                  >
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/60 text-white px-1 rounded">
                      #{i + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 100% Customizable Gradient Settings */}
        <div className="lg:col-span-4 flex flex-col space-y-4 bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-xs overflow-y-auto">
          {/* Section 1: Modes & Blend Mode */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Gradient Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['linear', 'radial', 'angular', 'mesh', 'liquid', 'soft-blur', 'abstract'] as GradientType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGradientType(type)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${
                      gradientType === type
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold'
                        : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800'
                    }`}
                  >
                    {type.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Overlay Blend Mode
              </label>
              <select
                value={blendMode}
                onChange={e => setBlendMode(e.target.value as GradientBlendMode)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="overlay">Overlay (Cinematic Contrast)</option>
                <option value="soft-light">Soft Light (Subtle Tint)</option>
                <option value="screen">Screen (Luminous Radiance)</option>
                <option value="multiply">Multiply (Moody Deep)</option>
                <option value="normal">Normal (Pure Gradient)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Color Stops Manager (Offset & Color per stop) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Color Stops ({stops.length}/12)
              </label>
              <button
                type="button"
                onClick={handleExtractColors}
                disabled={isExtracting || !currentImage}
                className="text-[11px] text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>Re-Extract</span>
              </button>
            </div>

            {/* Granular Stops List with Offsets */}
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-dark-900 p-2 rounded-lg border border-slate-200 dark:border-dark-700">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={e => handleColorChange(idx, e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={stop.color}
                    onChange={e => handleColorChange(idx, e.target.value)}
                    className="w-16 px-1.5 py-0.5 text-[11px] font-mono rounded border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-center uppercase"
                  />
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">At:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.offset}
                      onChange={e => handleOffsetChange(idx, Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-500 w-7 text-right">{stop.offset}%</span>
                  </div>
                  {stops.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeColorStop(idx)}
                      className="text-slate-400 hover:text-rose-500 text-sm px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {stops.length < 12 && (
                <button
                  type="button"
                  onClick={addColorStop}
                  className="w-full py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-dark-750 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border border-dashed border-slate-300 dark:border-dark-700"
                >
                  + Add Color Stop
                </button>
              )}
            </div>
          </div>

          {/* Section 3: 10 Variations Button */}
          <button
            type="button"
            onClick={handleGenerate10Variations}
            disabled={isProcessing}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate 10 Coherent Variations</span>
          </button>

          {/* Section 4: Focal Coordinates (for Radial / Mesh) */}
          {(gradientType === 'radial' || gradientType === 'mesh' || gradientType === 'liquid') && (
            <div className="p-3 bg-slate-50 dark:bg-dark-800 rounded-xl space-y-2 border border-slate-200 dark:border-dark-700">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                Focal Center Point & Spread
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Focal X</span>
                    <span className="font-mono">{focalX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={focalX}
                    onChange={e => setFocalX(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Focal Y</span>
                    <span className="font-mono">{focalY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={focalY}
                    onChange={e => setFocalY(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Radial Spread Radius</span>
                  <span className="font-mono">{radialRadius}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={radialRadius}
                  onChange={e => setRadialRadius(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Section 5: Sliders (Angle, Opacity, Blur, Anti-Banding Dither, PPI) */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-dark-800">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Gradient Angle</span>
                <span className="font-mono text-purple-500">{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={e => setAngle(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Master Opacity</span>
                <span className="font-mono text-purple-500">{opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Softness & Blur</span>
                <span className="font-mono text-purple-500">{blur}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blur}
                onChange={e => setBlur(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Anti-Banding Dither Texture</span>
                <span className="font-mono text-purple-500">{ditherNoise}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ditherNoise}
                onChange={e => setDitherNoise(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer" htmlFor="invertGrad">
                Invert Gradient Sequence
              </label>
              <input
                type="checkbox"
                id="invertGrad"
                checked={invertGradient}
                onChange={e => setInvertGradient(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Print Density (PPI / DPI)</span>
                <span className="font-mono text-brand-500">{ppi} PPI</span>
              </div>
              <input
                type="range"
                min="72"
                max="600"
                value={ppi}
                onChange={e => setPpi(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
