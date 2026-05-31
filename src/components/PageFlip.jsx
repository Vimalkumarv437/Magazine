import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPageImageUrl } from '../hooks/useImageMagazine';
import './PageFlip.css';

/**
 * PageFlip — book page-flip viewer (double-page desktop, single-page mobile).
 */
export function PageFlip({
  numPages,
  activePage,
  setActivePage,
  isDoublePage,
  zoomScale = 1,
  flipRef,
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState(null);
  const [flipFromPage, setFlipFromPage] = useState(null);
  const [flipToPage, setFlipToPage] = useState(null);

  const touchStartX = useRef(null);
  const isFlippingRef = useRef(false);

  const getSpread = useCallback((page) => {
    if (!isDoublePage) return { left: null, right: page };
    if (page === 1) return { left: null, right: 1 };
    const left = page % 2 === 0 ? page : page - 1;
    const right = left + 1 <= numPages ? left + 1 : null;
    return { left, right };
  }, [isDoublePage, numPages]);

  const currentSpread = getSpread(activePage);

  const handleFlip = useCallback((direction) => {
    if (isFlippingRef.current) return;

    if (direction === 'next') {
      let nextPage;
      if (!isDoublePage) {
        nextPage = activePage + 1;
      } else {
        nextPage = activePage === 1 ? 2 : activePage + 2;
        if (nextPage % 2 !== 0 && nextPage !== 1) nextPage = nextPage - 1;
        if (activePage === 1) nextPage = 2;
      }
      if (nextPage > numPages) return;

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

  useEffect(() => {
    if (flipRef) flipRef.current = handleFlip;
  }, [flipRef, handleFlip]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') handleFlip('next');
      else if (e.key === 'ArrowLeft') handleFlip('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleFlip]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) handleFlip('next');
    else if (diff < -40) handleFlip('prev');
    touchStartX.current = null;
  };

  const fromSpread = flipFromPage !== null ? getSpread(flipFromPage) : currentSpread;
  const toSpread = flipToPage !== null ? getSpread(flipToPage) : currentSpread;

  const bgLeft = flipDir === 'next' ? fromSpread.left : toSpread.left;
  const bgRight = flipDir === 'next' ? toSpread.right : fromSpread.right;
  const peelFront = flipDir === 'next' ? fromSpread.right : fromSpread.left;
  const peelBack = flipDir === 'next' ? toSpread.left : toSpread.right;

  const singleBg = flipDir === 'next' ? flipToPage : flipFromPage;
  const singleFront = flipDir === 'next' ? flipFromPage : flipToPage;
  const singleBack = flipDir === 'next' ? flipToPage : flipFromPage;

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

  const canNext = activePage < numPages;
  const canPrev = activePage > 1;

  return (
    <div
      className="pf-outer"
      style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center top' }}
    >
      <div className="pf-viewport">
        <div
          className={`pf-book ${isDoublePage ? 'pf-double' : 'pf-single'}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {isDoublePage ? (
            <>
              <div className="pf-page pf-left">
                {isFlipping
                  ? <PageImg pageNum={bgLeft} />
                  : <PageImg pageNum={currentSpread.left} />}
              </div>

              <div className="pf-spine" />

              <div className="pf-page pf-right">
                {isFlipping
                  ? <PageImg pageNum={bgRight} />
                  : <PageImg pageNum={currentSpread.right} />}
              </div>

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

              {!isFlipping && currentSpread.left && (
                <div className="pf-pagenum pf-pagenum-left">{currentSpread.left}</div>
              )}
              {!isFlipping && currentSpread.right && (
                <div className="pf-pagenum pf-pagenum-right">{currentSpread.right}</div>
              )}
            </>
          ) : (
            <div className="pf-single-stage">
              {isFlipping && (
                <div className="pf-single-bg">
                  <PageImg pageNum={singleBg} />
                </div>
              )}

              {!isFlipping ? (
                <div className="pf-single-page">
                  <PageImg pageNum={activePage} />
                </div>
              ) : (
                <div className={`pf-sheet-single pf-sheet-single-${flipDir}`}>
                  <div className="pf-face pf-front">
                    <PageImg pageNum={singleFront} />
                  </div>
                  <div className="pf-face pf-back">
                    <PageImg pageNum={singleBack} />
                  </div>
                </div>
              )}

              <div className="pf-pagenum pf-pagenum-right">{activePage}</div>
            </div>
          )}
        </div>

        {/* Desktop side arrows */}
        <button
          className={`pf-nav pf-nav-left pf-nav-desktop ${!canPrev ? 'pf-nav-disabled' : ''}`}
          onClick={() => handleFlip('prev')}
          aria-label="Previous page"
          type="button"
        >
          <ChevronLeft size={28} />
        </button>

        <button
          className={`pf-nav pf-nav-right pf-nav-desktop ${!canNext ? 'pf-nav-disabled' : ''}`}
          onClick={() => handleFlip('next')}
          aria-label="Next page"
          type="button"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Mobile bottom navigation */}
      <div className="pf-mobile-nav-row">
        <button
          className={`pf-mobile-btn ${!canPrev ? 'pf-nav-disabled' : ''}`}
          onClick={() => handleFlip('prev')}
          aria-label="Previous page"
          type="button"
        >
          <ChevronLeft size={26} />
        </button>

        <span className="pf-mobile-page-label">
          {activePage} / {numPages}
        </span>

        <button
          className={`pf-mobile-btn ${!canNext ? 'pf-nav-disabled' : ''}`}
          onClick={() => handleFlip('next')}
          aria-label="Next page"
          type="button"
        >
          <ChevronRight size={26} />
        </button>
      </div>

      <div className="pf-hint">
        {isDoublePage
          ? 'Arrow keys · Click arrows · Swipe to turn pages'
          : 'Tap arrows or swipe to turn pages'}
      </div>
    </div>
  );
}
