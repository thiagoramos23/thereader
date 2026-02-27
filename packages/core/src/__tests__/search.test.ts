import { describe, expect, it } from "vitest";

import { clampPagination, tokenizeQuery } from "../search";

describe("tokenizeQuery", () => {
  it("normalizes spacing and case", () => {
    expect(tokenizeQuery("  React   RSS Reader ")).toEqual(["react", "rss", "reader"]);
  });

  it("returns empty array for empty query", () => {
    expect(tokenizeQuery("   ")).toEqual([]);
  });
});

describe("clampPagination", () => {
  it("clamps to fallback when undefined", () => {
    expect(clampPagination(undefined, 20, 100)).toBe(20);
  });

  it("clamps to max", () => {
    expect(clampPagination(200, 20, 100)).toBe(100);
  });

  it("clamps to zero for negative values", () => {
    expect(clampPagination(-1, 20, 100)).toBe(0);
  });
});
