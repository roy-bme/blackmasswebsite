"use client";

import { useState, type FormEvent } from "react";

import { safeNext } from "@/lib/ops/next-param";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error" };

type LoginFormProps = {
  /** Post-auth redirect path, forwarded to /auth/callback. Validated server-side. */
  next?: string;
};

const GENERIC_FAILURE =
  "We couldn't send the link. Try again in a minute.";

export default function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus({ kind: "sending" });

    const nextPath = safeNext(next ?? null);

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ email: trimmed, next: nextPath }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setStatus({ kind: "error" });
      return;
    }

    setStatus({ kind: "sent", email: trimmed });
  }

  const disabled = status.kind === "sending";

  return (
    <form onSubmit={handleSubmit} className="mt-10 max-w-md">
      <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-[1px] text-white/50">
        Email
      </label>
      <input
        id="email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={disabled || status.kind === "sent"}
        placeholder="you@blackmass.co.uk"
        className="mt-3 w-full border border-white/20 bg-transparent px-4 py-3 text-[15px] text-white placeholder-white/30 focus:border-white/60 focus:outline-none disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={disabled || status.kind === "sent"}
        className="mt-6 inline-flex items-center justify-center border border-white/80 px-6 py-3 font-mono text-[12px] uppercase tracking-[1.5px] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
      >
        {status.kind === "sending" ? "Sending…" : "Send magic link"}
      </button>

      <div aria-live="polite" className="mt-6 min-h-[1.5rem] text-[14px]">
        {status.kind === "sent" && (
          <p className="text-white/70">
            If <span className="text-white">{status.email}</span> is registered, a link is on its way.
            You can close this tab.
          </p>
        )}
        {status.kind === "error" && (
          <p className="text-red-300">{GENERIC_FAILURE}</p>
        )}
      </div>
    </form>
  );
}
