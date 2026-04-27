"use client";

import { useFormStatus } from "react-dom";

import Button from "@/components/ops/ui/Button";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import { errorMessageForToken, type AuthErrorToken } from "@/lib/ops/auth-error";

import { signInWithPassword } from "./actions";

type LoginFormProps = {
  next?: string;
  error?: AuthErrorToken;
  flash?: string | null;
};

export default function LoginForm({ next, error, flash }: LoginFormProps) {
  const message = error ? errorMessageForToken(error) : null;

  return (
    <form action={signInWithPassword} className="mt-8 w-full max-w-md">
      {flash ? (
        <p
          role="status"
          className="mb-5 border border-status-ok/30 bg-status-ok/[0.06] px-4 py-3 text-[13px] text-status-ok"
        >
          {flash}
        </p>
      ) : null}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@blackmass.co"
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <div className="mt-1 mb-6 flex flex-col items-end gap-1">
        <a
          href="/auth/forgot-password"
          className="font-mono text-[11px] uppercase tracking-eyebrow text-zimx-gold/80 underline-offset-2 hover:text-white hover:underline"
        >
          Forgot password? Reset it
        </a>
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
          Or ask an admin
        </span>
      </div>

      <SubmitButton />

      {message ? (
        <p
          role="alert"
          aria-live="polite"
          className="mt-6 border border-status-bad/30 bg-status-bad/[0.06] px-4 py-3 text-[13px] text-status-bad"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  required?: boolean;
};

function Field({ label, name, type, autoComplete, placeholder, required }: FieldProps) {
  return (
    <div className="mb-5">
      <Eyebrow className="mb-2">{label}</Eyebrow>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="w-full border border-line-15 bg-ink-700 px-3.5 py-3 text-[14px] text-white placeholder-fg-faint outline-none transition-colors focus:border-zimx-gold"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      fullWidth
      disabled={pending}
      trailingIcon={
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      }
    >
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
