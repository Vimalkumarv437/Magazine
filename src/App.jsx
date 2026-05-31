import { useState, useEffect, useRef } from 'react';
import { useImageMagazine } from './hooks/useImageMagazine';
import { PageFlip } from './components/PageFlip';
import { Controls } from './components/Controls';
import { Thumbnails } from './components/Thumbnails';
import { Sparkles, HelpCircle, X } from 'lucide-react';
import './App.css';

function App() {
  // Image-based magazine (no PDF.js needed)
  const { numPages, getPageImageUrl } = useImageMagazine();

  // View state
  const [activePage, setActivePage]   = useState(1);
  const [zoomScale, setZoomScale]     = useState(1);
  const [isDoublePage, setIsDoublePage] = useState(true);
  const [showSidebar, setShowSidebar]  = useState(true);
  const [isHelpOpen, setIsHelpOpen]    = useState(false);

  // Ref exposed by PageFlip so Controls HUD can fire the flip animation directly
  const flipRef = useRef(null);

  // Responsive: switch between double-page (desktop) and single-page (mobile)
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsDoublePage(w >= 900);
      setShowSidebar(w >= 900);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-main-layout">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-glow"><Sparkles size={16} /></div>
          <span className="brand-title">Magazine</span>
          <span className="brand-edition-badge">2025 – 2026 Edition</span>
        </div>

        <div className="header-status-text">
          <div className="status-dot" />
          <span>Image Viewer • {numPages} Pages</span>
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

      {/* ── Main body ── */}
      <div className="app-body-container">

        {/* Sidebar */}
        <aside className={`sidebar-pane ${!showSidebar ? 'sidebar-closed' : ''}`}>
          <Thumbnails
            numPages={numPages}
            getPageImageUrl={getPageImageUrl}
            activePage={activePage}
            setActivePage={setActivePage}
            isDoublePage={isDoublePage}
          />
        </aside>

        {/* Magazine viewport */}
        <main className="magazine-pane">
          <PageFlip
            numPages={numPages}
            activePage={activePage}
            setActivePage={setActivePage}
            isDoublePage={isDoublePage}
            zoomScale={zoomScale}
            flipRef={flipRef}
          />

          {/* Controls HUD */}
          <Controls
            activePage={activePage}
            setActivePage={setActivePage}
            numPages={numPages}
            zoomScale={zoomScale}
            setZoomScale={setZoomScale}
            isDoublePage={isDoublePage}
            setIsDoublePage={setIsDoublePage}
            toggleSidebar={() => setShowSidebar((v) => !v)}
            showSidebar={showSidebar}
            flipRef={flipRef}
          />
        </main>
      </div>

      {/* ── Keyboard Shortcuts Modal ── */}
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
              <p>Navigate your magazine like a pro!</p>
              <div className="shortcuts-grid">
                <kbd className="shortcut-kbd">→  Right Arrow</kbd>
                <span className="shortcut-desc">Flip to next page</span>

                <kbd className="shortcut-kbd">←  Left Arrow</kbd>
                <span className="shortcut-desc">Flip to previous page</span>

                <kbd className="shortcut-kbd">Ctrl +</kbd>
                <span className="shortcut-desc">Zoom in</span>

                <kbd className="shortcut-kbd">Ctrl −</kbd>
                <span className="shortcut-desc">Zoom out</span>

                <kbd className="shortcut-kbd">Ctrl 0</kbd>
                <span className="shortcut-desc">Reset zoom</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
