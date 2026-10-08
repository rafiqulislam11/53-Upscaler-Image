import React from 'react';
import { X, LayoutDashboard, Maximize2, Palette, Sparkles, Eye, History, Settings, Info } from 'lucide-react';
import { NavView } from './Sidebar';
import { TOOLS } from '../../registry/toolRegistry';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: NavView;
  onSelectView: (view: NavView) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView
}) => {
  if (!isOpen) return null;

  const handleSelect = (view: NavView) => {
    onSelectView(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-72 max-w-[85%] bg-white dark:bg-dark-900 h-full p-4 flex flex-col justify-between shadow-2xl z-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-dark-800">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Studio Navigation</span>
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleSelect('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                currentView === 'dashboard' ? 'bg-brand-500 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  currentView === t.id ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{t.id === 'upscale' ? <Maximize2 className="w-4 h-4" /> : t.id === 'gradient' ? <Palette className="w-4 h-4" /> : t.id === 'noise' ? <Sparkles className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-dark-800 space-y-1">
            <button
              onClick={() => handleSelect('history')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${
                currentView === 'history' ? 'font-bold text-brand-500' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Image History</span>
            </button>
            <button
              onClick={() => handleSelect('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${
                currentView === 'settings' ? 'font-bold text-brand-500' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => handleSelect('about')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${
                currentView === 'about' ? 'font-bold text-brand-500' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
