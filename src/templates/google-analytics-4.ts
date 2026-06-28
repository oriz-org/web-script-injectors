import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const GA4_REGEX = /^G-[A-Z0-9]{8,12}$/;
const ENV_KEY = 'ORIZ_FLEET_GOOGLE_ANALYTICS_MEASUREMENT_ID';

export const googleAnalytics4: ServiceTemplate = {
  name: 'google-analytics-4',
  envKeys: [ENV_KEY] as const,
  place: 'head',
  enabled(env: Env): boolean {
    const id = env[ENV_KEY];
    return !!id && GA4_REGEX.test(id);
  },
  render(env: Env): SafeHtml | null {
    const id = env[ENV_KEY];
    if (!id || !GA4_REGEX.test(id)) return null;
    return safe`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(id)});</script>`;
  },
  cspDirectives: {
    'script-src': ['https://www.googletagmanager.com'],
    'connect-src': ['https://www.google-analytics.com', 'https://*.analytics.google.com'],
    'img-src': ['https://www.google-analytics.com'],
  },
};
