/**
 * stats command - Show indexing statistics
 */

import chalk from "chalk";
import { getStats, withIndex } from "../lib/index.js";
import { LIBRARIES, getLibrary, SourceType, EXAMPLES_CONFIG, EPISODES_CONFIG } from "../config.js";
import { isLibraryCloned, areExamplesCloned, areEpisodesCloned } from "../lib/repos.js";
import { getSourceName } from "../lib/format.js";

interface StatsOptions {
  json?: boolean;
}

export function statsCommand(options: StatsOptions): void {
  const stats = withIndex(() => getStats());

  if (options.json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log(chalk.bold("\n📊 pf-docs Statistics\n"));

  console.log(chalk.blue(`Total indexed items: ${stats.totalDocs}`));
  console.log();

  // Show breakdown by source
  console.log(chalk.bold("By source:"));
  for (const [sourceName, count] of Object.entries(stats.bySource)) {
    console.log(`  ${getSourceName(sourceName as SourceType)}: ${count} items`);
  }
  console.log();

  // Show breakdown by library
  console.log(chalk.bold("By library:"));
  for (const [libName, count] of Object.entries(stats.byLibrary)) {
    const libConfig = getLibrary(libName);
    console.log(`  ${chalk.green("●")} ${libName}: ${count} items`);
    if (libConfig) {
      console.log(chalk.gray(`      ${libConfig.description}`));
    }
  }
  console.log();

  // Show available but not indexed libraries
  const notIndexed = LIBRARIES.filter(
    (lib) => !stats.byLibrary[lib.shortName] && !isLibraryCloned(lib)
  );

  if (notIndexed.length > 0) {
    console.log(chalk.bold("Available libraries (not indexed):"));
    for (const lib of notIndexed) {
      console.log(`  ${chalk.gray("○")} ${lib.shortName}`);
      console.log(chalk.gray(`      ${lib.description}`));
    }
    console.log();
    console.log(chalk.gray(`To add: pf-docs init --libs ${notIndexed[0].shortName}`));
  }

  // Show examples/episodes status
  const extrasNotIndexed: string[] = [];
  if (!areExamplesCloned()) {
    extrasNotIndexed.push("examples");
  }
  if (!areEpisodesCloned()) {
    extrasNotIndexed.push("episodes");
  }

  if (extrasNotIndexed.length > 0) {
    console.log(chalk.bold("Additional sources (not indexed):"));
    if (extrasNotIndexed.includes("examples")) {
      console.log(`  ${chalk.gray("○")} examples — ${EXAMPLES_CONFIG.description}`);
    }
    if (extrasNotIndexed.includes("episodes")) {
      console.log(`  ${chalk.gray("○")} episodes — ${EPISODES_CONFIG.description}`);
    }
    console.log();
    console.log(chalk.gray(`To add: pf-docs init --examples --episodes`));
  }
}
