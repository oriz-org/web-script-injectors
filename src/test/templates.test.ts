import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICES,
  FORM_TARGETS,
  getInjectedScripts,
  getWeb3FormsAction,
  getWeb3FormsAccessKey,
  getContentSecurityPolicy,
  safe,
} from '../index.js';

const VALID_GA4 = 'G-ABCDEFGH12';
const VALID_CLARITY = 'abc123xyz9';
const VALID_PH_KEY = 'phc_' + 'a'.repeat(40);
const VALID_PH_HOST_US = 'https://us.i.posthog.com';
const VALID_PH_HOST_EU = 'https://eu.i.posthog.com';
const VALID_SENTRY = 'https://abc123@o12345.ingest.us.sentry.io/123456';
const VALID_CF_TOKEN = 'a'.repeat(32);
const VALID_CRONITOR = 'abc12345DEF';
const VALID_UUID = '11111111-2222-4333-8444-555555555555';
const VALID_TAWK_PROPERTY = 'abcdef1234567890abcdef12';
const VALID_TAWK_WIDGET = '1aBcDeFgHiJk';

const XSS = '"><script>alert(1)</script>';

// --- Registry shape ---
test('SERVICES has exactly 8 entries', () => {
  assert.equal(SERVICES.length, 8);
});

test('FORM_TARGETS has exactly 1 entry (web3forms)', () => {
  assert.equal(FORM_TARGETS.length, 1);
  assert.equal(FORM_TARGETS[0]?.name, 'web3forms');
});

test('SERVICES does NOT contain web3forms', () => {
  for (const svc of SERVICES) {
    assert.notEqual(svc.name, 'web3forms');
  }
});

test('every service has required keys', () => {
  for (const svc of SERVICES) {
    assert.ok(typeof svc.name === 'string' && svc.name.length > 0, `name: ${svc.name}`);
    assert.ok(Array.isArray(svc.envKeys) && svc.envKeys.length > 0, `envKeys: ${svc.name}`);
    assert.ok(svc.place === 'head' || svc.place === 'bodyEnd', `place: ${svc.name}`);
    assert.ok(typeof svc.enabled === 'function');
    assert.ok(typeof svc.render === 'function');
    assert.ok(typeof svc.cspDirectives === 'object');
  }
});

// --- safe helper ---
test('safe tagged template concatenates values', () => {
  const html = safe`<p>${'hello'}</p>`;
  assert.equal(html, '<p>hello</p>');
});

test('safe handles empty template', () => {
  const html = safe``;
  assert.equal(html, '');
});

// --- GA4 ---
test('ga4 valid → renders SafeHtml containing id', () => {
  const r = SERVICES.find((s) => s.name === 'google-analytics-4')!.render({
    ORIZ_FLEET_GOOGLE_ANALYTICS_MEASUREMENT_ID: VALID_GA4,
  });
  assert.ok(r);
  assert.match(r as string, /G-ABCDEFGH12/);
});

test('ga4 XSS → null', () => {
  const r = SERVICES.find((s) => s.name === 'google-analytics-4')!.render({
    ORIZ_FLEET_GOOGLE_ANALYTICS_MEASUREMENT_ID: XSS,
  });
  assert.equal(r, null);
});

test('ga4 lowercase → null (regex requires uppercase)', () => {
  const r = SERVICES.find((s) => s.name === 'google-analytics-4')!.render({
    ORIZ_FLEET_GOOGLE_ANALYTICS_MEASUREMENT_ID: 'g-abcdefgh12',
  });
  assert.equal(r, null);
});

test('ga4 missing → null', () => {
  const r = SERVICES.find((s) => s.name === 'google-analytics-4')!.render({});
  assert.equal(r, null);
});

// --- Clarity ---
test('clarity valid → renders', () => {
  const r = SERVICES.find((s) => s.name === 'microsoft-clarity')!.render({
    ORIZ_FLEET_MICROSOFT_CLARITY_PROJECT_ID: VALID_CLARITY,
  });
  assert.ok(r);
  assert.match(r as string, /abc123xyz9/);
});

test('clarity XSS → null', () => {
  const r = SERVICES.find((s) => s.name === 'microsoft-clarity')!.render({
    ORIZ_FLEET_MICROSOFT_CLARITY_PROJECT_ID: XSS,
  });
  assert.equal(r, null);
});

test('clarity missing → null', () => {
  const r = SERVICES.find((s) => s.name === 'microsoft-clarity')!.render({});
  assert.equal(r, null);
});

