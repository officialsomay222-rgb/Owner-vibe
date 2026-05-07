import { Innertube, UniversalCache } from 'youtubei.js';

// Cache the Innertube instance to optimize speed on Vercel
let ytInstance = null;

async function getYouTubeInstance() {
  if (!ytInstance) {
    ytInstance = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      clientType: 'ANDROID',
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

  try {
    const yt = await getYouTubeInstance();
    // Use a default trending query for music
    const searchResults = await yt.search('Top hits music global trending', { type: 'video' });

    // Filter out non-video results and get top 15
    const topResults = searchResults.videos
      .filter(item => item.type === 'Video')
      .slice(0, 15)
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
    console.error('Trending fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch trending music' });
  }
}
