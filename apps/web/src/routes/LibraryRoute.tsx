import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Inbox, Menu, Plus, Search, Settings } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ArticleDetailPane } from "../components/ArticleDetailPane";
import { ArticleList } from "../components/ArticleList";
import { SearchBox } from "../components/SearchBox";
import { UrlImportForm } from "../components/UrlImportForm";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useContentGateway } from "../lib/gatewayContext";

const LIST_QUERY_KEY = "articles";
const LIST_VIEW_STATE_KEY = "reader:list-view-state";

interface ListViewState {
  search: string;
  scrollTop: number;
}

function readListViewState(): ListViewState | null {
  try {
    const raw = sessionStorage.getItem(LIST_VIEW_STATE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<ListViewState>;

    if (typeof parsed.search !== "string" || typeof parsed.scrollTop !== "number") {
      return null;
    }

    return { search: parsed.search, scrollTop: parsed.scrollTop };
  } catch {
    return null;
  }
}

function persistListViewState(state: ListViewState) {
  try {
    sessionStorage.setItem(LIST_VIEW_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors; navigation should still proceed.
  }
}

function LeftRail() {
  const items = [
    { icon: BookOpen, label: "Library" },
    { icon: Search, label: "Search" },
    { icon: Inbox, label: "Inbox" },
    { icon: Settings, label: "Settings" }
  ];

  return (
    <aside className="hidden h-screen w-20 shrink-0 border-r border-border/70 bg-panel xl:flex xl:flex-col xl:items-center xl:py-6">
      <div className="mb-8 flex size-10 items-center justify-center rounded-lg bg-bg text-lg font-bold">R</div>
      <nav className="space-y-2">
        {items.map(({ icon: Icon, label }, index) => (
          <button
            key={label}
            className={`flex size-11 items-center justify-center rounded-lg transition-colors ${
              index === 0
                ? "bg-accent/20 text-accent"
                : "text-textMuted hover:bg-panel-muted hover:text-text"
            }`}
            aria-label={label}
            type="button"
          >
            <Icon className="size-5" />
          </button>
        ))}
      </nav>
    </aside>
  );
}

function ListPane({
  selectedId,
  compact = false
}: {
  selectedId?: string;
  compact?: boolean;
}) {
  const gateway = useContentGateway();
  const queryClient = useQueryClient();
  const [initialListState] = useState<ListViewState | null>(() => readListViewState());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRestoreRef = useRef<number | null>(initialListState?.scrollTop ?? null);
  const searchRef = useRef(initialListState?.search ?? "");
  const [search, setSearch] = useState(() => searchRef.current);
  const [showImport, setShowImport] = useState(!compact);

  const listQuery = useQuery({
    queryKey: [LIST_QUERY_KEY, search],
    queryFn: () => gateway.listArticles({ query: search, limit: 50, offset: 0 })
  });

  const importMutation = useMutation({
    mutationFn: (url: string) => gateway.importUrl(url),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [LIST_QUERY_KEY] });
    }
  });

  const headerTabs = useMemo(() => ["Library", "Later", "Archive"], []);
  const handleSearchChange = useCallback((value: string) => {
    searchRef.current = value;
    setSearch(value);
  }, []);

  const handleArticleOpen = useCallback(
    (_articleId: string) => {
      persistListViewState({
        search: searchRef.current,
        scrollTop: scrollContainerRef.current?.scrollTop ?? 0
      });
    },
    []
  );

  useEffect(() => {
    if (!listQuery.isSuccess || pendingScrollRestoreRef.current === null) {
      return;
    }

    const restoreScrollTop = pendingScrollRestoreRef.current;
    const applyScrollRestore = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = restoreScrollTop;
      }
    };

    applyScrollRestore();
    const frame = window.requestAnimationFrame(() => {
      applyScrollRestore();
    });

    pendingScrollRestoreRef.current = null;

    return () => window.cancelAnimationFrame(frame);
  }, [listQuery.dataUpdatedAt, listQuery.isSuccess]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <Panel className="sticky top-0 z-20 border border-border/80 bg-panel/95 p-3 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {headerTabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`rounded-md px-3 py-1 text-sm ${
                  index === 0
                    ? "bg-panel-muted text-text"
                    : "text-textMuted hover:text-text"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {compact ? (
            <Button variant="ghost" onClick={() => setShowImport((value) => !value)} className="px-3 py-1.5">
              <Plus className="mr-1 size-4" />
              Import
            </Button>
          ) : null}
        </div>

        {showImport ? (
          <div className="mb-3">
            <UrlImportForm
              onSubmit={async (url) => {
                await importMutation.mutateAsync(url);
              }}
              loading={importMutation.isPending}
            />
          </div>
        ) : null}

        <SearchBox value={search} onChange={handleSearchChange} />
      </Panel>

      <div ref={scrollContainerRef} data-testid="article-list-scroll" className="min-h-0 flex-1 overflow-y-auto pr-1">
        {listQuery.isLoading ? (
          <div className="rounded-xl border border-border/70 bg-panel/80 p-4 text-sm text-textMuted">
            Loading articles...
          </div>
        ) : listQuery.isError ? (
          <div className="rounded-xl border border-rose-300/40 bg-rose-600/10 p-4 text-sm text-rose-200">
            {(listQuery.error as Error).message}
          </div>
        ) : (
          <ArticleList
            items={listQuery.data?.results ?? []}
            selectedId={selectedId}
            onArticleOpen={handleArticleOpen}
          />
        )}
      </div>
    </div>
  );
}

function TabletDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 bg-black/50"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className="fixed left-0 top-0 z-40 h-full w-64 border-r border-border bg-panel p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-bold">Reader</div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <nav className="space-y-2 text-sm text-textMuted">
          <p className="rounded-lg bg-panel-muted px-3 py-2 text-text">Library</p>
          <p className="rounded-lg px-3 py-2">Later</p>
          <p className="rounded-lg px-3 py-2">Archive</p>
        </nav>
      </aside>
    </>
  );
}

export function LibraryRoute() {
  const { articleId } = useParams();
  const gateway = useContentGateway();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isTabletOrLarger = useMediaQuery("(min-width: 768px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => gateway.getArticle(articleId ?? ""),
    enabled: Boolean(articleId)
  });

  if (articleId) {
    if (isDesktop) {
      return (
        <div className="flex h-screen overflow-hidden">
          <LeftRail />
          <main className="flex min-h-0 flex-1 p-3">
            <ArticleDetailPane article={detailQuery.data} loading={detailQuery.isLoading} showBackLink />
          </main>
        </div>
      );
    }

    return (
      <div className="h-screen overflow-hidden bg-bg">
        <ArticleDetailPane article={detailQuery.data} loading={detailQuery.isLoading} compact showBackLink />
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="flex h-screen overflow-hidden">
        <LeftRail />
        <main className="flex min-h-0 flex-1 p-3">
          <ListPane />
        </main>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-bg">
      {isTabletOrLarger ? <TabletDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /> : null}

      <header className="sticky top-0 z-20 border-b border-border/80 bg-panel/95 px-4 py-3 backdrop-blur md:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isTabletOrLarger ? (
              <Button variant="ghost" className="px-2 py-2" onClick={() => setDrawerOpen(true)}>
                <Menu className="size-4" />
              </Button>
            ) : null}
            <Link to="/" className="text-sm font-semibold uppercase tracking-wide text-textMuted">
              Reader Library
            </Link>
          </div>
          <span className="text-xs text-textMuted">Saved reading</span>
        </div>
      </header>

      <main className="h-[calc(100vh-61px)] p-3 md:px-5 md:py-4">
        <ListPane compact />
      </main>
    </div>
  );
}
