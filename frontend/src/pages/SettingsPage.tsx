import React, { useState } from 'react';
import { Settings, Moon, Sun, Save, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { ExportFormat } from '@shared/types';

export const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [defaultFormat, setDefaultFormat] = useState<ExportFormat>('png');
  const [defaultPPI, setDefaultPPI] = useState<number>(300);
  const [previewQuality, setPreviewQuality] = useState<'fast' | 'high'>('high');
  const [autoCleanup, setAutoCleanup] = useState(true);

  // AI Provider settings
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [aiModel, setAiModel] = useState('real-esrgan-4x-plus');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ips_default_format', defaultFormat);
    localStorage.setItem('ips_default_ppi', String(defaultPPI));
    localStorage.setItem('ips_preview_quality', previewQuality);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div className="pb-3 border-b border-slate-200 dark:border-dark-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-500" />
          <span>Studio Settings & Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize export preferences, default PPI print density, and AI super-resolution endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Appearance Card */}
        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
            Appearance & Interface
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Theme Mode</span>
              <span className="text-[11px] text-slate-400">Switch between sleek Dark Mode and Clean Light Mode</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-dark-700 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>

        {/* Export & Print Density Defaults */}
        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
            Default Export & PPI Standards
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Default Format
              </label>
              <select
                value={defaultFormat}
                onChange={e => setDefaultFormat(e.target.value as ExportFormat)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="png">PNG (Lossless High-Res)</option>
                <option value="jpeg">JPEG (Compressed Photo)</option>
                <option value="webp">WebP (Modern Web)</option>
                <option value="tiff">TIFF (Archival Print)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Default Print Density (PPI / DPI)
              </label>
              <select
                value={defaultPPI}
                onChange={e => setDefaultPPI(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-medium font-mono"
              >
                <option value={72}>72 PPI (Screen / Web Standard)</option>
                <option value={150}>150 PPI (Medium Print)</option>
                <option value={300}>300 PPI (Commercial Ultra HD Print)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Automatic Storage Cleanup
              </span>
              <span className="text-[11px] text-slate-400">
                Purge processed temporary server cache files after 24 hours
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoCleanup}
              onChange={e => setAutoCleanup(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
          </div>
        </div>

        {/* AI Provider Configuration */}
        <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                AI Super-Resolution Provider
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {aiApiKey ? 'CONFIGURED' : 'LOCAL FALLBACK ACTIVE'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            When no external API key is configured, Image Processing Studio automatically utilizes the high-performance local Lanczos3 + Unsharp Masking engine without breaking.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                API Endpoint URL (Optional)
              </label>
              <input
                type="url"
                value={aiEndpoint}
                onChange={e => setAiEndpoint(e.target.value)}
                placeholder="https://api.replicate.com/v1/predictions or custom server"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                API Key (Optional)
              </label>
              <input
                type="password"
                value={aiApiKey}
                onChange={e => setAiApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </div>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
