import type { Article, ContentGateway, ImportResult, SearchQuery, SearchResult } from "@reader/core";

interface ListResponse {
  query: string;
  results: SearchResult[];
}

export class HttpContentGateway implements ContentGateway {
  constructor(private readonly apiBaseUrl: string) {}

  async importUrl(url: string): Promise<ImportResult> {
    const response = await fetch(`${this.apiBaseUrl}/api/import`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return (await response.json()) as ImportResult;
  }

  async listArticles(query: SearchQuery): Promise<ListResponse> {
    const searchParams = new URLSearchParams();

    if (query.query) {
      searchParams.set("query", query.query);
    }

    if (query.limit !== undefined) {
      searchParams.set("limit", String(query.limit));
    }

    if (query.offset !== undefined) {
      searchParams.set("offset", String(query.offset));
    }

    const response = await fetch(`${this.apiBaseUrl}/api/articles?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return (await response.json()) as ListResponse;
  }

  async getArticle(id: string): Promise<Article> {
    const response = await fetch(`${this.apiBaseUrl}/api/articles/${id}`);

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return (await response.json()) as Article;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
