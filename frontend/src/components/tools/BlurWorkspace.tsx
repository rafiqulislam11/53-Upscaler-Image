import React, { useState, useRef, useEffect } from 'react';
import { Eye, Brush, Eraser, Sliders, Target, Undo, Check, RotateCw, Aperture, Layers } from 'lucide-react';
import { ImageMetadata, BlurOptions, BlurType, BokehApertureShape } from '@shared/types';
import { BeforeAfterComparison } from '../common/BeforeAfterComparison';
import { CommonControls } from '../common/CommonControls';
import { UniversalImageUploader } from '../common/UniversalImageUploader';
import { ApiService } from '../../services/api.service';

const BLUR_TYPES: { id: BlurType; label: string; desc: string }[] = [
  { id: 'gaussian', label: 'Gaussian', desc: 'Silky smooth defocus' },
  { id: 'motion', label: 'Motion Blur', desc: 'Velocity angle streak' },
  { id: 'radial', label: 'Radial Spin', desc: 'Vortex rotation' },
  { id: 'zoom', label: 'Zoom Blur', desc: 'Center burst zoom' },
  { id: 'tiltshift', label: 'Tilt-Shift', desc: 'Miniature depth of field' },
  { id: 'lens', label: 'Bokeh Lens', desc: 'Aperture bloom highlights' },
  { id: 'background', label: 'Background', desc: 'Interactive subject mask' },
  { id: 'soft', label: 'Soft Mist', desc: 'Atmospheric bloom' }
];

interface BlurWorkspaceProps {
  currentImage: ImageMetadata | null;
  onImageUploaded: (img: ImageMetadata) => void;
  onImageRemoved: () => void;
  onOpenExport: (filename: string, defaultName: string) => void;
  onAddToHistory: (item: any) => void;
}

