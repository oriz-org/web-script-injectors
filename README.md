# @oriz/web-script-injectors

Framework-agnostic JavaScript snippet injectors for the oriz fleet. Strict regex allowlist on every env value, `SafeHtml` branded type, silent skip on missing/invalid creds.

## What & why

Every oriz site embeds the same handful of third-party scripts: Google Analytics 4, Microsoft Clarity, PostHog, Sentry, Cloudflare Web Analytics, Cronitor RUM, OneSignal, Tawk.to, plus Web3Forms for contact forms. Each app used to copy-paste those snippets. This package centralises them with three properties:

1. **Strict env validation.** Every env value must pass a regex (or string-allowlist) before its value reaches the rendered `<script>`. Invalid values are dropped silently — no broken pages on a typo'd key.
2. **`SafeHtml` branded type.** The output can only be produced by the `safe` tagged template inside this package. Callers don't get to forge it; consumers (Astro `set:html`, React `dangerouslySetInnerHTML`, vanilla `el.innerHTML`) opt in to trust it.
3. **Framework-agnostic.** Pure functions, zero peer deps. Works in Astro, Next.js, Remix, vanilla HTML build steps, and any other JS runtime.

## Install

```bash
npm install @oriz/web-script-injectors
```

## Usage

### Vanilla HTML build step

```js
import { getInjectedScripts, getContentSecurityPolicy } from '@oriz/web-script-injectors';

const { head, bodyEnd } = getInjectedScripts(process.env);
const csp = getContentSecurityPolicy(process.env);

const html = `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    ${head}
  </head>
  <body>
    <!-- page content -->
    ${bodyEnd}
  </body>
</html>`;
```

### Astro

```astro
---
import { getInjectedScripts, getContentSecurityPolicy } from '@oriz/web-script-injectors';
const { head, bodyEnd } = getInjectedScripts(import.meta.env);
const csp = getContentSecurityPolicy(import.meta.env);
---
<html>
  <head>
    <meta http-equiv="Content-Security-Policy" content={csp}>
    <Fragment set:html={head} />
  </head>
  <body>
    <slot />
    <Fragment set:html={bodyEnd} />
  </body>
</html>
```

### Next.js (App Router)

```tsx
import { getInjectedScripts } from '@oriz/web-script-injectors';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { head, bodyEnd } = getInjectedScripts(process.env);
  return (
    <html>
      <head>
        <script dangerouslySetInnerHTML={{ __html: head }} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: bodyEnd }} />
      </body>
    </html>
  );
}
```

### Web3Forms

```tsx
import { getWeb3FormsAction, getWeb3FormsAccessKey } from '@oriz/web-script-injectors';

const action = getWeb3FormsAction(process.env);
const key = getWeb3FormsAccessKey(process.env);

if (action && key) {
  return (
    <form action={action} method="POST">
      <input type="hidden" name="access_key" value={key} />
      {/* fields */}
    </form>
  );
}
```

## Services

| Service | Env key(s) | Place | Validation |
|---|---|---|---|
| Google Analytics 4 | `ORIZ_FLEET_GOOGLE_ANALYTICS_MEASUREMENT_ID` | head | `/^G-[A-Z0-9]{8,12}$/` |
| Microsoft Clarity | `ORIZ_FLEET_MICROSOFT_CLARITY_PROJECT_ID` | head | `/^[a-z0-9]{8,12}$/` |
| PostHog | `ORIZ_FLEET_POSTHOG_PROJECT_API_KEY` + `ORIZ_FLEET_POSTHOG_API_HOST` | head | `phc_...` + strict host allowlist (`us` or `eu`) |
| Sentry | `ORIZ_FLEET_SENTRY_DSN_BROWSER_SDK` | head | strict DSN regex |
| Cloudflare Web Analytics | `ORIZ_FLEET_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | bodyEnd | `/^[a-f0-9]{32,}$/` |
| Cronitor RUM | `ORIZ_FLEET_CRONITOR_RUM_SITE_KEY` | head | `/^[a-zA-Z0-9]{8,16}$/` |
| OneSignal | `ORIZ_FLEET_ONESIGNAL_APP_ID` + `ORIZ_FLEET_ENABLE_ONESIGNAL=1` | head | UUIDv4 + enable flag |
| Tawk.to | `ORIZ_FLEET_TAWK_TO_PROPERTY_ID` + `ORIZ_FLEET_TAWK_TO_WIDGET_ID` + `ORIZ_FLEET_ENABLE_TAWK=1` | bodyEnd | regex + enable flag |
| **Web3Forms** (form target, NOT a script) | `ORIZ_FLEET_WEB3FORMS_ACCESS_KEY` | n/a | UUIDv4 |

Tier E services (OneSignal, Tawk.to) require **both** a valid credential **and** the matching `ORIZ_FLEET_ENABLE_...=1` flag. They are opt-in to prevent surprise UX changes on a key drop.

## CSP integration

`getContentSecurityPolicy(env)` returns a CSP directive string for `<meta http-equiv="Content-Security-Policy">` or the `Content-Security-Policy` HTTP header. It unions only the sources required by currently-enabled services on top of a `'self'`-by-default base.

```ts
const csp = getContentSecurityPolicy(process.env);
// -> "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; ..."
```

`'unsafe-inline'` is currently in the script-src default because every injected snippet uses an inline IIFE. A future revision may switch to per-snippet nonces.

## Security model

- **No env value reaches the page unvalidated.** Every service has a regex (or host allowlist). Validation failure = silent skip; no fallback, no partial render.
- **`SafeHtml` is a branded type.** Only `safe` (the tagged template inside this package) can produce one. Render targets cannot accept arbitrary user strings as `SafeHtml`.
- **`JSON.stringify` for every interpolated value.** Even though regex already restricts the character set, all interpolations go through `JSON.stringify` so escaped quotes / backslashes round-trip safely.
- **Strict TypeScript.** `noUncheckedIndexedAccess`, `strict: true`.
- **No `eval`, no `new Function`, no dynamic imports.** The package is pure data + string concatenation.

## Key-rotation runbook

1. Generate the new key in the third-party dashboard. **Do not revoke the old one yet.**
2. Update the env value in GitHub org Actions secrets (or your deployment platform's secret store).
3. Trigger a rebuild of every fleet site. CI will pick up the new value and embed it on next deploy.
4. Verify on a canary site (open DevTools, confirm the new ID appears in the network request).
5. Revoke the old key from the third-party dashboard.

For Tier E services, you can also drop traffic immediately by setting `ORIZ_FLEET_ENABLE_ONESIGNAL=0` (or unsetting it) — no key change needed.

## License

MIT
