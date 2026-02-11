import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { RegionProfileInput } from "../config/regions.js";

const REGION_FILE = join(homedir(), ".chagee-cli", "regions.json");

export function regionFilePath(): string {
  return REGION_FILE;
}

export async function loadCustomRegionProfiles(): Promise<RegionProfileInput[]> {
  let raw = "";
  try {
    raw = await readFile(REGION_FILE, "utf8");
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return [];
  }

  const candidates = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown> | undefined)?.regions)
      ? (((parsed as Record<string, unknown>).regions as unknown[]) ?? [])
      : [];

  const out: RegionProfileInput[] = [];
  for (const item of candidates) {
    const mapped = mapRegionInput(item);
    if (mapped) {
      out.push(mapped);
    }
  }
  return out;
}

function mapRegionInput(value: unknown): RegionProfileInput | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const obj = value as Record<string, unknown>;
  const code = asString(obj.code);
  if (!code) {
    return undefined;
  }

  const profile: RegionProfileInput = { code };
  assignString(profile, "name", obj.name);
  assignString(profile, "apiBase", obj.apiBase);
  assignString(profile, "country", obj.country);
  assignString(profile, "defaultPhoneCode", obj.defaultPhoneCode);
  assignString(profile, "language", obj.language);
  assignString(profile, "acceptLanguage", obj.acceptLanguage);
  assignString(profile, "timezoneOffset", obj.timezoneOffset);
  assignString(profile, "deviceTimeZoneRegion", obj.deviceTimeZoneRegion);
  assignString(profile, "timeZone", obj.timeZone);
  assignString(profile, "currencySymbol", obj.currencySymbol);
  assignString(profile, "currencyCode", obj.currencyCode);
  assignString(profile, "channelCode", obj.channelCode);
  assignString(profile, "storeChannel", obj.storeChannel);
  assignString(profile, "tradeChannel", obj.tradeChannel);
  assignString(profile, "source", obj.source);
  assignString(profile, "appId", obj.appId);
  assignString(profile, "aid", obj.aid);
  assignString(profile, "apv", obj.apv);

  assignNumber(profile, "defaultLatitude", obj.defaultLatitude);
  assignNumber(profile, "defaultLongitude", obj.defaultLongitude);
  assignNumber(profile, "saleType", obj.saleType);
  assignNumber(profile, "saleChannel", obj.saleChannel);
  assignNumber(profile, "deliveryType", obj.deliveryType);
  assignNumber(profile, "businessType", obj.businessType);
  assignNumber(profile, "userType", obj.userType);

  assignBool(profile, "isTakeaway", obj.isTakeaway);

  return profile;
}

function assignString(
  target: RegionProfileInput,
  key: keyof RegionProfileInput,
  raw: unknown
): void {
  const value = asString(raw);
  if (value !== undefined) {
    ((target as unknown) as Record<string, unknown>)[key as string] = value;
  }
}

function assignNumber(
  target: RegionProfileInput,
  key: keyof RegionProfileInput,
  raw: unknown
): void {
  const value = asNumber(raw);
  if (value !== undefined) {
    ((target as unknown) as Record<string, unknown>)[key as string] = value;
  }
}

function assignBool(
  target: RegionProfileInput,
  key: keyof RegionProfileInput,
  raw: unknown
): void {
  const value = asBool(raw);
  if (value !== undefined) {
    ((target as unknown) as Record<string, unknown>)[key as string] = value;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.length > 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v === "true") {
      return true;
    }
    if (v === "false") {
      return false;
    }
  }
  return undefined;
}
