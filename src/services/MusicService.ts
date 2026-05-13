import { Capacitor } from '@capacitor/core';
import YtDlpPlugin from '../plugins/YtDlpPlugin';
import { getYouTubeAudioStream } from '../utils/youtube';

class MusicService {
  private isInitialized = false;

  async init() {
    if (Capacitor.isNativePlatform() && !this.isInitialized) {
      try {
        await YtDlpPlugin.init();
        this.isInitialized = true;
      } catch (e) {
        console.error('Failed to initialize YtDlpPlugin', e);
      }
    }
  }

  async getStreamUrl(videoId: string, preferredFormat: string = '251'): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      await this.init();
      try {
        const { url } = await YtDlpPlugin.extractAudioUrl({ videoId, format: preferredFormat });
        return url;
      } catch (e) {
        console.error('Native extraction failed, falling back to web proxy', e);
        // Fallback intentionally omitted here to force native logic, or we can use the web proxy as a last resort:
        return getYouTubeAudioStream(videoId);
      }
    } else {
      // Web fallback
      return getYouTubeAudioStream(videoId);
    }
  }

  async downloadTrack(videoId: string, preferredFormat: string = '251', onProgress?: (p: number) => void): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      await this.init();
      let listener: any;
      if (onProgress) {
        listener = await YtDlpPlugin.addListener('downloadProgress', (data) => {
          if (data.videoId === videoId) {
            onProgress(data.progress);
          }
        });
      }
      try {
        const { filePath } = await YtDlpPlugin.downloadAudio({ videoId, format: preferredFormat });
        if (listener) listener.remove();
        return filePath;
      } catch (e) {
        if (listener) listener.remove();
        console.error('Download failed', e);
        return null;
      }
    } else {
      console.warn('Downloading is only supported on native Android');
      return null;
    }
  }
}

export const musicService = new MusicService();
