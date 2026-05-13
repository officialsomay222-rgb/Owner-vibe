import { registerPlugin } from '@capacitor/core';

export interface YtDlpPluginPlugin {
  init(): Promise<void>;
  extractAudioUrl(options: { videoId: string; format?: string }): Promise<{ url: string }>;
  downloadAudio(options: { videoId: string; format: string }): Promise<{ filePath: string }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (progress: { progress: number; eta: number; videoId: string }) => void
  ): Promise<any>;
}

const YtDlpPlugin = registerPlugin<YtDlpPluginPlugin>('YtDlpPlugin');

export default YtDlpPlugin;
