import type { Article } from "@reader/core";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Panel } from "./ui/Panel";

interface ArticleDetailPaneProps {
  article: Article | undefined;
  loading: boolean;
  compact?: boolean;
  showBackLink?: boolean;
}

export function ArticleDetailPane({
  article,
  loading,
  compact = false,
  showBackLink = false
}: ArticleDetailPaneProps) {
  return (
    <Panel className={`h-full overflow-hidden ${compact ? "rounded-none border-x-0 border-b-0" : ""}`}>
      <div className="flex h-full flex-col">
        <div className="border-b border-border/80 px-5 py-4">
          {showBackLink ? (
            <Link to="/" className="mb-3 inline-flex items-center gap-2 text-xs text-textMuted hover:text-text">
              <ArrowLeft className="size-4" />
              Back to list
            </Link>
          ) : null}
          {loading ? (
            <p className="text-sm text-textMuted">Loading article...</p>
          ) : article ? (
            <>
              <h2 className="text-xl font-bold leading-snug text-text">{article.title}</h2>
              <p className="mt-2 text-xs uppercase tracking-wide text-textMuted/90">
                {article.sourceDomain ?? "Unknown source"}
              </p>
            </>
          ) : (
            <p className="text-sm text-textMuted">Select an article to read.</p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {article ? (
            <article
              className="prose prose-invert prose-sm max-w-none prose-headings:text-text prose-p:text-text prose-a:text-highlight"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : (
            <p className="text-sm text-textMuted">Article content will appear here.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
