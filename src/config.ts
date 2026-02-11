/**
 * Configuration for Point-Free libraries
 */

export interface LibraryConfig {
  name: string;
  shortName: string;
  repo: string;
  docsPaths: string[];  // Support multiple docs folders per library
  description: string;
}

/**
 * All available Point-Free libraries
 * Add or remove libraries here to customize what's indexed
 */
export const LIBRARIES: LibraryConfig[] = [
  {
    name: "swift-composable-architecture",
    shortName: "tca",
    repo: "pointfreeco/swift-composable-architecture",
    docsPaths: ["Sources/ComposableArchitecture/Documentation.docc"],
    description: "The Composable Architecture",
  },
  {
    name: "swift-dependencies",
    shortName: "dependencies",
    repo: "pointfreeco/swift-dependencies",
    docsPaths: ["Sources/Dependencies/Documentation.docc"],
    description: "Dependency injection library",
  },
  {
    name: "swift-navigation",
    shortName: "navigation",
    repo: "pointfreeco/swift-navigation",
    docsPaths: [
      "Sources/SwiftNavigation/Documentation.docc",
      "Sources/SwiftUINavigation/Documentation.docc",
      "Sources/UIKitNavigation/Documentation.docc",
      "Sources/AppKitNavigation/Documentation.docc",
    ],
    description: "Navigation tools for Swift",
  },
  {
    name: "swift-perception",
    shortName: "perception",
    repo: "pointfreeco/swift-perception",
    docsPaths: ["Sources/Perception/Documentation.docc"],
    description: "@Observable backported to iOS 16",
  },
  {
    name: "swift-sharing",
    shortName: "sharing",
    repo: "pointfreeco/swift-sharing",
    docsPaths: ["Sources/Sharing/Documentation.docc"],
    description: "Persistence & data sharing",
  },
  {
    name: "swift-identified-collections",
    shortName: "identified-collections",
    repo: "pointfreeco/swift-identified-collections",
    docsPaths: ["Sources/IdentifiedCollections/Documentation.docc"],
    description: "Identifiable-aware collections",
  },
  {
    name: "swift-case-paths",
    shortName: "case-paths",
    repo: "pointfreeco/swift-case-paths",
    docsPaths: ["Sources/CasePaths/Documentation.docc"],
    description: "Key paths for enum cases",
  },
  {
    name: "swift-custom-dump",
    shortName: "custom-dump",
    repo: "pointfreeco/swift-custom-dump",
    docsPaths: ["Sources/CustomDump/Documentation.docc"],
    description: "Debugging/diffing tools",
  },
  {
    name: "swift-concurrency-extras",
    shortName: "concurrency-extras",
    repo: "pointfreeco/swift-concurrency-extras",
    docsPaths: ["Sources/ConcurrencyExtras/Documentation.docc"],
    description: "Testable async/await",
  },
  {
    name: "swift-clocks",
    shortName: "clocks",
    repo: "pointfreeco/swift-clocks",
    docsPaths: ["Sources/Clocks/Documentation.docc"],
    description: "Testable Swift concurrency clocks",
  },
  {
    name: "swift-snapshot-testing",
    shortName: "snapshot-testing",
    repo: "pointfreeco/swift-snapshot-testing",
    docsPaths: [
      "Sources/SnapshotTesting/Documentation.docc",
      "Sources/InlineSnapshotTesting/Documentation.docc",
    ],
    description: "Snapshot testing library",
  },
  {
    name: "swift-issue-reporting",
    shortName: "issue-reporting",
    repo: "pointfreeco/swift-issue-reporting",
    docsPaths: ["Sources/IssueReporting/Documentation.docc"],
    description: "Runtime warnings & assertions",
  },
];

/**
 * Get library config by short name
 */
export function getLibrary(shortName: string): LibraryConfig | undefined {
  return LIBRARIES.find(
    (lib) => lib.shortName === shortName || lib.name === shortName
  );
}

/**
 * Get all library short names
 */
export function getLibraryNames(): string[] {
  return LIBRARIES.map((lib) => lib.shortName);
}

/**
 * Paths configuration
 */
export const PATHS = {
  dataDir: new URL("../data", import.meta.url).pathname,
  reposDir: new URL("../data/repos", import.meta.url).pathname,
  indexDb: new URL("../data/index.db", import.meta.url).pathname,
};
