export const runtime = 'edge';

export default async function handler(request) {
  // Handle CORS for OPTIONS
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
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response('Video ID parameter "id" is required', { status: 400 });
  }

  const rangeHeader = request.headers.get('range');

  try {
    // 1. Fetch from Cobalt
    const cobaltPayload = {
      url: `https://www.youtube.com/watch?v=${id}`,
      downloadMode: 'audio',
      audioFormat: 'best',
    };

    const cobaltResponse = await fetch('https://api.cobalt.tools', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cobaltPayload),
    });

    // 2. Parse JSON
    const data = await cobaltResponse.json();
    const audioUrl = data.url;

    // 3. Error Handling
    if (!audioUrl) {
      return new Response(`Cobalt failed: no URL in response. Cobalt status: ${data.status}`, { status: 500 });
    }

    // 4. Fetch the REAL Audio
    const fetchHeaders = new Headers();
    if (rangeHeader) {
      fetchHeaders.set('Range', rangeHeader);
    }

    const streamResponse = await fetch(audioUrl, {
      headers: fetchHeaders
    });

    if (!streamResponse.ok && streamResponse.status !== 206) {
      return new Response(`Failed to fetch real audio: ${streamResponse.status} ${streamResponse.statusText}`, { status: 500 });
    }

    // 5. Pipe the Stream
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
      'Accept-Ranges': 'bytes',
      'Content-Type': 'audio/mp4' // YOU MUST SET the Content-Type: audio/mp4 header in the final response
    });

    // forwarding Accept-Ranges, Content-Length, and Content-Range.
    const contentLength = streamResponse.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = streamResponse.headers.get('Content-Range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    const acceptRanges = streamResponse.headers.get('Accept-Ranges');
    if (acceptRanges) {
      responseHeaders.set('Accept-Ranges', acceptRanges);
    }

    return new Response(streamResponse.body, {
      status: streamResponse.status,
      headers: responseHeaders
    });

  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
