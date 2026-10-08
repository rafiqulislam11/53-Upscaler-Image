import React from 'react';
import { Sun, Moon, Layers, Menu, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { ImageMetadata } from '@shared/types';

interface HeaderProps {
  onSelectSample: (samplePath: string, name: string) => void;
  onOpenQueue: () => void;
  onToggleMobileNav: () => void;
  queueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onOpenQueue,
  onToggleMobileNav,
  queueCount
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between z-30 transition-colors">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Image Processing <span className="text-brand-500">Studio</span>
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Upscale • Gradient • Grain • Blur
            </p>
          </div>
        </div>
      </div>

      {/* Center Samples Picker */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Samples:
        </span>
        <button
          type="button"
          onClick={() => onSelectSample('/samples/cyberpunk.jpg', 'cyberpunk.jpg')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          🌆 Cyberpunk
        </button>
        <button
          type="button"
          onClick={() => onSelectSample('/samples/portrait.jpg', 'portrait.jpg')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          👤 Portrait
        </button>
        <button
          type="button"
          onClick={() => onSelectSample('/samples/nature.jpg', 'nature.jpg')}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          🏔️ Nature
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Queue button */}
        <button
          type="button"
          onClick={onOpenQueue}
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          title="Processing Queue"
        >
          <Layers className="w-5 h-5" />
          {queueCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {queueCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
