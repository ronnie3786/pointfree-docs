/**
 * init command - Download and index Point-Free documentation
 */

import chalk from "chalk";
import { LIBRARIES, getLibrary, LIBRARY_NAMES } from "../config.js";
import { cloneLibrary, cloneExamples, cloneEpisodes } from "../lib/repos.js";
import { indexLibrary, indexExamples, indexEpisodes, openIndex, closeIndex } from "../lib/index.js";

interface InitOptions {
  libs?: string[];
  all?: boolean;
  examples?: boolean;
  episodes?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.bold("\n📚 Initializing Point-Free Documentation\n"));

  const includeExamples = options.examples || false;
  const includeEpisodes = options.episodes || false;

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

  // If no libs specified and not --all, and no examples/episodes, show usage
  if (librariesToInit.length === 0 && !includeExamples && !includeEpisodes) {
    console.log(chalk.red("No valid libraries or sources specified."));
    console.log(`\nUsage:`);
    console.log(`  pf-docs init --libs tca dependencies navigation`);
    console.log(`  pf-docs init --all`);
    console.log(`  pf-docs init --examples`);
    console.log(`  pf-docs init --episodes`);
    console.log(`  pf-docs init --all --examples --episodes`);
    console.log(`\nAvailable libraries: ${LIBRARY_NAMES.join(", ")}`);
    return;
  }

  // Show what we're going to initialize
  const sources: string[] = [];
  if (librariesToInit.length > 0) {
    sources.push(`Docs: ${librariesToInit.map((l) => l.shortName).join(", ")}`);
  }
  if (includeExamples) {
    sources.push("Examples (TCA CaseStudies, SyncUps, etc.)");
  }
  if (includeEpisodes) {
    sources.push("Episodes (350+ Point-Free episode code samples)");
  }
  console.log(chalk.blue(`Initializing: \n  ${sources.join("\n  ")}\n`));

  // Clone library documentation repositories
  if (librariesToInit.length > 0) {
    console.log(chalk.bold("Cloning documentation repositories..."));
    for (const lib of librariesToInit) {
      try {
        await cloneLibrary(lib);
      } catch (error) {
        console.error(chalk.red(`  ✗ Failed to clone ${lib.shortName}:`), error);
      }
    }
  }

  // Clone examples if requested
  if (includeExamples) {
    console.log(chalk.bold("\nCloning TCA examples..."));
    try {
      await cloneExamples();
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to clone examples:`), error);
    }
  }

  // Clone episodes if requested
  if (includeEpisodes) {
    console.log(chalk.bold("\nCloning episode code samples..."));
    try {
      await cloneEpisodes();
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to clone episodes:`), error);
    }
  }

  // Build search index
  console.log(chalk.bold("\nBuilding search index..."));
  openIndex();

  let totalIndexed = 0;

  // Index library docs
  for (const lib of librariesToInit) {
    try {
      const count = indexLibrary(lib);
      console.log(`  ✓ Indexed ${lib.shortName}: ${count} documents`);
      totalIndexed += count;
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to index ${lib.shortName}:`), error);
    }
  }

  // Index examples
  if (includeExamples) {
    try {
      const count = indexExamples();
      console.log(`  ✓ Indexed examples: ${count} files`);
      totalIndexed += count;
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to index examples:`), error);
    }
  }

  // Index episodes
  if (includeEpisodes) {
    try {
      const count = indexEpisodes();
      console.log(`  ✓ Indexed episodes: ${count} files`);
      totalIndexed += count;
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to index episodes:`), error);
    }
  }

  closeIndex();

  console.log(chalk.green(`\n✅ Done! Indexed ${totalIndexed} items.\n`));
  console.log(`Try it out:`);
  console.log(chalk.gray(`  pf-docs search "testing async effects"`));
  console.log(chalk.gray(`  pf-docs search "Store" --source=examples`));
  console.log(chalk.gray(`  pf-docs search "dependency" --source=all`));
  console.log(chalk.gray(`  pf-docs list tca`));
  console.log(chalk.gray(`  pf-docs get tca/Testing`));
}
