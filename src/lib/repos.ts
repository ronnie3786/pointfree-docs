/**
 * Git operations for cloning and updating Point-Free repositories
 */

import { simpleGit, SimpleGit } from "simple-git";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { LibraryConfig, PATHS } from "../config.js";

/**
 * Clone a library repository (sparse checkout, docs only)
 */
export async function cloneLibrary(lib: LibraryConfig): Promise<void> {
  const repoDir = join(PATHS.reposDir, lib.name);

  // Ensure repos directory exists
  if (!existsSync(PATHS.reposDir)) {
    mkdirSync(PATHS.reposDir, { recursive: true });
  }

  if (existsSync(repoDir)) {
    console.log(`  Repository already exists: ${lib.name}`);
    return;
  }

  console.log(`  Cloning ${lib.repo}...`);

  const git: SimpleGit = simpleGit();

  // Clone with sparse checkout for just the docs directories
  // This saves bandwidth and disk space
  await git.clone(`https://github.com/${lib.repo}.git`, repoDir, [
    "--depth",
    "1",
    "--filter=blob:none",
    "--sparse",
  ]);

  const repoGit = simpleGit(repoDir);

  // Set up sparse checkout to only get the docs folders
  await repoGit.raw(["sparse-checkout", "init", "--cone"]);
  
  // Set all docs paths for this library
  await repoGit.raw(["sparse-checkout", "set", ...lib.docsPaths]);

  console.log(`  ✓ Cloned ${lib.shortName}`);
}

/**
 * Update a library repository
 */
export async function updateLibrary(lib: LibraryConfig): Promise<boolean> {
  const repoDir = join(PATHS.reposDir, lib.name);

  if (!existsSync(repoDir)) {
    console.log(`  Repository not found: ${lib.name}. Run 'pf-docs init' first.`);
    return false;
  }

  console.log(`  Updating ${lib.shortName}...`);

  const git = simpleGit(repoDir);

  try {
    const pullResult = await git.pull();

    if (pullResult.summary.changes > 0) {
      console.log(`  ✓ Updated ${lib.shortName} (${pullResult.summary.changes} changes)`);
      return true;
    } else {
      console.log(`  ✓ ${lib.shortName} is up to date`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Failed to update ${lib.shortName}:`, error);
    return false;
  }
}

/**
 * Get all local paths to a library's docs
 */
export function getDocsPaths(lib: LibraryConfig): string[] {
  return lib.docsPaths.map((docsPath) => join(PATHS.reposDir, lib.name, docsPath));
}

/**
 * Check if a library is cloned
 */
export function isLibraryCloned(lib: LibraryConfig): boolean {
  const repoDir = join(PATHS.reposDir, lib.name);
  return existsSync(repoDir);
}
