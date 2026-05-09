import { Innertube, UniversalCache } from 'youtubei.js';


export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('id');

    if (!videoId) return new Response("Missing id parameter", { status: 400 });

    // 1. Initialize InnerTube for Edge
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });

    // 2. Fetch data as an Android Client to bypass throttling
    const info = await yt.getBasicInfo(videoId, 'ANDROID');

    // 3. Extract the best audio format
    const format = info.streaming_data?.adaptive_formats
      ?.filter(f => f.has_audio && !f.has_video && f.mime_type.includes('mp4'))
      .sort((a, b) => b.bitrate - a.bitrate)[0];

    if (!format) return new Response("No suitable audio format found", { status: 404 });

    // 4. Setup Range headers for seeking
    const fetchHeaders = new Headers();
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) fetchHeaders.set('Range', rangeHeader);

    // 5. Pipe the stream directly from YouTube via Vercel Edge
    const youtubeResponse = await fetch(format.url, { headers: fetchHeaders });

    const responseHeaders = new Headers(youtubeResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    if (!responseHeaders.has('Content-Type')) {
        responseHeaders.set('Content-Type', format.mime_type || 'audio/mp4');
    }

    return new Response(youtubeResponse.body, {
      status: youtubeResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
