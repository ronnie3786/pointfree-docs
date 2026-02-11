/**
 * get command - Retrieve a specific documentation article
 */

import chalk from "chalk";
import { getDoc, withIndex } from "../lib/index.js";
import { formatDocForOutput } from "../lib/markdown.js";

interface GetOptions {
  json?: boolean;
  raw?: boolean;
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

  if (options.json) {
    console.log(JSON.stringify(doc, null, 2));
    return;
  }

  // Raw output (just content, no header)
  if (options.raw) {
    console.log(doc.content);
    return;
  }

  // Output the formatted document (clean markdown)
  console.log(formatDocForOutput(doc));
}
