declare const SAFE_HTML_BRAND: unique symbol;

/**
 * Branded string type. Only constructable via the `safe` tagged template.
 * Render targets (Astro, React, vanilla) must accept this type and emit
 * unescaped, trusting the producer has already validated all inputs.
 */
export type SafeHtml = string & { readonly [SAFE_HTML_BRAND]: true };

/**
 * Tagged template helper. Inputs are concatenated as-is — interpolated
 * values must be pre-validated (regex allowlist) before reaching this
 * function. This intentionally does NOT escape; SafeHtml is a contract,
 * not a sanitizer.
 */
export function safe(strings: TemplateStringsArray, ...values: string[]): SafeHtml {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    out += String(values[i] ?? '') + (strings[i + 1] ?? '');
  }
  return out as SafeHtml;
}

export const EMPTY_SAFE: SafeHtml = '' as SafeHtml;

export function concatSafe(parts: ReadonlyArray<SafeHtml>): SafeHtml {
  return parts.join('\n') as SafeHtml;
}
