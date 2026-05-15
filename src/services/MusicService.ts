import { Capacitor } from '@capacitor/core';
import { getYouTubeAudioStream, getYouTubeAudioDownloadUrl } from '../utils/youtube';
import { Filesystem, Directory } from '@capacitor/filesystem';

class MusicService {
  async init() {
    // No-op, kept for interface compatibility
  }

  async getStreamUrl(videoId: string, preferredFormat: string = '251'): Promise<string | null> {
    return getYouTubeAudioStream(videoId);
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

      const response = await Filesystem.downloadFile(downloadOptions);

      if (listener) {
        await listener.remove();
      }

      if (response.path) {
        return response.path;
      } else {
         console.error('Download did not return a path:', response);
         return null;
      }

    } catch (e) {
      console.error('Download failed:', e);
      return null;
    }
  }
}

export const musicService = new MusicService();
