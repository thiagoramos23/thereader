import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../app";
import { createDatabase } from "../db";
import { SqliteArticleRepository } from "../services/articleRepository";

describe("API routes", () => {
  const db = createDatabase({ dbPath: ":memory:" });
  const repository = new SqliteArticleRepository(db);

  beforeEach(() => {
    db.exec("DELETE FROM articles");
  });

  it("POST /api/import validates payload", async () => {
    const importer = {
      importFromUrl: vi.fn()
    };

    const { app } = createApp({ db, repository, importer });

    const response = await request(app).post("/api/import").send({ url: "not-a-url" });

    expect(response.status).toBe(400);
    expect(importer.importFromUrl).not.toHaveBeenCalled();
  });

  it("GET /api/articles returns search results", async () => {
    repository.upsert({
      canonicalUrl: "https://example.com/react-rss",
      sourceType: "article",
      feedUrl: null,
      title: "React RSS",
      excerpt: "reader app",
      contentHtml: "<p>React RSS Reader</p>",
      contentText: "React RSS Reader",
      imageUrl: null,
      sourceDomain: "example.com",
      publishedAt: null
    });

    repository.upsert({
      canonicalUrl: "https://example.com/react-only",
      sourceType: "article",
      feedUrl: null,
      title: "React",
      excerpt: "other",
      contentHtml: "<p>React only</p>",
      contentText: "React only",
      imageUrl: null,
      sourceDomain: "example.com",
      publishedAt: null
    });

    const { app } = createApp({
      db,
      repository,
      importer: {
        importFromUrl: vi.fn()
      }
    });

    const response = await request(app).get("/api/articles").query({ query: "react rss" });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0].canonicalUrl).toBe("https://example.com/react-rss");
  });

  it("GET /api/articles/:id returns full article", async () => {
    const inserted = repository.upsert({
      canonicalUrl: "https://example.com/full",
      sourceType: "article",
      feedUrl: null,
      title: "Full",
      excerpt: "excerpt",
      contentHtml: "<p>Body</p>",
      contentText: "Body",
      imageUrl: null,
      sourceDomain: "example.com",
      publishedAt: null
    });

    const { app } = createApp({
      db,
      repository,
      importer: {
        importFromUrl: vi.fn()
      }
    });

    const response = await request(app).get(`/api/articles/${inserted.article.id}`);

    expect(response.status).toBe(200);
    expect(response.body.contentHtml).toContain("<p>Body</p>");
  });
});
