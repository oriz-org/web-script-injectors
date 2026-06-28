import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const CF_TOKEN_REGEX = /^[a-f0-9]{32,}$/;
const ENV_KEY = 'ORIZ_FLEET_CLOUDFLARE_WEB_ANALYTICS_TOKEN';

export const cloudflareWebAnalytics: ServiceTemplate = {
  name: 'cloudflare-web-analytics',
  envKeys: [ENV_KEY] as const,
  place: 'bodyEnd',
  enabled(env: Env): boolean {
    const token = env[ENV_KEY];
    return !!token && CF_TOKEN_REGEX.test(token);
  },
  render(env: Env): SafeHtml | null {
    const token = env[ENV_KEY];
    if (!token || !CF_TOKEN_REGEX.test(token)) return null;
    const config = JSON.stringify({ token });
    return safe`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=${JSON.stringify(config)}></script>`;
  },
  cspDirectives: {
    'script-src': ['https://static.cloudflareinsights.com'],
    'connect-src': ['https://cloudflareinsights.com'],
  },
};
