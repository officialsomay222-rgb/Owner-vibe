import { Filesystem, Directory } from '@capacitor/filesystem';
import { Logger } from '../utils/logger';

export interface TrackMetadata {
  title: string;
  artist: string;
  coverArt: string;
}

export type AudioQuality = 'Low' | 'Normal' | 'High';

export interface OfflineTrack {
  songId: string;
  metadata: TrackMetadata;
  filePath: string;
  downloadedAt: number;
}

import { VEROME_API_BASE_URL } from '../utils/veromeApi';

export async function downloadTrackToVault(
  songId: string,
  metadata: TrackMetadata,
  selectedQuality: AudioQuality,
  onProgress?: (progress: number) => void
): Promise<OfflineTrack> {
  try {
    // 1. Fetch Stream Links
    const res = await fetch(`${VEROME_API_BASE_URL}/api/stream?id=${songId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch streams: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();

    if (!data.streamingUrls || data.streamingUrls.length === 0) {
      throw new Error('No streaming URLs found for this track.');
    }

    // 2. Quality Extraction Logic
    const extractItag = (streamUrl: string) => {
      try {
        const urlObj = new URL(streamUrl);
        const itag = urlObj.searchParams.get('itag');
        return itag ? parseInt(itag, 10) : null;
      } catch (e) {
        return null;
      }
    };

    let targetItag = 140; // Default to Normal
    if (selectedQuality === 'Low') targetItag = 249;
    if (selectedQuality === 'High') targetItag = 251;

    let selectedStream = data.streamingUrls.find((stream: any) => extractItag(stream.url || stream.directUrl) === targetItag);

    if (!selectedStream || (!selectedStream.directUrl && !selectedStream.url)) {
      throw new Error(`Could not resolve a streaming URL for the requested quality (${selectedQuality}).`);
    }

    const downloadUrl = selectedStream.directUrl || selectedStream.url;
    const actualItag = extractItag(downloadUrl);

    // 3. Determine file extension
    let ext = 'webm';
    if (actualItag === 140) {
      ext = 'm4a';
    } else if (actualItag === 249 || actualItag === 251) {
      ext = 'webm';
    } else {
      ext = selectedStream.mimeType?.includes('audio/mp4') ? 'm4a' : 'webm';
    }

    const fileName = `owners_vibe_vault/${songId}.${ext}`;

    // Ensure the vault directory exists
    try {
      await Filesystem.mkdir({
        path: 'owners_vibe_vault',
        directory: Directory.Data,
        recursive: true
      });
    } catch (e) {
      // Ignore if it already exists
    }

    // Progress Listener Setup
    let progressListener: any;
    if (onProgress) {
      // We will listen on Filesystem for progress events, as it handles the native download progress emitting
      progressListener = await Filesystem.addListener('progress', (progressInfo) => {
        if (progressInfo.url === downloadUrl && progressInfo.contentLength > 0) {
          const percent = Math.round((progressInfo.bytes / progressInfo.contentLength) * 100);
          onProgress(percent);
        }
      });
    }

    // 4. Native Capacitor Download
    let nativeFilePath = '';

    try {
      const downloadResponse = await Filesystem.downloadFile({
        url: downloadUrl,
        path: fileName,
        directory: Directory.Data,
        progress: true,
      });
      nativeFilePath = downloadResponse.path || fileName;
    } catch (err) {
      Logger.error('Filesystem.downloadFile failed', err);
      throw err;
    }

    // Clean up listener
    if (progressListener) {
      await progressListener.remove();
    }

    // Ensure 100% on success
    if (onProgress) {
      onProgress(100);
    }

    // Convert cover art to Base64 so it can be viewed offline
    let finalCoverArt = metadata.coverArt;
    if (finalCoverArt && !finalCoverArt.startsWith('data:')) {
      try {
        // Rewrite to high res
        let highResArtUrl = finalCoverArt.replace(/=w\d+-h\d+/, '=w500-h500');
        // Fetch as blob
        const imgRes = await fetch(highResArtUrl);
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          const base64data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('FileReader result is not a string'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          finalCoverArt = base64data;
        }
      } catch (e) {
        Logger.error('Failed to convert cover art to base64 for offline vault:', e);
      }
    }

    const finalMetadata = {
      ...metadata,
      coverArt: finalCoverArt
    };

    const offlineTrack: OfflineTrack = {
      songId,
      metadata: finalMetadata,
      filePath: nativeFilePath,
      downloadedAt: Date.now()
    };

    // 5. Offline Database (Local Storage)
    const vaultKey = 'offline_vault';
    let vault: OfflineTrack[] = [];
    try {
      const existingVault = localStorage.getItem(vaultKey);
      if (existingVault) {
        vault = JSON.parse(existingVault);
      }
    } catch (e) {
      Logger.error('Failed to parse offline vault from local storage:', e);
    }

    // Remove if already exists, then push
    vault = vault.filter(t => t.songId !== songId);
    vault.push(offlineTrack);

    localStorage.setItem(vaultKey, JSON.stringify(vault));

    return offlineTrack;

  } catch (error) {
    Logger.error('Failed to download track:', error);
    throw error;
  }
}
