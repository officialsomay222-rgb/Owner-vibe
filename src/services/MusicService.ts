import { getYouTubeAudioStream } from '../utils/youtube';

class MusicService {
  async getStreamUrl(videoId: string): Promise<string | null> {
    return getYouTubeAudioStream(videoId);
  }
}

export const musicService = new MusicService();
