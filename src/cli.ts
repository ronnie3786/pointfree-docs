#!/usr/bin/env node

/**
 * pf-docs CLI - Point-Free Documentation Tool
 *
 * A CLI for searching and browsing Point-Free library documentation.
 */

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { updateCommand } from "./commands/update.js";
import { searchCommand } from "./commands/search.js";
import { getCommand } from "./commands/get.js";
import { listCommand } from "./commands/list.js";
import { statsCommand } from "./commands/stats.js";

const program = new Command();

program
  .name("pf-docs")
  .description("CLI tool for searching Point-Free library documentation")
  .version("0.2.0");

program
  .command("init")
  .description("Initialize and download documentation for specified libraries")
  .option("-l, --libs <libs...>", "Libraries to download (e.g., tca dependencies)")
  .option("-a, --all", "Download all available libraries")
  .option("-e, --examples", "Download TCA examples (CaseStudies, SyncUps, etc.)")
  .option("-p, --episodes", "Download Point-Free episode code samples (350+)")
  .action(initCommand);

program
  .command("update")
  .description("Update documentation from remote repositories")
  .option("-l, --libs <libs...>", "Specific libraries to update")
  .option("-e, --examples", "Update examples")
  .option("-p, --episodes", "Update episodes")
  .action(updateCommand);

program
  .command("search <query>")
  .description("Search across all indexed documentation")
  .option("-l, --lib <lib>", "Limit search to specific library")
  .option("-n, --limit <n>", "Max results to return", "10")
  .option("-s, --source <source>", "Source type: docs, examples, episodes, all (default: docs)")
  .option("-j, --json", "Output results as JSON")
  .action(searchCommand);

program
  .command("get <path>")
  .description("Get a specific documentation article (e.g., tca/Testing)")
  .option("-j, --json", "Output as JSON")
  .option("-r, --raw", "Output raw content without header")
  .option("-p, --preview", "Preview mode (first 50 lines for code files)")
  .option("--lines <n>", "Number of lines to show in preview mode", "50")
  .action(getCommand);

program
  .command("list [lib]")
  .description("List available documentation articles")
  .option("-t, --tree", "Show as tree structure")
  .option("-j, --json", "Output as JSON")
  .option("-a, --available", "Show all libraries available to download")
  .option("-s, --source <source>", "Filter by source: docs, examples, episodes, all")
  .action(listCommand);

program
  .command("stats")
  .description("Show indexing statistics")
  .option("-j, --json", "Output as JSON")
  .action(statsCommand);

program.parse();
