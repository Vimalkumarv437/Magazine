/**
 * useImageMagazine
 * Lightweight hook that serves magazine pages from pre-converted WebP images
 * stored in /public/MAGAZINE 2025-2026/MAGAZINE 2025-2026-{n}.webp
 * No PDF.js required — instant loading, zero CPU rendering overhead.
 */

const TOTAL_PAGES = 58;
const IMAGE_FOLDER = '/MAGAZINE 2025-2026';
const IMAGE_PREFIX = 'MAGAZINE 2025-2026';

/**
 * Returns the public URL for a given page number.
 * Pages are 1-indexed: page 1 → /MAGAZINE 2025-2026/MAGAZINE 2025-2026-1.webp
 */
export function getPageImageUrl(pageNumber) {
  return `${IMAGE_FOLDER}/${IMAGE_PREFIX}-${pageNumber}.webp`;
}

export function useImageMagazine() {
  return {
    numPages: TOTAL_PAGES,
    getPageImageUrl,
  };
}
