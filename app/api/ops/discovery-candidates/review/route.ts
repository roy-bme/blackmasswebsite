import { jsonError, jsonOk, readJson, withOpsWrite } from "@/lib/server/ops-handler";

type Body = { candidateId?: string; action?: "promote" | "reject" | "hold"; reviewNotes?: string | null };

export async function POST(request: Request) {
  return withOpsWrite(request, { module: "/indaba/map", roles: ["admin", "ops", "bd"] }, async ({ service, user }) => {
    const body = await readJson<Body>(request);
    if (!body?.candidateId || !body.action) return jsonError(400, "invalid_request");

    const { data: candidate, error: readError } = await service
      .from("discovery_candidates")
      .select("*")
      .eq("id", body.candidateId)
      .single();
    if (readError || !candidate) return jsonError(404, "candidate_not_found");

    if (body.action === "promote") {
      const { data: business, error: bizErr } = await service.from("businesses").insert({
        name: candidate.name,
        sector: candidate.sector,
        zone_id: candidate.zone_id,
        lat: candidate.lat,
        lng: candidate.lng,
        address: candidate.address,
        decision_maker_name: candidate.decision_maker_name,
        decision_maker_title: candidate.decision_maker_title,
        phone: candidate.phone,
        email: candidate.email,
        linkedin: candidate.linkedin,
        mapped_by: user.id,
        source: "promoted_candidate",
        onboarding_stage: "identified",
      }).select("id").single();
      if (bizErr || !business) return jsonError(500, "promote_insert_failed");

      const { error: updateErr } = await service.from("discovery_candidates").update({
        review_status: "reviewed_promote", reviewed_by: user.id, reviewed_at: new Date().toISOString(),
        promoted_to_business_id: business.id, review_notes: body.reviewNotes ?? null,
      }).eq("id", body.candidateId);
      if (updateErr) return jsonError(500, "candidate_update_failed");
      return jsonOk({ ok: true, promotedBusinessId: business.id });
    }

    const status = body.action === "reject" ? "reviewed_reject" : "reviewed_hold";
    const { error } = await service.from("discovery_candidates").update({ review_status: status, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_notes: body.reviewNotes ?? null }).eq("id", body.candidateId);
    if (error) return jsonError(500, "candidate_update_failed");
    return jsonOk({ ok: true });
  });
}
