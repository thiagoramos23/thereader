import type { SearchResult } from "@reader/core";

import { ArticleRow } from "./ArticleRow";

interface ArticleListProps {
  items: SearchResult[];
  selectedId?: string;
}

export function ArticleList({ items, selectedId }: ArticleListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-panel/70 p-6 text-sm text-textMuted">
        No saved articles yet. Paste a URL to start your library.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((article) => (
        <ArticleRow key={article.id} article={article} active={article.id === selectedId} />
      ))}
    </div>
  );
}
