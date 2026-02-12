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
  .description(
    `CLI tool for searching Point-Free library documentation.

Indexes DocC articles, code examples, and episode samples from 12 Point-Free
open-source libraries (TCA, Dependencies, Navigation, Sharing, etc.).

Typical workflow:
  1. pf-docs init --libs tca dependencies    # clone & index selected libs
  2. pf-docs search "testing reducer"        # full-text search across docs
  3. pf-docs get tca/Articles/Testing        # retrieve a specific article

Path format:  <library>/<Articles|Tutorials|Extensions>/<Name>
              e.g. tca/Articles/TestingTCA, sharing/Articles/SharingState

All commands support --json for machine-readable output.`
  )
  .version("0.2.1");

program
  .command("init")
  .description("Initialize and download documentation for specified libraries")
  .option("-l, --libs <libs...>", "Libraries to download (e.g., tca dependencies)")
  .option("-a, --all", "Download all available libraries")
  .option("-e, --examples", "Download TCA examples (CaseStudies, SyncUps, etc.)")
  .option("-p, --episodes", "Download Point-Free episode code samples (350+)")
  .addHelpText(
    "after",
    `
Examples:
  $ pf-docs init --libs tca dependencies   # just TCA and Dependencies
  $ pf-docs init --all                     # all 12 libraries
  $ pf-docs init --libs tca --examples     # TCA docs + example apps
  $ pf-docs init --all --examples --episodes  # everything

Available library short names:
  tca, dependencies, navigation, perception, sharing,
  identified-collections, case-paths, custom-dump,
  concurrency-extras, clocks, snapshot-testing, issue-reporting

Uses sparse git checkout — only documentation folders are cloned.
Re-running init on already-cloned libraries is safe (skips existing).`
  )
  .action(initCommand);

program
  .command("update")
  .description("Update documentation from remote repositories")
  .option("-l, --libs <libs...>", "Specific libraries to update")
  .option("-e, --examples", "Update examples")
  .option("-p, --episodes", "Update episodes")
  .addHelpText(
    "after",
    `
Examples:
  $ pf-docs update                         # update all cloned libraries
  $ pf-docs update --libs tca              # update only TCA
  $ pf-docs update --examples --episodes   # update examples and episodes

Runs git pull on cloned repos and rebuilds the search index.
Only updates libraries that were previously initialized.`
  )
  .action(updateCommand);

program
  .command("search <query>")
  .description("Search across all indexed documentation")
  .option("-l, --lib <lib>", "Limit search to specific library")
  .option("-n, --limit <n>", "Max results to return", "10")
  .option("-s, --source <source>", "Source type: docs, examples, episodes, all (default: docs)")
  .option("-j, --json", "Output results as JSON")
  .addHelpText(
    "after",
    `
Examples:
  $ pf-docs search "testing reducer"                # search docs (default)
  $ pf-docs search "testing" --lib tca              # search within TCA only
  $ pf-docs search "dependency" --limit 5           # top 5 results
  $ pf-docs search "SyncUps" --source examples      # search example apps
  $ pf-docs search "parser" --source all            # search everything
  $ pf-docs search "testing" --json                 # JSON output

By default, searches docs only. Use --source all to include examples and episodes.
Results include path (usable with 'get'), title, snippet, and relevance score.
Uses SQLite FTS5 with BM25 ranking.`
  )
  .action(searchCommand);

program
  .command("get <path>")
  .description("Get a specific documentation article (e.g., tca/Testing)")
  .option("-j, --json", "Output as JSON")
  .option("-r, --raw", "Output raw content without header")
  .option("-p, --preview", "Preview mode (first 50 lines for code files)")
  .option("--lines <n>", "Number of lines to show in preview mode", "50")
  .addHelpText(
    "after",
    `
Examples:
  $ pf-docs get tca/Articles/Testing              # full article as markdown
  $ pf-docs get sharing/Articles/SharingState      # article from Sharing lib
  $ pf-docs get tca/Articles/Testing --raw         # no header, just content
  $ pf-docs get tca/Articles/Testing --json        # JSON with metadata
  $ pf-docs get examples/CaseStudies/01-Basics-BindingBasics --preview
  $ pf-docs get episodes/0290-CrossPlatformPt1 --preview --lines 100

Path format for docs:     <library>/Articles/<ArticleName>
Path format for examples: examples/<AppName>/<FilePath>
Path format for episodes: episodes/<EpisodeName>/<FilePath>
Use 'pf-docs list <lib>' or search results to discover valid paths.
Code files (Swift) default to preview mode; use --raw for full content.`
  )
  .action(getCommand);

program
  .command("list [lib]")
  .description("List available documentation articles")
  .option("-t, --tree", "Show as tree structure")
  .option("-j, --json", "Output as JSON")
  .option("-a, --available", "Show all libraries available to download")
  .option("-s, --source <source>", "Filter by source: docs, examples, episodes, all")
  .addHelpText(
    "after",
    `
Examples:
  $ pf-docs list                           # list all indexed docs
  $ pf-docs list tca                       # list TCA articles only
  $ pf-docs list tca --tree                # tree view of TCA docs
  $ pf-docs list --source examples         # list example app files
  $ pf-docs list --source all              # list everything
  $ pf-docs list --available               # show all downloadable libraries
  $ pf-docs list --json                    # JSON output

Without arguments, lists all indexed documentation articles.
Paths in the output can be passed directly to 'pf-docs get'.`
  )
  .action(listCommand);

program
  .command("stats")
  .description("Show indexing statistics")
  .option("-j, --json", "Output as JSON")
  .addHelpText(
    "after",
    `
Examples:
  $ pf-docs stats                          # summary table
  $ pf-docs stats --json                   # JSON output

Shows per-library document counts, total indexed articles, and index size.`
  )
  .action(statsCommand);

program.parse();
