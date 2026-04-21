/**
 * Attachment URL validation.
 *
 * Every attachment stored in activities.attachments must point at our own
 * Supabase Storage endpoint. The DB enforces this via a CHECK constraint;
 * the server validates before insert to give a friendly error; the client
 * validates before rendering <a>/<img> so a poisoned row can't become an
 * XSS or phish vector.
 */

import { getSupabaseUrl } from "@/lib/supabase/env";

export const STORAGE_HOST_SAFE = "ipqmdinidqpmchggjdov.supabase.co";
export const STORAGE_URL_PREFIX = `https://${STORAGE_HOST_SAFE}/storage/v1/`;

/** Accepts either a full https storage URL or a plain storage path. */
export function isAllowedAttachment(url: string): boolean {
  if (typeof url !== "string" || url.length === 0 || url.length > 2048) {
    return false;
  }
  if (url.startsWith("photos/")) {
    return true;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname.toLowerCase() !== STORAGE_HOST_SAFE) return false;
    if (!parsed.pathname.startsWith("/storage/v1/")) return false;
    return true;
  } catch {
    return false;
  }
}

export function filterAttachments(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (u): u is string => typeof u === "string" && isAllowedAttachment(u),
  );
}

/**
 * Convert a full storage URL to the bucket-relative path, or return the
 * input if it is already a path. Used by render code so we only store the
 * path and produce signed URLs on demand.
 */
export function storagePathFromUrl(url: string): string | null {
  if (!isAllowedAttachment(url)) return null;
  if (url.startsWith("photos/")) return url;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");
    // expected: ["", "storage", "v1", "object", "public|sign", "photos", ...rest]
    const bucketIdx = parts.indexOf("photos");
    if (bucketIdx < 0) return null;
    const path = parts.slice(bucketIdx).join("/");
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Client-safe version used before building <a>/<img>. Returns the URL if
 * we're willing to render it; otherwise null so the UI can show a
 * placeholder. Never throws.
 */
export function renderableAttachmentUrl(raw: string): string | null {
  if (!isAllowedAttachment(raw)) return null;
  if (raw.startsWith("photos/")) {
    // Path-only; caller must upgrade to signed URL before showing.
    return null;
  }
  return raw;
}

/** True if this module was built in the same Supabase project as the URL. */
export function sameSupabaseProject(url: string): boolean {
  try {
    const project = new URL(getSupabaseUrl()).hostname.toLowerCase();
    const host = new URL(url).hostname.toLowerCase();
    return project === host;
  } catch {
    return false;
  }
}
