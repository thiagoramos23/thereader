import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article, ContentGateway, ImportResult, SearchQuery } from "@reader/core";

import { GatewayProvider } from "../lib/gatewayContext";
import { LibraryRoute } from "../routes/LibraryRoute";

class FakeGateway implements ContentGateway {
  importSpy = vi.fn(async (_url: string) => this.importResult);

  constructor(
    private readonly article: Article,
    private readonly importResult: ImportResult
  ) {}

  async importUrl(url: string): Promise<ImportResult> {
    return this.importSpy(url);
  }

  async listArticles(_query: SearchQuery) {
    return {
      query: "",
      results: [
        {
          id: this.article.id,
          canonicalUrl: this.article.canonicalUrl,
          sourceType: this.article.sourceType,
          title: this.article.title,
          excerpt: this.article.excerpt,
          imageUrl: this.article.imageUrl,
          sourceDomain: this.article.sourceDomain,
          publishedAt: this.article.publishedAt,
          updatedAt: this.article.updatedAt,
          score: 10
        }
      ]
    };
  }

  async getArticle(_id: string): Promise<Article> {
    return this.article;
  }
}

function renderRoute(initialEntry: string) {
  const article: Article = {
    id: "a1",
    canonicalUrl: "https://example.com/a1",
    sourceType: "article",
    feedUrl: null,
    title: "React RSS Reader",
    excerpt: "A short preview",
    contentHtml: "<p>Full article body</p>",
    contentText: "Full article body",
    imageUrl: null,
    sourceDomain: "example.com",
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const gateway = new FakeGateway(article, {
    mode: "article",
    imported: [
      {
        id: article.id,
        canonicalUrl: article.canonicalUrl,
        sourceType: article.sourceType,
        title: article.title,
        excerpt: article.excerpt,
        imageUrl: article.imageUrl,
        sourceDomain: article.sourceDomain,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt
      }
    ],
    created: 1,
    updated: 0,
    errors: []
  });

  const queryClient = new QueryClient();
  const router = createMemoryRouter(
    [
      { path: "/", element: <LibraryRoute /> },
      { path: "/article/:articleId", element: <LibraryRoute /> }
    ],
    {
      initialEntries: [initialEntry]
    }
  );

  render(
    <QueryClientProvider client={queryClient}>
      <GatewayProvider gateway={gateway}>
        <RouterProvider router={router} />
      </GatewayProvider>
    </QueryClientProvider>
  );

  return { gateway, router };
}

describe("LibraryRoute", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.innerWidth = 390;
  });

  it("submits import URL", async () => {
    const { gateway } = renderRoute("/");

    await userEvent.click(screen.getAllByRole("button", { name: "Import" })[0]);
    await userEvent.type(screen.getByLabelText("URL input"), "https://example.com");
    await userEvent.click(screen.getAllByRole("button", { name: "Import" })[1]);

    await waitFor(() => {
      expect(gateway.importSpy).toHaveBeenCalledWith("https://example.com");
    });
  });

  it("navigates to detail when clicking list item", async () => {
    renderRoute("/");

    await userEvent.click(await screen.findByRole("link", { name: /React RSS Reader/i }));

    expect(await screen.findByText("Back to list")).toBeInTheDocument();
    expect(await screen.findByText("Full article body")).toBeInTheDocument();
  });

  it("renders list-only view on desktop when no article is selected", async () => {
    window.innerWidth = 1440;
    renderRoute("/");

    expect(await screen.findByText("React RSS Reader")).toBeInTheDocument();
    expect(screen.queryByText("Select an article to read.")).not.toBeInTheDocument();
  });

  it("shows in-page back navigation on desktop article detail page", async () => {
    window.innerWidth = 1440;
    renderRoute("/article/a1");

    expect(await screen.findByText("Back to list")).toBeInTheDocument();
    expect(await screen.findByText("Full article body")).toBeInTheDocument();
  });

  it("restores list search and scroll after returning from detail", async () => {
    renderRoute("/");

    const search = await screen.findByPlaceholderText("Search saved articles");
    await userEvent.type(search, "react");

    const scrollContainer = await screen.findByTestId("article-list-scroll");
    scrollContainer.scrollTop = 140;

    await userEvent.click(await screen.findByRole("link", { name: /React RSS Reader/i }));
    expect(await screen.findByText("Full article body")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: /Back to list/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search saved articles")).toHaveValue("react");
      expect(screen.getByTestId("article-list-scroll").scrollTop).toBe(140);
    });
  });
});
