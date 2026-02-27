import { Readability } from "@mozilla/readability";
import { domainFromUrl, normalizeUrl, type ExtractedArticle } from "@reader/core";
import * as cheerio from "cheerio";
import { JSDOM, VirtualConsole } from "jsdom";
import sanitizeHtml from "sanitize-html";

export class ImportServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "ImportServiceError";
  }
}

const DEFAULT_TIMEOUT_MS = 12_000;
const CSS_PARSE_ERROR_MESSAGE = "Could not parse CSS stylesheet";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
    "strong",
    "em",
    "code",
    "pre",
    "img",
    "figure",
    "figcaption",
    "hr",
    "br"
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title"]
  },
  allowedSchemes: ["http", "https", "mailto"]
};

function trimText(value: string | null | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function fallbackExcerpt(contentText: string): string | null {
  const normalized = contentText.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 220);
}

function enforceHtmlContentType(contentType: string | null): void {
  if (!contentType) {
    return;
  }

  if (
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml") ||
    contentType.includes("application/xml") ||
    contentType.includes("text/xml")
  ) {
    return;
  }

  throw new ImportServiceError(`Unsupported content type: ${contentType}`, 415);
}

export async function extractArticleFromUrl(rawUrl: string): Promise<ExtractedArticle> {
  const canonicalUrl = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(canonicalUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "reader-app/0.1"
      }
    });
  } catch (error) {
    throw new ImportServiceError(
      error instanceof Error ? `Unable to fetch URL: ${error.message}` : "Unable to fetch URL",
      502
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ImportServiceError(`Failed to fetch URL: ${response.status}`, 502);
  }

  enforceHtmlContentType(response.headers.get("content-type"));

  const html = await response.text();
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => {
    if (error.message.includes(CSS_PARSE_ERROR_MESSAGE)) {
      return;
    }

    // Preserve non-CSS jsdom diagnostics for operational debugging.
    console.error(error);
  });

  const dom = new JSDOM(html, { url: canonicalUrl, virtualConsole });
  const reader = new Readability(dom.window.document);
  const parsed = reader.parse();

  const $ = cheerio.load(html);
  const titleFallback = trimText($("meta[property='og:title']").attr("content")) ??
    trimText($("title").text()) ??
    "Untitled";
  const imageFallback = trimText($("meta[property='og:image']").attr("content")) ??
    trimText($("article img").first().attr("src")) ??
    null;
  const publishedFallback =
    trimText($("meta[property='article:published_time']").attr("content")) ??
    trimText($("time").first().attr("datetime"));

  const rawContentHtml = parsed?.content ?? $("article").html() ?? "";
  const contentHtml = sanitizeHtml(rawContentHtml, SANITIZE_OPTIONS);
  const contentText = trimText(parsed?.textContent) ?? trimText($("body").text()) ?? "";

  if (!contentText) {
    throw new ImportServiceError("Could not extract readable content", 422);
  }

  return {
    canonicalUrl,
    title: trimText(parsed?.title) ?? titleFallback,
    excerpt: trimText(parsed?.excerpt) ?? fallbackExcerpt(contentText),
    contentHtml,
    contentText,
    imageUrl: imageFallback,
    sourceDomain: domainFromUrl(canonicalUrl),
    publishedAt: publishedFallback
  };
}
