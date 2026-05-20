import { Config, Context } from '@netlify/edge-functions';
import { Innertube } from 'youtubei.js';

let innertube: Innertube | null = null;

async function getInnertube() {
    if (!innertube) {
        innertube = await Innertube.create({
             // We can optionally add proxy/client config here
             generate_session_locally: true
        });
    }
    return innertube;
}

export default async (req: Request, context: Context) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    try {
        const yt = await getInnertube();

        // Handle /api/yt/search?q=...
        if (pathname === '/api/yt/search') {
            const query = url.searchParams.get('q');
            if (!query) {
                return new Response(JSON.stringify({ error: 'Missing query parameter q' }), { status: 400 });
            }

            const searchResults = await yt.search(query, { type: 'video' });

            const results = searchResults.videos.map((v: any) => ({
                id: v.id,
                title: v.title.text,
                author: v.author?.name || 'Unknown',
                thumbnailUrl: v.thumbnails?.[0]?.url || '',
                duration: v.duration?.text || '',
                type: 'song'
            }));

            return new Response(JSON.stringify({ results }), {
                headers: { 'content-type': 'application/json' }
            });
        }

        // Handle /api/yt/stream/:id
        const streamMatch = pathname.match(/^\/api\/yt\/stream\/(.+)$/);
        if (streamMatch && streamMatch[1]) {
            const videoId = streamMatch[1];

            // Get basic info to fetch the streaming data
            // We use ANDROID client to avoid signature cipher requirement for audio streams
            const info = await yt.getBasicInfo(videoId, { client: 'ANDROID' });

            if (!info || !info.streaming_data) {
                return new Response(JSON.stringify({ error: 'No streaming data found' }), { status: 404 });
            }

            // Return the adaptive formats (audio)
            const adaptiveFormats = info.streaming_data.adaptive_formats || [];
            // Use has_audio and !has_video as more robust check than mime_type string prefix
            const audioFormats = adaptiveFormats.filter((f: any) => (f.mime_type && f.mime_type.startsWith('audio')) || (f.has_audio && !f.has_video));

            return new Response(JSON.stringify({
                success: true,
                streamingUrls: audioFormats.map((f: any) => ({
                    url: f.url || f.signature_cipher,
                    mimeType: f.mime_type,
                    bitrate: f.bitrate,
                    quality: f.audio_quality,
                    itag: f.itag
                }))
            }), {
                headers: { 'content-type': 'application/json' }
            });
        }

        return new Response('Not found', { status: 404 });
    } catch (err: any) {
        console.error('YouTubei Edge Function Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

export const config: Config = {
  path: '/api/yt/*',
};
