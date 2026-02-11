/**
 * update command - Update documentation from remote repositories
 */

import chalk from "chalk";
import { LIBRARIES, getLibrary } from "../config.js";
import { updateLibrary, isLibraryCloned } from "../lib/repos.js";
import { indexLibrary, openIndex, closeIndex } from "../lib/index.js";

interface UpdateOptions {
  libs?: string[];
}

export async function updateCommand(options: UpdateOptions): Promise<void> {
  console.log(chalk.bold("\n🔄 Updating Point-Free Documentation\n"));

  // Determine which libraries to update
  let librariesToUpdate = LIBRARIES.filter(isLibraryCloned);

  if (options.libs) {
    librariesToUpdate = [];
    for (const name of options.libs) {
      const lib = getLibrary(name);
      if (lib && isLibraryCloned(lib)) {
        librariesToUpdate.push(lib);
      } else if (lib) {
        console.log(chalk.yellow(`  ⚠ Library not initialized: ${name}. Run 'pf-docs init --libs ${name}' first.`));
      } else {
        console.log(chalk.yellow(`  ⚠ Unknown library: ${name}`));
      }
    }
  }

  if (librariesToUpdate.length === 0) {
    console.log(chalk.yellow("No libraries to update. Run 'pf-docs init' first."));
    return;
  }

  // Update repositories
  console.log(chalk.bold("Pulling latest changes..."));
  const updatedLibs: typeof LIBRARIES = [];

  for (const lib of librariesToUpdate) {
    const wasUpdated = await updateLibrary(lib);
    if (wasUpdated) {
      updatedLibs.push(lib);
    }
  }

  // Re-index updated libraries
  if (updatedLibs.length > 0) {
    console.log(chalk.bold("\nRe-indexing updated libraries..."));
    openIndex();

    for (const lib of updatedLibs) {
      const count = indexLibrary(lib);
      console.log(`  ✓ Re-indexed ${lib.shortName}: ${count} documents`);
    }

    closeIndex();
  }

  console.log(chalk.green(`\n✅ Update complete!\n`));
}
