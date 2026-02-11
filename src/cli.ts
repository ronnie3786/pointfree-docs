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
  .version("0.1.0");

program
  .command("init")
  .description("Initialize and download documentation for specified libraries")
  .option("-l, --libs <libs...>", "Libraries to download (e.g., tca dependencies)")
  .option("-a, --all", "Download all available libraries")
  .action(initCommand);

program
  .command("update")
  .description("Update documentation from remote repositories")
  .option("-l, --libs <libs...>", "Specific libraries to update")
  .action(updateCommand);

program
  .command("search <query>")
  .description("Search across all indexed documentation")
  .option("-l, --lib <lib>", "Limit search to specific library")
  .option("-n, --limit <n>", "Max results to return", "10")
  .option("-j, --json", "Output results as JSON")
  .action(searchCommand);

program
  .command("get <path>")
  .description("Get a specific documentation article (e.g., tca/Testing)")
  .option("-j, --json", "Output as JSON")
  .option("-r, --raw", "Output raw content without header")
  .action(getCommand);

program
  .command("list [lib]")
  .description("List available documentation articles")
  .option("-t, --tree", "Show as tree structure")
  .option("-j, --json", "Output as JSON")
  .option("-a, --available", "Show all libraries available to download")
  .action(listCommand);

program
  .command("stats")
  .description("Show indexing statistics")
  .option("-j, --json", "Output as JSON")
  .action(statsCommand);

program.parse();
