import { beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../db";
import { SqliteArticleRepository } from "../services/articleRepository";

function makeInput(url: string, title: string, contentText = "React rss reader content") {
  return {
    canonicalUrl: url,
    sourceType: "article" as const,
    feedUrl: null,
    title,
    excerpt: "short excerpt",
    contentHtml: "<p>content</p>",
    contentText,
    imageUrl: null,
    sourceDomain: "example.com",
    publishedAt: null
  };
}

describe("SqliteArticleRepository", () => {
  const db = createDatabase({ dbPath: ":memory:" });
  const repository = new SqliteArticleRepository(db);

  beforeEach(() => {
    db.exec("DELETE FROM articles");
  });

  it("upserts by canonical URL", () => {
    const created = repository.upsert(makeInput("https://example.com/post", "First Title"));
    const updated = repository.upsert(makeInput("https://example.com/post", "Updated Title"));

    expect(created.operation).toBe("created");
    expect(updated.operation).toBe("updated");

    const rows = repository.listLatest(10, 0);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Updated Title");
  });

  it("searches with AND semantics", () => {
    repository.upsert(
      makeInput("https://example.com/a", "React Routing", "react router and rss indexing")
    );
    repository.upsert(
      makeInput("https://example.com/b", "React", "react only term")
    );

    const results = repository.search(["react", "rss"], 10, 0);
    expect(results).toHaveLength(1);
    expect(results[0].canonicalUrl).toBe("https://example.com/a");
  });

  it("ranks title matches over body-only matches", () => {
    repository.upsert(
      makeInput("https://example.com/title", "React RSS", "generic body content")
    );
    repository.upsert(
      makeInput("https://example.com/body", "Generic", "react rss appear in body")
    );

    const results = repository.search(["react", "rss"], 10, 0);

    expect(results[0].canonicalUrl).toBe("https://example.com/title");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
