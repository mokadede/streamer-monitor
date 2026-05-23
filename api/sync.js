import { supabase } from './_utils/supabase.js';
import { processStream } from './_utils/streamProcessor.js';
import { getApiKeys, pruneExpiredCache } from './_utils/youtube.js';

export default async function handler(request, response) {
  try {
    // ── Otorisasi & Rate Limiting Pintar (Opsi 1) ──
    const authHeader = request.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // Bersihkan in-memory cache yang sudah expired sebelum mulai sync cycle
    pruneExpiredCache();

    // Ambil semua data stream dari DB (termasuk yt_uploads_id untuk DB cache)
    const { data: streams, error } = await supabase.from('streams').select('*');
    if (error) {
      return response.status(500).json({ error: error.message });
    }

    // Cari timestamp terakhir data disinkronkan di antara semua stream
    let lastUpdatedMs = 0;
    for (const stream of streams) {
      if (stream.yt_last_updated) {
        const time = new Date(stream.yt_last_updated).getTime();
        if (time > lastUpdatedMs) {
          lastUpdatedMs = time;
        }
      }
    }

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    const isStale = (now - lastUpdatedMs) > fiveMinutes;

    // Jika tidak diotorisasi (dipanggil dari browser pengunjung) dan data masih segar (< 5 menit), lewati sync
    if (!isAuthorized && !isStale) {
      console.log(`[Sync Bypassed] Data masih segar. Terakhir diupdate: ${new Date(lastUpdatedMs).toISOString()}`);
      return response.status(200).json({
        success: true,
        message: 'Sync skipped: data is still fresh (< 5 minutes old)',
        last_updated: new Date(lastUpdatedMs).toISOString()
      });
    }

    if (getApiKeys().length === 0) {
      return response.status(500).json({ error: 'Missing YouTube API Keys' });
    }

    console.log(`[Sync Triggered] Mulai sinkronisasi untuk ${streams.length} channel...`);

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
