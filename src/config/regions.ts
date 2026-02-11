export interface RegionProfile {
  code: string;
  name: string;
  apiBase: string;
  country: string;
  defaultPhoneCode: string;
  defaultLatitude: number;
  defaultLongitude: number;
  language: string;
  acceptLanguage: string;
  timezoneOffset: string;
  deviceTimeZoneRegion: string;
  timeZone: string;
  currencySymbol: string;
  currencyCode: string;
  channelCode: string;
  storeChannel: string;
  saleType: number;
  saleChannel: number;
  tradeChannel: string;
  source: string;
  deliveryType: number;
  businessType: number;
  userType: number;
  appId: string;
  aid: string;
  apv: string;
  isTakeaway: boolean;
}

export interface RegionProfileInput extends Partial<Omit<RegionProfile, "code">> {
  code: string;
}

export const DEFAULT_REGION_CODE = "SG";

const DEFAULT_PROFILE: RegionProfile = {
  code: DEFAULT_REGION_CODE,
  name: "Singapore",
  apiBase: "https://api-sea.chagee.com",
  country: "SG",
  defaultPhoneCode: "+65",
  defaultLatitude: 1.3521,
  defaultLongitude: 103.8198,
  language: "en-us",
  acceptLanguage: "en-US",
  timezoneOffset: "480",
  deviceTimeZoneRegion: "Asia/Singapore",
  timeZone: "Asia/Singapore",
  currencySymbol: "$",
  currencyCode: "SGD",
  channelCode: "H5",
  storeChannel: "H5",
  saleType: 1,
  saleChannel: 8,
  tradeChannel: "10",
  source: "10",
  deliveryType: 1,
  businessType: 1,
  userType: 3,
  appId: "wx4f4f6e46fc890118",
  aid: "100001",
  apv: "3.22.0",
  isTakeaway: false
};

const BUILTIN_PROFILES: RegionProfile[] = [DEFAULT_PROFILE];

export function normalizeRegionCode(code: string): string {
  return code.trim().toUpperCase();
}

export function getDefaultRegionProfile(): RegionProfile {
  return { ...DEFAULT_PROFILE };
}

export function getBuiltInRegionProfiles(): RegionProfile[] {
  return BUILTIN_PROFILES.map((p) => ({ ...p }));
}

export function buildRegionProfile(
  input: RegionProfileInput,
  base?: RegionProfile
): RegionProfile {
  const fallback = base ?? DEFAULT_PROFILE;
  const code = normalizeRegionCode(input.code);
  return {
    code,
    name: input.name ?? fallback.name,
    apiBase: input.apiBase ?? fallback.apiBase,
    country: input.country ?? (code || fallback.country),
    defaultPhoneCode: input.defaultPhoneCode ?? fallback.defaultPhoneCode,
    defaultLatitude: input.defaultLatitude ?? fallback.defaultLatitude,
    defaultLongitude: input.defaultLongitude ?? fallback.defaultLongitude,
    language: input.language ?? fallback.language,
    acceptLanguage: input.acceptLanguage ?? fallback.acceptLanguage,
    timezoneOffset: input.timezoneOffset ?? fallback.timezoneOffset,
    deviceTimeZoneRegion: input.deviceTimeZoneRegion ?? fallback.deviceTimeZoneRegion,
    timeZone: input.timeZone ?? fallback.timeZone,
    currencySymbol: input.currencySymbol ?? fallback.currencySymbol,
    currencyCode: input.currencyCode ?? fallback.currencyCode,
    channelCode: input.channelCode ?? fallback.channelCode,
    storeChannel: input.storeChannel ?? fallback.storeChannel,
    saleType: input.saleType ?? fallback.saleType,
    saleChannel: input.saleChannel ?? fallback.saleChannel,
    tradeChannel: input.tradeChannel ?? fallback.tradeChannel,
    source: input.source ?? fallback.source,
    deliveryType: input.deliveryType ?? fallback.deliveryType,
    businessType: input.businessType ?? fallback.businessType,
    userType: input.userType ?? fallback.userType,
    appId: input.appId ?? fallback.appId,
    aid: input.aid ?? fallback.aid,
    apv: input.apv ?? fallback.apv,
    isTakeaway: input.isTakeaway ?? fallback.isTakeaway
  };
}

export function buildRegionRegistry(
  customProfiles: RegionProfileInput[]
): Map<string, RegionProfile> {
  const registry = new Map<string, RegionProfile>();
  for (const profile of BUILTIN_PROFILES) {
    registry.set(profile.code, { ...profile });
  }

  for (const input of customProfiles) {
    const code = normalizeRegionCode(input.code);
    if (!code) {
      continue;
    }
    const current = registry.get(code);
    const base = current
      ? { ...current }
      : buildRegionProfile({ code, name: code, country: code }, DEFAULT_PROFILE);
    const resolved = buildRegionProfile({ ...input, code }, base);
    registry.set(code, resolved);
  }

  return registry;
}
