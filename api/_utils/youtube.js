let currentKeyIndex = 0;

// ──────────────────────────────────────────────
// In-memory Request Cache (Level 1)
// Mencegah hit API yang sama dalam 1 siklus sync.
// Key: URL string, Value: { data, expiresAt }
// ──────────────────────────────────────────────
const requestCache = new Map();
const REQUEST_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

export function getApiKeys() {
  return [
    process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY,
    process.env.YOUTUBE_API_KEY_FALLBACK,
  ].filter(Boolean);
}

function getApiKey() {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error('Missing YouTube API Keys');
  return keys[currentKeyIndex];
}

function nextApiKey() {
  const keys = getApiKeys();
  if (currentKeyIndex < keys.length - 1) {
    currentKeyIndex++;
    console.log(`[!] API Key limit reached. Switching to Backup API Key...`);
    return true;
  }
  console.error('[!!!] All API Keys have exhausted their quotas.');
  return false;
}

export function formatNumber(num) {
  if (!num) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

/**
 * Fetch dengan in-memory cache dan API key fallback.
 * Jika URL yang sama sudah pernah di-fetch dalam 5 menit terakhir,
 * hasilnya langsung dikembalikan dari cache tanpa hit API YouTube.
 */
export async function fetchWithFallback(urlFn) {
  // Buat cache key dari URL menggunakan key saat ini
  // (tanpa API key itu sendiri agar key rotation tidak merusak cache)
  const cacheKey = urlFn('__KEY_PLACEHOLDER__');

  // Cek in-memory cache
  const cached = requestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[Cache HIT] ${cacheKey.split('?')[0]}`);
    return cached.data;
  }

  // Tidak ada cache, fetch dari YouTube API
  while (true) {
    const url = urlFn(getApiKey());
    const res = await fetch(url);
    const data = await res.json();

    if (data.error && (data.error.code === 403 || data.error.code === 429)) {
      if (nextApiKey()) {
        continue;
      } else {
        throw new Error('All API Keys exhausted');
      }
    }

    // Simpan ke in-memory cache
    requestCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + REQUEST_CACHE_TTL_MS,
    });

    return data;
  }
}

/**
 * Membersihkan semua cache yang sudah expired.
 * Dipanggil di awal setiap siklus sync untuk manajemen memori.
 */
export function pruneExpiredCache() {
  const now = Date.now();
  let pruned = 0;
  for (const [key, value] of requestCache.entries()) {
    if (value.expiresAt <= now) {
      requestCache.delete(key);
      pruned++;
    }
  }
  if (pruned > 0) console.log(`[Cache] Pruned ${pruned} expired entries.`);
}
