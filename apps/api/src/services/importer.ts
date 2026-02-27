import {
  normalizeUrl,
  type ArticleRepository,
  type ImportError,
  type ImportInput,
  type ImportResult,
  type ImporterService,
  type ArticleSummary
} from "@reader/core";

import { extractArticleFromUrl, ImportServiceError } from "./extractArticle";
import { isFeedUrl, parseFeedItems } from "./importFeed";

const FEED_IMPORT_LIMIT = 5;

interface ImporterServiceDeps {
  repository: ArticleRepository;
}

export class DefaultImporterService implements ImporterService {
  constructor(private readonly deps: ImporterServiceDeps) {}

  async importFromUrl(input: ImportInput): Promise<ImportResult> {
    const normalizedUrl = normalizeUrl(input.url);
    const feedMode = await isFeedUrl(normalizedUrl);

    if (feedMode) {
      return this.importFeed(normalizedUrl);
    }

    return this.importArticle(normalizedUrl, "article", null);
  }

  private async importFeed(feedUrl: string): Promise<ImportResult> {
    const feedItems = await parseFeedItems(feedUrl, FEED_IMPORT_LIMIT);

    const imported: ArticleSummary[] = [];
    const errors: ImportError[] = [];
    let created = 0;
    let updated = 0;

    for (const item of feedItems) {
      try {
        const result = await this.importArticle(item.link, "feed", feedUrl);
        imported.push(...result.imported);
        created += result.created;
        updated += result.updated;
      } catch (error) {
        errors.push({
          url: item.link,
          message:
            error instanceof Error ? error.message : "Unknown feed item import error"
        });
      }
    }

    return {
      mode: "feed",
      imported,
      created,
      updated,
      errors
    };
  }

  private async importArticle(
    articleUrl: string,
    sourceType: "article" | "feed",
    feedUrl: string | null
  ): Promise<ImportResult> {
    try {
      const extracted = await extractArticleFromUrl(articleUrl);
      const result = this.deps.repository.upsert({
        canonicalUrl: extracted.canonicalUrl,
        sourceType,
        feedUrl,
        title: extracted.title,
        excerpt: extracted.excerpt,
        contentHtml: extracted.contentHtml,
        contentText: extracted.contentText,
        imageUrl: extracted.imageUrl,
        sourceDomain: extracted.sourceDomain,
        publishedAt: extracted.publishedAt
      });

      return {
        mode: sourceType,
        imported: [
          {
            id: result.article.id,
            canonicalUrl: result.article.canonicalUrl,
            sourceType: result.article.sourceType,
            title: result.article.title,
            excerpt: result.article.excerpt,
            imageUrl: result.article.imageUrl,
            sourceDomain: result.article.sourceDomain,
            publishedAt: result.article.publishedAt,
            updatedAt: result.article.updatedAt
          }
        ],
        created: result.operation === "created" ? 1 : 0,
        updated: result.operation === "updated" ? 1 : 0,
        errors: []
      };
    } catch (error) {
      if (error instanceof ImportServiceError) {
        return {
          mode: sourceType,
          imported: [],
          created: 0,
          updated: 0,
          errors: [{ url: articleUrl, message: error.message }]
        };
      }

      throw error;
    }
  }
}
