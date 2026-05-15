import { Capacitor } from '@capacitor/core';
import YtDlpPlugin from '../plugins/YtDlpPlugin';
import { getYouTubeAudioStream } from '../utils/youtube';
import { Logger } from '../utils/logger';

class MusicService {
  async init() {
    if (Capacitor.isNativePlatform() && !this.isInitialized) {
      try {
        await YtDlpPlugin.init();
        this.isInitialized = true;
      } catch (e) {
        Logger.error('Failed to initialize YtDlpPlugin', e);
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
        Logger.error('Native extraction failed, falling back to web proxy', e);
        // Fallback intentionally omitted here to force native logic, or we can use the web proxy as a last resort:
        return getYouTubeAudioStream(videoId);
      }
    } else {
      // Web fallback
      return getYouTubeAudioStream(videoId);
    }
  }

  async downloadTrack(videoId: string, title: string, artist: string, preferredFormat: string = '251', onProgress?: (p: number) => void): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Downloading is only supported on native Android');
      return null;
    }

    try {
      const url = await getYouTubeAudioDownloadUrl(videoId);
      if (!url) {
        console.error('Could not get download URL');
        return null;
      }

      // Safe filename
      const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeArtist = artist.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeTitle} - ${safeArtist}.m4a`;
      const path = `Owner Vibe/${fileName}`;

      // Start download
      console.log('Downloading from:', url, 'to:', path);

      const downloadOptions = {
        url: url,
        path: path,
        directory: Directory.Documents, // More reliable across Android versions
        progress: true
      };

      let listener;
      if (onProgress) {
        listener = await Filesystem.addListener('progress', (progress) => {
          if (progress.url === url) {
             onProgress((progress.bytes / progress.contentLength) * 100);
          }
        });
      }
      try {
        const { filePath } = await YtDlpPlugin.downloadAudio({ videoId, format: preferredFormat });
        if (listener) listener.remove();
        return filePath;
      } catch (e) {
        if (listener) listener.remove();
        Logger.error('Download failed', e);
        return null;
      }
    } else {
      Logger.warn('Downloading is only supported on native Android');
      return null;
    }
  }
}

export const musicService = new MusicService();
