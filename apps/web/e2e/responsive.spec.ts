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

    if (url.includes("/api/articles/a1")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fullArticle)
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: "",
        results: [summary]
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

    await expect(page.getByText("React RSS Reader")).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasOverflow).toBeFalsy();

    await page.getByRole("link", { name: /React RSS Reader/i }).click();

    await expect(page.getByText("Full article body")).toBeVisible();

    if (viewport.name === "desktop") {
      await expect(page.getByText("Reader Library")).not.toBeVisible();
    } else {
      await expect(page.getByText("Back to list")).toBeVisible();
    }
  });
}
