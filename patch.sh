sed -i "s/const VEROME_API_BASE_URL = 'https:\/\/verome-api.deno.dev';/import { VEROME_API_BASE_URL } from '..\/utils\/veromeApi';/g" src/services/DownloadService.ts
