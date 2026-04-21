/**
 * Hostname allowlist for the indaba portal.
 *
 * Replaces the previous `hostname.startsWith("indaba.")` check which was
 * over-permissive: any attacker-controlled subdomain of an attacker domain
 * starting with "indaba." would resolve as "ops portal".
 */

export const INDABA_HOSTS = new Set<string>([
  "indaba.zimx.io",
  "indaba.localhost",
]);

export const INDABA_PREVIEW_RE = /^indaba-[a-z0-9-]+\.vercel\.app$/;

/** True iff the hostname matches an allowed indaba surface. */
export function isIndabaHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0].toLowerCase();
  if (INDABA_HOSTS.has(hostname)) return true;
  if (INDABA_PREVIEW_RE.test(hostname)) return true;
  return false;
}

/** Known marketing-site hostnames. Anything not in either list gets logged. */
export const MARKETING_HOSTS = new Set<string>([
  "blackmass.co.uk",
  "www.blackmass.co.uk",
  "localhost",
]);

export const MARKETING_PREVIEW_RE = /^blackmass.*\.vercel\.app$/;

export function isMarketingHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0].toLowerCase();
  if (MARKETING_HOSTS.has(hostname)) return true;
  if (MARKETING_PREVIEW_RE.test(hostname)) return true;
  return false;
}

export function isUnknownHost(host: string | null): boolean {
  if (!host) return true;
  return !isIndabaHost(host) && !isMarketingHost(host);
}
