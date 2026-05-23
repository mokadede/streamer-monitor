import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return response.status(500).json({ error: 'Missing Supabase URL or Key' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return response.status(500).json({ error: error.message });
    }

    // Set Cache-Control header for Vercel Edge Cache
    // s-maxage=60: cache on CDN for 60 seconds
    // stale-while-revalidate=600: serve stale data up to 10 minutes while updating in the background
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
