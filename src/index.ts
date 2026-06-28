import { safe, type SafeHtml, EMPTY_SAFE } from './safe-html.js';
import type { ServiceTemplate, Env, CspDirectives } from './types.js';

import { googleAnalytics4 } from './templates/google-analytics-4.js';
import { microsoftClarity } from './templates/microsoft-clarity.js';
import { posthog } from './templates/posthog.js';
import { sentry } from './templates/sentry.js';
import { cloudflareWebAnalytics } from './templates/cloudflare-web-analytics.js';
import { cronitorRum } from './templates/cronitor-rum.js';
import { oneSignal } from './templates/onesignal.js';
import { tawkTo } from './templates/tawk-to.js';
import { web3Forms, type FormTarget } from './templates/web3forms.js';

export { safe, EMPTY_SAFE };
export type { SafeHtml, ServiceTemplate, Env, CspDirectives, FormTarget };

/**
 * Registered services (8 entries). Each renders a `<script>` snippet into
 * `head` or `bodyEnd`. Web3Forms is NOT here — it has no script and lives
 * under FORM_TARGETS.
 */
export const SERVICES: readonly ServiceTemplate[] = [
  googleAnalytics4,
  microsoftClarity,
  posthog,
  sentry,
  cloudflareWebAnalytics,
  cronitorRum,
  oneSignal,
  tawkTo,
] as const;

/**
 * Form-action targets. No script injection — supplies the URL for
 * `<form action="...">` plus a hidden access_key field.
 */
export const FORM_TARGETS: readonly FormTarget[] = [web3Forms] as const;

export interface InjectedScripts {
  readonly head: SafeHtml;
  readonly bodyEnd: SafeHtml;
}

/**
 * Render all enabled services. Invalid env values are silently dropped.
 */
export function getInjectedScripts(env: Env): InjectedScripts {
  const headParts: string[] = [];
  const bodyParts: string[] = [];

  for (const svc of SERVICES) {
    const rendered = svc.render(env);
    if (rendered === null) continue;
    if (svc.place === 'head') headParts.push(rendered);
    else bodyParts.push(rendered);
  }

  return {
    head: (headParts.join('\n') || '') as SafeHtml,
    bodyEnd: (bodyParts.join('\n') || '') as SafeHtml,
  };
}

/**
 * Web3Forms action URL. Returns null if access key is missing/invalid.
 */
export function getWeb3FormsAction(env: Env): string | null {
  return web3Forms.getAction(env);
}

/**
 * Web3Forms access key (the `<input type="hidden" name="access_key">` value).
 */
export function getWeb3FormsAccessKey(env: Env): string | null {
  return web3Forms.getAccessKey(env);
}

const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";

const DEFAULT_DIRECTIVES: Record<keyof CspDirectives, ReadonlyArray<string>> = {
  'script-src': [SELF, UNSAFE_INLINE],
  'connect-src': [SELF],
  'img-src': [SELF, 'data:'],
  'style-src': [SELF, UNSAFE_INLINE],
  'frame-src': [SELF],
  'worker-src': [SELF],
  'font-src': [SELF],
  'form-action': [SELF],
};

/**
 * Build a Content-Security-Policy directive string covering all enabled
 * services + Web3Forms. Each directive starts with the safe default and
 * unions in the sources required by enabled services.
 */
export function getContentSecurityPolicy(env: Env): string {
  const merged: Record<string, Set<string>> = {};
  for (const [key, defaults] of Object.entries(DEFAULT_DIRECTIVES)) {
    merged[key] = new Set(defaults);
  }

  const collect = (cspDirectives: CspDirectives): void => {
    for (const [k, sources] of Object.entries(cspDirectives) as [
      keyof CspDirectives,
      readonly string[] | undefined,
    ][]) {
      if (!sources) continue;
      const set = merged[k] ?? new Set<string>();
      for (const s of sources) set.add(s);
      merged[k] = set;
    }
  };

  for (const svc of SERVICES) {
    if (svc.enabled(env)) collect(svc.cspDirectives);
  }
  for (const target of FORM_TARGETS) {
    if (target.enabled(env)) collect(target.cspDirectives);
  }

  const parts: string[] = [];
  const order: Array<keyof CspDirectives> = [
    'script-src',
    'style-src',
    'img-src',
    'font-src',
    'connect-src',
    'frame-src',
    'worker-src',
    'form-action',
  ];
  for (const k of order) {
    const set = merged[k];
    if (!set || set.size === 0) continue;
    parts.push(`${k} ${Array.from(set).join(' ')}`);
  }
  return parts.join('; ');
}
