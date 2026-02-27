import { clampPagination, tokenizeQuery, type ArticleRepository } from "@reader/core";

export function searchArticles(
  repository: ArticleRepository,
  query: string,
  limit?: number,
  offset?: number
) {
  const normalizedLimit = clampPagination(limit, 30, 100);
  const normalizedOffset = clampPagination(offset, 0, 10_000);
  const terms = tokenizeQuery(query);

  if (terms.length === 0) {
    return {
      query: "",
      results: repository.listLatest(normalizedLimit, normalizedOffset).map((item) => ({
        ...item,
        score: 0
      }))
    };
  }

  return {
    query,
    results: repository.search(terms, normalizedLimit, normalizedOffset)
  };
}
