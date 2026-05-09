import { Innertube, UniversalCache } from 'youtubei.js';

// 1. GLOBAL INITIALIZATION: Keep the session warm outside the handler for instant playback
let yt;
const initializeYoutube = async () => {
  if (!yt) {
    yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      clientType: 'IOS'
    });
  }
  return yt;
};

export default async function handler(req, res) {
  // Polyfill send for Node
  if (!res.send) res.send = (text) => res.end(text);

  try {
    // Vite custom plugin fallback if req.query is undefined but req.url is available
    let videoId = req.query?.id;
    if (!videoId && req.url) {
      try {
        const url = new URL(req.url, 'http://localhost');
        videoId = url.searchParams.get('id');
      } catch (e) {
         // ignore
      }
    }

    if (!videoId) return res.status(400).send("Missing video ID");

    const youtube = await initializeYoutube();

    // 3. FETCH METADATA: Emulating Android/IOS to bypass web-client throttling
    const info = await youtube.getBasicInfo(videoId, 'IOS');

    // 4. FORMAT SELECTION: Filtering for pure MP4 audio to prevent format errors
    const format = info.chooseFormat({
      type: 'audio',
      quality: 'best',
      format: 'mp4',
      client: 'IOS'
    });

    if (!format) {
      return res.status(404).send("No suitable audio format found");
    }

    // 5. RANGE HANDLING: Support for mobile seeking/scrubbing
    const fetchHeaders = {};
    if (req.headers && req.headers.range) {
      fetchHeaders['Range'] = req.headers.range;
    }

    // 6. GET THE NATIVE STREAM directly using Android to support chunking natively if url is missing
    let streamUrl = format.url;

    // Instead of using youtube.download, we should use format.url or format.decipher
    // directly so we can make our own fetch call and proxy headers.
    if (!streamUrl) {
       try {
         // Some versions of getBasicInfo for ANDROID still yield ciphered streams we can decipher
         // But latest ones don't, in which case we fall back to download stream.
         streamUrl = await format.decipher(youtube.session.player);
       } catch (e) {
         // ignore decipher error
       }
    }

    // If streamUrl exists, we fetch manually.
    if (streamUrl) {
      const youtubeResponse = await fetch(streamUrl, { headers: fetchHeaders });

      if (!youtubeResponse.ok) {
        return res.status(youtubeResponse.status).send("YouTube Upstream Fetch Failed");
      }

      // 7. SET RESPONSE HEADERS: Explicitly setting headers for the browser audio tag
      res.setHeader('Content-Type', format.mime_type || 'audio/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const contentLength = youtubeResponse.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      const contentRange = youtubeResponse.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);

      // 8. NATIVE STREAM PIPING: Pushing binary chunks directly to the response
      const reader = youtubeResponse.body.getReader();

      async function streamPipe() {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        // Write binary chunk to Node.js response stream
        res.write(Buffer.from(value));
        return streamPipe();
      }

      res.status(youtubeResponse.status);
      await streamPipe();
      return;
    }

    // Fallback if no URL is available - stream directly using download, setting Range parameter
    let startByte = 0;
    let endByte = undefined;

    if (req.headers && req.headers.range) {
      const parts = req.headers.range.replace(/bytes=/, "").split("-");
      startByte = parseInt(parts[0], 10) || 0;
      if (parts[1]) endByte = parseInt(parts[1], 10);
    }

    const stream = await youtube.download(videoId, {
        type: 'audio',
        quality: 'best',
        format: 'mp4',
        client: 'IOS',
        range: { start: startByte, end: endByte || undefined }
    });

    if (!stream) {
      return res.status(404).send("No suitable audio format found or stream could not be started");
    }

    // SET RESPONSE HEADERS for fallback
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (req.headers && req.headers.range && format.content_length) {
       res.setHeader('Content-Range', `bytes ${startByte}-${endByte || (format.content_length - 1)}/${format.content_length}`);
       res.setHeader('Content-Length', endByte ? (endByte - startByte + 1) : format.content_length - startByte);
       res.status(206);
    } else {
       res.setHeader('Content-Length', format.content_length);
       res.status(200);
    }

    // NATIVE STREAM PIPING fallback
    const reader = stream.getReader();

    async function streamPipeFallback() {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(Buffer.from(value));
      return streamPipeFallback();
    }

    await streamPipeFallback();

  } catch (error) {
    console.error("CRITICAL BACKEND ERROR:", error.message);
    // Ensure we don't leave the request hanging if a crash occurs
    if (!res.headersSent) {
      if (!res.json) res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
      res.status(500).json({ error: error.message });
    }
  }
}
