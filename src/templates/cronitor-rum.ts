import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const CRONITOR_REGEX = /^[a-zA-Z0-9]{8,16}$/;
const ENV_KEY = 'ORIZ_FLEET_CRONITOR_RUM_SITE_KEY';

export const cronitorRum: ServiceTemplate = {
  name: 'cronitor-rum',
  envKeys: [ENV_KEY] as const,
  place: 'head',
  enabled(env: Env): boolean {
    const key = env[ENV_KEY];
    return !!key && CRONITOR_REGEX.test(key);
  },
  render(env: Env): SafeHtml | null {
    const key = env[ENV_KEY];
    if (!key || !CRONITOR_REGEX.test(key)) return null;
    return safe`<script async src="https://rum.cronitor.io/script.js"></script>
<script>window.cronitor=window.cronitor||function(){(window.cronitor.q=window.cronitor.q||[]).push(arguments)};cronitor('config',{clientKey:${JSON.stringify(key)}});</script>`;
  },
  cspDirectives: {
    'script-src': ['https://rum.cronitor.io'],
    'connect-src': ['https://rum-ingest.cronitor.io'],
  },
};
