/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// کش درون‌حافظه‌ای — جایگزین Redis در نسخهٔ پیش‌نمایش
// ============================================================================

const globalStore = globalThis as unknown as { __tyDemoCache?: Map<string, any> };
const store: Map<string, any> = globalStore.__tyDemoCache ?? new Map<string, any>();
globalStore.__tyDemoCache = store;

export const redis = {
  get: async (key: string) => (store.has(key) ? store.get(key) : null),
  set: async (key: string, value: any) => {
    store.set(key, value);
    return "OK";
  },
  setex: async (key: string, _ttl: number, value: any) => {
    store.set(key, value);
    return "OK";
  },
  del: async (...keys: string[]) => keys.forEach((k) => store.delete(k)),
  keys: async (pattern: string) => {
    const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    return [...store.keys()].filter((k) => regex.test(k));
  },
  exists: async (key: string) => (store.has(key) ? 1 : 0),
  incr: async (key: string) => {
    const next = Number(store.get(key) || 0) + 1;
    store.set(key, next);
    return next;
  },
  expire: async () => 1,
  hset: async (key: string, field: string, value: any) => {
    const hash = store.get(key) || {};
    hash[field] = value;
    store.set(key, hash);
    return 1;
  },
  hget: async (key: string, field: string) => (store.get(key) || {})[field] ?? null,
  quit: async () => "OK",
  on: () => undefined,
};

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value as string) as T;
  } catch {
    return null;
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length > 0) await redis.del(...keys);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}

export async function cacheExists(key: string): Promise<boolean> {
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function cacheIncr(key: string): Promise<number> {
  return redis.incr(key);
}

export async function cacheExpire(key: string, ttlSeconds: number): Promise<void> {
  await redis.expire(key, ttlSeconds);
}

export async function cacheHashSet(key: string, field: string, value: unknown): Promise<void> {
  await redis.hset(key, field, JSON.stringify(value));
}

export async function cacheHashGet<T = unknown>(key: string, field: string): Promise<T | null> {
  const value = await redis.hget(key, field);
  if (!value) return null;
  try {
    return JSON.parse(value as string) as T;
  } catch {
    return null;
  }
}

export const CACHE_TTL = {
  ARTIST_SEARCH: 5 * 60,
  ARTIST_DETAIL: 10 * 60,
  PORTFOLIO: 5 * 60,
  AVAILABILITY: 1 * 60,
  SLOTS: 2 * 60,
  DASHBOARD_STATS: 5 * 60,
  SETTINGS: 30 * 60,
  RATE_LIMIT_MESSAGES: 1 * 60,
  RATE_LIMIT_API: 15 * 60,
} as const;

export default redis;
