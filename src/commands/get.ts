/**
 * get command - Retrieve a specific documentation article
 */

import chalk from "chalk";
import { getDoc, withIndex, DocWithContent } from "../lib/index.js";
import { formatDocForOutput } from "../lib/markdown.js";
import { getSourceLabel } from "../lib/format.js";

interface GetOptions {
  json?: boolean;
  raw?: boolean;
  preview?: boolean;
  lines?: string;
}

const DEFAULT_PREVIEW_LINES = 50;

/**
 * Truncate content to a specified number of lines
 */
function truncateContent(content: string, maxLines: number): { content: string; truncated: boolean; totalLines: number } {
  const lines = content.split("\n");
  const totalLines = lines.length;
  
  if (lines.length <= maxLines) {
    return { content, truncated: false, totalLines };
  }
  
  return {
    content: lines.slice(0, maxLines).join("\n"),
    truncated: true,
    totalLines,
  };
}

/**
 * Check if a document is code (not documentation) based on its source
 */
function isCodeFile(doc: DocWithContent): boolean {
  return doc.source === "examples" || doc.source === "episodes";
}

export function getCommand(path: string, options: GetOptions = {}): void {
  const doc = withIndex(() => getDoc(path));

  if (!doc) {
    if (options.json) {
      console.log(JSON.stringify({ error: "Document not found", path }, null, 2));
      return;
    }
    console.error(chalk.red(`\n✗ Document not found: ${path}`));
    console.log(chalk.gray(`\nRun 'pf-docs list' to see available documents.`));
    console.log(chalk.gray(`Or search: pf-docs search "<query>"`));
    return;
  }

  // Determine preview lines
  const previewLines = options.lines 
    ? parseInt(options.lines, 10) 
    : DEFAULT_PREVIEW_LINES;

  // Apply preview mode for code files (examples/episodes)
  const shouldPreview = options.preview || (isCodeFile(doc) && !options.raw);
  
  let outputContent = doc.content;
  let truncationInfo = "";

  if (shouldPreview && !options.raw) {
    const { content, truncated, totalLines } = truncateContent(doc.content, previewLines);
    outputContent = content;
    
    if (truncated) {
      truncationInfo = `\n${chalk.gray(`... truncated (showing ${previewLines} of ${totalLines} lines)`)}\n${chalk.gray(`Use --raw for full content, or --lines=<n> for more`)}`;
    }
  }

  if (options.json) {
    const result: Record<string, unknown> = { ...doc, content: outputContent };
    if (truncationInfo) {
      result.truncated = true;
      result.previewLines = previewLines;
    }
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Raw output (just content, no header)
  if (options.raw) {
    console.log(doc.content);
    return;
  }

  // For code files, show with syntax hint
  if (isCodeFile(doc)) {
    console.log(`\n${getSourceLabel(doc.source)} ${chalk.bold(doc.title)}`);
    console.log(chalk.gray(`Path: ${doc.path}`));
    console.log(chalk.gray("─".repeat(60)));
    console.log(outputContent);
    if (truncationInfo) {
      console.log(truncationInfo);
    }
    return;
  }

  // Output the formatted document (clean markdown)
  console.log(formatDocForOutput({ ...doc, content: outputContent }));
  if (truncationInfo) {
    console.log(truncationInfo);
  }
}
