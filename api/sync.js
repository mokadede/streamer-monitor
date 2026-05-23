import { supabase } from './_utils/supabase.js';
import { processStream } from './_utils/streamProcessor.js';
import { getApiKeys, pruneExpiredCache } from './_utils/youtube.js';

export default async function handler(request, response) {
  try {
    if (getApiKeys().length === 0) {
      return response.status(500).json({ error: 'Missing YouTube API Keys' });
    }

    // Bersihkan in-memory cache yang sudah expired sebelum mulai sync cycle
    pruneExpiredCache();

    // Ambil semua data stream dari DB (termasuk yt_uploads_id untuk DB cache)
    const { data: streams, error } = await supabase.from('streams').select('*');
    if (error) {
      return response.status(500).json({ error: error.message });
    }

    // Jalankan semua (dengan sedikit delay antar request)
    for (const stream of streams) {
      await processStream(stream);
      await new Promise(res => setTimeout(res, 300));
    }

    return response.status(200).json({ success: true, message: `Synced ${streams.length} channels` });

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
