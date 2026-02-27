import { afterEach, describe, expect, it, vi } from "vitest";

import { extractArticleFromUrl } from "../services/extractArticle";

describe("extractArticleFromUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not emit noisy CSS parse errors for malformed style tags", async () => {
    const html = `
      <html>
        <head>
          <title>Broken CSS Article</title>
          <style>@layer x { .a { color: red; } }</style>
        </head>
        <body>
          <article><p>Hello world</p></article>
        </body>
      </html>
    `;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html"
        }
      })
    );

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await extractArticleFromUrl("https://example.com/broken-css");

    expect(result.title).toContain("Broken CSS Article");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
