import React, { useState } from 'react';
import { Sparkles, Dices, Sliders, Shield, Film, Flame } from 'lucide-react';
import { ImageMetadata, NoiseOptions, NoiseType, FilmStock, GrainBlendMode } from '@shared/types';
import { BeforeAfterComparison } from '../common/BeforeAfterComparison';
import { CommonControls } from '../common/CommonControls';
import { UniversalImageUploader } from '../common/UniversalImageUploader';
import { ApiService } from '../../services/api.service';

const NOISE_TYPES: { id: NoiseType; label: string; desc: string }[] = [
  { id: 'film-grain', label: 'Kodak 35mm', desc: 'Organic analog grain' },
  { id: 'fine', label: 'Fine Silk', desc: 'Subtle micro texture' },
  { id: 'medium', label: 'Medium Grain', desc: 'Balanced photo grain' },
  { id: 'heavy', label: 'Heavy Grit', desc: 'Raw retro grain' },
  { id: 'monochrome', label: 'Monochrome', desc: 'Silver halide B&W' },
  { id: 'color', label: 'Color Noise', desc: 'RGB chromatic noise' },
  { id: 'digital', label: 'Digital ISO', desc: 'High-ISO sensor noise' },
  { id: 'texture', label: 'Texture Grain', desc: 'Canvas tactile grit' }
];

interface NoiseWorkspaceProps {
  currentImage: ImageMetadata | null;
  onImageUploaded: (img: ImageMetadata) => void;
  onImageRemoved: () => void;
  onOpenExport: (filename: string, defaultName: string) => void;
  onAddToHistory: (item: any) => void;
}

