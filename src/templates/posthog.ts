import { safe, type SafeHtml } from '../safe-html.js';
import type { ServiceTemplate, Env } from '../types.js';

const POSTHOG_KEY_REGEX = /^phc_[A-Za-z0-9]{32,}$/;
const POSTHOG_HOST_ALLOWLIST = new Set([
  'https://us.i.posthog.com',
  'https://eu.i.posthog.com',
]);
const KEY_ENV = 'ORIZ_FLEET_POSTHOG_PROJECT_API_KEY';
const HOST_ENV = 'ORIZ_FLEET_POSTHOG_API_HOST';

function validate(env: Env): { key: string; host: string } | null {
  const key = env[KEY_ENV];
  const host = env[HOST_ENV];
  if (!key || !POSTHOG_KEY_REGEX.test(key)) return null;
  if (!host || !POSTHOG_HOST_ALLOWLIST.has(host)) return null;
  return { key, host };
}

export const posthog: ServiceTemplate = {
  name: 'posthog',
  envKeys: [KEY_ENV, HOST_ENV] as const,
  place: 'head',
  enabled(env: Env): boolean {
    return validate(env) !== null;
  },
  render(env: Env): SafeHtml | null {
    const v = validate(env);
    if (!v) return null;
    const config = JSON.stringify({
      api_host: v.host,
      session_recording: { maskAllInputs: true },
      autocapture: { dom_event_allowlist: ['click', 'submit'] },
    });
    return safe`<script>!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Ee Es En Ti Ts Tn capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init(${JSON.stringify(v.key)}, ${config});</script>`;
  },
  cspDirectives: {
    'script-src': ['https://us-assets.i.posthog.com', 'https://eu-assets.i.posthog.com'],
    'connect-src': ['https://us.i.posthog.com', 'https://eu.i.posthog.com'],
  },
};
