/**
 * update command - Update documentation from remote repositories
 */

import chalk from "chalk";
import { LIBRARIES, getLibrary } from "../config.js";
import { 
  updateLibrary, 
  updateExamples, 
  updateEpisodes, 
  isLibraryCloned, 
  areExamplesCloned, 
  areEpisodesCloned 
} from "../lib/repos.js";
import { indexLibrary, indexExamples, indexEpisodes, openIndex, closeIndex } from "../lib/index.js";

interface UpdateOptions {
  libs?: string[];
  examples?: boolean;
  episodes?: boolean;
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

  // Check for examples/episodes
  const shouldUpdateExamples = options.examples && areExamplesCloned();
  const shouldUpdateEpisodes = options.episodes && areEpisodesCloned();

  if (options.examples && !areExamplesCloned()) {
    console.log(chalk.yellow(`  ⚠ Examples not initialized. Run 'pf-docs init --examples' first.`));
  }
  if (options.episodes && !areEpisodesCloned()) {
    console.log(chalk.yellow(`  ⚠ Episodes not initialized. Run 'pf-docs init --episodes' first.`));
  }

  if (librariesToUpdate.length === 0 && !shouldUpdateExamples && !shouldUpdateEpisodes) {
    console.log(chalk.yellow("Nothing to update. Run 'pf-docs init' first."));
    return;
  }

  // Update repositories
  console.log(chalk.bold("Pulling latest changes..."));
  const updatedLibs: typeof LIBRARIES = [];
  let examplesUpdated = false;
  let episodesUpdated = false;

  for (const lib of librariesToUpdate) {
    const wasUpdated = await updateLibrary(lib);
    if (wasUpdated) {
      updatedLibs.push(lib);
    }
  }

  if (shouldUpdateExamples) {
    examplesUpdated = await updateExamples();
  }

  if (shouldUpdateEpisodes) {
    episodesUpdated = await updateEpisodes();
  }

  // Re-index updated sources
  const hasUpdates = updatedLibs.length > 0 || examplesUpdated || episodesUpdated;
  
  if (hasUpdates) {
    console.log(chalk.bold("\nRe-indexing updated sources..."));
    openIndex();

    for (const lib of updatedLibs) {
      const count = indexLibrary(lib);
      console.log(`  ✓ Re-indexed ${lib.shortName}: ${count} documents`);
    }

    if (examplesUpdated) {
      const count = indexExamples();
      console.log(`  ✓ Re-indexed examples: ${count} files`);
    }

    if (episodesUpdated) {
      const count = indexEpisodes();
      console.log(`  ✓ Re-indexed episodes: ${count} files`);
    }

    closeIndex();
  }

  console.log(chalk.green(`\n✅ Update complete!\n`));
}