// --- PostHog ---
test('posthog valid US → renders with hardened defaults', () => {
  const r = SERVICES.find((s) => s.name === 'posthog')!.render({
    ORIZ_FLEET_POSTHOG_PROJECT_API_KEY: VALID_PH_KEY,
    ORIZ_FLEET_POSTHOG_API_HOST: VALID_PH_HOST_US,
  });
  assert.ok(r);
  assert.match(r as string, /maskAllInputs/);
  assert.match(r as string, /dom_event_allowlist/);
});

test('posthog valid EU → renders', () => {
  const r = SERVICES.find((s) => s.name === 'posthog')!.render({
    ORIZ_FLEET_POSTHOG_PROJECT_API_KEY: VALID_PH_KEY,
    ORIZ_FLEET_POSTHOG_API_HOST: VALID_PH_HOST_EU,
  });
  assert.ok(r);
});

test('posthog host attack → null', () => {
  const r = SERVICES.find((s) => s.name === 'posthog')!.render({
    ORIZ_FLEET_POSTHOG_PROJECT_API_KEY: VALID_PH_KEY,
    ORIZ_FLEET_POSTHOG_API_HOST: 'https://evil.com',
  });
  assert.equal(r, null);
});

test('posthog key XSS → null', () => {
  const r = SERVICES.find((s) => s.name === 'posthog')!.render({
    ORIZ_FLEET_POSTHOG_PROJECT_API_KEY: XSS,
    ORIZ_FLEET_POSTHOG_API_HOST: VALID_PH_HOST_US,
  });
  assert.equal(r, null);
});

test('posthog missing host → null', () => {
  const r = SERVICES.find((s) => s.name === 'posthog')!.render({
    ORIZ_FLEET_POSTHOG_PROJECT_API_KEY: VALID_PH_KEY,
  });
  assert.equal(r, null);
});

// --- Sentry ---
test('sentry valid → renders', () => {
  const r = SERVICES.find((s) => s.name === 'sentry')!.render({
    ORIZ_FLEET_SENTRY_DSN_BROWSER_SDK: VALID_SENTRY,
  });
  assert.ok(r);
});

test('sentry XSS → null', () => {
  const r = SERVICES.find((s) => s.name === 'sentry')!.render({
    ORIZ_FLEET_SENTRY_DSN_BROWSER_SDK: XSS,
  });
  assert.equal(r, null);
});

test('sentry non-sentry domain → null', () => {
  const r = SERVICES.find((s) => s.name === 'sentry')!.render({
    ORIZ_FLEET_SENTRY_DSN_BROWSER_SDK: 'https://abc@o1.ingest.evil.com/1',
  });
  assert.equal(r, null);
});

// --- Cloudflare ---
test('cloudflare valid → renders', () => {
  const r = SERVICES.find((s) => s.name === 'cloudflare-web-analytics')!.render({
    ORIZ_FLEET_CLOUDFLARE_WEB_ANALYTICS_TOKEN: VALID_CF_TOKEN,
  });
  assert.ok(r);
});

test('cloudflare XSS → null', () => {
  const r = SERVICES.find((s) => s.name === 'cloudflare-web-analytics')!.render({
    ORIZ_FLEET_CLOUDFLARE_WEB_ANALYTICS_TOKEN: XSS,
  });
  assert.equal(r, null);
});

test('cloudflare in bodyEnd', () => {
  const svc = SERVICES.find((s) => s.name === 'cloudflare-web-analytics')!;
  assert.equal(svc.place, 'bodyEnd');
});

// --- Cronitor ---
test('cronitor valid → renders', () => {
  const r = SERVICES.find((s) => s.name === 'cronitor-rum')!.render({
    ORIZ_FLEET_CRONITOR_RUM_SITE_KEY: VALID_CRONITOR,
  });
  assert.ok(r);
});

test('cronitor XSS → null', () => {
  const r = SERVICES.find((s) => s.name === 'cronitor-rum')!.render({
    ORIZ_FLEET_CRONITOR_RUM_SITE_KEY: XSS,
  });
  assert.equal(r, null);
});

// --- OneSignal (double gate) ---
test('onesignal valid + enabled=1 → renders', () => {
  const r = SERVICES.find((s) => s.name === 'onesignal')!.render({
    ORIZ_FLEET_ONESIGNAL_APP_ID: VALID_UUID,
    ORIZ_FLEET_ENABLE_ONESIGNAL: '1',
  });
  assert.ok(r);
  assert.match(r as string, /oriz-onesignal-sw\.js/);
});

test('onesignal valid but enable flag missing → null', () => {
  const r = SERVICES.find((s) => s.name === 'onesignal')!.render({
    ORIZ_FLEET_ONESIGNAL_APP_ID: VALID_UUID,
  });
  assert.equal(r, null);
});

test('onesignal enable=1 but invalid uuid → null', () => {
  const r = SERVICES.find((s) => s.name === 'onesignal')!.render({
    ORIZ_FLEET_ONESIGNAL_APP_ID: XSS,
    ORIZ_FLEET_ENABLE_ONESIGNAL: '1',
  });
  assert.equal(r, null);
});

