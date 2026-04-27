"use client";

import { useFormStatus } from "react-dom";

import Button from "@/components/ops/ui/Button";
import Eyebrow from "@/components/ops/ui/Eyebrow";

import { requestPasswordReset } from "./actions";

type Props = {
  error?: string;
};

export default function ForgotPasswordForm({ error }: Props) {
  return (
    <form action={requestPasswordReset} className="mt-8 w-full max-w-md">
      <div className="mb-5">
        <Eyebrow className="mb-2">Email</Eyebrow>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@blackmass.co"
          required
          className="w-full border border-line-15 bg-ink-700 px-3.5 py-3 text-[14px] text-white placeholder-fg-faint outline-none transition-colors focus:border-zimx-gold"
        />
      </div>

      <SubmitButton />

      {error ? (
        <p
          role="alert"
          className="mt-6 border border-status-bad/30 bg-status-bad/[0.06] px-4 py-3 text-[13px] text-status-bad"
        >
          Enter a valid email address.
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}
