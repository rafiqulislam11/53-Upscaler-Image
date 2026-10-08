import React from 'react';
import { Info, Code, Cpu, ShieldCheck, Printer, Sparkles, Layers } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="pb-3 border-b border-slate-200 dark:border-dark-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-brand-500" />
          <span>About Image Processing Studio</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Professional 4-in-1 modular architecture for modern web and print graphics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Upscale Provider Abstraction
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Designed with an <code className="text-brand-500 font-mono">UpscaleProvider</code> interface separating local Sharp Lanczos3 kernels from external Neural AI APIs (Real-ESRGAN / Replicate). If no API key is specified, the application uses local high-quality upscaling with complete transparency.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            72 to 300 PPI Print Density Embedding
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Embeds exact pixels-per-inch (PPI/DPI) metadata headers into PNG, JPEG, WebP, and TIFF files. Essential for commercial print shops, gallery archival prints, and high-DPI retina rendering.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Modular Tool Registry
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tools are decoupled through a central <code className="text-purple-500 font-mono">toolRegistry.ts</code>. Additional modules such as Background Remover, Vectorizer, Frosted Glass, or Sharpen can be plugged in without refactoring the application shell.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Analog Film Physics & Optical Blur
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Noise module incorporates authentic parabolic midtone grain curves modeled after Kodak Tri-X silver halide emulsion. Blur engine supports Gaussian, directional velocity angle, radial spin, and manual brush subject masking.
          </p>
        </div>
      </div>
    </div>
  );
};
