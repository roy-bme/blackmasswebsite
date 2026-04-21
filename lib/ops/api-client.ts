"use client";

/**
 * Thin wrapper around `fetch` for calling our /api/ops/* Route Handlers.
 *
 * All ops mutation flows go through this so we get:
 *   - same-origin credentials
 *   - JSON Content-Type + Accept
 *   - a single place to interpret generic error codes
 */

export type OpsApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export async function opsApiPost<T>(
  path: string,
  body: unknown,
): Promise<OpsApiResult<T>> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body ?? {}),
  }).catch(() => null);

  if (!res) return { ok: false, status: 0, error: "network_error" };
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = typeof json.error === "string" ? json.error : "request_failed";
    return { ok: false, status: res.status, error: err };
  }
  return { ok: true, data: json as T };
}

export async function opsApiUpload<T>(
  path: string,
  form: FormData,
): Promise<OpsApiResult<T>> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    body: form,
  }).catch(() => null);

  if (!res) return { ok: false, status: 0, error: "network_error" };
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = typeof json.error === "string" ? json.error : "request_failed";
    return { ok: false, status: res.status, error: err };
  }
  return { ok: true, data: json as T };
}
