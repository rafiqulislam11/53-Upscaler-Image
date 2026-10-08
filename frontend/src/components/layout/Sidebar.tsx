import React from 'react';
import {
  LayoutDashboard,
  Maximize2,
  Palette,
  Sparkles,
  Eye,
  History,
  Settings,
  Info
} from 'lucide-react';
import { ToolId } from '@shared/types';
import { TOOLS } from '../../registry/toolRegistry';

export type NavView = 'dashboard' | ToolId | 'history' | 'settings' | 'about';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const getToolIcon = (id: ToolId) => {
    switch (id) {
      case 'upscale': return <Maximize2 className="w-4 h-4" />;
      case 'gradient': return <Palette className="w-4 h-4" />;
      case 'noise': return <Sparkles className="w-4 h-4" />;
      case 'blur': return <Eye className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 flex flex-col justify-between p-4 flex-shrink-0 transition-colors">
      <div className="space-y-6">
        {/* Main Dashboard Link */}
        <div>
          <button
            type="button"
            onClick={() => onSelectView('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'dashboard'
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* 4 Core Tools Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            Image Studio Tools
          </div>
          <div className="space-y-1">
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectView(tool.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === tool.id
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={currentView === tool.id ? 'text-brand-500' : 'text-slate-400'}>
                    {getToolIcon(tool.id)}
                  </span>
                  <span>{tool.name}</span>
                </div>
                {tool.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400">
                    {tool.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Management */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            System
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectView('history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                currentView === 'history'
                  ? 'bg-slate-100 dark:bg-dark-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Image History</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                currentView === 'settings'
                  ? 'bg-slate-100 dark:bg-dark-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('about')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                currentView === 'about'
                  ? 'bg-slate-100 dark:bg-dark-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pro Badge */}
      <div className="p-3 bg-gradient-to-br from-brand-50 to-accent-cyan/10 dark:from-dark-850 dark:to-dark-800 border border-brand-100 dark:border-dark-700 rounded-xl text-center">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Print Ready Engine
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
          72 to 300 PPI Metadata
        </p>
      </div>
    </aside>
  );
};
