type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class MemoryCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlSeconds: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const CACHE_KEYS = {
  STOCK: "cache:stock",
  STOCK_CATALOG: "cache:stock:catalog",
  OSO_ORDERS: "cache:oso:orders",
} as const;

export const CACHE_HEADERS = {
  HIT: "HIT",
  MISS: "MISS",
} as const;

export const stockCache = new MemoryCache<unknown>();
export const osoCache = new MemoryCache<unknown>();
