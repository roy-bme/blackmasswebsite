"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import { isAllowedAttachment } from "@/lib/ops/attachments";
import { opsApiPost } from "@/lib/ops/api-client";

type SignedAttachmentProps = {
  /** Either a storage path like `photos/<uid>/<file>` or a full storage URL. */
  path: string;
  alt: string;
  className?: string;
  /** When set, render as a clickable link opening the signed URL. */
  wrapInLink?: boolean;
};

/**
 * Renders an attachment stored in the private `photos` bucket by fetching
 * a short-lived signed URL from /api/ops/activities/signed-url. Invalid
 * paths fall back to a placeholder so a poisoned DB row can't produce
 * a hostile <img src>.
 */
export default function SignedAttachment({
  path,
  alt,
  className,
  wrapInLink,
}: SignedAttachmentProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  const pathIsValid = isAllowedAttachment(path);

  useEffect(() => {
    let cancelled = false;
    if (!pathIsValid) {
      setErrored(true);
      return;
    }
    (async () => {
      const res = await opsApiPost<{ urls: Record<string, string | null> }>(
        "/api/ops/activities/signed-url",
        { paths: [normalisePath(path)] },
      );
      if (cancelled) return;
      if (!res.ok) {
        setErrored(true);
        return;
      }
      const resolved = res.data.urls[normalisePath(path)];
      if (!resolved) {
        setErrored(true);
        return;
      }
      setUrl(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [path, pathIsValid]);

  if (errored || !pathIsValid) {
    return (
      <span
        aria-label="invalid attachment"
        className="inline-flex h-full w-full items-center justify-center bg-zinc-100 font-mono text-[10px] uppercase tracking-tag text-zinc-500"
      >
        invalid
      </span>
    );
  }

  if (!url) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-full w-full items-center justify-center bg-zinc-50"
      />
    );
  }

  const img = <img src={url} alt={alt} className={className} />;
  if (!wrapInLink) return img;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
      {img}
    </a>
  );
}

function normalisePath(input: string): string {
  // If full URL, extract bucket-relative path.
  if (input.startsWith("photos/")) return input;
  try {
    const u = new URL(input);
    const idx = u.pathname.indexOf("/photos/");
    if (idx >= 0) return u.pathname.slice(idx + 1);
  } catch {
    // ignore
  }
  return input;
}