test('onesignal enable=true (not 1) → null', () => {
  const r = SERVICES.find((s) => s.name === 'onesignal')!.render({
    ORIZ_FLEET_ONESIGNAL_APP_ID: VALID_UUID,
    ORIZ_FLEET_ENABLE_ONESIGNAL: 'true',
  });
  assert.equal(r, null);
});

// --- Tawk.to (double gate) ---
test('tawk valid + enabled=1 → renders', () => {
  const r = SERVICES.find((s) => s.name === 'tawk-to')!.render({
    ORIZ_FLEET_TAWK_TO_PROPERTY_ID: VALID_TAWK_PROPERTY,
    ORIZ_FLEET_TAWK_TO_WIDGET_ID: VALID_TAWK_WIDGET,
    ORIZ_FLEET_ENABLE_TAWK: '1',
  });
  assert.ok(r);
});

test('tawk enable missing → null', () => {
  const r = SERVICES.find((s) => s.name === 'tawk-to')!.render({
    ORIZ_FLEET_TAWK_TO_PROPERTY_ID: VALID_TAWK_PROPERTY,
    ORIZ_FLEET_TAWK_TO_WIDGET_ID: VALID_TAWK_WIDGET,
  });
  assert.equal(r, null);
});

test('tawk property XSS → null', () => {
  const r = SERVICES.find((s) => s.name === 'tawk-to')!.render({
    ORIZ_FLEET_TAWK_TO_PROPERTY_ID: XSS,
    ORIZ_FLEET_TAWK_TO_WIDGET_ID: VALID_TAWK_WIDGET,
    ORIZ_FLEET_ENABLE_TAWK: '1',
  });
  assert.equal(r, null);
});

// --- Web3Forms ---
test('web3forms valid → returns action url + key', () => {
  const env = { ORIZ_FLEET_WEB3FORMS_ACCESS_KEY: VALID_UUID };
  assert.equal(getWeb3FormsAction(env), 'https://api.web3forms.com/submit');
  assert.equal(getWeb3FormsAccessKey(env), VALID_UUID);
});

test('web3forms missing → null', () => {
  assert.equal(getWeb3FormsAction({}), null);
  assert.equal(getWeb3FormsAccessKey({}), null);
});

test('web3forms XSS → null', () => {
  const env = { ORIZ_FLEET_WEB3FORMS_ACCESS_KEY: XSS };
  assert.equal(getWeb3FormsAction(env), null);
  assert.equal(getWeb3FormsAccessKey(env), null);
});

// --- Aggregate ---
test('getInjectedScripts with empty env → both empty', () => {
  const { head, bodyEnd } = getInjectedScripts({});
  assert.equal(head, '');
  assert.equal(bodyEnd, '');
});

test('getInjectedScripts with GA4 → head populated, bodyEnd empty', () => {
  const { head, bodyEnd } = getInjectedScripts({
    ORIZ_FLEET_GOOGLE_ANALYTICS_MEASUREMENT_ID: VALID_GA4,
  });
  assert.match(head as string, /googletagmanager/);
  assert.equal(bodyEnd, '');
});

test('getInjectedScripts with cloudflare → bodyEnd populated', () => {
  const { head, bodyEnd } = getInjectedScripts({
    ORIZ_FLEET_CLOUDFLARE_WEB_ANALYTICS_TOKEN: VALID_CF_TOKEN,
  });
  assert.equal(head, '');
  assert.match(bodyEnd as string, /cloudflareinsights/);
});

// --- CSP ---
test('csp default (no env) returns self-only directives', () => {
  const csp = getContentSecurityPolicy({});
  assert.match(csp, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(csp, /googletagmanager/);
});

test('csp with GA4 enabled includes googletagmanager', () => {
  const csp = getContentSecurityPolicy({
    ORIZ_FLEET_GOOGLE_ANALYTICS_MEASUREMENT_ID: VALID_GA4,
  });
  assert.match(csp, /googletagmanager/);
  assert.match(csp, /google-analytics/);
});

test('csp with web3forms includes form-action', () => {
  const csp = getContentSecurityPolicy({
    ORIZ_FLEET_WEB3FORMS_ACCESS_KEY: VALID_UUID,
  });
  assert.match(csp, /form-action.*web3forms/);
});

test('csp with disabled service does NOT add its sources', () => {
  const csp = getContentSecurityPolicy({
    ORIZ_FLEET_ONESIGNAL_APP_ID: VALID_UUID,
    // no ORIZ_FLEET_ENABLE_ONESIGNAL
  });
  assert.doesNotMatch(csp, /onesignal/);
});
