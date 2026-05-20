import { Song } from '../types';
import { Logger } from './logger';
import { ConfigService } from '../services/ConfigService';

export const getVeromeApiBaseUrl = (): string => {
  const config = ConfigService.getSyncConfig();
  return config.veromeApiBaseUrl || 'https://verome-api.deno.dev';
};

export interface DetailsData {
  title: string;
  artist: string;
  thumbnail: string;
  tracks: Song[];
}

export async function fetchPlaylistDetails(playlistId: string): Promise<DetailsData | null> {
  try {
    const res = await fetch(`${getVeromeApiBaseUrl()}/api/playlists/${playlistId}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.tracks) return null;

    const tracks: Song[] = data.tracks.map((t: any) => ({
      videoId: t.videoId,
      title: t.title,
      artist: t.artists && t.artists.length > 0 ? t.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist',
      thumbnailUrl: t.thumbnails && t.thumbnails.length > 0 ? t.thumbnails[t.thumbnails.length - 1].url : data.thumbnail,
      duration: t.duration || ''
    })).filter((t: any) => t.videoId);

    return {
      title: data.title,
      artist: data.author || 'Playlist',
      thumbnail: data.thumbnail,
      tracks
    };
  } catch (e) {
    Logger.error(e);
    return null;
  }
}

export async function fetchAlbumDetails(browseId: string): Promise<DetailsData | null> {
  try {
    const res = await fetch(`${getVeromeApiBaseUrl()}/api/albums/${browseId}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.tracks) return null;

    const tracks: Song[] = data.tracks.map((t: any) => ({
      videoId: t.videoId,
      title: t.title,
      artist: data.artist?.name || 'Unknown Artist',
      thumbnailUrl: data.album?.thumbnail || '',
      duration: t.duration || ''
    })).filter((t: any) => t.videoId);

    return {
      title: data.album?.title || 'Album',
      artist: data.artist?.name || 'Unknown Artist',
      thumbnail: data.album?.thumbnail || '',
      tracks
    };
  } catch (e) {
    Logger.error(e);
    return null;
  }
}

export async function fetchArtistDetails(browseId: string): Promise<DetailsData | null> {
  try {
    const res = await fetch(`${getVeromeApiBaseUrl()}/api/artists/${browseId}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.topSongs) return null;

    const tracks: Song[] = data.topSongs.map((t: any) => ({
      videoId: t.videoId,
      title: t.title,
      artist: data.artist?.name || 'Unknown Artist',
      thumbnailUrl: t.thumbnail || data.artist?.thumbnail || '',
      duration: t.duration || ''
    })).filter((t: any) => t.videoId);

    return {
      title: data.artist?.name || 'Artist',
      artist: 'Top Songs',
      thumbnail: data.artist?.thumbnail || '',
      tracks
    };
  } catch (e) {
    Logger.error(e);
    return null;
  }
}
