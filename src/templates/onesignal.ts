import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const APP_ID_ENV = 'ORIZ_FLEET_ONESIGNAL_APP_ID';
const ENABLE_ENV = 'ORIZ_FLEET_ENABLE_ONESIGNAL';

function isEnabled(env: Env): boolean {
  const appId = env[APP_ID_ENV];
  if (!appId || !UUID_V4_REGEX.test(appId)) return false;
  if (env[ENABLE_ENV] !== '1') return false;
  return true;
}

export const oneSignal: ServiceTemplate = {
  name: 'onesignal',
  envKeys: [APP_ID_ENV, ENABLE_ENV] as const,
  place: 'head',
  enabled(env: Env): boolean {
    return isEnabled(env);
  },
  render(env: Env): SafeHtml | null {
    if (!isEnabled(env)) return null;
    const appId = env[APP_ID_ENV] as string;
    const config = JSON.stringify({
      appId,
      serviceWorkerPath: '/oriz-onesignal-sw.js',
      serviceWorkerParam: { scope: '/' },
    });
    return safe`<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(async function(OneSignal){await OneSignal.init(${config});});</script>`;
  },
  cspDirectives: {
    'script-src': ['https://cdn.onesignal.com'],
    'connect-src': ['https://onesignal.com', 'https://*.onesignal.com'],
    'worker-src': ["'self'"],
    'img-src': ['https://*.onesignal.com'],
  },
};
