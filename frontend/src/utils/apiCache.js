/**
 * API Response Cache Utility
 * Caches API responses to reduce redundant requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@photo_app_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

class APICache {
  constructor() {
    this.memoryCache = new Map(); // Fast in-memory cache
    this.ttls = new Map();
  }

  /**
   * Generate cache key from URL and params
   */
  _getKey(url, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    return `${url}?${paramStr}`;
  }

  /**
   * Check if cache entry is still valid
   */
  _isValid(key) {
    const ttl = this.ttls.get(key);
    if (!ttl) return false;
    return Date.now() < ttl;
  }

  /**
   * Get cached response (memory first, then disk)
   */
  async get(url, params = {}) {
    const key = this._getKey(url, params);

    // Check memory cache first (faster)
    if (this.memoryCache.has(key) && this._isValid(key)) {
      console.log(`[APICache] HIT (memory): ${key}`);
      return this.memoryCache.get(key);
    }

    // Check disk cache
    try {
      const diskKey = CACHE_PREFIX + key;
      const cached = await AsyncStorage.getItem(diskKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (this._isValid(key)) {
          console.log(`[APICache] HIT (disk): ${key}`);
          // Restore to memory cache
          this.memoryCache.set(key, parsed);
          return parsed;
        } else {
          // Expired, remove it
          await AsyncStorage.removeItem(diskKey);
        }
      }
    } catch (e) {
      console.error('[APICache] Disk read error:', e);
    }

    console.log(`[APICache] MISS: ${key}`);
    return null;
  }

  /**
   * Set cache with TTL
   */
  async set(url, params = {}, data, ttl = DEFAULT_TTL) {
    const key = this._getKey(url, params);
    const expiresAt = Date.now() + ttl;

    // Memory cache
    this.memoryCache.set(key, data);
    this.ttls.set(key, expiresAt);

    // Disk cache
    try {
      const diskKey = CACHE_PREFIX + key;
      await AsyncStorage.setItem(diskKey, JSON.stringify(data));
      console.log(`[APICache] STORED: ${key} (TTL: ${(ttl / 1000).toFixed(0)}s)`);
    } catch (e) {
      console.error('[APICache] Disk write error:', e);
    }
  }

  /**
   * Clear specific cache entry
   */
  async clear(url, params = {}) {
    const key = this._getKey(url, params);
    this.memoryCache.delete(key);
    this.ttls.delete(key);

    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      console.log(`[APICache] CLEARED: ${key}`);
    } catch (e) {
      console.error('[APICache] Clear error:', e);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    this.memoryCache.clear();
    this.ttls.clear();

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[APICache] CLEARED ALL (${cacheKeys.length} entries)`);
    } catch (e) {
      console.error('[APICache] Clear all error:', e);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      memoryCached: this.memoryCache.size,
      cacheKeys: Array.from(this.memoryCache.keys()),
    };
  }
}

// Singleton instance
export const apiCache = new APICache();

/**
 * Fetch with cache support
 * Usage: fetchWithCache(url, options, cacheParams)
 */
export const fetchWithCache = async (
  url,
  options = {},
  { ttl = DEFAULT_TTL, skipCache = false, params = {} } = {}
) => {
  try {
    // Check cache first
    if (!skipCache) {
      const cached = await apiCache.get(url, params);
      if (cached) return cached;
    }

    // Fetch from network
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the response
    await apiCache.set(url, params, data, ttl);

    return data;
  } catch (error) {
    console.error('[APICache] Fetch error:', error);
    throw error;
  }
};
