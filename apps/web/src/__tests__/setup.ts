import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => {
    const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
    const minWidth = minWidthMatch ? Number(minWidthMatch[1]) : 0;

    return {
      matches: window.innerWidth >= minWidth,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    };
  }
});
