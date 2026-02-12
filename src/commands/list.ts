/**
 * list command - List available documentation articles
 */

import chalk from "chalk";
import { listDocs, getStats, withIndex, DocEntry } from "../lib/index.js";
import { getLibrary, LIBRARIES, LIBRARY_NAMES, SourceType, SOURCE_TYPES, EXAMPLES_CONFIG, EPISODES_CONFIG } from "../config.js";

interface ListOptions {
  tree?: boolean;
  json?: boolean;
  available?: boolean;
  source?: string;
}

/**
 * Get source type label with color
 */
function getSourceLabel(source: SourceType): string {
  switch (source) {
    case "docs":
      return chalk.cyan("[DOC]");
    case "examples":
      return chalk.magenta("[EXAMPLE]");
    case "episodes":
      return chalk.yellow("[EPISODE]");
  }
}

export function listCommand(lib: string | undefined, options: ListOptions): void {
  if (options.available) {
    if (options.json) {
      const libs = LIBRARIES.map(({ shortName, name, repo, description }) => ({
        shortName, name, repo, description,
      }));
      const extras = [
        { shortName: "examples", name: EXAMPLES_CONFIG.name, repo: EXAMPLES_CONFIG.repo, description: EXAMPLES_CONFIG.description },
        { shortName: "episodes", name: EPISODES_CONFIG.name, repo: EPISODES_CONFIG.repo, description: EPISODES_CONFIG.description },
      ];
      console.log(JSON.stringify({ libraries: libs, extras }, null, 2));
      return;
    }

    console.log(chalk.bold(`\n📦 Available Libraries\n`));
    for (const library of LIBRARIES) {
      console.log(`  ${chalk.blue(library.shortName.padEnd(24))} ${library.description}`);
      console.log(chalk.gray(`  ${"".padEnd(24)} ${library.repo}\n`));
    }
    console.log(chalk.gray(`Total: ${LIBRARIES.length} libraries`));
    console.log(chalk.gray(`\nTo download: pf-docs init --libs <name> [<name>...]`));

    console.log(chalk.bold(`\n📦 Additional Sources\n`));
    console.log(`  ${chalk.magenta("examples".padEnd(24))} ${EXAMPLES_CONFIG.description}`);
    console.log(chalk.gray(`  ${"".padEnd(24)} --examples flag\n`));
    console.log(`  ${chalk.yellow("episodes".padEnd(24))} ${EPISODES_CONFIG.description}`);
    console.log(chalk.gray(`  ${"".padEnd(24)} --episodes flag\n`));
    return;
  }

  // Validate source option
  let source: SourceType | "all" | undefined;
  if (options.source) {
    if (options.source === "all" || SOURCE_TYPES.includes(options.source as SourceType)) {
      source = options.source as SourceType | "all";
    } else {
      console.log(chalk.red(`Invalid source: ${options.source}`));
      console.log(chalk.gray(`Valid sources: ${SOURCE_TYPES.join(", ")}, all`));
      return;
    }
  }

  const { docs, stats } = withIndex(() => ({
    docs: listDocs(lib, source),
    stats: getStats(),
  }));

  // JSON output for programmatic use
  if (options.json) {
    console.log(JSON.stringify({ docs, stats }, null, 2));
    return;
  }

  if (docs.length === 0) {
    if (lib) {
      console.log(chalk.yellow(`\nNo documents found for library: ${lib}`));
      console.log(chalk.gray(`Available libraries: ${LIBRARY_NAMES.join(", ")}`));
    } else {
      console.log(chalk.yellow(`\nNo documents indexed yet.`));
      console.log(chalk.gray(`Run 'pf-docs init --libs tca dependencies' to get started.`));
    }
    return;
  }

  console.log(chalk.bold(`\n📄 Available Documentation\n`));

  // Show stats summary
  if (!lib) {
    console.log(chalk.gray(`Indexed by source:`));
    for (const [sourceName, count] of Object.entries(stats.bySource)) {
      console.log(chalk.gray(`  ${getSourceLabel(sourceName as SourceType)}: ${count} items`));
    }
    console.log();

    console.log(chalk.gray(`Indexed libraries:`));
    for (const [libName, count] of Object.entries(stats.byLibrary)) {
      const libConfig = getLibrary(libName);
      const desc = libConfig?.description || "";
      console.log(chalk.gray(`  ${chalk.blue(libName)}: ${count} docs — ${desc}`));
    }
    console.log();
  }

  if (options.tree) {
    // Group by source and library, show as tree
    const bySource = new Map<SourceType, Map<string, DocEntry[]>>();

    for (const doc of docs) {
      if (!bySource.has(doc.source)) {
        bySource.set(doc.source, new Map());
      }
      const sourceMap = bySource.get(doc.source)!;
      if (!sourceMap.has(doc.library)) {
        sourceMap.set(doc.library, []);
      }
      sourceMap.get(doc.library)!.push(doc);
    }

    for (const [sourceName, byLibrary] of bySource) {
      console.log(getSourceLabel(sourceName));
      for (const [library, libraryDocs] of byLibrary) {
        console.log(chalk.blue(`  ${library}/`));
        const maxToShow = 10;
        for (let i = 0; i < Math.min(libraryDocs.length, maxToShow); i++) {
          const doc = libraryDocs[i];
          const relativePath = doc.path.replace(`${library}/`, "").replace(`${sourceName}/`, "");
          const isLast = i === Math.min(libraryDocs.length, maxToShow) - 1;
          const prefix = isLast ? "└── " : "├── ";
          console.log(chalk.gray(`    ${prefix}${relativePath}`));
        }
        if (libraryDocs.length > maxToShow) {
          console.log(chalk.gray(`    ... and ${libraryDocs.length - maxToShow} more`));
        }
      }
      console.log();
    }
  } else {
    // Simple list with source labels
    const showSourceLabel = !source || source === "all";
    for (const doc of docs) {
      const label = showSourceLabel ? `${getSourceLabel(doc.source)} ` : "";
      console.log(`${label}${chalk.blue(doc.path)}`);
      console.log(chalk.gray(`  ${doc.title}`));
    }
  }

  console.log(chalk.gray(`\nTotal: ${docs.length} items`));
  console.log(chalk.gray(`\nTo view a document: pf-docs get <path>`));
}
