import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDatabase } from "../db";
import { SqliteArticleRepository } from "../services/articleRepository";
import { DefaultImporterService } from "../services/importer";

const { extractArticleFromUrl, isFeedUrl, parseFeedItems } = vi.hoisted(() => ({
  extractArticleFromUrl: vi.fn(),
  isFeedUrl: vi.fn(),
  parseFeedItems: vi.fn()
}));

vi.mock("../services/extractArticle", () => ({
  extractArticleFromUrl,
  ImportServiceError: class extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

vi.mock("../services/importFeed", () => ({
  isFeedUrl,
  parseFeedItems
}));

function extracted(url: string, title: string) {
  return {
    canonicalUrl: url,
    title,
    excerpt: "excerpt",
    contentHtml: "<p>hello</p>",
    contentText: "hello world",
    imageUrl: null,
    sourceDomain: "example.com",
    publishedAt: null
  };
}

describe("DefaultImporterService", () => {
  const db = createDatabase({ dbPath: ":memory:" });
  const repository = new SqliteArticleRepository(db);
  const importer = new DefaultImporterService({ repository });

  beforeEach(() => {
    db.exec("DELETE FROM articles");
    vi.clearAllMocks();
  });

  it("imports article URLs", async () => {
    isFeedUrl.mockResolvedValue(false);
    extractArticleFromUrl.mockResolvedValue(extracted("https://example.com/a", "Article A"));

    const result = await importer.importFromUrl({ url: "https://example.com/a" });

    expect(result.mode).toBe("article");
    expect(result.created).toBe(1);
    expect(result.errors).toEqual([]);
  });

  it("imports only latest 5 entries from feeds", async () => {
    isFeedUrl.mockResolvedValue(true);
    parseFeedItems.mockResolvedValue([
      { link: "https://example.com/1", publishedAt: null },
      { link: "https://example.com/2", publishedAt: null },
      { link: "https://example.com/3", publishedAt: null },
      { link: "https://example.com/4", publishedAt: null },
      { link: "https://example.com/5", publishedAt: null }
    ]);

    extractArticleFromUrl.mockImplementation(async (url: string) => extracted(url, url));

    const result = await importer.importFromUrl({ url: "https://example.com/feed.xml" });

    expect(result.mode).toBe("feed");
    expect(result.created).toBe(5);
    expect(result.imported).toHaveLength(5);
  });

  it("upserts duplicate URLs", async () => {
    isFeedUrl.mockResolvedValue(false);
    extractArticleFromUrl.mockResolvedValue(extracted("https://example.com/same", "Title 1"));

    const first = await importer.importFromUrl({ url: "https://example.com/same" });

    extractArticleFromUrl.mockResolvedValue(extracted("https://example.com/same", "Title 2"));

    const second = await importer.importFromUrl({ url: "https://example.com/same" });

    expect(first.created).toBe(1);
    expect(second.updated).toBe(1);

    const [stored] = repository.listLatest(10, 0);
    expect(stored.title).toBe("Title 2");
  });
});
