let currentKeyIndex = 0;

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

export async function fetchWithFallback(urlFn) {
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
    return data;
  }
}
