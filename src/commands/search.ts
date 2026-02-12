/**
 * search command - Search across all indexed documentation
 */

import chalk from "chalk";
import { search as searchIndex, withIndex } from "../lib/index.js";
import { SourceType, SOURCE_TYPES } from "../config.js";
import { getSourceLabel } from "../lib/format.js";

interface SearchOptions {
  lib?: string;
  limit?: string;
  json?: boolean;
  source?: string;
}

export function searchCommand(query: string, options: SearchOptions): void {
  const limit = options.limit ? parseInt(options.limit, 10) : 10;
  
  // Validate source option
  let source: SourceType | "all" = "docs"; // Default to docs only
  if (options.source) {
    if (options.source === "all" || SOURCE_TYPES.includes(options.source as SourceType)) {
      source = options.source as SourceType | "all";
    } else {
      console.log(chalk.red(`Invalid source: ${options.source}`));
      console.log(chalk.gray(`Valid sources: ${SOURCE_TYPES.join(", ")}, all`));
      return;
    }
  }

  const results = withIndex(() => searchIndex(query, { lib: options.lib, limit, source }));

  if (options.json) {
    console.log(JSON.stringify({ query, source, results }, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(chalk.yellow(`\nNo results found for: "${query}"`));
    if (options.lib) {
      console.log(chalk.gray(`  (searched in library: ${options.lib})`));
    }
    if (source !== "all") {
      console.log(chalk.gray(`  (searched in source: ${source})`));
      console.log(chalk.gray(`  Try --source=all to search everything`));
    }
    console.log(chalk.gray(`\nTry a different query or run 'pf-docs list' to see available docs.`));
    return;
  }

  const sourceLabel = source === "all" ? "all sources" : source;
  console.log(chalk.bold(`\n🔍 Search results for: "${query}" (${sourceLabel})\n`));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const label = source === "all" ? `${getSourceLabel(result.source)} ` : "";
    
    console.log(`${label}${chalk.blue(`${i + 1}. ${result.title}`)}`);
    console.log(chalk.gray(`   Path: ${result.path}`));
    console.log(chalk.gray(`   ${result.snippet}`));
    console.log();
  }

  console.log(chalk.gray(`\nTo view a document: pf-docs get <path>`));
  console.log(chalk.gray(`Example: pf-docs get ${results[0].path}`));
  
  if (source !== "all") {
    console.log(chalk.gray(`\nTip: Use --source=all to search docs, examples, and episodes together`));
  }
}
