/**
 * Search index using SQLite FTS5 for full-text search
 */

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { glob } from "glob";
import { basename, join } from "path";
import { PATHS, LibraryConfig, SourceType, EXAMPLES_CONFIG, EPISODES_CONFIG } from "../config.js";
import { getDocsPaths, getExamplesPaths, getEpisodesPath } from "./repos.js";
import { cleanMarkdown, extractTitle } from "./markdown.js";

export interface DocEntry {
  library: string;
  path: string;
  title: string;
  source: SourceType;
}

export interface DocWithContent extends DocEntry {
  content: string;
}

export interface IndexStats {
  totalDocs: number;
  byLibrary: Record<string, number>;
  bySource: Record<SourceType, number>;
}

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
      source TEXT NOT NULL DEFAULT 'docs',
      UNIQUE(library, path)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
      title,
      content,
      library,
      path,
      source,
      content='docs',
      content_rowid='id'
    );
  `);

  // Add source column if it doesn't exist (migration for existing databases)
  try {
    db.exec(`ALTER TABLE docs ADD COLUMN source TEXT NOT NULL DEFAULT 'docs'`);
  } catch {
    // Column already exists, ignore
  }

  // Drop and recreate triggers to ensure they include the source column
  // This handles migration from older schema versions
  db.exec(`
    DROP TRIGGER IF EXISTS docs_ai;
    DROP TRIGGER IF EXISTS docs_ad;
    DROP TRIGGER IF EXISTS docs_au;

    CREATE TRIGGER docs_ai AFTER INSERT ON docs BEGIN
      INSERT INTO docs_fts(rowid, title, content, library, path, source)
      VALUES (new.id, new.title, new.content, new.library, new.path, new.source);
    END;

    CREATE TRIGGER docs_ad AFTER DELETE ON docs BEGIN
      INSERT INTO docs_fts(docs_fts, rowid, title, content, library, path, source)
      VALUES ('delete', old.id, old.title, old.content, old.library, old.path, old.source);
    END;

    CREATE TRIGGER docs_au AFTER UPDATE ON docs BEGIN
      INSERT INTO docs_fts(docs_fts, rowid, title, content, library, path, source)
      VALUES ('delete', old.id, old.title, old.content, old.library, old.path, old.source);
      INSERT INTO docs_fts(rowid, title, content, library, path, source)
      VALUES (new.id, new.title, new.content, new.library, new.path, new.source);
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
    INSERT OR REPLACE INTO docs (library, path, title, content, source)
    VALUES (?, ?, ?, ?, ?)
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

        const cleanedContent = cleanMarkdown(content);
        const title = extractTitle(content) || basename(file, ".md");

        // Logical path like "tca/Testing" or "tca/Articles/Performance"
        const docPath = `${lib.shortName}/${file.replace(/\.md$/, "")}`;

        insertStmt.run(lib.shortName, docPath, title, cleanedContent, "docs");
        indexed++;
      } catch (error) {
        console.error(`  Warning: Failed to index ${fullPath}:`, error);
      }
    }
  }

  return indexed;
}

/**
 * Index TCA examples (CaseStudies, etc.)
 */
