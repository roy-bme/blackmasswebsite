"use server";

import { revalidatePath } from "next/cache";

import { requireModuleAccess } from "@/lib/ops/auth";
import { copyRuleViolations } from "@/lib/ops/ssr";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionState = { status: "idle" } | { status: "ok"; message: string } | { status: "error"; message: string };

const PATH = "/indaba/synthetic-panel";
const CODE = /^C\d{1,2}$/;

async function requireAdmin() {
  const user = await requireModuleAccess(PATH);
  if (user.role !== "admin") throw new Error("Only admins can change the synthetic panel.");
  return user;
}

function fail(err: unknown): ActionState {
  return { status: "error", message: err instanceof Error ? err.message : String(err) };
}

/**
 * Ask the agent for a cost estimate. Spends nothing: the agent picks the row up within a
 * minute, estimates it and sets it to awaiting_approval.
 */
export async function requestEstimateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireAdmin();
    const concepts = formData.getAll("concepts").map(String).filter((c) => CODE.test(c));
    const pain = formData.getAll("pain_compare").map(String).filter((c) => concepts.includes(c));
    const scope = String(formData.get("scope") ?? "pilot");
    if (concepts.length === 0) return { status: "error", message: "Pick at least one concept." };
    if (!["pilot", "full", "concept_rerun"].includes(scope)) return { status: "error", message: "Unknown scope." };
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("ssr_runs").insert({
      status: "estimate_requested",
      scope,
      concept_codes: concepts,
      pain_compare_codes: pain,
      include_calibration: formData.get("include_calibration") === "on",
      created_by: user.id,
    });
    if (error) return { status: "error", message: error.message };
    revalidatePath(PATH);
    return { status: "ok", message: "Estimate requested. The agent prices it within a minute; refresh to see it." };
  } catch (err) {
    return fail(err);
  }
}

/** Re-run one concept: same flow, one concept, scope concept_rerun. */
export async function rerunConceptAction(code: string): Promise<ActionState> {
  try {
    const user = await requireAdmin();
    if (!CODE.test(code)) return { status: "error", message: "Unknown concept." };
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("ssr_runs").insert({
      status: "estimate_requested",
      scope: "concept_rerun",
      concept_codes: [code],
      pain_compare_codes: [],
      include_calibration: true,
      created_by: user.id,
    });
    if (error) return { status: "error", message: error.message };
    revalidatePath(PATH);
    return { status: "ok", message: `Estimate requested for ${code}.` };
  } catch (err) {
    return fail(err);
  }
}

/** Approve an estimate. The database refuses unless the worst case is within the run cap. */
export async function approveRunAction(runId: string): Promise<ActionState> {
  try {
    const user = await requireAdmin();
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ssr_runs")
      .update({ status: "approved", approved_by: user.id })
      .eq("id", runId)
      .eq("status", "awaiting_approval")
      .select("id");
    if (error) return { status: "error", message: error.message };
    if (!data || data.length === 0) return { status: "error", message: "That run is no longer waiting for approval." };
    revalidatePath(PATH);
    return { status: "ok", message: "Approved. The agent starts it within a minute." };
  } catch (err) {
    return fail(err);
  }
}

export async function cancelRunAction(runId: string): Promise<ActionState> {
  try {
    await requireAdmin();
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("ssr_runs")
      .update({ status: "cancelled" })
      .eq("id", runId)
      .in("status", ["estimate_requested", "awaiting_approval"]);
    if (error) return { status: "error", message: error.message };
    revalidatePath(PATH);
    return { status: "ok", message: "Cancelled." };
  } catch (err) {
    return fail(err);
  }
}

export async function updateConceptAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const code = String(formData.get("code") ?? "");
    if (!CODE.test(code)) return { status: "error", message: "Unknown concept." };
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const priceTextRaw = formData.get("price_text");
    const priceText = priceTextRaw === null ? undefined : String(priceTextRaw).trim() || null;
    const priceUsdRaw = String(formData.get("price_usd") ?? "").trim();
    if (!title || !body) return { status: "error", message: "Title and text are required." };
    const problems = copyRuleViolations(`${title}\n${body}\n${priceText ?? ""}`);
    if (problems.length) return { status: "error", message: `Copy rules: ${problems.join(", ")}.` };

    const supabase = createSupabaseServerClient();
    const { data: current, error: readErr } = await supabase.from("ssr_concepts").select("params").eq("code", code).single();
    if (readErr) return { status: "error", message: readErr.message };
    const params = { ...((current?.params as Record<string, unknown>) ?? {}) };
    if (priceUsdRaw) {
      const n = Number(priceUsdRaw);
      if (!Number.isFinite(n) || n <= 0 || n > 10000) return { status: "error", message: "Price must be a positive number." };
      params.price_usd = n;
    }
    if (/\{price_usd\}/.test(`${body}${priceText ?? ""}`) && params.price_usd === undefined) {
      return { status: "error", message: "The text uses {price_usd}; set a price." };
    }
    const update: Record<string, unknown> = {
      title,
      body,
      params,
      active: formData.get("active") === "on",
    };
    if (priceText !== undefined) update.price_text = priceText;
    const { error } = await supabase.from("ssr_concepts").update(update).eq("code", code);
    if (error) return { status: "error", message: error.message };
    revalidatePath(PATH);
    return { status: "ok", message: `${code} saved. Runs estimated before this edit must be re-estimated.` };
  } catch (err) {
    return fail(err);
  }
}

export async function updateAnchorSetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const code = String(formData.get("code") ?? "");
    if (!/^[AB]\d$/.test(code)) return { status: "error", message: "Unknown anchor set." };
    const anchors = [1, 2, 3, 4, 5].map((i) => String(formData.get(`anchor_${i}`) ?? "").trim());
    if (anchors.some((a) => !a)) return { status: "error", message: "All five anchors are required." };
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("ssr_anchor_sets")
      .update({ anchors, active: formData.get("active") === "on" })
      .eq("code", code);
    if (error) return { status: "error", message: error.message };
    revalidatePath(PATH);
    return { status: "ok", message: `${code} saved. Runs estimated before this edit must be re-estimated.` };
  } catch (err) {
    return fail(err);
  }
}
