/**
 * list command - List available documentation articles
 */

import chalk from "chalk";
import { listDocs, getStats, openIndex, closeIndex } from "../lib/index.js";
import { getLibraryNames, LIBRARIES } from "../config.js";

interface ListOptions {
  tree?: boolean;
  json?: boolean;
  available?: boolean;
}

export async function listCommand(lib: string | undefined, options: ListOptions): Promise<void> {
  if (options.available) {
    if (options.json) {
      const libs = LIBRARIES.map(({ shortName, name, repo, description }) => ({
        shortName, name, repo, description,
      }));
      console.log(JSON.stringify(libs, null, 2));
      return;
    }

    console.log(chalk.bold(`\n📦 Available Libraries\n`));
    for (const lib of LIBRARIES) {
      console.log(`  ${chalk.blue(lib.shortName.padEnd(24))} ${lib.description}`);
      console.log(chalk.gray(`  ${"".padEnd(24)} ${lib.repo}\n`));
    }
    console.log(chalk.gray(`Total: ${LIBRARIES.length} libraries`));
    console.log(chalk.gray(`\nTo download: pf-docs init --libs <name> [<name>...]`));
    return;
  }

  openIndex();

  const docs = listDocs(lib);
  const stats = getStats();

  closeIndex();

  // JSON output for programmatic use
  if (options.json) {
    console.log(JSON.stringify({ docs, stats }, null, 2));
    return;
  }

  if (docs.length === 0) {
    if (lib) {
      console.log(chalk.yellow(`\nNo documents found for library: ${lib}`));
      console.log(chalk.gray(`Available libraries: ${getLibraryNames().join(", ")}`));
    } else {
      console.log(chalk.yellow(`\nNo documents indexed yet.`));
      console.log(chalk.gray(`Run 'pf-docs init --libs tca dependencies' to get started.`));
    }
    return;
  }

  console.log(chalk.bold(`\n📄 Available Documentation\n`));

  // Show stats summary
  if (!lib) {
    console.log(chalk.gray(`Indexed libraries:`));
    for (const [libName, count] of Object.entries(stats.byLibrary)) {
      const libConfig = LIBRARIES.find((l) => l.shortName === libName);
      const desc = libConfig?.description || "";
      console.log(chalk.gray(`  ${chalk.blue(libName)}: ${count} docs — ${desc}`));
    }
    console.log();
  }

  if (options.tree) {
    // Group by library and show as tree
    const byLibrary = new Map<string, typeof docs>();

    for (const doc of docs) {
      if (!byLibrary.has(doc.library)) {
        byLibrary.set(doc.library, []);
      }
      byLibrary.get(doc.library)!.push(doc);
    }

    for (const [library, libraryDocs] of byLibrary) {
      console.log(chalk.blue(`${library}/`));
      for (let i = 0; i < libraryDocs.length; i++) {
        const doc = libraryDocs[i];
        const relativePath = doc.path.replace(`${library}/`, "");
        const isLast = i === libraryDocs.length - 1;
        const prefix = isLast ? "└── " : "├── ";
        console.log(chalk.gray(`  ${prefix}${relativePath}`));
      }
      console.log();
    }
  } else {
    // Simple list
    for (const doc of docs) {
      console.log(chalk.blue(doc.path));
      console.log(chalk.gray(`  ${doc.title}`));
    }
  }

  console.log(chalk.gray(`\nTotal: ${docs.length} documents`));
  console.log(chalk.gray(`\nTo view a document: pf-docs get <path>`));
}
