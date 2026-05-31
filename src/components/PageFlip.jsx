import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPageImageUrl } from '../hooks/useImageMagazine';
import './PageFlip.css';

/**
 * PageFlip
 * Real book page-flip viewer using pre-rendered WebP images.
 * Supports both desktop (double-page spread) and mobile (single page) modes.
 * The flip effect is a genuine 3D CSS rotateY animation on both modes.
 *
 * Props:
 *  - numPages        : total page count
 *  - activePage      : current page (1-indexed)
 *  - setActivePage   : setter for activePage
 *  - isDoublePage    : boolean from parent (desktop = true, mobile = false)
 *  - zoomScale       : CSS scale factor
 *  - onPageTurn      : optional callback(direction) for external buttons (Controls HUD)
 */
export function PageFlip({
  numPages,
  activePage,
  setActivePage,
  isDoublePage,
  zoomScale = 1,
  flipRef,          // ref so parent Controls can call flip externally
}) {
  // ------- flip animation state -------
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState(null); // 'next' | 'prev'
  const [flipFromPage, setFlipFromPage] = useState(null); // page visible before flip
  const [flipToPage, setFlipToPage] = useState(null);     // page visible after flip

  // touch handling
  const touchStartX = useRef(null);
  const isFlippingRef = useRef(false); // avoid stale closure in touch

  // ------- helpers -------
  /**
   * For double-page mode:
   *   page 1         → left=null, right=1  (cover alone on right)
   *   page 2,3       → left=2, right=3
   *   page 4,5       → left=4, right=5
   *   last if even   → left=last, right=null
   */
  const getSpread = useCallback((page) => {
    if (!isDoublePage) return { left: null, right: page };
    if (page === 1) return { left: null, right: 1 };
    const left = page % 2 === 0 ? page : page - 1;
    const right = left + 1 <= numPages ? left + 1 : null;
    return { left, right };
  }, [isDoublePage, numPages]);

  const currentSpread = getSpread(activePage);

  /**
   * Core flip trigger. Direction: 'next' | 'prev'
   */
  const handleFlip = useCallback((direction) => {
    if (isFlippingRef.current) return;

    if (direction === 'next') {
      // Calculate next page
      let nextPage;
      if (!isDoublePage) {
        nextPage = activePage + 1;
      } else {
        nextPage = activePage === 1 ? 2 : activePage + 2;
        // align to even so spreads stay clean
        if (nextPage % 2 !== 0 && nextPage !== 1) nextPage = nextPage - 1;
        // safety: don't go past cover+2 logic
        if (activePage === 1) nextPage = 2;
      }
      if (nextPage > numPages) return;

      // record what we're flipping from/to
      setFlipFromPage(activePage);
      setFlipToPage(nextPage);
      setFlipDir('next');
      setIsFlipping(true);
      isFlippingRef.current = true;

      setTimeout(() => {
        setActivePage(nextPage);
        setIsFlipping(false);
        setFlipDir(null);
        isFlippingRef.current = false;
      }, 650);

    } else {
      // prev
      let prevPage;
      if (!isDoublePage) {
        prevPage = activePage - 1;
      } else {
        if (activePage <= 2) {
          prevPage = 1;
        } else {
          prevPage = activePage % 2 === 0 ? activePage - 2 : activePage - 1;
          if (prevPage % 2 !== 0 && prevPage !== 1) prevPage = prevPage - 1;
        }
      }
      if (prevPage < 1) return;

      setFlipFromPage(activePage);
      setFlipToPage(prevPage);
      setFlipDir('prev');
      setIsFlipping(true);
      isFlippingRef.current = true;

      setTimeout(() => {
        setActivePage(prevPage);
        setIsFlipping(false);
        setFlipDir(null);
        isFlippingRef.current = false;
      }, 650);
    }
  }, [activePage, numPages, isDoublePage, setActivePage]);

  // Expose handleFlip to parent via flipRef so Controls HUD can call it
  useEffect(() => {
    if (flipRef) {
      flipRef.current = handleFlip;
    }
  }, [flipRef, handleFlip]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') handleFlip('next');
      else if (e.key === 'ArrowLeft') handleFlip('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleFlip]);

  // Touch / swipe
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) handleFlip('next');
    else if (diff < -40) handleFlip('prev');
    touchStartX.current = null;
  };

  // ------- what to render during/after flip -------
  /**
   * During a flip animation we keep the PREVIOUS spread visible as background
   * and overlay a flipping sheet that shows the OUTGOING page on its front face
   * and INCOMING page on its back face.
   *
   * DOUBLE MODE:
   *   next flip: right-side page peels left → reveals new right page on back
   *   prev flip: left-side page peels right → reveals new left page on back
   *
   * SINGLE MODE:
   *   next: current page peels left → new page revealed underneath / on back
   *   prev: new page sweeps in from right
   */

  const fromSpread = flipFromPage !== null ? getSpread(flipFromPage) : currentSpread;
  const toSpread = flipToPage !== null ? getSpread(flipToPage) : currentSpread;

  // The stable background during flip (the pages that are NOT involved in the peel)
  const bgLeft = flipDir === 'next' ? fromSpread.left : toSpread.left;
  const bgRight = flipDir === 'next' ? toSpread.right : fromSpread.right;

  // The page peeling (front=leaving, back=arriving)
  const peelFront = flipDir === 'next' ? fromSpread.right : fromSpread.left;
  const peelBack = flipDir === 'next' ? toSpread.left : toSpread.right;

  // ------- single-page equivalents -------
  const singleBg = flipDir === 'next' ? flipToPage : flipFromPage;
  const singleFront = flipDir === 'next' ? flipFromPage : flipToPage;
  const singleBack = flipDir === 'next' ? flipToPage : flipFromPage;

  // ------- page image helper -------
  const PageImg = ({ pageNum, className = '' }) => {
    if (!pageNum) return <div className={`page-blank ${className}`} />;
    return (
      <img
        src={getPageImageUrl(pageNum)}
        alt={`Page ${pageNum}`}
        className={`page-img ${className}`}
        draggable={false}
        loading="lazy"
      />
    );
  };

  // ------- can navigate? -------
  const canNext = activePage < numPages;
  const canPrev = activePage > 1;

  return (
    <div
      className="pf-outer"
      style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center top' }}
    >
      <div
        className={`pf-book ${isDoublePage ? 'pf-double' : 'pf-single'}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ======== DOUBLE PAGE MODE ======== */}
        {isDoublePage ? (
          <>
            {/* Background spread — shown during both idle and flip */}
            <div className="pf-page pf-left">
              {isFlipping
                ? <PageImg pageNum={bgLeft} />
                : <PageImg pageNum={currentSpread.left} />
              }
            </div>

            <div className="pf-spine" />

            <div className="pf-page pf-right">
              {isFlipping
                ? <PageImg pageNum={bgRight} />
                : <PageImg pageNum={currentSpread.right} />
              }
            </div>

            {/* Flipping peel sheet — only during animation */}
            {isFlipping && (
              <div className={`pf-sheet pf-sheet-${flipDir}`}>
                <div className="pf-face pf-front">
                  <PageImg pageNum={peelFront} />
                </div>
                <div className="pf-face pf-back">
                  <PageImg pageNum={peelBack} />
                </div>
              </div>
            )}

            {/* Page number overlays */}
            {!isFlipping && currentSpread.left && (
              <div className="pf-pagenum pf-pagenum-left">{currentSpread.left}</div>
            )}
            {!isFlipping && currentSpread.right && (
              <div className="pf-pagenum pf-pagenum-right">{currentSpread.right}</div>
            )}
          </>
        ) : (
          /* ======== SINGLE PAGE MODE (MOBILE) ======== */
          <div className="pf-single-stage">
            {/* Background page (destination) */}
            {isFlipping && (
              <div className="pf-single-bg">
                <PageImg pageNum={singleBg} />
              </div>
            )}

            {/* Current/foreground page */}
            {!isFlipping ? (
              <div className="pf-single-page">
                <PageImg pageNum={activePage} />
              </div>
            ) : (
              /* Flipping sheet */
              <div className={`pf-sheet-single pf-sheet-single-${flipDir}`}>
                <div className="pf-face pf-front">
                  <PageImg pageNum={singleFront} />
                </div>
                <div className="pf-face pf-back">
                  <PageImg pageNum={singleBack} />
                </div>
              </div>
            )}

            {/* Page number */}
            <div className="pf-pagenum pf-pagenum-right">{activePage}</div>
          </div>
        )}
      </div>

      {/* Nav Arrows */}
      <button
        className={`pf-nav pf-nav-left ${!canPrev ? 'pf-nav-disabled' : ''}`}
        onClick={() => handleFlip('prev')}
        aria-label="Previous page"
      >
        <ChevronLeft size={28} />
      </button>

      <button
        className={`pf-nav pf-nav-right ${!canNext ? 'pf-nav-disabled' : ''}`}
        onClick={() => handleFlip('next')}
        aria-label="Next page"
      >
        <ChevronRight size={28} />
      </button>

      {/* Hint bar */}
      <div className="pf-hint">
        {isDoublePage
          ? 'Arrow keys · Click arrows · Swipe to turn pages'
          : 'Tap arrows or swipe to turn pages'}
      </div>
    </div>
  );
}
