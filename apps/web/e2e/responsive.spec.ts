import { expect, test } from "@playwright/test";

const summary = {
  id: "a1",
  canonicalUrl: "https://example.com/a1",
  sourceType: "article",
  title: "React RSS Reader",
  excerpt: "A short preview",
  imageUrl: null,
  sourceDomain: "example.com",
  publishedAt: null,
  updatedAt: new Date().toISOString(),
  score: 10
};

const summaries = [
  summary,
  ...Array.from({ length: 20 }, (_, index) => ({
    id: `a${index + 2}`,
    canonicalUrl: `https://example.com/a${index + 2}`,
    sourceType: "article" as const,
    title: `Saved Article ${index + 2}`,
    excerpt: "A short preview",
    imageUrl: null,
    sourceDomain: "example.com",
    publishedAt: null,
    updatedAt: new Date().toISOString(),
    score: 5
  }))
];

const fullArticle = {
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

test.beforeEach(async ({ page }) => {
  await page.route("**/api/articles**", async (route) => {
    const url = route.request().url();

    if (/\/api\/articles\/[^/?]+$/.test(url)) {
      const articleId = url.split("/api/articles/")[1] ?? fullArticle.id;
      const detail = {
        ...fullArticle,
        id: articleId
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(detail)
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: "",
        results: summaries
      })
    });
  });

  await page.route("**/api/import", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        mode: "article",
        imported: [summary],
        created: 1,
        updated: 0,
        errors: []
      })
    });
  });
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1440, height: 900 }
]) {
  test(`responsive behavior on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    await expect(page.getByRole("link", { name: /React RSS Reader/i })).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasOverflow).toBeFalsy();

    await page.getByRole("link", { name: /React RSS Reader/i }).click();

    await expect(page.getByText("Full article body")).toBeVisible();
    await expect(page.getByText("Back to list")).toBeVisible();
  });

  test(`restores list search and scroll on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const searchResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/articles?") && response.url().includes("query=react")
    );
    await page.getByPlaceholder("Search saved articles").fill("react");
    await searchResponse;

    const listScroll = page.getByTestId("article-list-scroll");
    await listScroll.evaluate((node) => {
      node.scrollTop = 220;
    });
    await expect.poll(async () => listScroll.evaluate((node) => node.scrollTop)).toBe(220);
    const previousScrollTop = await listScroll.evaluate((node) => node.scrollTop);

    await page.getByRole("link", { name: /Saved Article 6/i }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = sessionStorage.getItem("reader:list-view-state");
          if (!raw) {
            return null;
          }

          const parsed = JSON.parse(raw) as { search: string; scrollTop: number };
          return parsed;
        })
      )
      .toEqual({ search: "react", scrollTop: previousScrollTop });
    await page.getByRole("link", { name: "Back to list" }).click();

    await expect(page.getByPlaceholder("Search saved articles")).toHaveValue("react");
    await expect.poll(async () => listScroll.evaluate((node) => node.scrollTop)).toBe(previousScrollTop);
  });
}
