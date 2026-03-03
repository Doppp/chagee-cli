import type { StoreState } from "../types.js";

const CLOSED_SUFFIX = " [CLOSED]";
const CLOSED_STATUS_TOKENS = [
  "closed",
  "close",
  "休息",
  "打烊",
  "暂停",
  "暫停",
  "停业",
  "停業",
  "歇业",
  "歇業"
] as const;

export function isStoreClosed(store: Pick<StoreState, "runningStatusDesc">): boolean {
  const status = (store.runningStatusDesc ?? "").trim().toLowerCase();
  if (status.length === 0) {
    return false;
  }
  return CLOSED_STATUS_TOKENS.some((token) => status.includes(token));
}

export function formatStoreDisplayName(
  store: Pick<StoreState, "storeName" | "runningStatusDesc">
): string {
  if (!isStoreClosed(store)) {
    return store.storeName;
  }
  if (/\s\[closed\]$/i.test(store.storeName)) {
    return store.storeName;
  }
  return `${store.storeName}${CLOSED_SUFFIX}`;
}
