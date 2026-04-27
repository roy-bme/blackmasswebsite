"use server";

import { redirect } from "next/navigation";

import { validateNewPassword, PASSWORD_ERROR_MESSAGES } from "@/lib/ops/password";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResetPasswordState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function setNewPassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!newPassword || !confirmPassword) {
    return { status: "error", message: "Both fields are required." };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: "Passwords don't match." };
  }

  const passwordError = validateNewPassword(newPassword);
  if (passwordError) {
    return { status: "error", message: PASSWORD_ERROR_MESSAGES[passwordError] };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The recovery-code exchange should have established a session before this
  // page loaded. If we don't have one, the link was either tampered with or
  // expired between landing and submit — bounce to the canonical error.
  if (!user) {
    redirect("/auth/auth-error?reason=reset_link_invalid");
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    data: { password_change_required: false },
  });
  if (error) {
    return {
      status: "error",
      message: error.message || "Couldn't update password. Try again.",
    };
  }

  // Sign the recovery session out so the user has to re-authenticate with
  // their new password — clean separation from the reset token.
  await supabase.auth.signOut();
  redirect("/login?flash=password_changed");
}
