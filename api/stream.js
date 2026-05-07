export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Video ID parameter "id" is required' });
  }

  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.smnz.de'
  ];

  for (const instance of pipedInstances) {
    try {
      console.log(`Attempting to fetch from Piped API instance: ${instance} for video: ${id}`);
      const pipedApiUrl = `${instance}/streams/${id}`;
      const pipedResponse = await fetch(pipedApiUrl);

      if (!pipedResponse.ok) {
        throw new Error(`Piped API failed with status ${pipedResponse.status}`);
      }

      const pipedData = await pipedResponse.json();

      if (!pipedData.audioStreams || pipedData.audioStreams.length === 0) {
        throw new Error('No audio streams found from Piped API');
      }

      // Sort streams by highest bitrate
      const sortedStreams = pipedData.audioStreams.sort((a, b) => b.bitrate - a.bitrate);

      // Prioritize m4a/mp4a format
      let bestAudioStream = sortedStreams.find(s => s.mimeType && (s.mimeType.includes('m4a') || s.mimeType.includes('mp4a')));

      // Fallback to highest bitrate if no m4a
      if (!bestAudioStream) {
        bestAudioStream = sortedStreams[0];
      }

      if (!bestAudioStream || !bestAudioStream.url) {
         throw new Error('Could not extract a valid audio URL');
      }

      console.log(`Successfully resolved audio URL from ${instance}. Redirecting...`);

      // We must not use res.redirect() directly if it overwrites headers or is unavailable in raw http server context
      // But Vercel's res.redirect is standard. Let's use writeHead instead for max control to preserve CORS.
      res.writeHead(302, { Location: bestAudioStream.url });
      return res.end();

    } catch (error) {
      console.error(`Error with instance ${instance}:`, error.message);
      // Continue to the next instance
    }
  }

  // If all instances failed
  console.error('All streaming proxies failed to resolve.');
  if (!res.headersSent) {
    return res.status(500).json({ error: 'All streaming proxies failed' });
  } else {
    res.end();
  }
}
