import { useRef, useEffect } from 'react';
import { FileText, Compass } from 'lucide-react';
import { useState } from 'react';
import './Thumbnails.css';

/**
 * LazyThumbnail — only loads the image when scrolled into view
 */
function LazyThumbnail({ pageNum, getPageImageUrl, isActive, onClick }) {
  const ref = useRef(null);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (src) return; // already loaded

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSrc(getPageImageUrl(pageNum));
          observer.disconnect();
        }
      },
      { rootMargin: '120px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pageNum, getPageImageUrl, src]);

  return (
    <div
      ref={ref}
      className={`thumb-item-box ${isActive ? 'active-thumb' : ''}`}
      onClick={onClick}
    >
      <div className="thumb-preview-frame">
        {src
          ? <img src={src} alt={`Page ${pageNum}`} className="thumb-image" loading="lazy" />
          : <div className="thumb-loading" />
        }
      </div>
      <span className="thumb-page-num">Page {pageNum}</span>
    </div>
  );
}

export function Thumbnails({
  numPages,
  getPageImageUrl,
  activePage,
  setActivePage,
  isDoublePage,
}) {
  const [activeTab, setActiveTab] = useState('thumbs');
  const listRef = useRef(null);

  // Table of contents — generic section labels; can be customised
  const tocSections = [
    { title: 'Front Cover', page: 1, desc: 'Welcome Page' },
    { title: "Editor's Note", page: 2, desc: 'Preface & Acknowledgements' },
    { title: 'Presidential Address', page: 4, desc: 'Message from Leadership' },
    { title: 'Academic Highlights', page: 8, desc: 'Featured Events 2025' },
    { title: 'Spotlight Features', page: 12, desc: 'Outstanding Achievements' },
    { title: 'Creative Corner', page: 18, desc: 'Student Contributions' },
    { title: 'Sports Achievements', page: 24, desc: 'Athletic Triumphs' },
    { title: 'Back Cover', page: numPages, desc: 'Concluding Remarks' },
  ];

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (activeTab !== 'thumbs' || !listRef.current) return;
    const active = listRef.current.querySelector('.active-thumb');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activePage, activeTab]);

  const handleThumbClick = (pageNum) => {
    setActivePage(pageNum);
  };

  return (
    <div className="sidebar-thumbnails-panel">

      {/* Tab headers */}
      <div className="sidebar-tabs-header">
        <button
          className={`sidebar-tab-btn ${activeTab === 'thumbs' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('thumbs')}
        >
          <FileText size={14} /><span>Pages</span>
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'toc' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('toc')}
        >
          <Compass size={14} /><span>Index</span>
        </button>
      </div>

      {/* Thumbnails tab */}
      {activeTab === 'thumbs' ? (
        <div className="sidebar-thumbs-list" ref={listRef}>
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            const isActive =
              activePage === pageNum ||
              (isDoublePage && activePage % 2 === 0 && activePage + 1 === pageNum);

            return (
              <LazyThumbnail
                key={pageNum}
                pageNum={pageNum}
                getPageImageUrl={getPageImageUrl}
                isActive={isActive}
                onClick={() => handleThumbClick(pageNum)}
              />
            );
          })}
        </div>
      ) : (
        /* Table of Contents tab */
        <div className="sidebar-toc-list">
          <div className="toc-info-bar">
            <span>Click any section to jump directly to that page.</span>
          </div>
          {tocSections.map((sec, idx) => {
            const isActive =
              activePage === sec.page ||
              (isDoublePage && activePage % 2 === 0 && activePage + 1 === sec.page);

            return (
              <div
                key={idx}
                className={`toc-item-row ${isActive ? 'active-toc' : ''}`}
                onClick={() => handleThumbClick(sec.page)}
              >
                <div className="toc-number-pill">{sec.page}</div>
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
