import type { Router } from "express";
import { z } from "zod";

const querySchema = z.object({
  query: z.string().optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional()
});

export function registerArticleRoutes(
  router: Router,
  deps: {
    listArticles: (query: string, limit?: number, offset?: number) => {
      query: string;
      results: unknown[];
    };
    getArticle: (id: string) => unknown;
  }
) {
  router.get("/articles", (req, res) => {
    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ message: "Invalid query params" });
      return;
    }

    const query = parsed.data.query ?? "";
    const result = deps.listArticles(query, parsed.data.limit, parsed.data.offset);
    res.json(result);
  });

  router.get("/articles/:id", (req, res) => {
    const article = deps.getArticle(req.params.id);

    if (!article) {
      res.status(404).json({ message: "Article not found" });
      return;
    }

    res.json(article);
  });
}
