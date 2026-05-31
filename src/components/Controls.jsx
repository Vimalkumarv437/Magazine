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
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Sidebar
} from 'lucide-react';
import './Controls.css';

export function Controls({
  activePage,
  setActivePage,
  numPages,
  maxAllowedPages,
  loadNextBatch,
  zoomScale,
  setZoomScale,
  isDoublePage,
  setIsDoublePage,
  toggleSidebar,
  showSidebar,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);

  // Keyboard navigation for zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '=') {
        e.preventDefault();
        setZoomScale((z) => Math.min(2, z + 0.15));
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setZoomScale((z) => Math.max(0.6, z - 0.15));
      } else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setZoomScale]);

  // Autoplay functionality
  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setActivePage((prev) => {
        const step = isDoublePage ? (prev === 1 ? 1 : 2) : 1;
        const next = prev + step;
        if (next <= maxAllowedPages) {
          return next;
        } else {
          // Wrap around or pause
          if (maxAllowedPages === numPages && prev >= numPages - 1) {
            return 1; // start over
          } else if (maxAllowedPages < numPages && prev >= maxAllowedPages - 1) {
            // Trigger batch load and stop autoplay temporarily or pause
            loadNextBatch();
            return prev;
          }
          return prev;
        }
      });
    }, 4500); // Flip every 4.5 seconds

    return () => clearInterval(interval);
  }, [isAutoplay, maxAllowedPages, numPages, isDoublePage, loadNextBatch, setActivePage]);

  // Listen for fullscreen change events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    // Align to even page in double page view to keep layout clean
    if (isDoublePage && val > 1 && val % 2 !== 0) {
      setActivePage(val - 1);
    } else {
      setActivePage(val);
    }
  };

  const handlePrev = () => {
    const step = isDoublePage ? (activePage === 3 ? 2 : 2) : 1;
    setActivePage((p) => Math.max(1, p - (p === 2 ? 1 : step)));
  };

  const handleNext = () => {
    const step = isDoublePage ? (activePage === 1 ? 1 : 2) : 1;
    setActivePage((p) => Math.min(maxAllowedPages, p + step));
  };

  return (
    <div className="controls-hud-wrapper">
      {/* 1. Progress Slider Scrub Bar */}
      <div className="hud-slider-section">
        <span className="slider-label">Page 1</span>
        <input
          type="range"
          min="1"
          max={maxAllowedPages}
          value={activePage}
          onChange={handleSliderChange}
          className="hud-slider-bar"
        />
        <span className="slider-label">Unlocked {maxAllowedPages}</span>
      </div>

      {/* 2. Primary Buttons Controls Row */}
      <div className="hud-buttons-row">
        {/* Left Controls: Sidebar & Views */}
        <div className="hud-group group-left">
          <button
            className={`hud-btn ${showSidebar ? 'active' : ''}`}
            onClick={toggleSidebar}
            title="Toggle Sidebar Table of Contents"
          >
            <Sidebar size={18} />
          </button>
          
          <button
            className={`hud-btn ${isDoublePage ? 'active' : ''}`}
            onClick={() => setIsDoublePage(!isDoublePage)}
            title={isDoublePage ? "Switch to Single Page View" : "Switch to Double Page View"}
          >
            {isDoublePage ? <BookOpen size={18} /> : <Layers size={18} />}
          </button>
        </div>

        {/* Center Controls: Navigation & Autoplay */}
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
                ? `${activePage}-${Math.min(activePage + 1, numPages)}`
                : activePage}
            </span>
            <span className="divider">/</span>
            <span className="total-pages">{numPages}</span>
          </div>

          <button
            className="hud-btn arrow-btn"
            onClick={handleNext}
            disabled={activePage >= maxAllowedPages}
            title="Next Page"
          >
            <ChevronRight size={20} />
          </button>

          <button
            className={`hud-btn autoplay-btn ${isAutoplay ? 'autoplay-active' : ''}`}
            onClick={() => setIsAutoplay(!isAutoplay)}
            title={isAutoplay ? "Pause Slideshow" : "Play Slideshow"}
          >
            {isAutoplay ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>

        {/* Right Controls: Zoom, Fullscreen & Batch Loader */}
        <div className="hud-group group-right">
          {/* Zoom controls */}
          <div className="zoom-controls-subgroup">
            <button
              className="hud-btn zoom-btn"
              onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.1))}
              disabled={zoomScale <= 0.6}
              title="Zoom Out (Ctrl -)"
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

          {/* Fullscreen */}
          <button
            className="hud-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* 3. Batch Loading / Progression Alert Bar */}
      {maxAllowedPages < numPages && (
        <div className="hud-batch-alert-bar">
          <div className="alert-content">
            <Sparkles size={14} className="gold-text animate-pulse" />
            <span className="batch-status-text">
              Reading batch of {maxAllowedPages} pages. {numPages - maxAllowedPages} pages remaining.
            </span>
          </div>
          <button className="hud-batch-action-btn" onClick={loadNextBatch}>
            Unlock Next 10 Pages
          </button>
        </div>
      )}
    </div>
  );
}
