import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import type { AppState } from "../types.js";

const STORE_FILE = join(homedir(), ".chagee-cli", "session.json");

export function sessionFilePath(): string {
  return STORE_FILE;
}

export async function loadSession(): Promise<Partial<AppState> | undefined> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    return undefined;
  }
}

export async function saveSession(state: AppState): Promise<void> {
  const payload: Partial<AppState> = {
    session: state.session,
    auth: state.auth,
    selectedStore: state.selectedStore,
    storesCache: state.storesCache,
    menuCache: state.menuCache,
    menuCacheByStore: state.menuCacheByStore,
    cart: state.cart,
    cartVersion: state.cartVersion,
    quote: state.quote,
    pendingCreatePayload: state.pendingCreatePayload,
    order: state.order,
    payment: state.payment,
    pendingLoginPhone: state.pendingLoginPhone
  };

  await mkdir(dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(payload, null, 2), "utf8");
}
