import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Sidebar,
} from 'lucide-react';
import './Controls.css';

export function Controls({
  activePage,
  setActivePage,
  numPages,
  zoomScale,
  setZoomScale,
  isDoublePage,
  setIsDoublePage,
  toggleSidebar,
  showSidebar,
  flipRef,          // ref to PageFlip's handleFlip — keeps animation in sync
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);

  // ── Keyboard zoom shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === '=') { e.preventDefault(); setZoomScale((z) => Math.min(2, z + 0.15)); }
      else if (e.ctrlKey && e.key === '-') { e.preventDefault(); setZoomScale((z) => Math.max(0.5, z - 0.15)); }
      else if (e.ctrlKey && e.key === '0') { e.preventDefault(); setZoomScale(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setZoomScale]);

  // ── Autoplay ──
  useEffect(() => {
    if (!isAutoplay) return;
    const id = setInterval(() => {
      // Use flipRef so we get the animation
      if (flipRef?.current) {
        flipRef.current('next');
      }
    }, 4500);
    return () => clearInterval(id);
  }, [isAutoplay, flipRef]);

  // Stop autoplay when we reach the last page
  useEffect(() => {
    if (activePage >= numPages) setIsAutoplay(false);
  }, [activePage, numPages]);

  // ── Fullscreen ──
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  // ── Navigation via flipRef so animation always fires ──
  const handlePrev = () => {
    if (flipRef?.current) flipRef.current('prev');
  };

  const handleNext = () => {
    if (flipRef?.current) flipRef.current('next');
  };

  // ── Slider scrub (no animation — just jump) ──
  const handleSlider = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isDoublePage && val > 1 && val % 2 !== 0) val = val - 1;
    setActivePage(val);
  };

  return (
    <div className="controls-hud-wrapper">

      {/* Progress slider */}
      <div className="hud-slider-section">
        <span className="slider-label">1</span>
        <input
          type="range"
          min="1"
          max={numPages}
          value={activePage}
          onChange={handleSlider}
          className="hud-slider-bar"
        />
        <span className="slider-label">{numPages}</span>
      </div>

      {/* Button row */}
      <div className="hud-buttons-row">

        {/* Left group: sidebar + view toggle */}
        <div className="hud-group group-left">
          <button
            className={`hud-btn ${showSidebar ? 'active' : ''}`}
            onClick={toggleSidebar}
            title="Toggle Sidebar"
          >
            <Sidebar size={18} />
          </button>
          <button
            className={`hud-btn ${isDoublePage ? 'active' : ''}`}
            onClick={() => setIsDoublePage((v) => !v)}
            title={isDoublePage ? 'Switch to Single Page' : 'Switch to Double Page'}
          >
            {isDoublePage ? <BookOpen size={18} /> : <Layers size={18} />}
          </button>
        </div>

        {/* Center group: nav + page display + autoplay */}
        <div className="hud-group group-center">
          <button
            className="hud-btn arrow-btn"
            onClick={handlePrev}
            disabled={activePage <= 1}
            title="Previous Page"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="hud-page-indicator">
            <span className="current-page">
              {isDoublePage && activePage > 1 && activePage < numPages
                ? `${activePage}–${Math.min(activePage + 1, numPages)}`
                : activePage}
            </span>
            <span className="divider">/</span>
            <span className="total-pages">{numPages}</span>
          </div>

          <button
            className="hud-btn arrow-btn"
            onClick={handleNext}
            disabled={activePage >= numPages}
            title="Next Page"
          >
            <ChevronRight size={20} />
          </button>

          <button
            className={`hud-btn autoplay-btn ${isAutoplay ? 'autoplay-active' : ''}`}
            onClick={() => setIsAutoplay((v) => !v)}
            title={isAutoplay ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isAutoplay ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>

        {/* Right group: zoom + fullscreen */}
        <div className="hud-group group-right">
          <div className="zoom-controls-subgroup">
            <button
              className="hud-btn zoom-btn"
              onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.1))}
              disabled={zoomScale <= 0.5}
              title="Zoom Out (Ctrl −)"
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-percentage">{Math.round(zoomScale * 100)}%</span>
            <button
              className="hud-btn zoom-btn"
              onClick={() => setZoomScale((z) => Math.min(2.0, z + 0.1))}
              disabled={zoomScale >= 2.0}
              title="Zoom In (Ctrl +)"
            >
              <ZoomIn size={16} />
            </button>
            {zoomScale !== 1 && (
              <button
                className="hud-btn reset-zoom-btn"
                onClick={() => setZoomScale(1)}
                title="Reset Zoom (Ctrl 0)"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <button
            className="hud-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

      </div>
    </div>
  );
}
