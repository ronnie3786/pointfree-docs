# pf-docs

A CLI tool for searching Point-Free library documentation locally. Uses sparse git checkout and SQLite FTS5 for fast, offline full-text search. Built for use with AI coding assistants like Claude Code.

## Demo

See pf-docs in action: install, search, and real-world usage with Claude Code.

https://github.com/ronnie3786/pointfree-docs/raw/main/demo.mp4

## Quick Start

```bash
# Install from npm
npm install -g pointfree-docs

# Or install from source
git clone https://github.com/ronnie3786/pointfree-docs.git
cd pointfree-docs
npm install
npm run build
npm link

# See what libraries are available
pf-docs list --available

# Download and index the ones you use
pf-docs init --libs tca dependencies navigation

# Search, browse, and read
pf-docs search "testing effects"
pf-docs get tca/Articles/TestingTCA
pf-docs list tca
```

## Commands

### `pf-docs list --available`

Show all libraries available to download, plus additional sources (examples, episodes).

### `pf-docs init`

Download and index documentation. Only fetches `Documentation.docc` folders via sparse checkout.

```bash
pf-docs init --libs tca dependencies navigation
pf-docs init --all
pf-docs init --examples           # TCA CaseStudies, SyncUps, etc.
pf-docs init --episodes           # 350+ Point-Free episode code samples
pf-docs init --all --examples --episodes  # Everything
```

### `pf-docs update`

Pull latest changes and re-index.

```bash
pf-docs update                    # All initialized libraries
pf-docs update --libs tca         # Specific libraries
pf-docs update --examples         # Update examples
pf-docs update --episodes         # Update episodes
```

### `pf-docs search <query>`

Full-text search across all indexed docs.

```bash
pf-docs search "testing effects"
pf-docs search "navigation" --lib tca
pf-docs search "Store" --limit 5

# Search by source type
pf-docs search "TestStore" --source=docs      # Default: docs only
pf-docs search "TestStore" --source=examples  # TCA examples only
pf-docs search "TestStore" --source=episodes  # Episode code only
pf-docs search "TestStore" --source=all       # Everything, labeled
```

### `pf-docs get <path>`

Fetch a specific article as clean markdown.

```bash
pf-docs get tca/Articles/TestingTCA
pf-docs get dependencies/Articles/QuickStart --raw

# Code files show preview by default (50 lines)
pf-docs get examples/CaseStudies/03-Effects-Basics.swift
pf-docs get examples/CaseStudies/03-Effects-Basics.swift --raw      # Full content
pf-docs get episodes/0156-testable-state/Main.swift --lines=100     # More lines
```

### `pf-docs list [lib]`

List indexed documentation.

```bash
pf-docs list                      # All indexed docs
pf-docs list tca --tree           # Tree view for one library
pf-docs list --source=examples    # Only examples
pf-docs list --source=all         # All sources
```

### `pf-docs stats`

Show indexing statistics by source and library.

All commands support `--json` for programmatic output.

## Supported Libraries

| Short Name | Library | Description |
|---|---|---|
| `tca` | swift-composable-architecture | The Composable Architecture |
| `dependencies` | swift-dependencies | Dependency injection library |
| `navigation` | swift-navigation | Navigation tools for Swift |
| `perception` | swift-perception | @Observable backported to iOS 16 |
| `sharing` | swift-sharing | Persistence & data sharing |
| `identified-collections` | swift-identified-collections | Identifiable-aware collections |
| `case-paths` | swift-case-paths | Key paths for enum cases |
| `custom-dump` | swift-custom-dump | Debugging/diffing tools |
| `concurrency-extras` | swift-concurrency-extras | Testable async/await |
| `clocks` | swift-clocks | Testable Swift concurrency clocks |
| `snapshot-testing` | swift-snapshot-testing | Snapshot testing library |
| `issue-reporting` | swift-issue-reporting | Runtime warnings & assertions |

Run `pf-docs list --available` to see this list in your terminal.

## Additional Sources

| Source | Description | Flag |
|--------|-------------|------|
| `examples` | TCA CaseStudies, SyncUps, Todos, VoiceMemos, etc. | `--examples` |
| `episodes` | 350+ Point-Free episode code samples | `--episodes` |

### Source Types for Search

When searching, you can filter by source type:

- `docs` (default) — Library documentation (DocC articles)
- `examples` — TCA example apps and case studies
- `episodes` — Point-Free episode code samples
- `all` — Everything, with labels showing the source

```bash
# Search docs for concepts
pf-docs search "testing effects"

# Search examples for real implementations
pf-docs search "TestStore" --source=examples

# Search everything
pf-docs search "dependency injection" --source=all
```

Results with `--source=all` are labeled:
```
[DOC]     tca/Articles/Testing           (0.94)
[EXAMPLE] CaseStudies/03-Effects-Basics  (0.82)
[EPISODE] Ep156: Testable State          (0.71)
```

## Usage with Claude Code

Add the key commands to your project's `CLAUDE.md`:

```markdown
Use `pf-docs search "<query>"` to search Point-Free docs.
Use `pf-docs search "<query>" --source=examples` to find real code examples.
Use `pf-docs get <path>` to read an article or code file.
```

## Adding Libraries

Edit `src/config.ts` to add entries, then run `pf-docs init --libs <shortName>` to download.

## Development

```bash
npm install
npm run dev      # Watch mode
npm run build    # Build once
npm link         # Install globally
```

Cloned repos and the search index are stored in `data/` (gitignored).

## License

MIT
