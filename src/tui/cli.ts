#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { runTui } from "./index.js";

const HELP_TEXT = `chagee-tui - CHAGEE pane TUI

Usage
  chagee-tui
  chagee-tui [options]
  chagee --tui

Options
  -h, --help       Show help
  -v, --version    Show version`;

function versionString(): string {
  try {
    const path = new URL("../../package.json", import.meta.url);
    const raw = readFileSync(path, "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    console.log(HELP_TEXT);
    return;
  }
  if (args.includes("-v") || args.includes("--version")) {
    console.log(versionString());
    return;
  }
  await runTui();
}

void main();

