import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const FALLBACK_FILE = join(homedir(), ".chagee-cli", "tokens.json");
const KEYCHAIN_SERVICE = "chagee-cli";

type TokenMap = Record<string, string>;

export async function loadAuthToken(userId: string): Promise<string | undefined> {
  if (!userId) {
    return undefined;
  }

  if (process.platform === "darwin") {
    const fromKeychain = await loadFromMacKeychain(userId);
    if (fromKeychain !== undefined) {
      return fromKeychain;
    }
  }

  const fallback = await loadFallbackTokenMap();
  const token = fallback[userId];
  return typeof token === "string" && token.length > 0 ? token : undefined;
}

export async function saveAuthToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) {
    return;
  }

  if (process.platform === "darwin") {
    const stored = await saveToMacKeychain(userId, token);
    if (stored) {
      return;
    }
  }

  const map = await loadFallbackTokenMap();
  map[userId] = token;
  await saveFallbackTokenMap(map);
}

export async function clearAuthToken(userId: string): Promise<void> {
  if (!userId) {
    return;
  }

  if (process.platform === "darwin") {
    await clearFromMacKeychain(userId);
  }

  const map = await loadFallbackTokenMap();
  if (map[userId] === undefined) {
    return;
  }
  delete map[userId];
  await saveFallbackTokenMap(map);
}

async function loadFromMacKeychain(userId: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("security", [
      "find-generic-password",
      "-a",
      tokenAccount(userId),
      "-s",
      KEYCHAIN_SERVICE,
      "-w"
    ]);
    const token = stdout.trim();
    return token.length > 0 ? token : undefined;
  } catch {
    return undefined;
  }
}

async function saveToMacKeychain(userId: string, token: string): Promise<boolean> {
  try {
    await execFileAsync("security", [
      "add-generic-password",
      "-U",
      "-a",
      tokenAccount(userId),
      "-s",
      KEYCHAIN_SERVICE,
      "-w",
      token
    ]);
    return true;
  } catch {
    return false;
  }
}

async function clearFromMacKeychain(userId: string): Promise<void> {
  try {
    await execFileAsync("security", [
      "delete-generic-password",
      "-a",
      tokenAccount(userId),
      "-s",
      KEYCHAIN_SERVICE
    ]);
  } catch {
    // Ignore missing entry and continue.
  }
}

function tokenAccount(userId: string): string {
  return `auth:${userId}`;
}

async function loadFallbackTokenMap(): Promise<TokenMap> {
  try {
    const raw = await readFile(FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const out: TokenMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && value.length > 0) {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

async function saveFallbackTokenMap(map: TokenMap): Promise<void> {
  await mkdir(dirname(FALLBACK_FILE), { recursive: true });
  await writeFile(FALLBACK_FILE, JSON.stringify(map, null, 2), {
    encoding: "utf8",
    mode: 0o600
  });
}
