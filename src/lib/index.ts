/**
 * Search index using SQLite FTS5 for full-text search
 */

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { glob } from "glob";
import { basename, join } from "path";
import { PATHS, LibraryConfig } from "../config.js";
import { getDocsPaths } from "./repos.js";
import { cleanMarkdown, extractTitle } from "./markdown.js";

let db: Database.Database | null = null;

/**
 * Initialize or open the search index database
 */
export function openIndex(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  if (!existsSync(PATHS.dataDir)) {
    mkdirSync(PATHS.dataDir, { recursive: true });
  }

  db = new Database(PATHS.indexDb);

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS docs (
      id INTEGER PRIMARY KEY,
      library TEXT NOT NULL,
      path TEXT NOT NULL,
      title TEXT,
      content TEXT,
      UNIQUE(library, path)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
      title,
      content,
      library,
      path,
      content='docs',
      content_rowid='id'
    );

    -- Triggers to keep FTS index in sync
    CREATE TRIGGER IF NOT EXISTS docs_ai AFTER INSERT ON docs BEGIN
      INSERT INTO docs_fts(rowid, title, content, library, path)
      VALUES (new.id, new.title, new.content, new.library, new.path);
    END;

    CREATE TRIGGER IF NOT EXISTS docs_ad AFTER DELETE ON docs BEGIN
      INSERT INTO docs_fts(docs_fts, rowid, title, content, library, path)
      VALUES ('delete', old.id, old.title, old.content, old.library, old.path);
    END;

    CREATE TRIGGER IF NOT EXISTS docs_au AFTER UPDATE ON docs BEGIN
      INSERT INTO docs_fts(docs_fts, rowid, title, content, library, path)
      VALUES ('delete', old.id, old.title, old.content, old.library, old.path);
      INSERT INTO docs_fts(rowid, title, content, library, path)
      VALUES (new.id, new.title, new.content, new.library, new.path);
    END;
  `);

  return db;
}

/**
 * Index all documentation files for a library
 */
export function indexLibrary(lib: LibraryConfig): number {
  const db = openIndex();
  const docsPaths = getDocsPaths(lib);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO docs (library, path, title, content)
    VALUES (?, ?, ?, ?)
  `);

  let indexed = 0;

  for (const docsPath of docsPaths) {
    if (!existsSync(docsPath)) {
      // Skip if this docs path doesn't exist (some may be optional)
      continue;
    }

    // Find all markdown files
    const mdFiles = glob.sync("**/*.md", { cwd: docsPath });

    for (const file of mdFiles) {
      const fullPath = join(docsPath, file);
      
      try {
        const content = readFileSync(fullPath, "utf-8");

        // Clean the markdown and extract title
        const cleanedContent = cleanMarkdown(content);
        const title = extractTitle(content) || basename(file, ".md");

        // Create a logical path like "tca/Testing" or "tca/Articles/Performance"
        const docPath = `${lib.shortName}/${file.replace(/\.md$/, "")}`;

        insertStmt.run(lib.shortName, docPath, title, cleanedContent);
        indexed++;
      } catch (error) {
        console.error(`  Warning: Failed to index ${fullPath}:`, error);
      }
    }
  }

  return indexed;
}

/**
 * Search the index
 */
export interface SearchResult {
  library: string;
  path: string;
  title: string;
  snippet: string;
  score: number;
}

export function search(query: string, options: { lib?: string; limit?: number } = {}): SearchResult[] {
  const db = openIndex();
  const limit = options.limit || 10;

  // Escape special FTS5 characters and format query
  const ftsQuery = query
    .replace(/['"]/g, "") // Remove quotes
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term}"*`) // Prefix matching
    .join(" ");

  if (!ftsQuery) {
    return [];
  }

  let sql = `
    SELECT
      library,
      path,
      title,
      snippet(docs_fts, 1, '**', '**', '...', 32) as snippet,
      bm25(docs_fts) as score
    FROM docs_fts
    WHERE docs_fts MATCH ?
  `;

  const params: (string | number)[] = [ftsQuery];

  if (options.lib) {
    sql += ` AND library = ?`;
    params.push(options.lib);
  }

  sql += ` ORDER BY score LIMIT ?`;
  params.push(limit);

  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as SearchResult[];
  } catch (error) {
    // If FTS query fails, try simpler LIKE search
    console.error("FTS search failed, falling back to LIKE search:", error);
    return fallbackSearch(query, options);
  }
}

/**
 * Fallback search using LIKE (when FTS fails)
 */
function fallbackSearch(query: string, options: { lib?: string; limit?: number } = {}): SearchResult[] {
  const db = openIndex();
  const limit = options.limit || 10;

  let sql = `
    SELECT
      library,
      path,
      title,
      substr(content, 1, 200) as snippet,
      0 as score
    FROM docs
    WHERE (title LIKE ? OR content LIKE ?)
  `;

  const likePattern = `%${query}%`;
  const params: (string | number)[] = [likePattern, likePattern];

  if (options.lib) {
    sql += ` AND library = ?`;
    params.push(options.lib);
  }

  sql += ` LIMIT ?`;
  params.push(limit);

  const stmt = db.prepare(sql);
  return stmt.all(...params) as SearchResult[];
}

/**
 * List all indexed documents
 */
export function listDocs(lib?: string): { library: string; path: string; title: string }[] {
  const db = openIndex();

  let sql = `SELECT library, path, title FROM docs`;
  const params: string[] = [];

  if (lib) {
    sql += ` WHERE library = ?`;
    params.push(lib);
  }

  sql += ` ORDER BY library, path`;

  const stmt = db.prepare(sql);
  return stmt.all(...params) as { library: string; path: string; title: string }[];
}

/**
 * Get a specific document by path
 */
export function getDoc(path: string): { library: string; path: string; title: string; content: string } | null {
  const db = openIndex();

  const stmt = db.prepare(`SELECT library, path, title, content FROM docs WHERE path = ?`);
  return stmt.get(path) as { library: string; path: string; title: string; content: string } | null;
}

/**
 * Get index statistics
 */
export function getStats(): { totalDocs: number; byLibrary: Record<string, number> } {
  const db = openIndex();

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM docs`);
  const total = (totalStmt.get() as { count: number }).count;

  const byLibStmt = db.prepare(`SELECT library, COUNT(*) as count FROM docs GROUP BY library`);
  const byLibRows = byLibStmt.all() as { library: string; count: number }[];

  const byLibrary: Record<string, number> = {};
  for (const row of byLibRows) {
    byLibrary[row.library] = row.count;
  }

  return { totalDocs: total, byLibrary };
}

/**
 * Close the database connection
 */
export function closeIndex(): void {
  if (db) {
    db.close();
    db = null;
  }
}
