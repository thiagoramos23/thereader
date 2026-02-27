export type SourceType = "article" | "feed";

export interface Article {
  id: string;
  canonicalUrl: string;
  sourceType: SourceType;
  feedUrl: string | null;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  contentText: string;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleSummary {
  id: string;
  canonicalUrl: string;
  sourceType: SourceType;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult extends ArticleSummary {
  score: number;
}

export interface ImportError {
  url: string;
  message: string;
}

export interface ImportResult {
  mode: SourceType;
  imported: ArticleSummary[];
  created: number;
  updated: number;
  errors: ImportError[];
}

export interface ImportInput {
  url: string;
}

export interface UpsertArticleInput {
  canonicalUrl: string;
  sourceType: SourceType;
  feedUrl: string | null;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  contentText: string;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: string | null;
}

export interface UpsertResult {
  article: Article;
  operation: "created" | "updated";
}

export interface ArticleRepository {
  upsert(input: UpsertArticleInput): UpsertResult;
  getById(id: string): Article | null;
  listLatest(limit: number, offset: number): ArticleSummary[];
  search(terms: string[], limit: number, offset: number): SearchResult[];
}

export interface ExtractedArticle {
  canonicalUrl: string;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  contentText: string;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: string | null;
}

export interface ImporterService {
  importFromUrl(input: ImportInput): Promise<ImportResult>;
}

export interface ContentGateway {
  importUrl(url: string): Promise<ImportResult>;
  listArticles(query: SearchQuery): Promise<{
    query: string;
    results: SearchResult[];
  }>;
  getArticle(id: string): Promise<Article>;
}
