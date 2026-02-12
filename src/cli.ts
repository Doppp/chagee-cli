#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { App, runCliRepl } from "./index.js";

interface CliOptions {
  help: boolean;
  version: boolean;
  json: boolean;
  tui: boolean;
  yolo: boolean;
  mode?: string;
  region?: string;
  commands: string[];
  errors: string[];
}

const HELP_TEXT = `chagee - CHAGEE ordering CLI
Warning: alpha + highly experimental; use at your own risk.

Usage
  chagee                       # interactive TUI (default on TTY)
  chagee [options]
  chagee [options] -c "<command>"
  chagee [options] "<command>"

Options
  -h, --help                 Show help
  -v, --version              Show version
  --tui                      Start TUI mode
  --yolo                     Enable shell ordering commands (unsafe)
  --json                     Enable JSON output before running commands
  --mode <dry-run|live>      Set mode before running commands
  --region <CODE>            Set region before running commands
  -c, --command "<cmd>"      Run command once (repeatable)

Examples
  chagee --help
  chagee --version
  chagee --yolo --tui
  chagee --region SG --mode dry-run
  chagee -c "status"
  chagee --json -c "region list" -c "status"
  chagee "/status"`;

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    help: false,
    version: false,
    json: false,
    tui: false,
    yolo: false,
    commands: [],
    errors: []
  };

  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }

    if (arg === "--") {
      const rest = argv.slice(i + 1);
      if (rest.length > 0) {
        positional.push(rest.join(" "));
      }
      break;
    }

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "-v" || arg === "--version") {
      options.version = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--tui") {
      options.tui = true;
      continue;
    }
    if (arg === "--yolo") {
      options.yolo = true;
      continue;
    }

    if (arg.startsWith("--mode=")) {
      options.mode = arg.slice("--mode=".length);
      continue;
    }
    if (arg === "--mode") {
      const val = argv[i + 1];
      if (!val) {
        options.errors.push("--mode requires a value");
      } else {
        options.mode = val;
        i += 1;
      }
      continue;
    }

    if (arg.startsWith("--region=")) {
      options.region = arg.slice("--region=".length);
      continue;
    }
    if (arg === "--region") {
      const val = argv[i + 1];
      if (!val) {
        options.errors.push("--region requires a value");
      } else {
        options.region = val;
        i += 1;
      }
      continue;
    }

    if (arg === "-c" || arg === "--command") {
      const val = argv[i + 1];
      if (!val) {
        options.errors.push(`${arg} requires a value`);
      } else {
        options.commands.push(val);
        i += 1;
      }
      continue;
    }

    if (arg.startsWith("-")) {
      options.errors.push(`Unknown option: ${arg}`);
      continue;
    }

    positional.push(arg);
  }

  if (positional.length > 0) {
    options.commands.push(positional.join(" "));
  }

  return options;
}

function versionString(): string {
  try {
    const path = new URL("../package.json", import.meta.url);
    const raw = readFileSync(path, "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function runWithOptions(options: CliOptions): Promise<void> {
  const hasBootstrapCommands = Boolean(options.region || options.mode || options.json);
  const hasOneShotCommands = options.commands.length > 0;
  const interactiveTty = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  if (options.tui) {
    if (hasBootstrapCommands) {
      const bootstrap = new App({ yolo: options.yolo });
      await bootstrap.init();
      if (options.region) {
        await bootstrap.execute(`region set ${options.region}`);
      }
      if (options.mode) {
        await bootstrap.execute(`mode ${options.mode}`);
      }
      if (options.json) {
        await bootstrap.execute("json on");
      }
      await bootstrap.shutdown();
    }
    const mod = await import("./tui/index.js");
    await mod.runTui({ yolo: options.yolo });
    return;
  }

  const app = new App({ yolo: options.yolo });
  await app.init();

  if (options.region) {
    await app.execute(`region set ${options.region}`);
  }
  if (options.mode) {
    await app.execute(`mode ${options.mode}`);
  }
  if (options.json) {
    await app.execute("json on");
  }

  if (hasOneShotCommands) {
    for (const command of options.commands) {
      const shouldExit = await app.execute(command);
      if (shouldExit) {
        break;
      }
    }
    await app.shutdown();
    return;
  }

  await app.shutdown();

  if (interactiveTty) {
    const mod = await import("./tui/index.js");
    await mod.runTui({ yolo: options.yolo });
    return;
  }

  if (!hasBootstrapCommands) {
    await runCliRepl({ yolo: options.yolo });
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.errors.length > 0) {
    for (const error of options.errors) {
      console.error(error);
    }
    console.log("");
    console.log(HELP_TEXT);
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (options.version) {
    console.log(versionString());
    return;
  }

  await runWithOptions(options);
}

void main();
