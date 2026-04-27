"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { validateNewPassword, PASSWORD_ERROR_MESSAGES } from "@/lib/ops/password";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ChangePasswordState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function changePasswordRequired(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { status: "error", message: "All fields are required." };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: "New passwords don't match." };
  }
  if (newPassword === currentPassword) {
    return {
      status: "error",
      message: "New password must differ from current password.",
    };
  }

  const passwordError = validateNewPassword(newPassword);
  if (passwordError) {
    return { status: "error", message: PASSWORD_ERROR_MESSAGES[passwordError] };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    redirect("/login");
  }

  const verifier = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { status: "error", message: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
    data: { password_change_required: false },
  });
  if (updateError) {
    return {
      status: "error",
      message: updateError.message || "Couldn't update password. Try again.",
    };
  }

  redirect("/indaba/dashboard?flash=password_changed");
}
