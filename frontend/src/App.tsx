import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { UpscaleWorkspace } from './components/tools/UpscaleWorkspace';
import { GradientWorkspace } from './components/tools/GradientWorkspace';
import { NoiseWorkspace } from './components/tools/NoiseWorkspace';
import { BlurWorkspace } from './components/tools/BlurWorkspace';
import { ExportModal } from './components/common/ExportModal';
import { ProcessingQueueModal } from './components/common/ProcessingQueueModal';
import { ImageMetadata, ProcessingJob, ToolId } from '@shared/types';
import { useHistory } from './hooks/useHistory';
import { ApiService } from './services/api.service';

export function App() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageMetadata | null>(null);

  // Global Export Modal state
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    sourceFilename: string;
    defaultName: string;
  }>({
    isOpen: false,
    sourceFilename: '',
    defaultName: ''
  });

  // Global Processing Queue state
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueJobs, setQueueJobs] = useState<ProcessingJob[]>([]);

  // History hook
  const { history, addHistoryItem, removeHistoryItem, clearHistory } = useHistory();

  // Load a demo sample
  const handleSelectSample = async (samplePath: string, name: string) => {
    try {
      const response = await fetch(samplePath);
      const blob = await response.blob();
      const file = new File([blob], name, { type: 'image/jpeg' });
      const metadata = await ApiService.uploadImage(file);
      setCurrentImage(metadata);
    } catch (err: any) {
      alert(`Could not load sample image: ${err.message}`);
    }
  };

  const handleOpenExport = (filename: string, defaultName: string) => {
    setExportModalState({
      isOpen: true,
      sourceFilename: filename,
      defaultName
    });
  };

  const handleCloseExport = () => {
    setExportModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleSelectTool = (toolId: ToolId) => {
    setCurrentView(toolId);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-slate-100 font-sans transition-colors">
      {/* Top Header */}
      <Header
        onSelectSample={handleSelectSample}
        onOpenQueue={() => setIsQueueModalOpen(true)}
        onToggleMobileNav={() => setIsMobileNavOpen(true)}
        queueCount={queueJobs.filter(j => j.status === 'processing').length}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex">
          <Sidebar currentView={currentView} onSelectView={setCurrentView} />
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          currentView={currentView}
          onSelectView={setCurrentView}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentView === 'dashboard' && (
            <Dashboard
              onSelectTool={handleSelectTool}
              onSelectSample={handleSelectSample}
            />
          )}

          {currentView === 'upscale' && (
            <UpscaleWorkspace
              currentImage={currentImage}
              onImageUploaded={setCurrentImage}
              onImageRemoved={() => setCurrentImage(null)}
              onOpenExport={handleOpenExport}
              onAddToHistory={addHistoryItem}
            />
          )}

          {currentView === 'gradient' && (
            <GradientWorkspace
              currentImage={currentImage}
              onImageUploaded={setCurrentImage}
              onImageRemoved={() => setCurrentImage(null)}
              onOpenExport={handleOpenExport}
              onAddToHistory={addHistoryItem}
            />
          )}

          {currentView === 'noise' && (
            <NoiseWorkspace
              currentImage={currentImage}
              onImageUploaded={setCurrentImage}
              onImageRemoved={() => setCurrentImage(null)}
              onOpenExport={handleOpenExport}
              onAddToHistory={addHistoryItem}
            />
          )}

          {currentView === 'blur' && (
            <BlurWorkspace
              currentImage={currentImage}
              onImageUploaded={setCurrentImage}
              onImageRemoved={() => setCurrentImage(null)}
              onOpenExport={handleOpenExport}
              onAddToHistory={addHistoryItem}
            />
          )}

          {currentView === 'history' && (
            <HistoryPage
              history={history}
              onClearHistory={clearHistory}
              onRemoveItem={removeHistoryItem}
              onSelectTool={handleSelectTool}
            />
          )}

          {currentView === 'settings' && <SettingsPage />}

          {currentView === 'about' && <AboutPage />}
        </main>
      </div>

      {/* Unified Export Modal Dialog */}
      <ExportModal
        isOpen={exportModalState.isOpen}
        onClose={handleCloseExport}
        sourceFilename={exportModalState.sourceFilename}
        defaultName={exportModalState.defaultName}
      />

      {/* Processing Queue Modal */}
      <ProcessingQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        jobs={queueJobs}
      />
    </div>
  );
}

export default App;
