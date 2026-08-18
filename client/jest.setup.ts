import '@testing-library/jest-dom';

// IntersectionObserver mock — needed by infinite-scroll components (AI Runs, Sessions)
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  root: Element | Document | null = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
}
(global as any).IntersectionObserver = IntersectionObserver;
