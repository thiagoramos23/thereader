import Parser from "rss-parser";

export interface FeedItemCandidate {
  link: string;
  publishedAt: string | null;
}

const parser = new Parser();

export async function parseFeedItems(feedUrl: string, limit = 5): Promise<FeedItemCandidate[]> {
  const feed = await parser.parseURL(feedUrl);

  const items = (feed.items ?? [])
    .map((item) => {
      const link = item.link?.trim();
      if (!link) {
        return null;
      }

      return {
        link,
        publishedAt: item.isoDate ?? item.pubDate ?? null
      };
    })
    .filter((item): item is FeedItemCandidate => Boolean(item));

  return items.slice(0, limit);
}

export async function isFeedUrl(url: string): Promise<boolean> {
  try {
    const items = await parseFeedItems(url, 1);
    return items.length > 0;
  } catch {
    return false;
  }
}
