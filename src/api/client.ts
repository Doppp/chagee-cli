import type { RegionProfile } from "../config/regions.js";
import type { ApiEnvelope, RequestEvent, ResponseEvent } from "../types.js";

const STATIC_BASE_HEADERS: Record<string, string> = {
  ua: "Dart/2.12 (dart:io)",
  debug: "1",
  os: "web",
  devicelanguage: "en",
  screenwidth: "1280",
  screenheight: "720",
  devicebrand: "Web",
  devicemodel: "Browser",
  uuid: "null",
  cid: "null",
  avc: "320",
  clientip: "",
  colordepth: "",
  browserinfo:
    '{"javaenabled":false,"javascriptenabled":true,"language":"en","useragent":"Mozilla/5.0"}',
  "accept-language": "en-US"
};

export interface ApiHooks {
  onRequest?: (event: RequestEvent) => void;
  onResponse?: (event: ResponseEvent) => void;
}

export interface RequestOptions {
  baseUrl?: string;
}

export class ChageeClient {
  constructor(
    private readonly getToken: () => string | undefined,
    private readonly getRegion: () => RegionProfile,
    private readonly hooks?: ApiHooks
  ) {}

  async sendVerifyCode(phone: string, sendType = 1): Promise<ApiEnvelope> {
    return this.post("/api/user-client/customer/sendVerifyCode", {
      sendType,
      sendObj: phone
    });
  }

  async loginOrRegister(params: {
    phone: string;
    code: string;
    phoneCode?: string;
  }): Promise<ApiEnvelope> {
    const region = this.getRegion();
    return this.post("/api/user-client/customer/loginOrRegister", {
      mobile: params.phone,
      phoneCode: params.phoneCode ?? region.defaultPhoneCode,
      code: params.code
    });
  }

  async commonLoginSg(params: {
    sourceCode: string;
    token: string;
  }): Promise<ApiEnvelope> {
    return this.post("/api/user-client/common/login/sg", {
      sourceCode: params.sourceCode,
      token: params.token
    });
  }

  async getCustomerInfo(): Promise<ApiEnvelope> {
    return this.get("/api/user-client/customer/info");
  }

  async getCustomerDetails(): Promise<ApiEnvelope> {
    return this.get("/api/user-client/customer/details");
  }

  async listStores(params: {
    latitude: number;
    longitude: number;
    userId?: string;
    pageNum?: number;
    pageSize?: number;
    isTakeaway?: boolean;
    channelCode?: string;
  }): Promise<ApiEnvelope> {
    const region = this.getRegion();
    return this.post("/api/navigation/store/list", {
      latitude: params.latitude,
      longitude: params.longitude,
      pageNum: params.pageNum ?? 1,
      pageSize: params.pageSize ?? 20,
      channelCode: params.channelCode ?? region.channelCode,
      userId: params.userId ?? "",
      isTakeaway: params.isTakeaway ?? region.isTakeaway
    });
  }

  async getStoreWaitInfo(params: {
    storeNo: string;
    isTakeaway?: boolean;
  }): Promise<ApiEnvelope> {
    const region = this.getRegion();
    return this.post("/api/navigation/store/getStoreWaitInfo", {
      storeNo: params.storeNo,
      isTakeaway: params.isTakeaway ?? region.isTakeaway
    });
  }

  async getStoreMenu(params: {
    storeNo: string;
    saleType?: number;
    saleChannel?: number;
  }): Promise<ApiEnvelope> {
    const region = this.getRegion();
    return this.post("/api/navigation/goods/storeGoodsMenu", {
      storeNo: params.storeNo,
      saleType: String(params.saleType ?? region.saleType),
      saleChannel: String(params.saleChannel ?? region.saleChannel)
    });
  }

  async getGoodsDetail(params: {
    spuId: string;
    storeNo: string;
    saleType?: number;
    saleChannel?: number;
  }): Promise<ApiEnvelope> {
    const region = this.getRegion();
    return this.post("/api/navigation/goods/detail", {
      spuId: params.spuId,
      storeNo: params.storeNo,
      saleType: String(params.saleType ?? region.saleType),
      saleChannel: String(params.saleChannel ?? region.saleChannel)
    });
  }

