"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import { PASSWORD_RULE_HINT } from "@/lib/ops/password";

import { changePasswordAction, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = { status: "idle" };

export default function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.status === "ok") {
      formRef.current?.reset();
    }
  }, [state]);

  const close = () => {
    if (state.status === "ok") {
      window.location.href = "/indaba/settings?flash=password_changed";
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Change password
      </Button>

      <Dialog
        open={open}
        onClose={close}
        size="sm"
        ariaLabel="Change password"
      >
        <Dialog.Header>
          <Dialog.Title>Change password</Dialog.Title>
          <Dialog.CloseButton onClose={close} />
        </Dialog.Header>

        <form ref={formRef} action={formAction}>
          <Dialog.Body className="flex flex-col gap-4">
            {state.status === "ok" ? (
              <p className="border border-status-ok/30 bg-status-ok/[0.06] px-3.5 py-3 text-[13px] text-status-ok">
                Password updated.
              </p>
            ) : null}

            {state.status === "error" ? (
              <p
                role="alert"
                className="border border-status-bad/30 bg-status-bad/[0.06] px-3.5 py-3 text-[13px] text-status-bad"
              >
                {state.message}
              </p>
            ) : null}

            <Input
              label="Current password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              minLength={1}
              disabled={state.status === "ok"}
            />
            <Input
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              hint={PASSWORD_RULE_HINT}
              disabled={state.status === "ok"}
            />
            <Input
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              disabled={state.status === "ok"}
            />
          </Dialog.Body>

          <Dialog.Footer>
            <Button type="button" variant="bare" onClick={close}>
              {state.status === "ok" ? "Done" : "Cancel"}
            </Button>
            {state.status === "ok" ? null : <SubmitButton />}
          </Dialog.Footer>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}
