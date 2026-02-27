import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpContentGateway } from "../gateway/httpContentGateway";

describe("HttpContentGateway", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls import endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        mode: "article",
        imported: [],
        created: 1,
        updated: 0,
        errors: []
      })
    } as Response);

    const gateway = new HttpContentGateway("http://localhost:4000");
    await gateway.importUrl("https://example.com");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/api/import", expect.any(Object));
  });

  it("calls list endpoint with query", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({ query: "react", results: [] })
    } as Response);

    const gateway = new HttpContentGateway("http://localhost:4000");
    await gateway.listArticles({ query: "react", limit: 10, offset: 0 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/api/articles");
    expect(url).toContain("query=react");
    expect(url).toContain("limit=10");
  });

  it("calls article detail endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "1",
        canonicalUrl: "https://example.com",
        sourceType: "article",
        feedUrl: null,
        title: "Title",
        excerpt: null,
        contentHtml: "<p>Hello</p>",
        contentText: "Hello",
        imageUrl: null,
        sourceDomain: "example.com",
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } as Response);

    const gateway = new HttpContentGateway("http://localhost:4000");
    await gateway.getArticle("1");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/api/articles/1");
  });
});