  async cartGet(params: {
    storeNo: string;
    userId: string;
    saleType?: number;
    saleChannel?: number;
    tradeChannel?: string;
  }): Promise<ApiEnvelope> {
    const region = this.getRegion();
    return this.post("/api/navigation/goods/shoppingCart/get", {
      storeNo: params.storeNo,
      userId: params.userId,
      saleType: String(params.saleType ?? region.saleType),
      saleChannel: String(params.saleChannel ?? region.saleChannel),
      tradeChannel: params.tradeChannel ?? region.tradeChannel,
      inAppDeliveryGray: false
    });
  }

  async cartChange(params: {
    userId: string;
    skuList: unknown[];
    saleType?: number;
    saleChannel?: number;
    inAppDeliveryGray?: boolean;
  }): Promise<ApiEnvelope> {
    const region = this.getRegion();
    return this.post("/api/navigation/goods/shoppingCart/change", {
      userId: params.userId,
      skuList: params.skuList,
      saleType: params.saleType ?? region.saleType,
      saleChannel: params.saleChannel ?? region.saleChannel,
      inAppDeliveryGray: params.inAppDeliveryGray ?? false
    });
  }

  async orderPrice(payload: Record<string, unknown>): Promise<ApiEnvelope> {
    return this.post("/api/navigation/order/price", payload);
  }

  async orderCreate(payload: Record<string, unknown>): Promise<ApiEnvelope> {
    return this.post("/api/navigation/order/create", payload);
  }

  async orderCancel(userId: string, orderNo: string): Promise<ApiEnvelope> {
    return this.post("/api/navigation/order/cancel", {
      userId,
      orderNo
    });
  }

  async continuePay(payload: Record<string, unknown>): Promise<ApiEnvelope> {
    return this.post("/api/navigation/order/continuePay", payload);
  }

  async payResultList(params: {
    userId: string;
    storeNo: string;
    orderNo: string;
  }): Promise<ApiEnvelope> {
    return this.post("/api/navigation/payment/payResultList", {
      userId: params.userId,
      storeNo: params.storeNo,
      orderNo: params.orderNo
    });
  }

  async post(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiEnvelope> {
    return this.request("POST", path, body, options);
  }

  async get(path: string, options?: RequestOptions): Promise<ApiEnvelope> {
    return this.request("GET", path, undefined, options);
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiEnvelope> {
    const region = this.getRegion();
    const baseUrl = options?.baseUrl ?? region.apiBase;
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const token = this.getToken();

    const headers = buildHeaders(region, token);

    if (method === "POST") {
      headers["content-type"] = "application/json";
    }

    this.hooks?.onRequest?.({
      ts: new Date().toISOString(),
      method,
      url,
      payload: body
    });

    const requestInit: RequestInit = {
      method,
      headers
    };
    if (method === "POST" && body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    const start = Date.now();
    const response = await fetch(url, requestInit);
    const elapsedMs = Date.now() - start;

    const text = await response.text();
    let parsed: unknown = text;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = { errcode: String(response.status), errmsg: text };
      }
    }

    this.hooks?.onResponse?.({
      ts: new Date().toISOString(),
      method,
      url,
      status: response.status,
      elapsedMs,
      body: parsed
    });

    if (typeof parsed === "object" && parsed !== null) {
      const envelope = parsed as ApiEnvelope;
      if (envelope.errcode === undefined) {
        envelope.errcode = String(response.status);
      }
      return envelope;
    }

    return {
      errcode: String(response.status),
      errmsg: typeof parsed === "string" ? parsed : "Unexpected response",
      data: parsed
    };
  }
}

function buildHeaders(region: RegionProfile, token?: string): Record<string, string> {
  return {
    ...STATIC_BASE_HEADERS,
    language: region.language,
    region: region.code,
    channel: region.channelCode,
    apv: region.apv,
    aid: region.aid,
    timezoneoffset: region.timezoneOffset,
    devicetimezoneregion: region.deviceTimeZoneRegion,
    "accept-language": region.acceptLanguage,
    authorization: token ?? "null"
  };
}

export function isApiOk(envelope: ApiEnvelope): boolean {
  return String(envelope.errcode ?? "") === "0";
}

export function envelopeData<T = unknown>(envelope: ApiEnvelope): T | undefined {
  return envelope.data as T | undefined;
}

export function extractToken(envelope: ApiEnvelope): string | undefined {
  const data = envelope.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const candidates = [data.token, data.accessToken, data.authToken];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return undefined;
}

export function extractUserId(envelope: ApiEnvelope): string | undefined {
  const data = envelope.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const candidates = [data.userId, data.uid, data.id];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return undefined;
}
