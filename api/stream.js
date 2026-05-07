import { Innertube, UniversalCache } from 'youtubei.js';

let ytInstance = null;

async function getYouTubeInstance() {
  if (!ytInstance) {
    ytInstance = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      clientType: "TV" // use TV client for initialization
    });
  }
  return ytInstance;
}

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

  try {
    const yt = await getYouTubeInstance();

    // We get the stream using the ANDROID client type as it's more stable for downloads
    // bypassing deciphering issues currently happening on WEB
    const stream = await yt.download(id, {
      type: 'audio',
      quality: 'best',
      client: 'ANDROID'
    });

    res.setHeader('Content-Type', 'audio/mp4'); // Typically m4a/mp4 container
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the stream directly to the response
    for await (const chunk of stream) {
      // In Vercel serverless, writing chunks to the response works effectively
      res.write(chunk);
    }

    res.end();

  } catch (error) {
    console.error('youtubei.js stream error:', error.message);

    // Fallback Proxy logic
    try {
      console.log(`Falling back to Piped API for video: ${id}`);
      const pipedApiUrl = `https://pipedapi.kavin.rocks/streams/${id}`;
      const pipedResponse = await fetch(pipedApiUrl);

      if (!pipedResponse.ok) {
        throw new Error(`Piped API failed with status ${pipedResponse.status}`);
      }

      const pipedData = await pipedResponse.json();

      if (!pipedData.audioStreams || pipedData.audioStreams.length === 0) {
        throw new Error('No audio streams found from Piped API');
      }

      // Get the highest bitrate audio stream
      const bestAudioStream = pipedData.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];

      const audioResponse = await fetch(bestAudioStream.url);

      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio from Piped URL: ${audioResponse.status}`);
      }

      if (!res.headersSent) {
        res.setHeader('Content-Type', audioResponse.headers.get('content-type') || 'audio/mp4');
        res.setHeader('Transfer-Encoding', 'chunked');
      }

      // Pipe the fetched audio stream to the client
      if (audioResponse.body) {
        // Handle web stream response from fetch
        for await (const chunk of audioResponse.body) {
          res.write(chunk);
        }
        res.end();
      } else {
        // Fallback if body is not async iterable (e.g. node-fetch without stream)
        const buffer = await audioResponse.arrayBuffer();
        res.end(Buffer.from(buffer));
      }
    } catch (fallbackError) {
      console.error('Fallback proxy error:', fallbackError.message);

      // Check if headers have been sent before trying to send JSON error
      if (!res.headersSent) {
          if (error.message && error.message.includes('age-restricted')) {
              return res.status(403).json({ error: 'Video is age-restricted and cannot be streamed' });
          }
          return res.status(500).json({ error: 'Failed to fetch audio stream' });
      } else {
          // Just end the response if headers were already sent
          res.end();
      }
    }
  }
}
