import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Columns, SplitSquareVertical } from 'lucide-react';

interface BeforeAfterComparisonProps {
  originalUrl: string;
  processedUrl: string | null;
  originalLabel?: string;
  processedLabel?: string;
  aspectRatio?: number;
  ppi?: number;
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  originalUrl,
  processedUrl,
  originalLabel = 'Original',
  processedLabel = 'Processed',
  aspectRatio = 1,
  ppi = 72
}) => {
  const currentProcessed = processedUrl || originalUrl;
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomImgRef = useRef<HTMLImageElement>(null);

  const updateImgDimensions = useCallback(() => {
    if (bottomImgRef.current) {
      const rect = bottomImgRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setImgDimensions({
          width: bottomImgRef.current.clientWidth,
          height: bottomImgRef.current.clientHeight
        });
      }
    }
  }, []);

  useEffect(() => {
    updateImgDimensions();
    window.addEventListener('resize', updateImgDimensions);
    return () => window.removeEventListener('resize', updateImgDimensions);
  }, [updateImgDimensions, currentProcessed, originalUrl]);

  // Reset zoom & pan
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPosition(50);
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.25, 0.4));
  const handleZoomActual = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 4.0));
  };

  // Slider Dragging
  const handleSliderMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDraggingSlider && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const offsetX = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
        setSliderPosition(percent);
      } else if (isPanning) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setPan({
          x: clientX - panStartRef.current.x,
          y: clientY - panStartRef.current.y
        });
      }
    };

    const handleUp = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingSlider, isPanning]);

  // Pan Canvas
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-100 dark:bg-dark-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-700 shadow-inner">
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 shadow-sm pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              viewMode === 'slider'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750'
            }`}
            title="Comparison Slider"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sideBySide')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              viewMode === 'sideBySide'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-750'
            }`}
            title="Side by Side"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Side by Side</span>
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 shadow-sm pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 px-1 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomActual}
            className="px-2 py-1 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
            title="100% Actual Size"
          >
            1:1
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
            title="Fit to Screen / Reset"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div
        ref={containerRef}
        onMouseDown={handlePanStart}
        onWheel={handleWheel}
        className="flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none relative p-6"
      >
        <div
          className="transition-transform duration-75 relative bg-transparency-grid rounded-lg shadow-2xl overflow-hidden max-w-full max-h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {viewMode === 'slider' ? (
            /* COMPARISON SLIDER MODE */
            <div className="relative select-none flex items-center justify-center">
              {/* Bottom Processed Image */}
              <img
                ref={bottomImgRef}
                src={currentProcessed}
                alt="Processed Result"
                onLoad={updateImgDimensions}
                className="max-h-[70vh] w-auto object-contain block pointer-events-none"
              />

              {/* Clipped Top Original Image */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={originalUrl}
                  alt="Original Master"
                  className="max-h-[70vh] w-auto max-w-none object-contain block"
                  style={
                    imgDimensions
                      ? { width: imgDimensions.width, height: imgDimensions.height }
                      : undefined
                  }
                />
                <div className="absolute top-4 left-4 bg-black/70 text-white backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider font-semibold border border-white/20">
                  {originalLabel}
                </div>
              </div>

              {/* Floating Processed Label */}
              <div className="absolute top-4 right-4 bg-brand-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider font-semibold border border-brand-400/40 pointer-events-none">
                {processedLabel}
              </div>

              {/* Interactive Divider Line */}
              <div
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleSliderMouseDown}
                className="absolute top-0 bottom-0 z-20 w-1 bg-brand-400 cursor-ew-resize flex items-center justify-center group pointer-events-auto"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-8 h-8 rounded-full bg-dark-900 border-2 border-brand-400 text-brand-300 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <SplitSquareVertical className="w-4 h-4" />
                </div>
              </div>
            </div>
          ) : (
            /* SIDE BY SIDE MODE */
            <div className="flex items-center gap-4 p-2">
              <div className="relative flex flex-col items-center">
                <span className="absolute top-3 left-3 bg-black/70 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold z-10">
                  {originalLabel}
                </span>
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-[65vh] w-auto object-contain rounded-md"
                />
              </div>
              <div className="relative flex flex-col items-center">
                <span className="absolute top-3 left-3 bg-brand-600 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold z-10">
                  {processedLabel}
                </span>
                <img
                  src={currentProcessed}
                  alt="Processed"
                  className="max-h-[65vh] w-auto object-contain rounded-md"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status bar */}
      <div className="px-4 py-2 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-dark-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
        <div>
          <span>Drag canvas to pan • Scroll to zoom • Drag vertical line to compare</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-brand-500 font-bold">{ppi} PPI</span>
          <span>•</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
