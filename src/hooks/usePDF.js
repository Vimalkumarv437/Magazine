import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to run off-thread for 60fps performance
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PAGE_BATCH_SIZE = 10;
const RENDER_SCALE = 1.5; // High sharpness balance

export function usePDF(pdfUrl = 'https://y45lw8fa3udvqq4m.public.blob.vercel-storage.com/MAGAZINE%202025-2026.pdf') {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState(null);

  // Batch loading state
  const [maxAllowedPages, setMaxAllowedPages] = useState(PAGE_BATCH_SIZE);

  // Page rendering states & caches
  const [pageCache, setPageCache] = useState({}); // { [pageNumber]: blobUrl }
  const [renderingPages, setRenderingPages] = useState({}); // { [pageNumber]: boolean }

  // Ref to hold the loading task and prevent multiple loads
  const loadingTaskRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderQueueRef = useRef(new Set()); // Pages currently in render queue

  // 1. Initialize and progressively load the PDF via Range Requests
  useEffect(() => {
    setLoadingDoc(true);
    setDocError(null);

    // Get document with range request enablement (enabled by default in pdfjs for static servers)
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: false,
      // Support HTTP Range Requests efficiently
      disableRange: false,
      disableStream: false,
      disableAutoFetch: true, // Only fetch what is explicitly requested!
    });

    loadingTaskRef.current = loadingTask;

    loadingTask.promise
      .then((doc) => {
        pdfDocRef.current = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoadingDoc(false);

        // Pre-render the first few pages
        preloadPages(1, 4);
      })
      .catch((err) => {
        console.error('Error loading PDF:', err);
        setDocError(err.message || 'Failed to load PDF magazine.');
        setLoadingDoc(false);
      });

    // Cleanup blob URLs on unmount
    return () => {
      // Revoke all Blob URLs to prevent memory leaks
      setPageCache((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
    };
  }, [pdfUrl]);

  // 2. Load the next batch of pages
  const loadNextBatch = useCallback(() => {
    if (!pdfDoc) return;
    setMaxAllowedPages((prev) => {
      const nextBatch = Math.min(prev + PAGE_BATCH_SIZE, numPages);
      // Pre-render the newly unlocked pages
      preloadPages(prev + 1, Math.min(prev + 3, numPages));
      return nextBatch;
    });
  }, [pdfDoc, numPages]);

  // 3. Main rendering function that converts a page to a cached Blob URL
  const renderPageToCache = useCallback(async (pageNumber) => {
    const doc = pdfDocRef.current;
    if (!doc || pageNumber < 1 || pageNumber > numPages) return null;

    // Return from cache if already rendered
    if (pageCache[pageNumber]) return pageCache[pageNumber];

    // Prevent double rendering
    if (renderQueueRef.current.has(pageNumber)) return null;
    renderQueueRef.current.add(pageNumber);

    setRenderingPages((prev) => ({ ...prev, [pageNumber]: true }));

    try {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      // Setup HTML5 Offscreen/Virtual Canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert Canvas content to highly compressed JPEG Blob (much more efficient than base64 DataURLs)
      const blobUrl = await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.85); // 85% JPEG quality is crystal clear but small size
      });

      if (blobUrl) {
        setPageCache((prev) => ({ ...prev, [pageNumber]: blobUrl }));
      }

      setRenderingPages((prev) => ({ ...prev, [pageNumber]: false }));
      renderQueueRef.current.delete(pageNumber);
      return blobUrl;
    } catch (err) {
      console.error(`Error rendering page ${pageNumber}:`, err);
      setRenderingPages((prev) => ({ ...prev, [pageNumber]: false }));
      renderQueueRef.current.delete(pageNumber);
      return null;
    }
  }, [pageCache, numPages]);

  // Helper: Preload a range of pages in the background
  const preloadPages = useCallback((start, end) => {
    for (let i = start; i <= end; i++) {
      if (i <= maxAllowedPages && !pageCache[i]) {
        renderPageToCache(i);
      }
    }
  }, [maxAllowedPages, pageCache, renderPageToCache]);

  return {
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
  };
}
