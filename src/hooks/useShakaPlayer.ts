import { useEffect, useRef, useState } from 'react';
//@ts-ignore
import shaka from "shaka-player/dist/shaka-player.compiled";
import { ShakaPlayerAdapter } from '../streaming/ShakaPlayerAdapter';
import { makePlayerRequest } from '../utils/onesie';
import { loadCachedClientConfig, REDIRECTOR_STORAGE_KEY } from '../utils/helpers';
import { botguardService } from '../services/botguard';
import { Innertube, UniversalCache, YT } from 'youtubei.js/web';
import { SabrStreamingAdapter } from 'googlevideo/sabr-streaming-adapter';

export function useShakaPlayer(mediaElementRef: React.RefObject<HTMLMediaElement | null>) {
  const [playerState, setPlayerState] = useState('idle');
  const playerRef = useRef<shaka.Player | null>(null);
  const sabrAdapterRef = useRef<any>(null);
  const innertubeRef = useRef<Innertube | null>(null);

  useEffect(() => {
    async function init() {
      if (mediaElementRef.current && !playerRef.current) {
        playerRef.current = new shaka.Player(mediaElementRef.current);
        sabrAdapterRef.current = new SabrStreamingAdapter({ playerAdapter: new ShakaPlayerAdapter() });

        innertubeRef.current = await Innertube.create({
          cache: new UniversalCache(true),
          generate_session_locally: true
        });

        await botguardService.init();
      }
    }
    init();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [mediaElementRef]);

  return {
    player: playerRef.current,
    sabrAdapter: sabrAdapterRef.current,
    innertube: innertubeRef.current,
    playerState
  };
}
