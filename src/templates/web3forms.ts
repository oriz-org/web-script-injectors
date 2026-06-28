import type { Env } from '../types.js';
import type { CspDirectives } from '../types.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENV_KEY = 'ORIZ_FLEET_WEB3FORMS_ACCESS_KEY';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

export interface FormTarget {
  readonly name: string;
  readonly envKeys: readonly string[];
  enabled(env: Env): boolean;
  getAction(env: Env): string | null;
  getAccessKey(env: Env): string | null;
  readonly cspDirectives: CspDirectives;
}

export const web3Forms: FormTarget = {
  name: 'web3forms',
  envKeys: [ENV_KEY] as const,
  enabled(env: Env): boolean {
    const key = env[ENV_KEY];
    return !!key && UUID_V4_REGEX.test(key);
  },
  getAction(env: Env): string | null {
    return this.enabled(env) ? WEB3FORMS_ENDPOINT : null;
  },
  getAccessKey(env: Env): string | null {
    const key = env[ENV_KEY];
    if (!key || !UUID_V4_REGEX.test(key)) return null;
    return key;
  },
  cspDirectives: {
    'form-action': ['https://api.web3forms.com'],
    'connect-src': ['https://api.web3forms.com'],
  },
};