export const NoiseWorkspace: React.FC<NoiseWorkspaceProps> = ({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  onOpenExport,
  onAddToHistory
}) => {
  // 100% Customizable Noise State
  const [noiseType, setNoiseType] = useState<NoiseType>('film-grain');
  const [filmStock, setFilmStock] = useState<FilmStock>('kodak-tri-x');
  const [grainBlendMode, setGrainBlendMode] = useState<GrainBlendMode>('overlay');

  const [amount, setAmount] = useState(40);
  const [grainSize, setGrainSize] = useState(1.5);
  const [intensity, setIntensity] = useState(70);
  const [contrast, setContrast] = useState(50);
  const [roughness, setRoughness] = useState(50);
  const [opacity, setOpacity] = useState(85);
  const [colorVariation, setColorVariation] = useState(30);

  // Granular Tonal Weights
  const [shadowGrain, setShadowGrain] = useState(50);
  const [midtonesGrain, setMidtonesGrain] = useState(75);
  const [highlightGrain, setHighlightGrain] = useState(25);
  const [dustAndScratches, setDustAndScratches] = useState(10);

  const [preserveOriginalColors, setPreserveOriginalColors] = useState(true);
  const [seed, setSeed] = useState(12345);
  const [ppi, setPpi] = useState<number>(300);

  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedFilename, setProcessedFilename] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Undo/Redo stack
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleApply = async () => {
    if (!currentImage) return;

    try {
      setIsProcessing(true);

      const options: NoiseOptions = {
        noiseType,
        filmStock,
        amount,
        grainSize,
        intensity,
        contrast,
        roughness,
        opacity,
        colorVariation,
        shadowGrain,
        midtonesGrain,
        highlightGrain,
        dustAndScratches,
        grainBlendMode,
        preserveOriginalColors,
        previewQuality: 'high',
        seed,
        ppi
      };

      const res = await ApiService.applyNoise(currentImage.filename, options);
      const resultData = res.data;

      setProcessedUrl(resultData.outputUrl);
      setProcessedFilename(resultData.outputFilename);

      // Save state snapshot
      const snapshot = { noiseType, amount, grainSize, intensity, opacity, ppi, seed, processedUrl: resultData.outputUrl };
      setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), snapshot]);
      setHistoryIndex(prev => prev + 1);

      onAddToHistory({
        tool: 'noise',
        toolName: 'Noise / Film Grain',
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
      alert(err.message || 'Noise processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRandomize = () => {
    const newSeed = Math.floor(Math.random() * 999999);
    setSeed(newSeed);
    setTimeout(handleApply, 50);
  };

  const handleReset = () => {
    setNoiseType('film-grain');
    setFilmStock('kodak-tri-x');
    setGrainBlendMode('overlay');
    setAmount(40);
    setGrainSize(1.5);
    setIntensity(70);
    setContrast(50);
    setRoughness(50);
    setOpacity(85);
    setShadowGrain(50);
    setMidtonesGrain(75);
    setHighlightGrain(25);
    setDustAndScratches(10);
    setPreserveOriginalColors(true);
    setPpi(300);
    setProcessedUrl(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setNoiseType(prev.noiseType);
      setAmount(prev.amount);
      setGrainSize(prev.grainSize);
      setProcessedUrl(prev.processedUrl);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setNoiseType(next.noiseType);
      setAmount(next.amount);
      setGrainSize(next.grainSize);
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
            <span>Noise / Film Grain</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              100% CUSTOMIZABLE
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Granular shadows/midtones/highlights weighting, film stock emulsions, dust specks, and 72-600 PPI density.
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
                originalLabel="Clean Image"
                processedLabel={`Grain (${noiseType})`}
                aspectRatio={currentImage.aspectRatio}
                ppi={ppi}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-[360px] bg-white dark:bg-dark-850 rounded-2xl border border-dashed border-slate-300 dark:border-dark-700 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-10 h-10 text-amber-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Upload image to apply film grain
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
              onDownload={() => onOpenExport(processedFilename || currentImage.filename, `${currentImage.originalName.replace(/\.[^/.]+$/, '')}_grain`)}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Right Column: 100% Customizable Noise Controls */}
        <div className="lg:col-span-4 flex flex-col space-y-4 bg-white dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-xs overflow-y-auto">
          {/* Section 1: Noise Profiles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Grain Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              {NOISE_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNoiseType(t.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    noiseType === t.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800'
                  }`}
                >
                  <div className="text-xs">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Film Stock Emulsion Simulation */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Film Stock
              </label>
              <select
                value={filmStock}
                onChange={e => setFilmStock(e.target.value as FilmStock)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="kodak-tri-x">Kodak Tri-X 400</option>
                <option value="ilford-hp5">Ilford HP5 Plus</option>
                <option value="fuji-superia">Fuji Superia 400</option>
                <option value="polaroid-600">Polaroid 600</option>
                <option value="digital-iso">Digital ISO 6400</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Blend Mode
              </label>
              <select
                value={grainBlendMode}
                onChange={e => setGrainBlendMode(e.target.value as GrainBlendMode)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
                <option value="screen">Screen</option>
                <option value="multiply">Multiply</option>
                <option value="hard-light">Hard Light</option>
              </select>
            </div>
          </div>

          {/* Seed Input & Randomize */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 block font-mono">Pattern Seed</label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(Number(e.target.value))}
                className="w-full px-2 py-0.5 text-xs font-mono rounded bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700"
              />
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Randomize</span>
            </button>
          </div>

          {/* Section 3: Granular Tonal Weightings */}
          <div className="p-3 bg-slate-50 dark:bg-dark-800 rounded-xl space-y-2 border border-slate-200 dark:border-dark-700">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
              Tonal Grain Distribution
            </span>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                <span>Shadows Weight</span>
                <span className="font-mono text-amber-500">{shadowGrain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shadowGrain}
                onChange={e => setShadowGrain(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                <span>Midtones Focus (Kodak Curve)</span>
                <span className="font-mono text-amber-500">{midtonesGrain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={midtonesGrain}
                onChange={e => setMidtonesGrain(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                <span>Highlights Grain</span>
                <span className="font-mono text-amber-500">{highlightGrain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={highlightGrain}
                onChange={e => setHighlightGrain(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-dark-700 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Section 4: Core Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-dark-800">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Grain Amount</span>
                <span className="font-mono text-amber-500">{amount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Particle Size</span>
                <span className="font-mono text-amber-500">{grainSize.toFixed(1)} px</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={grainSize}
                onChange={e => setGrainSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Intensity & Contrast</span>
                <span className="font-mono text-amber-500">{intensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Analog Dust & Imperfections</span>
                <span className="font-mono text-amber-500">{dustAndScratches}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={dustAndScratches}
                onChange={e => setDustAndScratches(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Grain Opacity</span>
                <span className="font-mono text-amber-500">{opacity}%</span>
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

            {/* Preserve Original Colors Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer" htmlFor="preserveColors">
                Preserve Original Color Fidelity
              </label>
              <input
                type="checkbox"
                id="preserveColors"
                checked={preserveOriginalColors}
                onChange={e => setPreserveOriginalColors(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
