/**
 * init command - Download and index Point-Free documentation
 */

import chalk from "chalk";
import { LIBRARIES, getLibrary, LIBRARY_NAMES } from "../config.js";
import { cloneLibrary } from "../lib/repos.js";
import { indexLibrary, openIndex, closeIndex } from "../lib/index.js";

interface InitOptions {
  libs?: string[];
  all?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.bold("\n📚 Initializing Point-Free Documentation\n"));

  // Determine which libraries to download
  let librariesToInit = LIBRARIES;

  if (options.libs && !options.all) {
    librariesToInit = [];
    for (const name of options.libs) {
      const lib = getLibrary(name);
      if (lib) {
        librariesToInit.push(lib);
      } else {
        console.log(chalk.yellow(`  ⚠ Unknown library: ${name}`));
        console.log(chalk.gray(`    Available: ${LIBRARY_NAMES.join(", ")}`));
      }
    }
  }

  if (librariesToInit.length === 0) {
    console.log(chalk.red("No valid libraries specified."));
    console.log(`\nUsage: pf-docs init --libs tca dependencies navigation`);
    console.log(`       pf-docs init --all`);
    console.log(`\nAvailable libraries: ${LIBRARY_NAMES.join(", ")}`);
    return;
  }

  console.log(chalk.blue(`Libraries to initialize: ${librariesToInit.map((l) => l.shortName).join(", ")}\n`));

  // Clone repositories
  console.log(chalk.bold("Cloning repositories..."));
  for (const lib of librariesToInit) {
    try {
      await cloneLibrary(lib);
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to clone ${lib.shortName}:`), error);
    }
  }

  // Build search index
  console.log(chalk.bold("\nBuilding search index..."));
  openIndex();

  let totalIndexed = 0;
  for (const lib of librariesToInit) {
    try {
      const count = indexLibrary(lib);
      console.log(`  ✓ Indexed ${lib.shortName}: ${count} documents`);
      totalIndexed += count;
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to index ${lib.shortName}:`), error);
    }
  }

  closeIndex();

  console.log(chalk.green(`\n✅ Done! Indexed ${totalIndexed} documents.\n`));
  console.log(`Try it out:`);
  console.log(chalk.gray(`  pf-docs search "testing async effects"`));
  console.log(chalk.gray(`  pf-docs list tca`));
  console.log(chalk.gray(`  pf-docs get tca/Testing`));
}
