import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const CLARITY_REGEX = /^[a-z0-9]{8,12}$/;
const ENV_KEY = 'ORIZ_FLEET_MICROSOFT_CLARITY_PROJECT_ID';

export const microsoftClarity: ServiceTemplate = {
  name: 'microsoft-clarity',
  envKeys: [ENV_KEY] as const,
  place: 'head',
  enabled(env: Env): boolean {
    const id = env[ENV_KEY];
    return !!id && CLARITY_REGEX.test(id);
  },
  render(env: Env): SafeHtml | null {
    const id = env[ENV_KEY];
    if (!id || !CLARITY_REGEX.test(id)) return null;
    return safe`<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",${JSON.stringify(id)});</script>`;
  },
  cspDirectives: {
    'script-src': ['https://www.clarity.ms'],
    'connect-src': ['https://*.clarity.ms'],
  },
};
