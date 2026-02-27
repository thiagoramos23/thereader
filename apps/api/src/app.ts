import cors from "cors";
import express from "express";
import type Database from "better-sqlite3";
import type { ImporterService } from "@reader/core";

import { createDatabase } from "./db";
import { registerArticleRoutes } from "./routes/articles";
import { registerImportRoutes } from "./routes/import";
import { SqliteArticleRepository } from "./services/articleRepository";
import { DefaultImporterService } from "./services/importer";
import { searchArticles } from "./services/search";

export interface AppContext {
  db: Database.Database;
  repository: SqliteArticleRepository;
  importer: Pick<ImporterService, "importFromUrl">;
}

export function createApp(contextOverrides?: Partial<AppContext>) {
  const db = contextOverrides?.db ?? createDatabase();
  const repository = contextOverrides?.repository ?? new SqliteArticleRepository(db);
  const importer = contextOverrides?.importer ?? new DefaultImporterService({ repository });

  const app = express();

  app.use(cors());
  app.use(express.json());

  const apiRouter = express.Router();

  registerImportRoutes(apiRouter, async (url) => importer.importFromUrl({ url }));
  registerArticleRoutes(apiRouter, {
    listArticles: (query, limit, offset) => searchArticles(repository, query, limit, offset),
    getArticle: (id) => repository.getById(id)
  });

  app.use("/api", apiRouter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  return {
    app,
    context: {
      db,
      repository,
      importer
    }
  };
}
