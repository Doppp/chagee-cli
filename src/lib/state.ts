import { getDefaultRegionProfile } from "../config/regions.js";
import type { AppPhase, AppState, SessionConfig } from "../types.js";

const defaultRegion = getDefaultRegionProfile();

export const DEFAULT_SESSION: SessionConfig = {
  mode: "dry-run",
  jsonOutput: false,
  region: defaultRegion.code,
  latitude: defaultRegion.defaultLatitude,
  longitude: defaultRegion.defaultLongitude,
  locationSource: "default",
  storePinned: false
};

export function createInitialState(): AppState {
  return {
    session: { ...DEFAULT_SESSION },
    storesCache: [],
    menuCache: [],
    menuCacheByStore: {},
    cart: [],
    cartVersion: 0
  };
}

export function nextCartVersion(state: AppState): void {
  state.cartVersion += 1;
  state.quote = undefined;
  state.pendingCreatePayload = undefined;
}

export function resetForStoreSwitch(state: AppState): void {
  state.cart = [];
  state.cartVersion += 1;
  state.quote = undefined;
  state.pendingCreatePayload = undefined;
  state.order = undefined;
  state.payment = undefined;
}

export function derivePhase(state: AppState): AppPhase {
  if (!state.auth) {
    return "UNAUTH";
  }
  if (!state.selectedStore) {
    return "AUTH_NO_STORE";
  }
  if (state.payment?.status === "pending") {
    return "PAYMENT_PENDING";
  }
  if (state.order?.status === "paid") {
    return "ORDER_PAID";
  }
  if (state.order?.status === "canceled") {
    return "ORDER_CANCELED";
  }
  if (state.order) {
    return "ORDER_CREATED";
  }
  if (state.quote) {
    return "QUOTED";
  }
  if (state.cart.length > 0) {
    return "CART_DIRTY";
  }
  return "READY";
}
