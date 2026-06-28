import type { SafeHtml } from './safe-html.js';

export type ServicePlace = 'head' | 'bodyEnd';

export interface CspDirectives {
  readonly 'script-src'?: readonly string[];
  readonly 'connect-src'?: readonly string[];
  readonly 'img-src'?: readonly string[];
  readonly 'style-src'?: readonly string[];
  readonly 'frame-src'?: readonly string[];
  readonly 'worker-src'?: readonly string[];
  readonly 'font-src'?: readonly string[];
  readonly 'form-action'?: readonly string[];
}

export interface ServiceTemplate {
  readonly name: string;
  readonly envKeys: readonly string[];
  readonly place: ServicePlace;
  enabled(env: Record<string, string | undefined>): boolean;
  render(env: Record<string, string | undefined>): SafeHtml | null;
  readonly cspDirectives: CspDirectives;
}

export type Env = Record<string, string | undefined>;
