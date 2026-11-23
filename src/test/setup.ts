import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (typeof window !== 'undefined') {
  if (!window.ResizeObserver) {
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  window.scrollTo = vi.fn();
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }
}

beforeEach(() => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0]?.trim();
      if (name) {
        document.cookie = `${name}=; max-age=0; path=/`;
      }
    });
    window.history.replaceState({}, '', '/');
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
