"use client";

import { useFormState, useFormStatus } from "react-dom";

import Button from "@/components/ops/ui/Button";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import { PASSWORD_RULE_HINT } from "@/lib/ops/password";

import {
  changePasswordRequired,
  type ChangePasswordState,
} from "./actions";

const initialState: ChangePasswordState = { status: "idle" };

export default function ChangePasswordRequiredForm() {
  const [state, formAction] = useFormState(
    changePasswordRequired,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 w-full max-w-md">
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
      />
      <Field
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
      />
      <p className="-mt-3 mb-5 text-[11px] text-fg-mute">{PASSWORD_RULE_HINT}</p>
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
      />

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

type FieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
};

function Field({ label, name, type, autoComplete, required, minLength }: FieldProps) {
  return (
    <div className="mb-5">
      <Eyebrow className="mb-2">{label}</Eyebrow>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full border border-line-15 bg-ink-700 px-3.5 py-3 text-[14px] text-white placeholder-fg-faint outline-none transition-colors focus:border-zimx-gold"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}
