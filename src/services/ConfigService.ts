import { Logger } from '../utils/logger';

// Bucket created via curl. In a production app, these would be env vars.
const KVDB_BUCKET_ID = 'RjBzWy7h7hHWXtYzJtqoe8';
const KVDB_KEY = 'config';
const BASE_URL = `https://kvdb.io/${KVDB_BUCKET_ID}/${KVDB_KEY}`;

export interface GlobalConfig {
    useVeromeApi: boolean;
    proxyDomain: string;
    rapidApiKey?: string;
    veromeApiBaseUrl?: string;
    useYoutubeiApi?: boolean;
}

const defaultConfig: GlobalConfig = {
    useVeromeApi: false,
    proxyDomain: 'https://yt.omada.cafe',
    veromeApiBaseUrl: 'https://verome-api.deno.dev',
    useYoutubeiApi: false,
};

// In-memory cache to avoid repeated network requests
let cachedConfig: GlobalConfig | null = null;
let isFetching = false;
let fetchPromise: Promise<GlobalConfig> | null = null;

export const ConfigService = {
    async getConfig(forceRefresh = false): Promise<GlobalConfig> {
        if (cachedConfig && !forceRefresh) {
            return cachedConfig;
        }

        if (isFetching && fetchPromise) {
            return fetchPromise;
        }

        isFetching = true;
        fetchPromise = (async () => {
            try {
                const response = await fetch(BASE_URL);
                if (response.status === 404) {
                    // Key doesn't exist yet, return default and initialize
                    await this.updateConfig(defaultConfig);
                    return defaultConfig;
                }
                if (!response.ok) {
                    throw new Error(`Failed to fetch config: ${response.status}`);
                }
                const data = await response.json();
                cachedConfig = { ...defaultConfig, ...data };
                return cachedConfig as GlobalConfig;
            } catch (err) {
                Logger.error('Error fetching global config from KVDB:', err);
                // Fallback to default if KVDB fails or is offline
                return cachedConfig || defaultConfig;
            } finally {
                isFetching = false;
                fetchPromise = null;
            }
        })();

        return fetchPromise;
    },

    async updateConfig(newConfig: Partial<GlobalConfig>): Promise<void> {
        const currentConfig = await this.getConfig();
        const updatedConfig = { ...currentConfig, ...newConfig };

        try {
            const response = await fetch(BASE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedConfig),
            });

            if (!response.ok) {
                throw new Error(`Failed to update config: ${response.status}`);
            }

            cachedConfig = updatedConfig;
            Logger.info('Global config updated successfully.');
        } catch (err) {
            Logger.error('Error updating global config in KVDB:', err);
            throw err;
        }
    },

    // Synchronous getter for safe access where async is not possible, defaults if not loaded
    getSyncConfig(): GlobalConfig {
        return cachedConfig || defaultConfig;
    }
};

// Initialize config on startup
ConfigService.getConfig().catch(err => Logger.error("Failed initial config fetch:", err));
