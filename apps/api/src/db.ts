import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

export interface DatabaseOptions {
  dbPath?: string;
  migrationsPath?: string;
}

export function createDatabase(options: DatabaseOptions = {}): Database.Database {
  const srcDir = path.dirname(fileURLToPath(import.meta.url));
  const dbPath =
    options.dbPath ?? process.env.DB_PATH ?? path.join(process.cwd(), "data/reader.db");

  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  const migrationsPath =
    options.migrationsPath ?? path.join(srcDir, "migrations");

  runMigrations(db, migrationsPath);

  return db;
}

function runMigrations(db: Database.Database, migrationsPath: string): void {
  if (!fs.existsSync(migrationsPath)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsPath, file), "utf8");
    db.exec(sql);
  }
}
