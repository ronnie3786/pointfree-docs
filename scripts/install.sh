#!/usr/bin/env bash
set -euo pipefail

# Install pf-docs CLI tool if not already available
# This script checks for pf-docs on PATH and installs it via npm if missing.
# After installation, it runs 'pf-docs init' to set up the local doc index.

if command -v pf-docs &>/dev/null; then
  echo "pf-docs is already installed: $(command -v pf-docs)"
  echo "Version: $(pf-docs --version 2>/dev/null || echo 'unknown')"
else
  echo "pf-docs not found. Installing via npm..."

  if ! command -v npm &>/dev/null; then
    echo "Error: npm is required but not installed." >&2
    echo "Install Node.js (>=18) from https://nodejs.org or via your package manager." >&2
    exit 1
  fi

  npm install -g pointfree-docs
  echo "pf-docs installed successfully."
fi

# Initialize the documentation index if not already present
echo ""
echo "Checking documentation index..."
pf-docs init
echo ""
echo "Setup complete. Run 'pf-docs --help' for usage information."
