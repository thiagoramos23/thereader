import crypto from "node:crypto";
import type Database from "better-sqlite3";
import type {
  Article,
  ArticleRepository,
  ArticleSummary,
  SearchResult,
  UpsertArticleInput,
  UpsertResult
} from "@reader/core";

interface ArticleRow {
  id: string;
  canonical_url: string;
  source_type: "article" | "feed";
  feed_url: string | null;
  title: string;
  excerpt: string | null;
  content_html: string;
  content_text: string;
  image_url: string | null;
  source_domain: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  score?: number;
}

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    canonicalUrl: row.canonical_url,
    sourceType: row.source_type,
    feedUrl: row.feed_url,
    title: row.title,
    excerpt: row.excerpt,
    contentHtml: row.content_html,
    contentText: row.content_text,
    imageUrl: row.image_url,
    sourceDomain: row.source_domain,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toSummary(row: ArticleRow): ArticleSummary {
  return {
    id: row.id,
    canonicalUrl: row.canonical_url,
    sourceType: row.source_type,
    title: row.title,
    excerpt: row.excerpt,
    imageUrl: row.image_url,
    sourceDomain: row.source_domain,
    publishedAt: row.published_at,
    updatedAt: row.updated_at
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export class SqliteArticleRepository implements ArticleRepository {
  constructor(private readonly db: Database.Database) {}

  upsert(input: UpsertArticleInput): UpsertResult {
    const existing = this.db
      .prepare("SELECT * FROM articles WHERE canonical_url = ?")
      .get(input.canonicalUrl) as ArticleRow | undefined;

    const timestamp = nowIso();

    if (existing) {
      this.db
        .prepare(
          `UPDATE articles
           SET source_type = ?, feed_url = ?, title = ?, excerpt = ?, content_html = ?, content_text = ?,
               image_url = ?, source_domain = ?, published_at = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(
          input.sourceType,
          input.feedUrl,
          input.title,
          input.excerpt,
          input.contentHtml,
          input.contentText,
          input.imageUrl,
          input.sourceDomain,
          input.publishedAt,
          timestamp,
          existing.id
        );

      const row = this.db
        .prepare("SELECT * FROM articles WHERE id = ?")
        .get(existing.id) as ArticleRow | undefined;

      if (!row) {
        throw new Error("Updated article row could not be loaded");
      }

      return {
        article: toArticle(row),
        operation: "updated"
      };
    }

    const id = crypto.randomUUID();

    this.db
      .prepare(
        `INSERT INTO articles(
          id, canonical_url, source_type, feed_url, title, excerpt,
          content_html, content_text, image_url, source_domain,
          published_at, created_at, updated_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.canonicalUrl,
        input.sourceType,
        input.feedUrl,
        input.title,
        input.excerpt,
        input.contentHtml,
        input.contentText,
        input.imageUrl,
        input.sourceDomain,
        input.publishedAt,
        timestamp,
        timestamp
      );

    const row = this.db.prepare("SELECT * FROM articles WHERE id = ?").get(id) as
      | ArticleRow
      | undefined;

    if (!row) {
      throw new Error("Inserted article row could not be loaded");
    }

    return {
      article: toArticle(row),
      operation: "created"
    };
  }

  getById(id: string): Article | null {
    const row = this.db.prepare("SELECT * FROM articles WHERE id = ?").get(id) as
      | ArticleRow
      | undefined;
    return row ? toArticle(row) : null;
  }

  listLatest(limit: number, offset: number): ArticleSummary[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM articles ORDER BY updated_at DESC LIMIT ? OFFSET ?"
      )
      .all(limit, offset) as ArticleRow[];

    return rows.map((row) => toSummary(row));
  }

  search(terms: string[], limit: number, offset: number): SearchResult[] {
    if (terms.length === 0) {
      return this.listLatest(limit, offset).map((row) => ({ ...row, score: 0 }));
    }

    const whereClauses: string[] = [];
    const scoreClauses: string[] = [];
    const scoreArgs: string[] = [];
    const whereArgs: string[] = [];

    for (const term of terms) {
      const likeTerm = `%${term}%`;
      whereClauses.push(
        "(LOWER(title) LIKE ? OR LOWER(COALESCE(excerpt, '')) LIKE ? OR LOWER(content_text) LIKE ?)"
      );
      whereArgs.push(likeTerm, likeTerm, likeTerm);

      scoreClauses.push(
        "CASE WHEN LOWER(title) LIKE ? THEN 3 ELSE 0 END +" +
          " CASE WHEN LOWER(COALESCE(excerpt, '')) LIKE ? THEN 2 ELSE 0 END +" +
          " CASE WHEN LOWER(content_text) LIKE ? THEN 1 ELSE 0 END"
      );
      scoreArgs.push(likeTerm, likeTerm, likeTerm);
    }

    const query = `
      SELECT *, (${scoreClauses.join(" + ")}) AS score
      FROM articles
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY score DESC, updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = this.db
      .prepare(query)
      .all(...scoreArgs, ...whereArgs, limit, offset) as ArticleRow[];

    return rows.map((row) => ({
      ...toSummary(row),
      score: row.score ?? 0
    }));
  }
}
