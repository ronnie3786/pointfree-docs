/**
 * stats command - Show indexing statistics
 */

import chalk from "chalk";
import { getStats, withIndex } from "../lib/index.js";
import { LIBRARIES, getLibrary } from "../config.js";
import { isLibraryCloned } from "../lib/repos.js";

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

  console.log(chalk.blue(`Total indexed documents: ${stats.totalDocs}`));
  console.log();

  console.log(chalk.bold("Indexed libraries:"));
  for (const [libName, count] of Object.entries(stats.byLibrary)) {
    const libConfig = getLibrary(libName);
    console.log(`  ${chalk.green("●")} ${libName}: ${count} docs`);
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
}
