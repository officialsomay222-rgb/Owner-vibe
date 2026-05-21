export interface ProxySettings {
  protocol: 'http' | 'https';
  host: string;
  port: string;
}

const PROXY_SETTINGS_KEY = 'proxy_settings';

const settingsState: ProxySettings = {
  protocol: 'https',
  host: 'yt.omada.cafe',
  port: '443'
};

export function useProxySettings() {
  const isProxyConfigured = true;

  const setSettings = (newSettings: ProxySettings) => {
    // stub
  };

  return {
    settings: settingsState,
    isProxyConfigured,
    setSettings
  };
}
