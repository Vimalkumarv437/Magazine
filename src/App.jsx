import { useState, useEffect } from 'react';
import { usePDF } from './hooks/usePDF';
import { PageFlip } from './components/PageFlip';
import { Controls } from './components/Controls';
import { Thumbnails } from './components/Thumbnails';
import { Sparkles, HelpCircle, X, Loader2, AlertCircle } from 'lucide-react';
import './App.css';

function App() {
  // 1. Core PDF Hook initialization
  const {
    pdfDoc,
    numPages,
    loadingDoc,
    docError,
    maxAllowedPages,
    pageCache,
    renderingPages,
    loadNextBatch,
    renderPageToCache,
    preloadPages,
  } = usePDF('/MAGAZINE 2025-2026.pdf');

  // 2. View states
  const [activePage, setActivePage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDoublePage, setIsDoublePage] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 3. Smart device responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 900) {
        setIsDoublePage(false);
        setShowSidebar(false);
      } else {
        setIsDoublePage(true);
        setShowSidebar(true);
      }
    };

    handleResize(); // Run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. Fullscreen Loader state
  if (loadingDoc) {
    return (
      <div className="fullscreen-loader-wrapper">
        <div className="loader-glow-circle">
          <div className="loader-inner-core">
            <Loader2 className="loader-spinner-item animate-spin" size={40} />
          </div>
        </div>
        <h2 className="loader-title">Magazine 2025-2026</h2>
        <span className="loader-subtitle">Preparing Premium Magazine Viewer...</span>
      </div>
    );
  }

  // 5. Document Loading Error panel
  if (docError) {
    return (
      <div className="fullscreen-loader-wrapper">
        <div className="glass-panel magazine-error-panel">
          <AlertCircle size={48} className="text-rose-500" />
          <h2 className="error-title">Failed to load Magazine</h2>
          <p className="error-desc">
            {docError}. Please verify that the PDF file is in the public folder and matches the correct filename.
          </p>
          <button className="error-retry-btn" onClick={() => window.location.reload()}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main-layout">
      {/* Immersive Designer Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-glow">
            <Sparkles size={16} />
          </div>
          <span className="brand-title">Magazine</span>
          <span className="brand-edition-badge">2025 - 2026 Edition</span>
        </div>

        <div className="header-status-text">
          <div className="status-dot" />
          <span>Range Reading Active • Incremental Buffering</span>
        </div>

        <div className="brand-section" style={{ gap: '16px' }}>
          <button
            className="header-action-button"
            onClick={() => setIsHelpOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <HelpCircle size={14} />
            <span>Shortcuts</span>
          </button>
        </div>
      </header>

      {/* Main Core Layout */}
      <div className="app-body-container">
        {/* Navigation Sidebar Panel */}
        <aside className={`sidebar-pane ${!showSidebar ? 'sidebar-closed' : ''}`}>
          <Thumbnails
            numPages={numPages}
            pageCache={pageCache}
            renderingPages={renderingPages}
            renderPageToCache={renderPageToCache}
            activePage={activePage}
            setActivePage={setActivePage}
            maxAllowedPages={maxAllowedPages}
            loadNextBatch={loadNextBatch}
          />
        </aside>

        {/* Immersive Magazine Viewport */}
        <main className="magazine-pane">
          {/* Fully Unlocked celebration banner */}
          {maxAllowedPages === numPages && (
            <div className="premium-magazine-success-badge">
              <Sparkles size={14} className="animate-bounce" />
              <span>Full Issue Unlocked</span>
            </div>
          )}

          {/* Core PageFlip Canvas */}
          <PageFlip
            numPages={numPages}
            pageCache={pageCache}
            renderingPages={renderingPages}
            renderPageToCache={renderPageToCache}
            preloadPages={preloadPages}
            activePage={activePage}
            setActivePage={setActivePage}
            zoomScale={zoomScale}
            isDoublePage={isDoublePage}
          />

          {/* Floating Control HUD */}
          <Controls
            activePage={activePage}
            setActivePage={setActivePage}
            numPages={numPages}
            maxAllowedPages={maxAllowedPages}
            loadNextBatch={loadNextBatch}
            zoomScale={zoomScale}
            setZoomScale={setZoomScale}
            isDoublePage={isDoublePage}
            setIsDoublePage={setIsDoublePage}
            toggleSidebar={() => setShowSidebar(!showSidebar)}
            showSidebar={showSidebar}
          />
        </main>
      </div>

      {/* Interactive Keyboard Shortcuts Modal Overlay */}
      {isHelpOpen && (
        <div className="hud-modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="glass-panel hud-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Keyboard Shortcuts</h3>
              <button className="modal-close-btn" onClick={() => setIsHelpOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="help-modal-body">
              <p>
                Navigate your magazine like a pro! Use these responsive keyboard hotkeys to read quickly:
              </p>
              <div className="shortcuts-grid">
                <kbd className="shortcut-kbd">Right Arrow</kbd>
                <span className="shortcut-desc">Flip to next page</span>

                <kbd className="shortcut-kbd">Left Arrow</kbd>
                <span className="shortcut-desc">Flip to previous page</span>

                <kbd className="shortcut-kbd">Ctrl +</kbd>
                <span className="shortcut-desc">Zoom In (+15%)</span>

                <kbd className="shortcut-kbd">Ctrl -</kbd>
                <span className="shortcut-desc">Zoom Out (-15%)</span>

                <kbd className="shortcut-kbd">Ctrl 0</kbd>
                <span className="shortcut-desc">Reset zoom to 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
