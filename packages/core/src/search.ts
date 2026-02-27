const TOKEN_SPLIT = /\s+/;

export function tokenizeQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(TOKEN_SPLIT)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function clampPagination(value: number | undefined, fallback: number, max: number): number {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(max, Math.floor(value)));
}