export const BlurWorkspace: React.FC<BlurWorkspaceProps> = ({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  onOpenExport,
  onAddToHistory
}) => {
  // 100% Customizable Blur State
  const [blurType, setBlurType] = useState<BlurType>('gaussian');
  const [radius, setRadius] = useState(25);
  const [strength, setStrength] = useState(85);

  // Motion Blur
  const [angle, setAngle] = useState(45);
  const [distance, setDistance] = useState(25);

  // Radial / Zoom Center
  const [centerX, setCenterX] = useState(50);
  const [centerY, setCenterY] = useState(50);
  const [zoomAmount, setZoomAmount] = useState(30);

  // Tilt-Shift Miniature
  const [tiltPosition, setTiltPosition] = useState(50);
  const [tiltWidth, setTiltWidth] = useState(30);
  const [tiltAngle, setTiltAngle] = useState(0);
  const [tiltFeather, setTiltFeather] = useState(50);

  // Bokeh / Lens
  const [bokehAperture, setBokehAperture] = useState<BokehApertureShape>('circle');
  const [bokehThreshold, setBokehThreshold] = useState(70);
  const [bokehBoost, setBokehBoost] = useState(2.0);

  // Manual Mask state
  const [isMaskMode, setIsMaskMode] = useState(false);
  const [brushMode, setBrushMode] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(35);
  const [brushHardness, setBrushHardness] = useState(80);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [ppi, setPpi] = useState<number>(300);

  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedFilename, setProcessedFilename] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Undo/Redo stack
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Open mask mode when switching to background blur
  useEffect(() => {
    if (blurType === 'background') {
      setIsMaskMode(true);
    } else {
      setIsMaskMode(false);
    }
  }, [blurType]);

  const handleApply = async () => {
    if (!currentImage) return;

    try {
      setIsProcessing(true);

      let maskBase64: string | undefined = undefined;
      if (blurType === 'background' && maskCanvasRef.current) {
        maskBase64 = maskCanvasRef.current.toDataURL('image/png');
      }

      const options: BlurOptions = {
        blurType,
        radius,
        strength,
        angle,
        distance,
        centerX,
        centerY,
        zoomAmount,
        tiltShiftAngle: tiltAngle,
        tiltShiftPosition: tiltPosition,
        tiltShiftWidth: tiltWidth,
        tiltShiftFeather: tiltFeather,
        bokehAperture,
        bokehThreshold,
        bokehBoost,
        maskBase64,
        ppi
      };

      const res = await ApiService.applyBlur(currentImage.filename, options);
      const resultData = res.data;

      setProcessedUrl(resultData.outputUrl);
      setProcessedFilename(resultData.outputFilename);

      // Save state snapshot
      const snapshot = { blurType, radius, angle, distance, ppi, processedUrl: resultData.outputUrl };
      setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), snapshot]);
      setHistoryIndex(prev => prev + 1);

      onAddToHistory({
        tool: 'blur',
        toolName: 'Image to Blur',
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
      alert(err.message || 'Blur processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setBlurType('gaussian');
    setRadius(25);
    setStrength(85);
    setAngle(45);
    setDistance(25);
    setCenterX(50);
    setCenterY(50);
    setTiltPosition(50);
    setTiltWidth(30);
    setBokehThreshold(70);
    setBokehBoost(2.0);
    setPpi(300);
    setProcessedUrl(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setBlurType(prev.blurType);
      setRadius(prev.radius);
      setProcessedUrl(prev.processedUrl);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setBlurType(next.blurType);
      setRadius(next.radius);
      setProcessedUrl(next.processedUrl);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Canvas mask drawing logic
  const handleMaskMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    drawOnMask(e);
  };

  const handleMaskMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    drawOnMask(e);
  };

  const handleMaskMouseUp = () => {
    setIsDrawing(false);
  };

  const drawOnMask = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);

    if (brushMode === 'brush') {
      ctx.fillStyle = '#ffffff'; // White reveals subject sharp
      ctx.fill();
    } else {
      ctx.fillStyle = '#000000'; // Black marks as blur background
      ctx.fill();
    }
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-dark-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Image to Blur</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              100% CUSTOMIZABLE
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Miniature tilt-shift depth, specular bokeh aperture blades, motion angle vectors, and 72-600 PPI density.
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
            <div className="flex-1 min-h-[360px] relative">
              <BeforeAfterComparison
                originalUrl={currentImage.url}
                processedUrl={processedUrl}
                originalLabel="Sharp Image"
                processedLabel={`Blur (${blurType})`}
                aspectRatio={currentImage.aspectRatio}
                ppi={ppi}
              />

              {/* Mask overlay canvas when in background blur manual mask mode */}
              {isMaskMode && (
                <div className="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center p-6 bg-black/50 backdrop-blur-xs">
                  <div className="relative border-2 border-dashed border-emerald-400 rounded-xl overflow-hidden shadow-2xl">
                    <img
                      src={currentImage.url}
                      alt="Mask Target"
                      className="max-h-[60vh] w-auto pointer-events-none opacity-40"
                    />
                    <canvas
                      ref={maskCanvasRef}
                      width={currentImage.width || 800}
                      height={currentImage.height || 600}
                      onMouseDown={handleMaskMouseDown}
                      onMouseMove={handleMaskMouseMove}
                      onMouseUp={handleMaskMouseUp}
                      className="absolute inset-0 w-full h-full cursor-crosshair mix-blend-screen opacity-85"
                    />

                    {/* Mask Floating Toolbar */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-dark-900/90 backdrop-blur-md p-2 rounded-xl border border-dark-700 text-white">
                      <button
                        type="button"
                        onClick={() => setBrushMode('brush')}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                          brushMode === 'brush' ? 'bg-emerald-500 text-white' : 'text-slate-300'
                        }`}
                        title="Brush: Paint Subject to keep sharp"
                      >
                        <Brush className="w-4 h-4" />
                        <span>Brush (Sharp Subject)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrushMode('eraser')}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                          brushMode === 'eraser' ? 'bg-emerald-500 text-white' : 'text-slate-300'
                        }`}
                        title="Eraser: Paint Background to blur"
                      >
                        <Eraser className="w-4 h-4" />
                        <span>Eraser (Blur)</span>
                      </button>
                      <div className="flex items-center gap-1.5 px-2">
                        <span className="text-[10px] text-slate-400">Size:</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={brushSize}
                          onChange={e => setBrushSize(Number(e.target.value))}
                          className="w-16 h-1 bg-dark-700 rounded cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearMask}
                        className="px-2 py-1 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-dark-800"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMaskMode(false)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        Done Masking
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-[360px] bg-white dark:bg-dark-850 rounded-2xl border border-dashed border-slate-300 dark:border-dark-700 flex flex-col items-center justify-center p-8 text-center">
              <Eye className="w-10 h-10 text-emerald-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Upload image to apply optical blur
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
              onDownload={() => onOpenExport(processedFilename || currentImage.filename, `${currentImage.originalName.replace(/\.[^/.]+$/, '')}_blur`)}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Right Column: 100% Customizable Blur Controls */}
        <div className="lg:col-span-4 flex flex-col space-y-4 bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-xs overflow-y-auto">
          {/* Section 1: Blur Types */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Blur Optical Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BLUR_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBlurType(t.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    blurType === t.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800'
                  }`}
                >
                  <div className="text-xs">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Mode Specific Granular Sliders */}
          <div className="space-y-3.5 pt-2 border-t border-slate-200 dark:border-dark-800">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Blur Radius / Intensity</span>
                <span className="font-mono text-emerald-500">{radius} px</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Motion Blur Granular Controls */}
            {(blurType === 'motion' || blurType === 'directional') && (
              <div className="p-3 bg-slate-50 dark:bg-dark-800 rounded-xl space-y-2.5 border border-slate-200 dark:border-dark-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Directional Velocity Angle & Distance
                </span>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Motion Angle</span>
                    <span className="font-mono text-emerald-500">{angle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={angle}
                    onChange={e => setAngle(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Streak Distance</span>
                    <span className="font-mono text-emerald-500">{distance} px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={distance}
                    onChange={e => setDistance(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Tilt-Shift Miniature Granular Controls */}
            {blurType === 'tiltshift' && (
              <div className="p-3 bg-slate-50 dark:bg-dark-800 rounded-xl space-y-2.5 border border-slate-200 dark:border-dark-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Tilt-Shift Focus Corridor & Feather
                </span>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>Focus Center Position</span>
                    <span className="font-mono text-emerald-500">{tiltPosition}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={tiltPosition}
                    onChange={e => setTiltPosition(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>Focus Clear Corridor Width</span>
                    <span className="font-mono text-emerald-500">{tiltWidth}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={tiltWidth}
                    onChange={e => setTiltWidth(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>Transition Feather Gradient</span>
                    <span className="font-mono text-emerald-500">{tiltFeather}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={tiltFeather}
                    onChange={e => setTiltFeather(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Bokeh / Lens Blur Highlights Granular Controls */}
            {blurType === 'lens' && (
              <div className="p-3 bg-slate-50 dark:bg-dark-800 rounded-xl space-y-2.5 border border-slate-200 dark:border-dark-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Specular Highlight Bloom & Aperture
                </span>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Aperture Blade Shape</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['circle', '5-blade', '6-blade', '8-blade'] as BokehApertureShape[]).map(shape => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setBokehAperture(shape)}
                        className={`py-1 text-[10px] rounded border capitalize ${
                          bokehAperture === shape
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 font-bold'
                            : 'border-slate-200 dark:border-dark-700 text-slate-500'
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>Highlight Threshold</span>
                    <span className="font-mono text-emerald-500">{bokehThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    value={bokehThreshold}
                    onChange={e => setBokehThreshold(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>Specular Glow Boost</span>
                    <span className="font-mono text-emerald-500">{bokehBoost.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.2"
                    value={bokehBoost}
                    onChange={e => setBokehBoost(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Radial / Zoom Blur Center Coordinates */}
            {(blurType === 'radial' || blurType === 'zoom') && (
              <div className="p-3 bg-slate-50 dark:bg-dark-800 rounded-xl space-y-2.5 border border-slate-200 dark:border-dark-700">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Optical Center Coordinates
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400">Center X: {centerX}%</label>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={centerX}
                      onChange={e => setCenterX(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Center Y: {centerY}%</label>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={centerY}
                      onChange={e => setCenterY(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Background Blur Mask Launcher */}
            {blurType === 'background' && (
              <button
                type="button"
                onClick={() => setIsMaskMode(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
              >
                <Brush className="w-3.5 h-3.5" />
                <span>Open Subject Mask Editor</span>
              </button>
            )}

            {/* PPI Slider */}
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
