import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const SENTRY_DSN_REGEX = /^https:\/\/[a-f0-9]+@o\d+\.ingest\.[a-z0-9.]+\.sentry\.io\/\d+$/;
const ENV_KEY = 'ORIZ_FLEET_SENTRY_DSN_BROWSER_SDK';

export const sentry: ServiceTemplate = {
  name: 'sentry',
  envKeys: [ENV_KEY] as const,
  place: 'head',
  enabled(env: Env): boolean {
    const dsn = env[ENV_KEY];
    return !!dsn && SENTRY_DSN_REGEX.test(dsn);
  },
  render(env: Env): SafeHtml | null {
    const dsn = env[ENV_KEY];
    if (!dsn || !SENTRY_DSN_REGEX.test(dsn)) return null;
    return safe`<script src="https://browser.sentry-cdn.com/7.119.0/bundle.tracing.min.js" crossorigin="anonymous"></script>
<script>window.Sentry&&Sentry.init({dsn:${JSON.stringify(dsn)},tracesSampleRate:0.1});</script>`;
  },
  cspDirectives: {
    'script-src': ['https://browser.sentry-cdn.com'],
    'connect-src': [
      'https://browser.sentry-cdn.com',
      'https://*.ingest.sentry.io',
      'https://*.ingest.us.sentry.io',
      'https://*.ingest.de.sentry.io',
    ],
  },
};
