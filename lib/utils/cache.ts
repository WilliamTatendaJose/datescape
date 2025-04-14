import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheItem<T> = {
  data: T;
  timestamp: number;
};

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = '@datescape_cache';

  private constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  private async loadFromStorage() {
    try {
      const storedCache = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedCache) {
        const parsed = JSON.parse(storedCache);
        this.cache = new Map(Object.entries(parsed));
        // Clean up expired items
        for (const [key, item] of this.cache.entries()) {
          if (Date.now() > item.timestamp) {
            this.cache.delete(key);
          }
        }
        await this.persistToStorage();
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  private async persistToStorage() {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error persisting cache to storage:', error);
    }
  }

  async set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
    await this.persistToStorage();
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      await this.persistToStorage();
      return null;
    }
    return item.data as T;
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
    await this.persistToStorage();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await this.persistToStorage();
  }
}

export const cache = Cache.getInstance();