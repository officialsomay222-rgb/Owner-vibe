export const runtime = 'edge';
import { Innertube, UniversalCache } from 'youtubei.js';

export default async function handler(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (!id) {
    return new Response(JSON.stringify({ error: 'Video ID parameter "id" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const rangeHeader = request.headers.get('range');
  console.log(`[Stream] Edge proxy requested for ID: ${id}, Range: ${rangeHeader || 'none'}`);

  // 1. Try api.cobalt.tools
  try {
    console.log('[Stream] Attempting to fetch stream via api.cobalt.tools...');
    const cobaltPayload = {
      url: `https://www.youtube.com/watch?v=${id}`,
      downloadMode: 'audio',
      audioFormat: 'best',
    };

    const cobaltRes = await fetch('https://api.cobalt.tools', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cobaltPayload),
    });

    if (!cobaltRes.ok) {
       console.error(`[Stream] Cobalt API returned status ${cobaltRes.status}`);
       const cobaltError = await cobaltRes.text();
       console.error(`[Stream] Cobalt Error:`, cobaltError);
       throw new Error('Cobalt failed');
    }

    const cobaltData = await cobaltRes.json();
    console.log(`[Stream] Cobalt Data status:`, cobaltData.status);

    if (cobaltData.status === 'redirect' || cobaltData.status === 'tunnel') {
        const streamUrl = cobaltData.url;
        console.log(`[Stream] Cobalt returned stream URL: ${streamUrl.substring(0, 50)}...`);

        // Fetch from the stream URL and proxy it back
        const fetchHeaders = new Headers();
        if (rangeHeader) {
            fetchHeaders.set('Range', rangeHeader);
        }

        const streamRes = await fetch(streamUrl, {
            headers: fetchHeaders
        });

        if (!streamRes.ok && streamRes.status !== 206) {
             throw new Error(`Failed to fetch from Cobalt stream URL, status: ${streamRes.status}`);
        }

        const responseHeaders = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
            'Accept-Ranges': 'bytes',
        });

        // Copy over relevant headers
        const headersToCopy = ['Content-Type', 'Content-Length', 'Content-Range'];
        headersToCopy.forEach(header => {
            const val = streamRes.headers.get(header);
            if (val) responseHeaders.set(header, val);
        });

        // Fallback Content-Type if not provided
        if (!responseHeaders.has('Content-Type')) {
            responseHeaders.set('Content-Type', 'audio/mp4');
        }

        return new Response(streamRes.body, {
            status: streamRes.status,
            headers: responseHeaders
        });
    } else {
        throw new Error('Cobalt did not return a tunnel or redirect status');
    }

  } catch (err) {
    console.log(`[Stream] Cobalt fallback failed: ${err.message}. Falling back to youtubei.js...`);
  }

  // 2. Fallback to youtubei.js
  try {
    const yt = await Innertube.create({ clientType: 'ANDROID', cache: new UniversalCache(false) });
    const info = await yt.getBasicInfo(id);

    // Prioritize mp4a/m4a
    let format = info.chooseFormat({ type: 'audio', quality: 'best', format: 'mp4' });
    if (!format) {
         format = info.chooseFormat({ type: 'audio', quality: 'best' });
    }

    if (!format || !format.content_length) {
      throw new Error('Could not find a valid audio format with content_length from youtubei.js');
    }

    console.log(`[Stream] YouTubei.js found stream: ${format.mime_type}, size: ${format.content_length}, direct URL: ${!!format.url}`);

    if (format.url) {
        // Direct stream fetch
        const fetchHeaders = new Headers();
        if (rangeHeader) {
            fetchHeaders.set('Range', rangeHeader);
        }

        console.log(`[Stream] Fetching direct stream from youtubei.js URL...`);
        const streamRes = await fetch(format.url, {
            headers: fetchHeaders
        });

        if (!streamRes.ok && streamRes.status !== 206) {
             throw new Error(`Failed to fetch from direct youtubei.js stream URL, status: ${streamRes.status}`);
        }

        const responseHeaders = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
            'Accept-Ranges': 'bytes',
        });

        const headersToCopy = ['Content-Type', 'Content-Length', 'Content-Range'];
        headersToCopy.forEach(header => {
            const val = streamRes.headers.get(header);
            if (val) responseHeaders.set(header, val);
        });

         if (!responseHeaders.has('Content-Type')) {
            responseHeaders.set('Content-Type', format.mime_type || 'audio/mp4');
        }

        return new Response(streamRes.body, {
            status: streamRes.status,
            headers: responseHeaders
        });

    } else {
         throw new Error('Direct URL not found in youtubei.js format');
    }

  } catch (ytErr) {
     console.error('[Stream] youtubei.js fallback also failed:', ytErr);
  }

  // 3. Complete failure
  console.error('[Stream] All streaming proxy methods failed.');
  return new Response(JSON.stringify({ error: 'All streaming proxies failed' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
