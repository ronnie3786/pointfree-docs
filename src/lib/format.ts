/**
 * Shared formatting utilities
 */

import chalk from "chalk";
import { SourceType } from "../config.js";

/**
 * Get source type label with color and brackets for search/list results
 */
export function getSourceLabel(source: SourceType): string {
  switch (source) {
    case "docs":
      return chalk.cyan("[DOC]");
    case "examples":
      return chalk.magenta("[EXAMPLE]");
    case "episodes":
      return chalk.yellow("[EPISODE]");
  }
}

/**
 * Get source type name with color (for stats display)
 */
export function getSourceName(source: SourceType): string {
  switch (source) {
    case "docs":
      return chalk.cyan("docs");
    case "examples":
      return chalk.magenta("examples");
    case "episodes":
      return chalk.yellow("episodes");
  }
}
