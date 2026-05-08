import { Innertube, UniversalCache } from 'youtubei.js';

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
    'https://piped.video/api',
    'https://pipedapi.mha.fi',
    'https://api.piped.privacydev.net',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.smnz.de'
  ];

  for (const instance of pipedInstances) {
    try {
      console.log(`Attempting to fetch from Piped API instance: ${instance} for video: ${id}`);
      // Remove trailing slash if exists for cleaner URLs
      const baseUrl = instance.endsWith('/') ? instance.slice(0, -1) : instance;
      const pipedApiUrl = `${baseUrl}/streams/${id}`;
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
      res.writeHead(302, { Location: bestAudioStream.url });
      return res.end();

    } catch (error) {
      console.error(`Error with instance ${instance}:`, error.message);
      // Continue to the next instance
    }
  }

  // If all instances failed, fallback to youtubei.js
  console.log('All Piped instances failed. Falling back to youtubei.js...');

  try {
    const yt = await Innertube.create({ clientType: 'ANDROID_VR', cache: new UniversalCache(false) });
    const info = await yt.getBasicInfo(id);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });

    if (!format || !format.content_length) {
      throw new Error('Could not find a valid audio format with content_length from youtubei.js');
    }

    console.log(`Piping fallback stream directly: ${format.mime_type}, size: ${format.content_length}`);

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', format.content_length);
    res.setHeader('Content-Type', format.mime_type || 'audio/mp4');

    // Handle range requests
    const range = req.headers.range;
    let start = 0;
    let end = format.content_length - 1;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : format.content_length - 1;
      const chunksize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${format.content_length}`,
        'Content-Length': chunksize,
        'Content-Type': format.mime_type || 'audio/mp4',
      });
    } else {
      res.writeHead(200);
    }

    // Quick write helper to respect backpressure slightly
    const writeToRes = (chunk) => new Promise((resolve, reject) => {
        if (res.destroyed) {
            return reject(new Error('Response destroyed'));
        }
        if (!res.write(chunk)) {
            res.once('drain', resolve);
        } else {
            resolve();
        }
    });

    try {
      if (format.url) {
          // If a direct URL is available, we can fetch it with Range header
          console.log(`Fetching from direct URL with Range: bytes=${start}-${end}`);
          const response = await fetch(format.url, {
              headers: {
                  Range: `bytes=${start}-${end}`
              }
          });

          if (!response.ok) {
             throw new Error(`Direct fetch failed with status ${response.status}`);
          }

          // @ts-ignore
          for await (const chunk of response.body) {
              if (res.destroyed) break;
              await writeToRes(chunk);
          }
      } else {
          // Fallback to downloading using yt.download if no url directly available (rare for ANDROID_VR but possible)
          console.log(`Downloading stream from yt.download...`);
          const stream = await yt.download(id, {
            type: 'audio',
            quality: 'best',
            client: 'ANDROID_VR'
          });

          let downloaded = 0;
          let bytesWritten = 0;
          const targetLength = end - start + 1;

          for await (const chunk of stream) {
            if (res.destroyed) break;

            const chunkStart = downloaded;
            const chunkEnd = downloaded + chunk.length - 1;

            // Check if chunk overlaps with our requested range
            if (chunkEnd >= start && chunkStart <= end) {
               const sliceStart = Math.max(0, start - chunkStart);
               // Ensure we don't write past the end byte
               const sliceEnd = Math.min(chunk.length, end - chunkStart + 1);
               const toWrite = chunk.slice(sliceStart, sliceEnd);

               await writeToRes(toWrite);
               bytesWritten += toWrite.length;

               if (bytesWritten >= targetLength) {
                   break;
               }
            }
            downloaded += chunk.length;
          }
      }
    } catch (streamErr) {
       console.error('Stream piping error:', streamErr.message);
    } finally {
       if (!res.destroyed) {
          res.end();
       }
    }
    return;

  } catch (ytError) {
    console.error('youtubei.js fallback failed:', ytError.message);
  }

  // If all instances AND fallback failed
  console.error('All streaming proxies and fallback failed to resolve.');
  if (!res.headersSent) {
    return res.status(500).json({ error: 'All streaming proxies failed' });
  } else {
    res.end();
  }
}
