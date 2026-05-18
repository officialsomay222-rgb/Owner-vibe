import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ownervibe.app',
  appName: 'Owner Vibe',
  webDir: 'dist',
  server: {
    url: 'https://owner-vibe.netlify.app/',
    cleartext: false
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'none' as any,
    },
    StatusBar: {
      overlaysWebView: true,
    },
    NavigationBar: {
      transparent: true,
    }
  }
};

export default config;
