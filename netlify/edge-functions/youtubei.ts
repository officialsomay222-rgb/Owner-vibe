import { Config, Context } from '@netlify/edge-functions';
import { Innertube, Utils } from 'youtubei.js';

// Netlify Edge functions run on Deno, which supports `new Function()` natively.
// We don't need Jintr (which causes bundle size/deployment issues in edge environments).
// Let's use `new Function()` directly for the fastest, most reliable evaluator on Edge!

Utils.Platform.shim.eval = (script: any, env: any) => {
    const fn = new Function(...Object.keys(env), script.output);
    const result = fn(...Object.values(env));
    return result;
};

let innertube: Innertube | null = null;

async function getInnertube() {
    if (!innertube) {
        innertube = await Innertube.create({
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
            // We use IOS client first because it natively yields stream URLs without requiring deciphering often,
            // then fallback to ANDROID, MWEB, or WEB if streaming_data is missing
            let info;

            try {
                info = await yt.getBasicInfo(videoId, { client: 'IOS' });
            } catch (e) {
                console.error('IOS client failed:', e);
            }

            if (!info || !info.streaming_data) {
                try {
                    info = await yt.getBasicInfo(videoId, { client: 'ANDROID' });
                } catch (e) {
                    console.error('ANDROID client failed:', e);
                }
            }

            if (!info || !info.streaming_data) {
                try {
                    info = await yt.getBasicInfo(videoId, { client: 'MWEB' });
                } catch (e) {
                    console.error('MWEB client failed:', e);
                }
            }

            if (!info || !info.streaming_data) {
                try {
                    info = await yt.getBasicInfo(videoId, { client: 'WEB' });
                } catch (e) {
                    console.error('WEB client failed:', e);
                }
            }

            if (!info || !info.streaming_data) {
                try {
                    info = await yt.getBasicInfo(videoId, { client: 'TV' });
                } catch (e) {
                    console.error('TV client failed:', e);
                }
            }

            if (!info || !info.streaming_data) {
                return new Response(JSON.stringify({ error: 'No streaming data found after multiple clients' }), { status: 404 });
            }

            // Return the adaptive formats (audio)
            const adaptiveFormats = info.streaming_data.adaptive_formats || [];
            const audioFormats = adaptiveFormats.filter((f: any) => (f.mime_type && f.mime_type.startsWith('audio')) || (f.has_audio && !f.has_video));

            const streamingUrls = [];
            for (const f of audioFormats) {
                let streamUrl = f.url;
                if (!streamUrl && f.signature_cipher) {
                    try {
                        if (typeof f.decipher === 'function') {
                            await f.decipher(yt.session.player);
                        }
                        streamUrl = f.url;
                    } catch (decipherError) {
                        console.error('Decipher error:', decipherError);
                    }
                }

                if (streamUrl) {
                    streamingUrls.push({
                        url: streamUrl,
                        mimeType: f.mime_type,
                        bitrate: f.bitrate,
                        quality: f.audio_quality,
                        itag: f.itag
                    });
                }
            }

            return new Response(JSON.stringify({
                success: true,
                streamingUrls
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
