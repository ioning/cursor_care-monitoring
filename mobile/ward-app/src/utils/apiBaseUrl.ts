import { NativeModules, Platform } from 'react-native';
import { API_PORT, API_PATH, PRODUCTION_API_URL } from '../config/api.config';

/**
 * Resolve API base URL for development runtime.
 *
 * - Android emulator: use 10.0.2.2 to reach host machine localhost
 * - Physical device: use Metro host IP (same as JS bundle host)
 * - iOS simulator: localhost works, but Metro host IP also works
 */
function getDevHost(): string | null {
  // RN exposes metro bundle URL here (e.g. "http://192.168.0.10:8081/index.bundle?platform=android")
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL || typeof scriptURL !== 'string') return null;

  try {
    const url = new URL(scriptURL);
    return url.hostname || null;
  } catch {
    // Fallback for environments without URL (older JS engines)
    const match = scriptURL.match(/https?:\/\/([^:/?#]+)(?::\d+)?/i);
    return match?.[1] ?? null;
  }
}

export function getApiBaseUrl(): string {
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  const host = getDevHost();

  // If we can't detect host, keep the old behavior
  if (!host) {
    return Platform.OS === 'android'
      ? `http://10.0.2.2:${API_PORT}${API_PATH}`
      : `http://localhost:${API_PORT}${API_PATH}`;
  }

  // Android emulator reports host as "localhost" for Metro → API must use 10.0.2.2
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }

  // Physical device (or iOS simulator): use the same host as Metro
  return `http://${host}:${API_PORT}${API_PATH}`;
}


