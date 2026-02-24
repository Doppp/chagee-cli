import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import type { AppState } from "../types.js";
import { loadAuthToken, saveAuthToken } from "./token-store.js";

const STORE_FILE = join(homedir(), ".chagee-cli", "session.json");
const SESSION_SCHEMA_VERSION = 2;

interface SessionLoadResult {
  state?: Partial<AppState>;
  warnings: string[];
}

export function sessionFilePath(): string {
  return STORE_FILE;
}

export async function loadSession(): Promise<SessionLoadResult> {
  const warnings: string[] = [];
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const candidate = extractSessionCandidate(parsed, warnings);
    if (!candidate) {
      return { warnings };
    }
    const state = sanitizeSessionState(candidate, warnings);
    if (!state) {
      return { warnings };
    }

    const authUserId = state.auth?.userId;
    if (authUserId && !state.auth?.token) {
      const token = await loadAuthToken(authUserId);
      if (token) {
        state.auth = { ...(state.auth ?? {}), userId: authUserId, token };
      } else {
        warnings.push(`auth token missing from secure store for userId=${authUserId}; clearing auth state`);
        state.auth = undefined;
      }
    }

    return { state, warnings };
  } catch {
    return { warnings };
  }
}

export async function saveSession(state: AppState): Promise<void> {
  if (state.auth?.userId && state.auth.token) {
    await saveAuthToken(state.auth.userId, state.auth.token);
  }

  const auth =
    state.auth && typeof state.auth === "object"
      ? (() => {
          const { token: _token, ...rest } = state.auth;
          return rest;
        })()
      : undefined;

  const payload: Record<string, unknown> = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    session: state.session,
    auth,
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
  const tempFile = `${STORE_FILE}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempFile, JSON.stringify(payload, null, 2), {
    encoding: "utf8",
    mode: 0o600
  });
  await rename(tempFile, STORE_FILE);
}

function extractSessionCandidate(
  parsed: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!parsed || typeof parsed !== "object") {
    warnings.push("session file is not a JSON object");
    return undefined;
  }

  const root = parsed as Record<string, unknown>;
  const schemaVersion = asNumber(root.schemaVersion);
  if (schemaVersion !== undefined && schemaVersion > SESSION_SCHEMA_VERSION) {
    warnings.push(
      `session schemaVersion=${schemaVersion} is newer than supported=${SESSION_SCHEMA_VERSION}; attempting best-effort load`
    );
  }

  const stateNode =
    root.state && typeof root.state === "object"
      ? (root.state as Record<string, unknown>)
      : root;
  return stateNode;
}

function sanitizeSessionState(
  candidate: Record<string, unknown>,
  warnings: string[]
): Partial<AppState> | undefined {
  const out: Partial<AppState> = {};

  if (candidate.session && typeof candidate.session === "object") {
    out.session = candidate.session as AppState["session"];
  }

  if (candidate.auth && typeof candidate.auth === "object") {
    out.auth = candidate.auth as AppState["auth"];
  }

  if (candidate.selectedStore && typeof candidate.selectedStore === "object") {
    out.selectedStore = candidate.selectedStore as AppState["selectedStore"];
  }

  if (Array.isArray(candidate.storesCache)) {
    out.storesCache = candidate.storesCache as AppState["storesCache"];
  }
  if (Array.isArray(candidate.menuCache)) {
    out.menuCache = candidate.menuCache as AppState["menuCache"];
  }
  if (candidate.menuCacheByStore && typeof candidate.menuCacheByStore === "object") {
    out.menuCacheByStore = candidate.menuCacheByStore as AppState["menuCacheByStore"];
  }
  if (Array.isArray(candidate.cart)) {
    out.cart = candidate.cart as AppState["cart"];
  }
  if (typeof candidate.cartVersion === "number" && Number.isFinite(candidate.cartVersion)) {
    out.cartVersion = candidate.cartVersion;
  }

  if (candidate.quote && typeof candidate.quote === "object") {
    out.quote = candidate.quote as AppState["quote"];
  }
  if (candidate.pendingCreatePayload && typeof candidate.pendingCreatePayload === "object") {
    out.pendingCreatePayload = candidate.pendingCreatePayload as AppState["pendingCreatePayload"];
  }
  if (candidate.order && typeof candidate.order === "object") {
    out.order = candidate.order as AppState["order"];
  }
  if (candidate.payment && typeof candidate.payment === "object") {
    out.payment = candidate.payment as AppState["payment"];
  }
  if (typeof candidate.pendingLoginPhone === "string") {
    out.pendingLoginPhone = candidate.pendingLoginPhone;
  }

  if (!out.session) {
    warnings.push("session file missing `session`; ignoring persisted state");
    return undefined;
  }
  return out;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}
