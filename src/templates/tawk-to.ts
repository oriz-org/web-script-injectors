import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const PROPERTY_REGEX = /^[a-f0-9]{24}$/i;
const WIDGET_REGEX = /^[a-zA-Z0-9]{10,16}$/;
const PROPERTY_ENV = 'ORIZ_FLEET_TAWK_TO_PROPERTY_ID';
const WIDGET_ENV = 'ORIZ_FLEET_TAWK_TO_WIDGET_ID';
const ENABLE_ENV = 'ORIZ_FLEET_ENABLE_TAWK';

function validate(env: Env): { property: string; widget: string } | null {
  const property = env[PROPERTY_ENV];
  const widget = env[WIDGET_ENV];
  if (!property || !PROPERTY_REGEX.test(property)) return null;
  if (!widget || !WIDGET_REGEX.test(widget)) return null;
  if (env[ENABLE_ENV] !== '1') return null;
  return { property, widget };
}

export const tawkTo: ServiceTemplate = {
  name: 'tawk-to',
  envKeys: [PROPERTY_ENV, WIDGET_ENV, ENABLE_ENV] as const,
  place: 'bodyEnd',
  enabled(env: Env): boolean {
    return validate(env) !== null;
  },
  render(env: Env): SafeHtml | null {
    const v = validate(env);
    if (!v) return null;
    return safe`<script>var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/'+${JSON.stringify(v.property)}+'/'+${JSON.stringify(v.widget)};s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();</script>`;
  },
  cspDirectives: {
    'script-src': ['https://embed.tawk.to'],
    'connect-src': ['https://*.tawk.to', 'wss://*.tawk.to'],
    'img-src': ['https://*.tawk.to'],
    'style-src': ['https://embed.tawk.to'],
    'font-src': ['https://embed.tawk.to'],
  },
};
