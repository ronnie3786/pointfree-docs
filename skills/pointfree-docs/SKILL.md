---
name: pointfree-docs
description: 'This skill should be used when the user asks to "search Point-Free docs", "look up TCA documentation", "find composable architecture examples", "get swift-dependencies docs", "search pointfree episodes", or mentions Point-Free libraries by name (composable architecture, TCA, swift-dependencies, swift-navigation, swift-sharing, swift-perception, swift-concurrency-extras, swift-case-paths, swift-custom-dump, swift-identified-collections, swift-tagged). It also applies when the user works with code that uses these libraries and needs API reference or usage guidance.'
---

# Point-Free Documentation Search

A local CLI tool (`pf-docs`) provides offline full-text search across all Point-Free Swift library documentation, code examples, and episode transcripts.

## Setup

Before first use, verify `pf-docs` is installed by running:

```bash
pf-docs --help
```

If the command is not found, install it by running the setup script:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/install.sh
```

## Usage

Invoke `pf-docs --help` to get full usage details and available commands. Use the CLI to search documentation, retrieve specific articles, list available libraries, and check index statistics.

When working with Point-Free Swift libraries, search for relevant documentation proactively to ensure accurate, up-to-date guidance rather than relying on training data alone.

## When to Use

- Answer questions about Point-Free library APIs or patterns
- Debug issues with TCA reducers, stores, effects, or dependencies
- Look up correct usage of dependency injection, navigation, or sharing patterns
- Find code examples demonstrating library features
- Reference episode content for deeper explanations
- Resolve uncertainty about Point-Free API signatures or conventions
