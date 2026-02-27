import { Link } from "react-router-dom";
import type { SearchResult } from "@reader/core";

import { Panel } from "./ui/Panel";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString();
}

interface ArticleRowProps {
  article: SearchResult;
  active: boolean;
}

export function ArticleRow({ article, active }: ArticleRowProps) {
  return (
    <Link to={`/article/${article.id}`} className="block">
      <Panel
        className={`overflow-hidden border transition ${
          active ? "border-accent/70 bg-panel-muted" : "border-border/70 hover:border-accent/40"
        }`}
      >
        <div className="flex gap-4 p-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-bg/60">
            {article.imageUrl ? (
              <img src={article.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-textMuted">
                NO IMG
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-text">{article.title}</h3>
              <span className="shrink-0 text-xs text-textMuted">{formatDate(article.publishedAt)}</span>
            </div>
            {article.excerpt ? (
              <p className="line-clamp-2 text-sm text-textMuted/90">{article.excerpt}</p>
            ) : null}
            <p className="text-xs uppercase tracking-wide text-textMuted/90">{article.sourceDomain ?? "Unknown"}</p>
          </div>
        </div>
      </Panel>
    </Link>
  );
}
