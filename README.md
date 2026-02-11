# pf-docs

A CLI tool for searching Point-Free library documentation. Built for use with AI coding assistants like Claude Code.

## Features

- 📥 **Download** documentation from Point-Free library repositories (sparse checkout — only docs)
- 🔍 **Search** across all indexed documentation using full-text search (SQLite FTS5)
- 📖 **Get** specific articles as clean markdown
- 🔄 **Update** documentation with a single command
- 📊 **Stats** to see what's indexed

## Quick Start

```bash
# Install
git clone https://github.com/YOUR_USERNAME/pf-docs.git
cd pf-docs
npm install
npm run build
npm link

# Initialize with the libraries you use
pf-docs init --libs tca dependencies navigation

# Search documentation
pf-docs search "testing effects"

# Get a specific article
pf-docs get tca/Articles/TestingTCA

# List available docs
pf-docs list

# Show stats
pf-docs stats
```

## Supported Libraries

| Short Name | Library | Description |
|------------|---------|-------------|
| `tca` | swift-composable-architecture | The Composable Architecture |
| `dependencies` | swift-dependencies | Dependency injection |
| `navigation` | swift-navigation | Navigation tools |
| `perception` | swift-perception | @Observable backport |
| `sharing` | swift-sharing | Persistence & data sharing |
| `identified-collections` | swift-identified-collections | Identifiable collections |
| `case-paths` | swift-case-paths | Key paths for enums |
| `custom-dump` | swift-custom-dump | Debugging/diffing |
| `concurrency-extras` | swift-concurrency-extras | Testable async/await |
| `clocks` | swift-clocks | Testable clocks |
| `snapshot-testing` | swift-snapshot-testing | Snapshot testing |
| `issue-reporting` | swift-issue-reporting | Runtime warnings |

## Commands

### `pf-docs init`

Download and index documentation for specified libraries.

```bash
pf-docs init --libs tca dependencies navigation
pf-docs init --all  # All 12 libraries
```

Uses sparse git checkout — only downloads the Documentation.docc folders, not full repos.

### `pf-docs update`

Pull latest changes from remote repositories and re-index.

```bash
pf-docs update              # Update all initialized libraries
pf-docs update --libs tca   # Update specific libraries
```

### `pf-docs search <query>`

Search across all indexed documentation.

```bash
pf-docs search "testing effects"
pf-docs search "navigation" --lib tca    # Limit to specific library
pf-docs search "Store" --limit 5         # Limit results
pf-docs search "dependency" --json       # JSON output
```

### `pf-docs get <path>`

Get a specific documentation article as clean markdown.

```bash
pf-docs get tca/Articles/TestingTCA
pf-docs get dependencies/Articles/QuickStart
pf-docs get tca/Extensions/Store --json  # JSON output
pf-docs get tca/Articles/FAQ --raw       # Raw content, no header
```

### `pf-docs list [lib]`

List available documentation articles.

```bash
pf-docs list                # List all docs
pf-docs list tca            # List docs for specific library
pf-docs list --tree         # Show as tree structure
pf-docs list --json         # JSON output
```

### `pf-docs stats`

Show indexing statistics.

```bash
pf-docs stats
pf-docs stats --json
```

## Usage with Claude Code

Add this to your `CLAUDE.md` or project instructions:

```markdown
## Point-Free Documentation

Use the `pf-docs` CLI for Point-Free library documentation:

- `pf-docs search "<query>"` — search all docs
- `pf-docs get <lib>/<article>` — fetch specific article  
- `pf-docs list <lib>` — list available articles
- `pf-docs stats` — see what's indexed

Example workflow:
1. Search: `pf-docs search "testing effects"`
2. Get details: `pf-docs get tca/Articles/TestingTCA`

Libraries indexed: tca, dependencies, navigation (run `pf-docs stats` to check)
```

## How It Works

1. **Sparse checkout**: Only clones the `Documentation.docc` folders from each repo (saves bandwidth)
2. **SQLite FTS5**: Full-text search with BM25 ranking — fast and zero external dependencies
3. **DocC cleanup**: Strips DocC-specific syntax (`@Metadata`, `<doc:>`, etc.) for cleaner AI consumption

## Development

```bash
npm install
npm run dev      # Watch mode
npm run build    # Build once
npm link         # Install globally as 'pf-docs'
```

## Data Storage

All data is stored in the `data/` directory relative to the project:

```
data/
├── repos/           # Cloned repositories (sparse)
│   ├── swift-composable-architecture/
│   ├── swift-dependencies/
│   └── ...
└── index.db         # SQLite search index
```

## Adding More Libraries

Edit `src/config.ts` to add more Point-Free libraries:

```typescript
{
  name: "swift-new-library",
  shortName: "new-lib",
  repo: "pointfreeco/swift-new-library",
  docsPaths: ["Sources/NewLibrary/Documentation.docc"],
  description: "Description here",
}
```

## License

MIT
