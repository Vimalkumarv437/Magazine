import { useEffect, useRef, useState } from 'react';
import { Lock, FileText, Compass, Loader2 } from 'lucide-react';
import './Thumbnails.css';

// Custom lightweight visible observer wrapper for progressive rendering
function ThumbnailItem({ pageNum, pageCache, renderingPages, renderPageToCache, isLocked, isActive, onClick }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy render ONLY when thumbnail is scrolled into viewport! (Ultimate performance)
  useEffect(() => {
    if (isLocked) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Request rendering if not already cached
          if (!pageCache[pageNum] && !renderingPages[pageNum]) {
            renderPageToCache(pageNum);
          }
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Pre-trigger slightly before scroll
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [pageNum, pageCache, renderingPages, renderPageToCache, isLocked]);

  return (
    <div
      ref={containerRef}
      className={`thumb-item-box ${isActive ? 'active-thumb' : ''} ${isLocked ? 'locked-thumb' : ''}`}
      onClick={onClick}
    >
      <div className="thumb-preview-frame">
        {isLocked ? (
          <div className="thumb-locked-overlay">
            <Lock size={16} className="lock-icon" />
          </div>
        ) : !pageCache[pageNum] ? (
          <div className="thumb-loading">
            <Loader2 size={16} className="animate-spin text-amber-500" />
          </div>
        ) : (
          <img
            src={pageCache[pageNum]}
            alt={`Page ${pageNum} Thumb`}
            className="thumb-image"
            loading="lazy"
          />
        )}
      </div>
      <span className="thumb-page-num">Page {pageNum}</span>
    </div>
  );
}

export function Thumbnails({
  numPages,
  pageCache,
  renderingPages,
  renderPageToCache,
  activePage,
  setActivePage,
  maxAllowedPages,
  loadNextBatch,
}) {
  const [activeTab, setActiveTab] = useState('thumbs'); // 'thumbs' or 'toc'
  const listContainerRef = useRef(null);

  // Pre-defined premium Table of Contents (indicative sections of a typical school/corporate annual magazine)
  const tocSections = [
    { title: 'Front Cover', page: 1, desc: 'Welcome Page' },
    { title: "Editor's Note", page: 2, desc: 'Preface & Acknowledgements' },
    { title: 'Presidential Address', page: 4, desc: 'Message from Leadership' },
    { title: 'Academic Highlights', page: 8, desc: 'Featured Events 2025' },
    { title: 'Spotlight Features', page: 12, desc: 'Outstanding Achievements' },
    { title: 'Creative Corner', page: 18, desc: 'Student Contributions' },
    { title: 'Sports Achievements', page: 24, desc: 'Athletic Triumphs' },
    { title: 'Back Cover', page: numPages || 30, desc: 'Concluding Remarks' },
  ];

  const handleThumbClick = (pageNum) => {
    if (pageNum > maxAllowedPages) {
      // Offer to load next batch automatically!
      const confirmLoad = window.confirm(
        `Page ${pageNum} is in a locked batch. Would you like to unlock pages up to page ${Math.ceil(pageNum / 10) * 10} now?`
      );
      if (confirmLoad) {
        // Increment batch until desired page is unlocked
        let currentMax = maxAllowedPages;
        while (currentMax < pageNum) {
          loadNextBatch();
          currentMax += 10;
        }
        setActivePage(pageNum);
      }
    } else {
      setActivePage(pageNum);
    }
  };

  // Scroll active thumbnail into view
  useEffect(() => {
    if (activeTab !== 'thumbs' || !listContainerRef.current) return;
    
    // Find active element
    const container = listContainerRef.current;
    const activeItem = container.querySelector('.active-thumb');
    
    if (activeItem) {
      activeItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activePage, activeTab]);

  return (
    <div className="sidebar-thumbnails-panel">
      {/* Tab Switcher Headers */}
      <div className="sidebar-tabs-header">
        <button
          className={`sidebar-tab-btn ${activeTab === 'thumbs' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('thumbs')}
        >
          <FileText size={14} />
          <span>Pages</span>
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'toc' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('toc')}
        >
          <Compass size={14} />
          <span>Index</span>
        </button>
      </div>

      {/* Pages Thumbnails View */}
      {activeTab === 'thumbs' ? (
        <div className="sidebar-thumbs-list" ref={listContainerRef}>
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            const isLocked = pageNum > maxAllowedPages;
            const isActive = activePage === pageNum || (activePage % 2 === 0 && activePage + 1 === pageNum && pageNum !== 1);

            return (
              <ThumbnailItem
                key={pageNum}
                pageNum={pageNum}
                pageCache={pageCache}
                renderingPages={renderingPages}
                renderPageToCache={renderPageToCache}
                isLocked={isLocked}
                isActive={isActive}
                onClick={() => handleThumbClick(pageNum)}
              />
            );
          })}
        </div>
      ) : (
        /* Table of Contents View */
        <div className="sidebar-toc-list">
          <div className="toc-info-bar">
            <span>Click any section to jump directly to that page.</span>
          </div>
          {tocSections.map((sec, idx) => {
            const isLocked = sec.page > maxAllowedPages;
            const isActive = activePage === sec.page || (activePage % 2 === 0 && activePage + 1 === sec.page && sec.page !== 1);

            return (
              <div
                key={idx}
                className={`toc-item-row ${isActive ? 'active-toc' : ''} ${isLocked ? 'locked-toc' : ''}`}
                onClick={() => handleThumbClick(sec.page)}
              >
                <div className="toc-number-pill">
                  {isLocked ? <Lock size={10} /> : sec.page}
                </div>
                <div className="toc-text-wrapper">
                  <h4 className="toc-item-title">{sec.title}</h4>
                  <p className="toc-item-desc">{sec.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
