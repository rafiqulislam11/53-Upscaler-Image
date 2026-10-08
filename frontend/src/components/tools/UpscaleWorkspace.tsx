import React, { useState } from 'react';
import { Sparkles, Sliders, Info, ShieldCheck, Check, Lock, Unlock, Settings2 } from 'lucide-react';
import { ImageMetadata, UpscaleOptions, UpscaleTarget, UpscaleProviderType, ResamplingKernel } from '@shared/types';
import { BeforeAfterComparison } from '../common/BeforeAfterComparison';
import { CommonControls } from '../common/CommonControls';
import { UniversalImageUploader } from '../common/UniversalImageUploader';
import { ApiService } from '../../services/api.service';

interface UpscaleWorkspaceProps {
  currentImage: ImageMetadata | null;
  onImageUploaded: (img: ImageMetadata) => void;
  onImageRemoved: () => void;
  onOpenExport: (filename: string, defaultName: string) => void;
  onAddToHistory: (item: any) => void;
}

export const UpscaleWorkspace: React.FC<UpscaleWorkspaceProps> = ({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  onOpenExport,
  onAddToHistory
}) => {
  // 100% Customizable Controls State
  const [scaleTarget, setScaleTarget] = useState<UpscaleTarget>('4x');
  const [customMultiplier, setCustomMultiplier] = useState<number>(3.0);
  const [customWidth, setCustomWidth] = useState<number>(3840);
  const [customHeight, setCustomHeight] = useState<number>(2160);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [resamplingKernel, setResamplingKernel] = useState<ResamplingKernel>('lanczos3');

  const [detail, setDetail] = useState(65);
  const [sharpness, setSharpness] = useState(70);
  const [sharpenSigma, setSharpenSigma] = useState(1.2);
  const [clarity, setClarity] = useState(45);
  const [colorVibrance, setColorVibrance] = useState(25);
  const [noiseReduction, setNoiseReduction] = useState(20);

  const [faceEnhancement, setFaceEnhancement] = useState(true);
  const [faceIntensity, setFaceIntensity] = useState(60);

  const [provider, setProvider] = useState<UpscaleProviderType>('local');
  const [ppi, setPpi] = useState<number>(300); // 72 to 600 PPI

  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedFilename, setProcessedFilename] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [providerMessage, setProviderMessage] = useState<string | null>(null);

  // History state for undo/redo
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Update custom dimensions when source image loads
  React.useEffect(() => {
    if (currentImage) {
      setCustomWidth(Math.round(currentImage.width * customMultiplier));
      setCustomHeight(Math.round(currentImage.height * customMultiplier));
    }
  }, [currentImage?.filename]);

  const handleWidthChange = (val: number) => {
    setCustomWidth(val);
    if (lockAspectRatio && currentImage && currentImage.aspectRatio) {
      setCustomHeight(Math.round(val / currentImage.aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setCustomHeight(val);
    if (lockAspectRatio && currentImage && currentImage.aspectRatio) {
      setCustomWidth(Math.round(val * currentImage.aspectRatio));
    }
  };

  const calculateTargetPreview = () => {
    if (!currentImage) return { width: 0, height: 0, mp: '0' };
    const w = currentImage.width;
    const h = currentImage.height;
    const aspect = w / h;

    let targetW = w;
    let targetH = h;

    if (scaleTarget === '2x') {
      targetW = w * 2; targetH = h * 2;
    } else if (scaleTarget === '4x') {
      targetW = w * 4; targetH = h * 4;
    } else if (scaleTarget === '4k') {
      if (aspect >= 1) {
        targetW = 3840; targetH = Math.round(3840 / aspect);
      } else {
        targetH = 2160; targetW = Math.round(2160 * aspect);
      }
    } else if (scaleTarget === '8k') {
      if (aspect >= 1) {
        targetW = 7680; targetH = Math.round(7680 / aspect);
      } else {
        targetH = 4320; targetW = Math.round(4320 * aspect);
      }
    } else if (scaleTarget === 'custom') {
      targetW = customWidth;
      targetH = customHeight;
    }

    const mp = ((targetW * targetH) / 1000000).toFixed(1);
    return { width: targetW, height: targetH, mp };
  };

  const targetDim = calculateTargetPreview();

  const handleApply = async () => {
    if (!currentImage) return;

    try {
      setIsProcessing(true);
      setProviderMessage(null);

      const options: UpscaleOptions = {
        scaleTarget,
        customScaleMultiplier: scaleTarget === 'custom' ? customMultiplier : undefined,
        customWidth: scaleTarget === 'custom' ? customWidth : undefined,
        customHeight: scaleTarget === 'custom' ? customHeight : undefined,
        maintainAspectRatio: lockAspectRatio,
        resamplingKernel,
        detail,
        sharpness,
        sharpenSigma,
        clarity,
        colorVibrance,
        noiseReduction,
        faceEnhancement,
        faceEnhancementIntensity: faceIntensity,
        provider,
        ppi
      };

      const res = await ApiService.upscale(currentImage.filename, options);
      const resultData = res.data;

      setProcessedUrl(resultData.outputUrl);
      setProcessedFilename(resultData.outputFilename);
      setProviderMessage(res.message);

      // Save to undo stack
      const stateSnapshot = { scaleTarget, detail, sharpness, clarity, ppi, processedUrl: resultData.outputUrl };
      setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), stateSnapshot]);
      setHistoryIndex(prev => prev + 1);

      // Add to global image history
      onAddToHistory({
        tool: 'upscale',
        toolName: 'Upscale 4K / 8K',
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
      alert(err.message || 'Upscaling failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setScaleTarget('4x');
    setCustomMultiplier(3.0);
    setResamplingKernel('lanczos3');
    setDetail(65);
    setSharpness(70);
    setSharpenSigma(1.2);
    setClarity(45);
    setColorVibrance(25);
    setNoiseReduction(20);
    setFaceEnhancement(true);
    setFaceIntensity(60);
    setPpi(300);
    setProcessedUrl(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetState = historyStack[historyIndex - 1];
      setScaleTarget(targetState.scaleTarget);
      setDetail(targetState.detail);
      setSharpness(targetState.sharpness);
      setPpi(targetState.ppi);
      setProcessedUrl(targetState.processedUrl);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const targetState = historyStack[historyIndex + 1];
      setScaleTarget(targetState.scaleTarget);
      setDetail(targetState.detail);
      setSharpness(targetState.sharpness);
      setPpi(targetState.ppi);
      setProcessedUrl(targetState.processedUrl);
      setHistoryIndex(historyIndex + 1);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-dark-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Image Upscale 4K / 8K</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              100% CUSTOMIZABLE
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fully customizable target pixels, multi-algorithm kernels, unsharp masking sigma, and 72-600 PPI density.
          </p>
        </div>

        {/* Dynamic Resolution Pill */}
        {currentImage && (
          <div className="flex items-center gap-2 text-xs font-mono bg-white dark:bg-dark-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 shadow-2xs">
            <span className="text-slate-500">{currentImage.width}×{currentImage.height}</span>
            <span className="text-slate-400">➔</span>
            <span className="font-bold text-brand-500">{targetDim.width}×{targetDim.height} ({targetDim.mp} MP)</span>
          </div>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left Column: Image Upload & Comparison Viewer */}
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
                originalLabel="Original Master"
                processedLabel={`Upscaled ${scaleTarget.toUpperCase()}`}
                aspectRatio={currentImage.aspectRatio}
                ppi={ppi}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-[360px] bg-white dark:bg-dark-850 rounded-2xl border border-dashed border-slate-300 dark:border-dark-700 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-10 h-10 text-brand-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No image loaded in Upscaler
              </p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Upload your picture or select one of the top demo samples to preview 4K / 8K Super Resolution.
              </p>
            </div>
          )}

          {/* Common Controls Toolbar */}
          {currentImage && (
            <CommonControls
              canUndo={historyIndex > 0}
              canRedo={historyIndex < historyStack.length - 1}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReset={handleReset}
              onApply={handleApply}
              onDownload={() => onOpenExport(processedFilename || currentImage.filename, `${currentImage.originalName.replace(/\.[^/.]+$/, '')}_upscaled_${scaleTarget}`)}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Right Column: 100% Customizable Parameters Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-4 bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-xs overflow-y-auto">
          {/* Section 1: Target Resolution Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Resolution Target
              </label>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['2x', '4x', '4k', '8k', 'custom'] as UpscaleTarget[]).map(target => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setScaleTarget(target)}
                  className={`py-2 flex flex-col items-center justify-center rounded-xl border transition-all ${
                    scaleTarget === target
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 shadow-xs ring-1 ring-brand-500/30'
                      : 'border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800'
                  }`}
                >
                  <span className="text-xs font-black font-mono">{target.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimension Editor (When 'custom' selected or general adjustment) */}
          {scaleTarget === 'custom' && (
            <div className="p-3 bg-slate-50 dark:bg-dark-800 rounded-xl space-y-2.5 border border-slate-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Custom Pixel Dimensions
                </span>
                <button
                  type="button"
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  className={`p-1 rounded text-xs flex items-center gap-1 ${
                    lockAspectRatio ? 'text-brand-500 font-semibold' : 'text-slate-400'
                  }`}
                  title={lockAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
                >
                  {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{lockAspectRatio ? 'Locked' : 'Free'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Width (px)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={e => handleWidthChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Height (px)</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={e => handleHeightChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Custom Scale Multiplier</span>
                  <span className="font-mono text-brand-500 font-bold">{customMultiplier.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={customMultiplier}
                  onChange={e => {
                    const mult = Number(e.target.value);
                    setCustomMultiplier(mult);
                    if (currentImage) {
                      setCustomWidth(Math.round(currentImage.width * mult));
                      setCustomHeight(Math.round(currentImage.height * mult));
                    }
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Section 2: Resampling Algorithm Kernel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Resampling Algorithm Kernel
            </label>
            <select
              value={resamplingKernel}
              onChange={e => setResamplingKernel(e.target.value as ResamplingKernel)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="lanczos3">Lanczos3 (High Order - Maximum Sharpness)</option>
              <option value="lanczos2">Lanczos2 (Fast Balanced Cinema)</option>
              <option value="bicubic">Cubic / Bicubic (Smooth Gradient)</option>
              <option value="mitchell">Mitchell-Netravali (Anti-Ringing)</option>
              <option value="bilinear">Bilinear (Soft Texture)</option>
              <option value="nearest">Nearest Neighbor (Pixel Art Crispy)</option>
            </select>
          </div>

          {/* Section 3: PPI / DPI Density (72 to 600 PPI) */}
          <div className="p-3.5 bg-slate-50 dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Print PPI / DPI Density
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="72"
                  max="600"
                  value={ppi}
                  onChange={e => setPpi(Math.max(72, Math.min(600, Number(e.target.value))))}
                  className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-brand-500 bg-white dark:bg-dark-900 rounded border border-slate-200 dark:border-dark-700 text-center"
                />
                <span className="text-xs font-mono text-slate-400">PPI</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPpi(72)}
                className={`py-1 text-[11px] font-medium rounded-lg border transition-all ${
                  ppi === 72 ? 'border-brand-500 bg-white dark:bg-dark-900 text-brand-500 font-bold' : 'border-transparent text-slate-500'
                }`}
              >
                72 Web
              </button>
              <button
                type="button"
                onClick={() => setPpi(150)}
                className={`py-1 text-[11px] font-medium rounded-lg border transition-all ${
                  ppi === 150 ? 'border-brand-500 bg-white dark:bg-dark-900 text-brand-500 font-bold' : 'border-transparent text-slate-500'
                }`}
              >
                150 Standard
              </button>
              <button
                type="button"
                onClick={() => setPpi(300)}
                className={`py-1 text-[11px] font-medium rounded-lg border transition-all ${
                  ppi === 300 ? 'border-brand-500 bg-white dark:bg-dark-900 text-brand-500 font-bold' : 'border-transparent text-slate-500'
                }`}
              >
                300 Print
              </button>
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

          {/* Section 4: Provider Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Engine Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('local')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                  provider === 'local'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold">Local Sharp</div>
                <div className="text-[10px] text-slate-400">Lanczos3 Kernel</div>
              </button>
              <button
                type="button"
                onClick={() => setProvider('ai')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                  provider === 'ai'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                    : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold">Neural AI</div>
                <div className="text-[10px] text-slate-400">API Provider</div>
              </button>
            </div>
          </div>

          {/* Section 5: Fine Tuning Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-dark-800">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Detail Enhancement</span>
                <span className="font-mono text-brand-500">{detail}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={detail}
                onChange={e => setDetail(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Sharpness & Unsharp Mask</span>
                <span className="font-mono text-brand-500">{sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpness}
                onChange={e => setSharpness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Sharpening Sigma Radius</span>
                <span className="font-mono text-brand-500">{sharpenSigma}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="3.0"
                step="0.1"
                value={sharpenSigma}
                onChange={e => setSharpenSigma(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Clarity & Micro-Contrast</span>
                <span className="font-mono text-brand-500">{clarity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={clarity}
                onChange={e => setClarity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Color Vibrance Boost</span>
                <span className="font-mono text-brand-500">{colorVibrance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={colorVibrance}
                onChange={e => setColorVibrance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Noise Reduction Pre-Filter</span>
                <span className="font-mono text-brand-500">{noiseReduction}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={noiseReduction}
                onChange={e => setNoiseReduction(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-dark-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer" htmlFor="faceEnhance">
                  Face & Skin Tone Enhancement
                </label>
                <input
                  type="checkbox"
                  id="faceEnhance"
                  checked={faceEnhancement}
                  onChange={e => setFaceEnhancement(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {faceEnhancement && (
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Skin Smoothing & Glow</span>
                    <span className="font-mono text-brand-500">{faceIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={faceIntensity}
                    onChange={e => setFaceIntensity(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status message */}
          {providerMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{providerMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
