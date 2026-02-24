#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { runTui } from "./index.js";
import type { LocationPolicy } from "../types.js";

const HELP_TEXT = `chagee-tui - CHAGEE pane TUI

Usage
  chagee-tui
  chagee-tui [options]
  chagee --tui

Options
  -h, --help       Show help
  -v, --version    Show version
  --yolo           Enable shell ordering commands
  --location-policy Startup location policy: smart|ip-only|manual-only
  --no-auto-locate Disable startup browser geolocation`;

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

  let yolo = false;
  let autoLocate = true;
  let locationPolicy: LocationPolicy = "smart";

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) {
      continue;
    }
    if (arg === "--yolo") {
      yolo = true;
      continue;
    }
    if (arg === "--no-auto-locate") {
      autoLocate = false;
      locationPolicy = "manual-only";
      continue;
    }
    if (arg.startsWith("--location-policy=")) {
      const parsed = parseLocationPolicy(arg.slice("--location-policy=".length));
      if (!parsed) {
        console.error(
          `Invalid --location-policy value: ${arg.slice("--location-policy=".length)} (expected smart|ip-only|manual-only)`
        );
        process.exitCode = 1;
        return;
      }
      locationPolicy = parsed;
      continue;
    }
    if (arg === "--location-policy") {
      const value = args[i + 1];
      if (!value) {
        console.error("--location-policy requires a value");
        process.exitCode = 1;
        return;
      }
      const parsed = parseLocationPolicy(value);
      if (!parsed) {
        console.error(
          `Invalid --location-policy value: ${value} (expected smart|ip-only|manual-only)`
        );
        process.exitCode = 1;
        return;
      }
      locationPolicy = parsed;
      i += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      process.exitCode = 1;
      return;
    }
  }

  await runTui({ yolo, autoLocate, locationPolicy });
}

function parseLocationPolicy(raw: string | undefined): LocationPolicy | undefined {
  const normalized = raw?.trim().toLowerCase();
  if (
    normalized === "smart" ||
    normalized === "ip-only" ||
    normalized === "manual-only"
  ) {
    return normalized;
  }
  return undefined;
}

void main();