export function indexExamples(): number {
  const db = openIndex();
  const examplesPaths = getExamplesPaths();

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO docs (library, path, title, content, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  let indexed = 0;

  for (const examplesPath of examplesPaths) {
    if (!existsSync(examplesPath)) {
      continue;
    }

    // Find all Swift files
    for (const pattern of EXAMPLES_CONFIG.filePatterns) {
      const files = glob.sync(pattern, { cwd: examplesPath });

      for (const file of files) {
        const fullPath = join(examplesPath, file);

        try {
          const content = readFileSync(fullPath, "utf-8");

          // Extract title from filename or first struct/class
          const title = extractSwiftTitle(content) || basename(file, ".swift");
          
          // Get the example category from the path (e.g., "CaseStudies", "SyncUps")
          const category = basename(examplesPath);
          const docPath = `examples/${category}/${file}`;

          insertStmt.run("examples", docPath, title, content, "examples");
          indexed++;
        } catch (error) {
          console.error(`  Warning: Failed to index ${fullPath}:`, error);
        }
      }
    }
  }

  return indexed;
}

/**
 * Index episode code samples
 */
export function indexEpisodes(): number {
  const db = openIndex();
  const episodesPath = getEpisodesPath();

  if (!existsSync(episodesPath)) {
    return 0;
  }

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO docs (library, path, title, content, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  let indexed = 0;

  // Find all episode directories (0001-xxx, 0002-xxx, etc.)
  const episodeDirs = glob.sync("[0-9][0-9][0-9][0-9]-*", { cwd: episodesPath });

  for (const episodeDir of episodeDirs) {
    const episodePath = join(episodesPath, episodeDir);

    // Find all Swift files in this episode
    for (const pattern of EPISODES_CONFIG.filePatterns) {
      const files = glob.sync(pattern, { cwd: episodePath });

      for (const file of files) {
        const fullPath = join(episodePath, file);

        try {
          const content = readFileSync(fullPath, "utf-8");

          // Title: episode name + file name
          const episodeName = formatEpisodeName(episodeDir);
          const fileName = basename(file, ".swift");
          const title = `${episodeName}: ${fileName}`;

          const docPath = `episodes/${episodeDir}/${file}`;

          insertStmt.run("episodes", docPath, title, content, "episodes");
          indexed++;
        } catch (error) {
          console.error(`  Warning: Failed to index ${fullPath}:`, error);
        }
      }
    }
  }

  return indexed;
}

/**
 * Extract title from Swift file (first struct/class/enum name)
 */
function extractSwiftTitle(content: string): string | null {
  // Match struct, class, enum, or actor declarations
  const match = content.match(/(?:struct|class|enum|actor)\s+(\w+)/);
  return match ? match[1] : null;
}

/**
 * Format episode directory name to readable title
 * "0156-testable-state-pt1" -> "Episode 156: Testable State Pt1"
 */
function formatEpisodeName(dirName: string): string {
  const match = dirName.match(/^(\d+)-(.+)$/);
  if (!match) return dirName;

  const num = parseInt(match[1], 10);
  const name = match[2]
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return `Ep${num}: ${name}`;
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
  source: SourceType;
}

export function search(
  query: string,
  options: { lib?: string; limit?: number; source?: SourceType | "all" } = {}
): SearchResult[] {
  const db = openIndex();
  const limit = options.limit || 10;
  const source = options.source || "docs"; // Default to docs only

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
      bm25(docs_fts) as score,
      source
    FROM docs_fts
    WHERE docs_fts MATCH ?
  `;

  const params: (string | number)[] = [ftsQuery];

  if (options.lib) {
    sql += ` AND library = ?`;
    params.push(options.lib);
  }

  // Filter by source unless "all" is specified
  if (source !== "all") {
    sql += ` AND source = ?`;
    params.push(source);
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
function fallbackSearch(
  query: string,
  options: { lib?: string; limit?: number; source?: SourceType | "all" } = {}
): SearchResult[] {
  const db = openIndex();
  const limit = options.limit || 10;
  const source = options.source || "docs";

  let sql = `
    SELECT
      library,
      path,
      title,
      substr(content, 1, 200) as snippet,
      0 as score,
      source
    FROM docs
    WHERE (title LIKE ? OR content LIKE ?)
  `;

  const likePattern = `%${query}%`;
  const params: (string | number)[] = [likePattern, likePattern];

  if (options.lib) {
    sql += ` AND library = ?`;
    params.push(options.lib);
  }

  if (source !== "all") {
    sql += ` AND source = ?`;
    params.push(source);
  }

  sql += ` LIMIT ?`;
  params.push(limit);

  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as SearchResult[];
  } catch {
    return [];
  }
}

/**
 * List all indexed documents
 */
export function listDocs(lib?: string, source?: SourceType | "all"): DocEntry[] {
  const db = openIndex();

  let sql = `SELECT library, path, title, source FROM docs WHERE 1=1`;
  const params: string[] = [];

  if (lib) {
    sql += ` AND library = ?`;
    params.push(lib);
  }

  if (source && source !== "all") {
    sql += ` AND source = ?`;
    params.push(source);
  }

  sql += ` ORDER BY source, library, path`;

  const stmt = db.prepare(sql);
  return stmt.all(...params) as DocEntry[];
}

/**
 * Get a specific document by path
 */
export function getDoc(path: string): DocWithContent | null {
  const db = openIndex();

  const stmt = db.prepare(`SELECT library, path, title, content, source FROM docs WHERE path = ?`);
  return stmt.get(path) as DocWithContent | null;
}

/**
 * Get index statistics
 */
export function getStats(): IndexStats {
  const db = openIndex();

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM docs`);
  const total = (totalStmt.get() as { count: number }).count;

  const byLibStmt = db.prepare(`SELECT library, COUNT(*) as count FROM docs GROUP BY library`);
  const byLibRows = byLibStmt.all() as { library: string; count: number }[];
  const byLibrary = Object.fromEntries(byLibRows.map((row) => [row.library, row.count]));

  const bySourceStmt = db.prepare(`SELECT source, COUNT(*) as count FROM docs GROUP BY source`);
  const bySourceRows = bySourceStmt.all() as { source: SourceType; count: number }[];
  const bySource = Object.fromEntries(bySourceRows.map((row) => [row.source, row.count])) as Record<SourceType, number>;

  return { totalDocs: total, byLibrary, bySource };
}

/**
 * Run a function with the index open, closing it automatically afterward.
 */
export function withIndex<T>(fn: () => T): T {
  openIndex();
  try {
    return fn();
  } finally {
    closeIndex();
  }
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
