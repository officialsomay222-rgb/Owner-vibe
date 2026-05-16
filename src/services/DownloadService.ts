import { CapacitorHttp } from '@capacitor/core';
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
    let targetItag = 140; // Default to Normal
    if (selectedQuality === 'Low') targetItag = 249;
    if (selectedQuality === 'High') targetItag = 251;

    let selectedStream = data.streamingUrls.find((stream: any) => stream.itag === targetItag);

    // Fallback 1: Try 140
    if (!selectedStream) {
      selectedStream = data.streamingUrls.find((stream: any) => stream.itag === 140);
    }

    // Fallback 2: First available
    if (!selectedStream) {
      selectedStream = data.streamingUrls[0];
    }

    if (!selectedStream || !selectedStream.directUrl) {
      throw new Error('Could not resolve a direct streaming URL.');
    }

    const downloadUrl = selectedStream.directUrl;
    const actualItag = selectedStream.itag;

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
    // Based on user specification, use CapacitorHttp.downloadFile.
    // Types may not explicitly show it in current V8 typings, so we cast to any.
    // However, it's also common that Capacitor's HTTP plugin is bridged this way.
    // Note: Since Capacitor 5+, Filesystem.downloadFile actually maps to the HTTP plugin under the hood
    // or is the correct method, but we strictly follow the instruction.
    let nativeFilePath = '';

    try {
      const downloadResponse = await (CapacitorHttp as any).downloadFile({
        url: downloadUrl,
        filePath: fileName,
        fileDirectory: Directory.Data,
        progress: true,
      });
      nativeFilePath = downloadResponse.path || fileName;
    } catch (err) {
      Logger.warn('CapacitorHttp.downloadFile failed or missing, falling back to Filesystem.downloadFile', err);
      // Fallback if the user's plugin version actually uses Filesystem for this
      const downloadResponse = await Filesystem.downloadFile({
        url: downloadUrl,
        path: fileName,
        directory: Directory.Data,
        progress: true,
      });
      nativeFilePath = downloadResponse.path || fileName;
    }

    // Clean up listener
    if (progressListener) {
      await progressListener.remove();
    }

    // Ensure 100% on success
    if (onProgress) {
      onProgress(100);
    }

    const offlineTrack: OfflineTrack = {
      songId,
      metadata,
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
