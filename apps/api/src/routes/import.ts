import type { Router } from "express";
import { z } from "zod";

const schema = z.object({
  url: z.string().url()
});

export function registerImportRoutes(router: Router, importHandler: (url: string) => Promise<unknown>) {
  router.post("/import", async (req, res) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ message: "Invalid URL payload" });
      return;
    }

    try {
      const result = await importHandler(parsed.data.url);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      res.status(500).json({ message });
    }
  });
}
