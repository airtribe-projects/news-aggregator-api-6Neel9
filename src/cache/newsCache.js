// Simple TTL cache; production: replace with Redis
class NewsCache {
  constructor(ttlSeconds = 300) {
    this.ttl = ttlSeconds * 1000;
    this.map = new Map(); // key -> { ts, value }
  }

  _expired(entry) {
    return (Date.now() - entry.ts) > this.ttl;
  }

  get(key) {
    const e = this.map.get(key);
    if (!e) return null;
    if (this._expired(e)) {
      this.map.delete(key);
      return null;
    }
    return e.value;
  }

  set(key, value) {
    this.map.set(key, { ts: Date.now(), value });
  }

  del(key) {
    this.map.delete(key);
  }

  keys() {
    return Array.from(this.map.keys());
  }

  clear() {
    this.map.clear();
  }
}

module.exports = new NewsCache(process.env.CACHE_TTL_SECONDS ? Number(process.env.CACHE_TTL_SECONDS) : 300);
