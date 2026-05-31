import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import './PageFlip.css';

export function PageFlip({
  numPages,
  pageCache,
  renderingPages,
  renderPageToCache,
  preloadPages,
  activePage,
  setActivePage,
  zoomScale = 1,
  isDoublePage = true,
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null); // 'next' or 'prev'
  const [touchStart, setTouchStart] = useState(null);
  const bookContainerRef = useRef(null);

  // Calculate pages in current spread
  // If activePage = 1 (cover), it's on the right in double page mode.
  // Spread: Left = even page (e.g. 2), Right = odd page (e.g. 3)
  const getSpreadPages = useCallback((page) => {
    if (!isDoublePage) {
      return { left: null, right: page };
    }
    if (page === 1) {
      return { left: null, right: 1 };
    }
    const left = page % 2 === 0 ? page : page - 1;
    const right = left + 1 <= numPages ? left + 1 : null;
    return { left, right: left + 1 <= numPages ? right : null };
  }, [isDoublePage, numPages]);

  const { left: currentLeft, right: currentRight } = getSpreadPages(activePage);

  // Trigger page rendering and preloading for current spread
  useEffect(() => {
    const pagesToLoad = [];
    if (currentLeft) pagesToLoad.push(currentLeft);
    if (currentRight) pagesToLoad.push(currentRight);

    pagesToLoad.forEach((p) => {
      if (!pageCache[p]) {
        renderPageToCache(p);
      }
    });

    // Preload next/prev spreads in background for buttery-smooth flips
    if (isDoublePage) {
      const nextLeft = (currentLeft || 2) + 2;
      const prevLeft = (currentLeft || 2) - 2;
      if (nextLeft <= numPages) preloadPages(nextLeft, Math.min(nextLeft + 1, numPages));
      if (prevLeft >= 1) preloadPages(Math.max(1, prevLeft), prevLeft + 1);
    } else {
      if (activePage + 1 <= numPages) preloadPages(activePage + 1, activePage + 2);
      if (activePage - 1 >= 1) preloadPages(Math.max(1, activePage - 2), activePage - 1);
    }
  }, [activePage, currentLeft, currentRight, isDoublePage, numPages, pageCache, renderPageToCache, preloadPages]);

  // Transition handler
  const handlePageTurn = useCallback((direction) => {
    if (isFlipping) return;

    if (direction === 'next') {
      const step = isDoublePage ? (activePage === 1 ? 1 : 2) : 1;
      const nextPage = activePage + step;
      if (nextPage <= numPages) {
        // Ensure new pages are rendering/rendered before we flip
        const { left: nLeft, right: nRight } = getSpreadPages(nextPage);
        if (nLeft && !pageCache[nLeft]) renderPageToCache(nLeft);
        if (nRight && !pageCache[nRight]) renderPageToCache(nRight);

        setFlipDirection('next');
        setIsFlipping(true);
        setTimeout(() => {
          setActivePage(nextPage);
          setIsFlipping(false);
          setFlipDirection(null);
        }, 600); // matches CSS animation duration
      }
    } else if (direction === 'prev') {
      const step = isDoublePage ? (activePage === 3 ? 2 : 2) : 1;
      const prevPage = Math.max(1, activePage - (activePage === 2 ? 1 : step));
      if (prevPage >= 1) {
        const { left: pLeft, right: pRight } = getSpreadPages(prevPage);
        if (pLeft && !pageCache[pLeft]) renderPageToCache(pLeft);
        if (pRight && !pageCache[pRight]) renderPageToCache(pRight);

        setFlipDirection('prev');
        setIsFlipping(true);
        setTimeout(() => {
          setActivePage(prevPage);
          setIsFlipping(false);
          setFlipDirection(null);
        }, 600);
      }
    }
  }, [isFlipping, activePage, numPages, isDoublePage, getSpreadPages, pageCache, renderPageToCache, setActivePage]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handlePageTurn('next');
      } else if (e.key === 'ArrowLeft') {
        handlePageTurn('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePageTurn]);

  // Swipe gesture handling for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      handlePageTurn('next');
      setTouchStart(null);
    } else if (diff < -50) {
      handlePageTurn('prev');
      setTouchStart(null);
    }
  };

  // Render individual page content
  const renderSinglePage = (pageNum, side) => {
    if (!pageNum) return <div className={`page-side empty ${side}`} />;

    const isLoaded = !!pageCache[pageNum];
    const isRendering = !!renderingPages[pageNum];

    return (
      <div className={`page-side ${side} ${isLoaded ? 'loaded' : 'loading'}`}>
        {!isLoaded ? (
          <div className="page-skeleton">
            <div className="skeleton-loader-animation" />
            <Loader2 className="spinner-icon animate-spin" />
            <BookOpen className="book-bg-icon" />
            <span className="loading-text">Rendering Page {pageNum}...</span>
          </div>
        ) : (
          <img
            src={pageCache[pageNum]}
            alt={`Magazine Page ${pageNum}`}
            className="page-image"
            draggable="false"
          />
        )}
        <div className="page-number-overlay">{pageNum}</div>
        {/* Subtle page curl gradient for premium look */}
        <div className={`page-curl-indicator ${side}`} />
      </div>
    );
  };

  // Calculate transition pages during flip
  const getTransitionPages = () => {
    if (flipDirection === 'next') {
      const step = isDoublePage ? (activePage === 1 ? 1 : 2) : 1;
      const nextPage = activePage + step;
      const { left: nLeft, right: nRight } = getSpreadPages(nextPage);
      return {
        flippingFront: currentRight,
        flippingBack: nLeft || nRight,
        underRight: nRight,
        underLeft: currentLeft,
      };
    } else if (flipDirection === 'prev') {
      const step = isDoublePage ? (activePage === 3 ? 2 : 2) : 1;
      const prevPage = Math.max(1, activePage - (activePage === 2 ? 1 : step));
      const { left: pLeft, right: pRight } = getSpreadPages(prevPage);
      return {
        flippingFront: pRight || pLeft,
        flippingBack: currentLeft,
        underRight: currentRight,
        underLeft: pLeft,
      };
    }
    return {};
  };

  const tPages = getTransitionPages();

  return (
    <div className="magazine-outer-container" style={{ transform: `scale(${zoomScale})` }}>
      <div
        className={`book-wrapper ${isDoublePage ? 'double-view' : 'single-view'} ${isFlipping ? 'flipping' : ''
          }`}
        ref={bookContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Previous page arrow anchor */}
        <button
          className={`nav-hotspot left-hotspot ${activePage <= 1 ? 'disabled' : ''}`}
          onClick={() => handlePageTurn('prev')}
          aria-label="Previous Page"
        >
          <ChevronLeft />
        </button>

        <div className="book-3d-canvas">
          {isDoublePage ? (
            /* ================= DOUBLE PAGE SPREAD MODE ================= */
            <>
              {/* Left Side Container */}
              <div className="book-left-container">
                {!isFlipping ? (
                  renderSinglePage(currentLeft, 'left')
                ) : flipDirection === 'next' ? (
                  // When flipping next, the left page is static
                  renderSinglePage(tPages.underLeft, 'left')
                ) : (
                  // When flipping prev, the left side displays the new left page underneath the flip
                  renderSinglePage(tPages.underLeft, 'left')
                )}
              </div>

              {/* Central binding spine */}
              <div className="book-spine" />

              {/* Right Side Container */}
              <div className="book-right-container">
                {!isFlipping ? (
                  renderSinglePage(currentRight, 'right')
                ) : flipDirection === 'next' ? (
                  // When flipping next, the right side displays the new right page underneath the flip
                  renderSinglePage(tPages.underRight, 'right')
                ) : (
                  // When flipping prev, the right page remains static
                  renderSinglePage(tPages.underRight, 'right')
                )}
              </div>

              {/* 3D Flipping Sheet Overlay */}
              {isFlipping && (
                <div
                  className={`flipping-page-sheet ${flipDirection === 'next' ? 'flip-to-left' : 'flip-to-right'
                    }`}
                >
                  <div className="sheet-face sheet-front">
                    {renderSinglePage(tPages.flippingFront, flipDirection === 'next' ? 'right' : 'left')}
                  </div>
                  <div className="sheet-face sheet-back">
                    {renderSinglePage(tPages.flippingBack, flipDirection === 'next' ? 'left' : 'right')}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ================= SINGLE PAGE MOBILE MODE ================= */
            <div className="single-page-container">
              {!isFlipping ? (
                renderSinglePage(activePage, 'right')
              ) : (
                <>
                  {/* Underneath page */}
                  <div className="single-static-under">
                    {renderSinglePage(
                      flipDirection === 'next' ? activePage + 1 : activePage,
                      'right'
                    )}
                  </div>

                  {/* 3D Flipping Sheet Overlay */}
                  <div
                    className={`flipping-page-sheet-single ${flipDirection === 'next' ? 'single-flip-to-left' : 'single-flip-to-right'
                      }`}
                  >
                    <div className="sheet-face sheet-front">
                      {renderSinglePage(
                        flipDirection === 'next' ? activePage : activePage - 1,
                        'right'
                      )}
                    </div>
                    <div className="sheet-face sheet-back">
                      <div className="page-side empty right" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Next page arrow anchor */}
        <button
          className={`nav-hotspot right-hotspot ${activePage >= numPages ? 'disabled' : ''}`}
          onClick={() => handlePageTurn('next')}
          aria-label="Next Page"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Subtle indicator of loaded/cache status */}
      <div className="magazine-hints">
        <span>Use Left/Right arrow keys or Swipe to turn pages</span>
      </div>
    </div>
  );
}
