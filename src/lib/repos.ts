/**
 * Git operations for cloning and updating Point-Free repositories
 */

import { simpleGit, SimpleGit } from "simple-git";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { LibraryConfig, PATHS, EXAMPLES_CONFIG, EPISODES_CONFIG } from "../config.js";

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

  // Sparse checkout: only download docs directories
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
 * Clone TCA examples (CaseStudies, SyncUps, etc.)
 */
export async function cloneExamples(): Promise<void> {
  const repoDir = join(PATHS.reposDir, EXAMPLES_CONFIG.name);

  // Ensure repos directory exists
  if (!existsSync(PATHS.reposDir)) {
    mkdirSync(PATHS.reposDir, { recursive: true });
  }

  if (existsSync(repoDir)) {
    console.log(`  Repository already exists: ${EXAMPLES_CONFIG.name}`);
    return;
  }

  console.log(`  Cloning ${EXAMPLES_CONFIG.repo} (examples)...`);

  const git: SimpleGit = simpleGit();

  // Sparse checkout: only download examples directories
  await git.clone(`https://github.com/${EXAMPLES_CONFIG.repo}.git`, repoDir, [
    "--depth",
    "1",
    "--filter=blob:none",
    "--sparse",
  ]);

  const repoGit = simpleGit(repoDir);

  // Set up sparse checkout to only get the examples folders
  await repoGit.raw(["sparse-checkout", "init", "--cone"]);
  await repoGit.raw(["sparse-checkout", "set", ...EXAMPLES_CONFIG.paths]);

  console.log(`  ✓ Cloned examples`);
}

/**
 * Clone episode code samples
 */
export async function cloneEpisodes(): Promise<void> {
  const repoDir = join(PATHS.reposDir, EPISODES_CONFIG.name);

  // Ensure repos directory exists
  if (!existsSync(PATHS.reposDir)) {
    mkdirSync(PATHS.reposDir, { recursive: true });
  }

  if (existsSync(repoDir)) {
    console.log(`  Repository already exists: ${EPISODES_CONFIG.name}`);
    return;
  }

  console.log(`  Cloning ${EPISODES_CONFIG.repo} (episodes)...`);
  console.log(`  ⚠ Note: This may take a while (350+ episodes)...`);

  const git: SimpleGit = simpleGit();

  // Full clone with depth 1 and blob filter for efficiency
  await git.clone(`https://github.com/${EPISODES_CONFIG.repo}.git`, repoDir, [
    "--depth",
    "1",
    "--filter=blob:none",
  ]);

  console.log(`  ✓ Cloned episodes`);
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
 * Update examples repository
 */
export async function updateExamples(): Promise<boolean> {
  const repoDir = join(PATHS.reposDir, EXAMPLES_CONFIG.name);

  if (!existsSync(repoDir)) {
    console.log(`  Examples not found. Run 'pf-docs init --examples' first.`);
    return false;
  }

  console.log(`  Updating examples...`);

  const git = simpleGit(repoDir);

  try {
    const pullResult = await git.pull();

    if (pullResult.summary.changes > 0) {
      console.log(`  ✓ Updated examples (${pullResult.summary.changes} changes)`);
      return true;
    } else {
      console.log(`  ✓ Examples are up to date`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Failed to update examples:`, error);
    return false;
  }
}

/**
 * Update episodes repository
 */
export async function updateEpisodes(): Promise<boolean> {
  const repoDir = join(PATHS.reposDir, EPISODES_CONFIG.name);

  if (!existsSync(repoDir)) {
    console.log(`  Episodes not found. Run 'pf-docs init --episodes' first.`);
    return false;
  }

  console.log(`  Updating episodes...`);

  const git = simpleGit(repoDir);

  try {
    const pullResult = await git.pull();

    if (pullResult.summary.changes > 0) {
      console.log(`  ✓ Updated episodes (${pullResult.summary.changes} changes)`);
      return true;
    } else {
      console.log(`  ✓ Episodes are up to date`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Failed to update episodes:`, error);
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
 * Get all local paths to examples
 */
export function getExamplesPaths(): string[] {
  return EXAMPLES_CONFIG.paths.map((path) => join(PATHS.reposDir, EXAMPLES_CONFIG.name, path));
}

/**
 * Get local path to episodes
 */
export function getEpisodesPath(): string {
  return join(PATHS.reposDir, EPISODES_CONFIG.name);
}

/**
 * Check if a library is cloned
 */
export function isLibraryCloned(lib: LibraryConfig): boolean {
  const repoDir = join(PATHS.reposDir, lib.name);
  return existsSync(repoDir);
}

/**
 * Check if examples are cloned
 */
export function areExamplesCloned(): boolean {
  const repoDir = join(PATHS.reposDir, EXAMPLES_CONFIG.name);
  return existsSync(repoDir);
}

/**
 * Check if episodes are cloned
 */
export function areEpisodesCloned(): boolean {
  const repoDir = join(PATHS.reposDir, EPISODES_CONFIG.name);
  return existsSync(repoDir);
}
