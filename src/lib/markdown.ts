/**
 * Markdown processing utilities
 *
 * Handles DocC-flavored markdown and converts it to clean, AI-friendly markdown.
 */

import type { DocWithContent } from "./index.js";

/**
 * Extract the title from a markdown document
 * Handles both standard markdown headers and DocC frontmatter
 */
export function extractTitle(content: string): string | null {
  // Try to find a DocC title directive: # ``SymbolName``
  const doccTitleMatch = content.match(/^#\s+``([^`]+)``/m);
  if (doccTitleMatch) {
    return doccTitleMatch[1];
  }

  // Try standard markdown h1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Try YAML frontmatter title
  const yamlMatch = content.match(/^---\s*\n.*?title:\s*(.+?)\n.*?---/s);
  if (yamlMatch) {
    return yamlMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  return null;
}

/**
 * Clean DocC-flavored markdown for better search and AI consumption
 */
export function cleanMarkdown(content: string): string {
  let cleaned = content;

  // Remove DocC directives like @Metadata, @Options, etc.
  cleaned = cleaned.replace(/@\w+\s*\{[^}]*\}/g, "");

  // Convert DocC symbol references ``Symbol`` to just Symbol
  cleaned = cleaned.replace(/``([^`]+)``/g, "$1");

  // Convert DocC links like <doc:ArticleName> to [ArticleName]
  cleaned = cleaned.replace(/<doc:([^>]+)>/g, "[$1]");

  // Remove @Row, @Column and other DocC layout directives
  cleaned = cleaned.replace(/@(Row|Column|Image|Video|Links|TabNavigator|Tab)\s*(\{[^}]*\})?/g, "");

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Format a document for output to the terminal/AI
 */
export function formatDocForOutput(doc: DocWithContent): string {
  const header = `# ${doc.title}

> Library: ${doc.library}
> Path: ${doc.path}

---

`;

  return header + doc.content;
}
