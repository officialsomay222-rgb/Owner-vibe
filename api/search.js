import { Innertube, UniversalCache } from 'youtubei.js';

// Cache the Innertube instance to optimize speed on Vercel
let ytInstance = null;

async function getYouTubeInstance() {
  if (!ytInstance) {
    ytInstance = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      clientType: 'TV', // Use TV client to bypass login checks
    });
  }
  return ytInstance;
}

export default async function handler(req, res) {
  // CORS Headers for wide open access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const yt = await getYouTubeInstance();
    const searchResults = await yt.search(q);

    // Filter out non-video results and get top 10
    const topResults = searchResults.videos
      .filter(item => item.type === 'Video')
      .slice(0, 10)
      .map((video) => {
        // Get highest resolution thumbnail
        const highResThumb = video.thumbnails?.sort((a, b) => b.width - a.width)[0]?.url || '';

        return {
          videoId: video.id,
          title: video.title?.text || '',
          artist: video.author?.name || '',
          duration: video.duration?.text || '',
          thumbnailUrl: highResThumb,
        };
      });

    return res.status(200).json(topResults);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to search YouTube' });
  }
}
