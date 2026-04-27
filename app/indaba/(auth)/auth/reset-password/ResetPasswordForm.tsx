"use client";

import { useFormState, useFormStatus } from "react-dom";

import Button from "@/components/ops/ui/Button";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import { PASSWORD_RULE_HINT } from "@/lib/ops/password";

import { setNewPassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = { status: "idle" };

export default function ResetPasswordForm() {
  const [state, formAction] = useFormState(setNewPassword, initialState);

  return (
    <form action={formAction} className="mt-8 w-full max-w-md">
      <div className="mb-5">
        <Eyebrow className="mb-2">New password</Eyebrow>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="w-full border border-line-15 bg-ink-700 px-3.5 py-3 text-[14px] text-white placeholder-fg-faint outline-none transition-colors focus:border-zimx-gold"
        />
      </div>
      <p className="-mt-3 mb-5 text-[11px] text-fg-mute">{PASSWORD_RULE_HINT}</p>
      <div className="mb-6">
        <Eyebrow className="mb-2">Confirm new password</Eyebrow>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="w-full border border-line-15 bg-ink-700 px-3.5 py-3 text-[14px] text-white placeholder-fg-faint outline-none transition-colors focus:border-zimx-gold"
        />
      </div>

      <SubmitButton />

      {state.status === "error" ? (
        <p
          role="alert"
          aria-live="polite"
          className="mt-6 border border-status-bad/30 bg-status-bad/[0.06] px-4 py-3 text-[13px] text-status-bad"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending}>
      {pending ? "Saving…" : "Set new password"}
    </Button>
  );
}
