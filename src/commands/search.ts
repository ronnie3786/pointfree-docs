/**
 * search command - Search across all indexed documentation
 */

import chalk from "chalk";
import { search as searchIndex, withIndex } from "../lib/index.js";

interface SearchOptions {
  lib?: string;
  limit?: string;
  json?: boolean;
}

export function searchCommand(query: string, options: SearchOptions): void {
  const limit = options.limit ? parseInt(options.limit, 10) : 10;
  const results = withIndex(() => searchIndex(query, { lib: options.lib, limit }));

  if (options.json) {
    console.log(JSON.stringify({ query, results }, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(chalk.yellow(`\nNo results found for: "${query}"`));
    if (options.lib) {
      console.log(chalk.gray(`  (searched in library: ${options.lib})`));
    }
    console.log(chalk.gray(`\nTry a different query or run 'pf-docs list' to see available docs.`));
    return;
  }

  console.log(chalk.bold(`\n🔍 Search results for: "${query}"\n`));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    console.log(chalk.blue(`${i + 1}. ${result.title}`));
    console.log(chalk.gray(`   Path: ${result.path}`));
    console.log(chalk.gray(`   ${result.snippet}`));
    console.log();
  }

  console.log(chalk.gray(`\nTo view a document: pf-docs get <path>`));
  console.log(chalk.gray(`Example: pf-docs get ${results[0].path}`));
}
