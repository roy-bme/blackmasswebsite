import Link from "next/link";

import Card from "@/components/ops/ui/Card";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import PageHeader from "@/components/ops/PageHeader";
import Distribution from "@/components/ops/SyntheticPanel/Distribution";
import {
  AnchorEditor,
  ConceptEditor,
  RequestEstimateForm,
  RerunConceptButton,
  RunDecision,
} from "@/components/ops/SyntheticPanel/Controls";
import { requireModuleAccess } from "@/lib/ops/auth";
import {
  SSR_BANNER,
  fmtDiff,
  fmtMean,
  fmtUsd,
  type SegmentDists,
  type SsrAnchorSet,
  type SsrConcept,
  type SsrObjection,
  type SsrRun,
} from "@/lib/ops/ssr";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = { run?: string };

const STATUS_TONE: Record<SsrRun["status"], string> = {
  estimate_requested: "text-fg-dim",
  awaiting_approval: "text-status-warn",
  approved: "text-status-info",
  running: "text-status-info",
  done: "text-status-ok",
  failed: "text-status-bad",
  capped: "text-status-bad",
  cancelled: "text-fg-dim",
};

export default async function SyntheticPanelPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireModuleAccess("/indaba/synthetic-panel");
  const isAdmin = user.role === "admin";
  const supabase = createSupabaseServerClient();

  const [runsRes, conceptsRes, anchorsRes] = await Promise.all([
    supabase.from("ssr_runs").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("ssr_concepts").select("*").order("sort_order"),
    supabase.from("ssr_anchor_sets").select("*").order("code"),
  ]);
  const runs = (runsRes.data ?? []) as SsrRun[];
  const concepts = (conceptsRes.data ?? []) as SsrConcept[];
  const anchors = (anchorsRes.data ?? []) as SsrAnchorSet[];

  const pending = runs.filter((r) => ["estimate_requested", "awaiting_approval", "approved", "running"].includes(r.status));
  const selected =
    runs.find((r) => r.id === searchParams.run) ?? runs.find((r) => r.status === "done" && r.summary) ?? null;
  const summary = selected?.summary ?? null;

  let objections: SsrObjection[] = [];
  let calibration: CalibrationView[] = [];
  if (selected && summary) {
    const { data } = await supabase
      .from("ssr_objections")
      .select("*")
      .eq("run_id", selected.id)
      .order("concept_code")
      .order("share", { ascending: false });
    objections = (data ?? []) as SsrObjection[];
    calibration = await loadCalibration(selected.id, summary.calibration.records.map((r) => r.business_id));
  }

  const conceptCodes = summary ? Object.keys(summary.concepts) : [];

  return (
    <div>
      <div
        role="note"
        className="sticky top-0 z-20 border-b border-status-warn/40 bg-[#2a2216] px-4 py-2 text-[12px] font-medium text-status-warn md:px-6"
      >
        {SSR_BANNER}
      </div>

      <PageHeader
        eyebrow="indaba · agent · synthetic panel"
        title="synthetic merchant panel."
        caption={
          summary
            ? `run ${selected!.id.slice(0, 8)} · ${summary.records} records · ${summary.persona_groups} persona groups · ${fmtUsd(selected!.actual_cost_usd)}`
            : "no completed run yet"
        }
      />

      <div className="grid gap-4 px-4 py-4 md:px-6 md:py-5">
        {/* Runs needing a decision */}
        {pending.length > 0 ? (
          <Card padding="lg" accent="warn">
            <Eyebrow gold>runs waiting · {pending.length}</Eyebrow>
            <div className="mt-3 space-y-4">
              {pending.map((r) => (
                <PendingRun key={r.id} run={r} isAdmin={isAdmin} />
              ))}
            </div>
          </Card>
        ) : null}

        {isAdmin ? (
          <Card padding="lg">
            <Eyebrow>new run · estimate first, nothing is spent until you approve</Eyebrow>
            <div className="mt-3">
              <RequestEstimateForm concepts={concepts} />
            </div>
          </Card>
        ) : null}

        {summary && selected ? (
          <>
            <RunMeta run={selected} />
            <Ranking summary={summary} />

            <section className="grid gap-4 xl:grid-cols-2">
              {conceptCodes.map((code) => {
                const c = summary.concepts[code];
                return (
                  <Card key={code} padding="lg" accent={code === summary.control ? undefined : "gold"}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Eyebrow>{code}{code === summary.control ? " · control" : ""}</Eyebrow>
                        <h3 className="mt-1 text-[15px] text-white">{c.title}</h3>
                      </div>
                      {isAdmin ? <RerunConceptButton code={code} /> : null}
                    </div>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <Distribution dist={c.base.A} construct="A" label="A · adoption intent" />
                      <Distribution dist={c.base.B} construct="B" label="B · price acceptance" />
                    </div>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <Distribution dist={c.base.icp.A} construct="A" label="A · ICP (wholesale, FMCG, distribution)" compact />
                      <Distribution dist={c.base.non_icp.A} construct="A" label="A · other sectors" compact />
                      {c.base.B ? (
                        <>
                          <Distribution dist={c.base.icp.B} construct="B" label="B · ICP" compact />
                          <Distribution dist={c.base.non_icp.B} construct="B" label="B · other sectors" compact />
                        </>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </section>

            {summary.pain_compare.length ? <PainCompare summary={summary} /> : null}

            <Breakdown title="by sector" summary={summary} pick="by_sector" />
            <Breakdown title="by zone" summary={summary} pick="by_zone" />

            <Objections objections={objections} titles={Object.fromEntries(conceptCodes.map((c) => [c, summary.concepts[c].title]))} />

            <Calibration views={calibration} summary={summary} />
          </>
        ) : null}

        <RunHistory runs={runs} selectedId={selected?.id ?? null} />

        <Card padding="lg">
          <details>
            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-eyebrow text-fg-dim">
              concepts and anchors{isAdmin ? " · edit" : ""}
            </summary>
            <div className="mt-4 grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                {concepts.map((c) => (
                  <div key={c.code}>
                    <Eyebrow>{c.code}{c.is_control ? " · control" : ""}{c.price_construct ? " · price asked" : ""}</Eyebrow>
                    <div className="mt-2">
                      {isAdmin ? (
                        <ConceptEditor concept={c} />
                      ) : (
                        <p className="text-[13px] text-fg-mute">
                          <span className="text-white">{c.title}.</span> {c.body}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <p className="text-[12px] text-fg-dim">
                  Each answer is compared with every anchor in a set; the five similarities become a 1–5
                  distribution. A construct&apos;s sets are averaged. Price (B) is asked only for priced concepts.
                </p>
                {anchors.map((a) => (
                  <div key={a.code}>
                    <Eyebrow>{a.code} · construct {a.construct}</Eyebrow>
                    <div className="mt-2">
                      {isAdmin ? (
                        <AnchorEditor set={a} />
                      ) : (
                        <ol className="list-decimal pl-5 text-[13px] text-fg-mute">
                          {a.anchors.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PendingRun({ run, isAdmin }: { run: SsrRun; isAdmin: boolean }) {
  const e = run.estimate;
  return (
    <div className="border-b border-line-10 pb-4 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px]">
        <span className="text-white">{run.id.slice(0, 8)}</span>
        <span className={STATUS_TONE[run.status]}>{run.status.replace("_", " ")}</span>
        <span className="text-fg-mute">{run.scope} · {run.concept_codes.join(", ")}</span>
        {run.pain_compare_codes.length ? <span className="text-fg-dim">no-pain: {run.pain_compare_codes.join(", ")}</span> : null}
        {run.persona_group_count ? <span className="text-fg-dim">{run.persona_group_count} groups / {run.persona_record_count} records</span> : null}
      </div>
      {e ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="model calls" value={String(e.calls)} />
          <Stat label="expected" value={fmtUsd(e.expected_usd)} />
          <Stat label="worst case" value={fmtUsd(e.worst_case_usd)} />
          <Stat label="run cap" value={fmtUsd(run.cost_cap_usd)} sub={e.cap_reason} />
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-fg-dim">The agent will price this within a minute.</p>
      )}
      {e ? (
        <p className="mt-2 font-mono text-[10px] text-fg-dim">
          {Object.entries(e.breakdown_usd)
            .map(([k, v]) => `${k.replace("_", " ")} ${fmtUsd(v.expected)}–${fmtUsd(v.worst)}`)
            .join(" · ")}
          {" · "}model {String(run.params?.model ?? "—")}
          {run.params?.sampling_params_sent ? ` · T=${run.params.temperature} top_p=${run.params.top_p}` : " · model default sampling"}
        </p>
      ) : null}
      {run.error_message ? <p className="mt-2 text-[12px] text-status-bad">{run.error_message}</p> : null}
      {isAdmin && run.status === "awaiting_approval" ? (
        <div className="mt-3">
          <RunDecision runId={run.id} canApprove={Boolean(e?.fits_cap)} />
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">{label}</div>
      <div className="mt-1 text-[20px] font-light text-white">{value}</div>
      {sub ? <div className="font-mono text-[10px] text-fg-dim">{sub}</div> : null}
    </div>
  );
}

function RunMeta({ run }: { run: SsrRun }) {
  const p = run.params ?? {};
  return (
    <Card padding="md">
      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-fg-mute">
        <span>model {String(p.model ?? "—")}</span>
        <span>embeddings {String(p.embedding_model ?? "—")}</span>
        <span>{p.sampling_params_sent ? `temperature ${p.temperature} · top_p ${p.top_p}` : "model default sampling (temperature/top_p not accepted)"}</span>
        <span>{String(p.samples ?? "—")} samples per prompt</span>
        <span>SSR T={String(p.T ?? "—")} ε={String(p.epsilon ?? "—")}</span>
        <span>cost {fmtUsd(run.actual_cost_usd)} of cap {fmtUsd(run.cost_cap_usd)}</span>
        {run.summary?.dropped_samples ? <span className="text-status-warn">{run.summary.dropped_samples} samples dropped</span> : null}
      </div>
      {run.pii_log ? (
        <details className="mt-2">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
            PII stripping log
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] text-fg-mute">
            {JSON.stringify(run.pii_log, null, 2)}
          </pre>
        </details>
      ) : null}
    </Card>
  );
}

function Ranking({ summary }: { summary: NonNullable<SsrRun["summary"]> }) {
  const segs: { key: "all" | "icp" | "non_icp"; label: string }[] = [
    { key: "all", label: "all records" },
    { key: "icp", label: "ICP · wholesale, FMCG, distribution" },
    { key: "non_icp", label: "other sectors" },
  ];
  return (
    <Card padding="lg">
      <Eyebrow>ranking against {summary.control} · mean adoption (A), 1–5</Eyebrow>
      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        {segs.map((s) => {
          const rows = summary.ranking.filter((r) => r.segment === s.key);
          return (
            <div key={s.key} className="overflow-x-auto">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">{s.label}</div>
              <table className="mt-2 w-full text-left text-[13px]">
                <thead className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
                  <tr>
                    <th className="py-1 font-normal">concept</th>
                    <th className="py-1 text-right font-normal">A</th>
                    <th className="py-1 text-right font-normal">vs {summary.control}</th>
                    <th className="py-1 text-right font-normal">B</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-t border-line-10">
                      <td className="py-1.5 text-white">{r.code}</td>
                      <td className="py-1.5 text-right font-mono">{fmtMean(r.a_mean)}</td>
                      <td className="py-1.5 text-right font-mono text-fg-mute">{r.code === summary.control ? "" : fmtDiff(r.a_vs_c0)}</td>
                      <td className="py-1.5 text-right font-mono text-fg-mute">{fmtMean(r.b_mean)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PainCompare({ summary }: { summary: NonNullable<SsrRun["summary"]> }) {
  return (
    <Card padding="lg">
      <Eyebrow>pain tags · do they inflate the scores?</Eyebrow>
      <p className="mt-2 text-[12px] text-fg-dim">
        The same persona groups were asked twice: with their pain tags and with the tags removed. For
        groups with no tags both prompts are identical, so their gap shows ordinary sampling noise.
      </p>
      {summary.pain_compare.map((p) => (
        <div key={p.concept} className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">{p.concept} · tagged groups ({p.tagged.n_records} records)</div>
            <div className="mt-1 text-[20px] font-light text-white">
              A {fmtDiff(p.tagged.a_diff)} <span className="text-fg-dim">·</span> B {fmtDiff(p.tagged.b_diff)}
            </div>
            <div className="font-mono text-[10px] text-fg-dim">with tags minus without</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">noise floor · untagged ({p.untagged_noise.n_records} records)</div>
            <div className="mt-1 text-[20px] font-light text-fg-mute">
              A {fmtDiff(p.untagged_noise.a_diff)} <span className="text-fg-dim">·</span> B {fmtDiff(p.untagged_noise.b_diff)}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">all records</div>
            <div className="mt-1 text-[20px] font-light text-fg-mute">
              A {fmtDiff(p.all.a_diff)} <span className="text-fg-dim">·</span> B {fmtDiff(p.all.b_diff)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-3">
            <Distribution dist={p.tagged.base.A} construct="A" label="tagged · with tags" compact />
            <Distribution dist={p.tagged.no_pain.A} construct="A" label="tagged · tags removed" compact />
          </div>
        </div>
      ))}
    </Card>
  );
}

function Breakdown({
  title,
  summary,
  pick,
}: {
  title: string;
  summary: NonNullable<SsrRun["summary"]>;
  pick: "by_sector" | "by_zone";
}) {
  const codes = Object.keys(summary.concepts);
  const segments = new Map<string, Record<string, SegmentDists>>();
  for (const code of codes) {
    for (const [seg, d] of Object.entries(summary.concepts[code].base[pick])) {
      segments.set(seg, { ...(segments.get(seg) ?? {}), [code]: d });
    }
  }
  const rows = [...segments.entries()].sort(
    (a, b) => (Object.values(b[1])[0]?.A?.n_records ?? 0) - (Object.values(a[1])[0]?.A?.n_records ?? 0),
  );
  return (
    <Card padding="lg">
      <Eyebrow>{title} · mean A (B), records in brackets · small segments are noisy</Eyebrow>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
            <tr>
              <th className="py-1 font-normal">{pick === "by_sector" ? "sector" : "zone"}</th>
              <th className="py-1 text-right font-normal">n</th>
              {codes.map((c) => (
                <th key={c} className="py-1 text-right font-normal">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([seg, byCode]) => {
              const n = Object.values(byCode)[0]?.A?.n_records ?? 0;
              const icp = pick === "by_sector" && summary.icp_sectors.includes(seg);
              return (
                <tr key={seg} className="border-t border-line-10">
                  <td className={`py-1.5 ${icp ? "text-zimx-gold" : "text-white"}`}>{seg}{icp ? " · ICP" : ""}</td>
                  <td className={`py-1.5 text-right font-mono ${n < 5 ? "text-fg-faint" : "text-fg-dim"}`}>{n}</td>
                  {codes.map((c) => (
                    <td key={c} className={`py-1.5 text-right font-mono ${n < 5 ? "text-fg-faint" : "text-fg-mute"}`}>
                      {fmtMean(byCode[c]?.A?.mean)}
                      {byCode[c]?.B ? <span className="text-fg-dim"> ({fmtMean(byCode[c]?.B?.mean)})</span> : null}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Objections({ objections, titles }: { objections: SsrObjection[]; titles: Record<string, string> }) {
  const panels = new Map<string, SsrObjection[]>();
  for (const o of objections) {
    const k = `${o.concept_code}:${o.variant}`;
    panels.set(k, [...(panels.get(k) ?? []), o]);
  }
  return (
    <Card padding="lg">
      <Eyebrow>objections · what would hold people back</Eyebrow>
      <p className="mt-2 text-[12px] text-fg-dim">
        Reasons copied word for word from the synthetic answers, grouped by meaning. Share = records (weighted)
        whose answer raised that reason at least once.
      </p>
      {panels.size === 0 ? <p className="mt-3 text-[13px] text-fg-mute">No objections recorded for this run.</p> : null}
      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        {[...panels.entries()].map(([k, list]) => {
          const [code, variant] = k.split(":");
          return (
            <div key={k}>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
                {code} · {titles[code] ?? ""}{variant === "no_pain" ? " · pain tags removed" : ""}
              </div>
              <ul className="mt-2 space-y-3">
                {list.map((o) => (
                  <li key={o.id} className="border-t border-line-10 pt-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] text-white">{o.label}</span>
                      <span className="shrink-0 font-mono text-[12px] text-fg-mute">{Math.round(o.share * 100)}%</span>
                    </div>
                    <div className="mt-1 h-[4px] w-full bg-line-10">
                      <div className="h-full rounded-r-[4px] bg-zimx-gold" style={{ width: `${Math.min(o.share * 100, 100)}%` }} />
                    </div>
                    <ul className="mt-2 space-y-1">
                      {o.quotes.slice(0, 3).map((q, i) => (
                        <li key={i} className="text-[12px] text-fg-mute">
                          &ldquo;{q.quote}&rdquo;{" "}
                          <span className="font-mono text-[10px] text-fg-dim">{q.sector} · {q.zone}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Calibration: real records beside their synthetic answers.

type CalibrationView = {
  businessId: string;
  zitf: Record<string, unknown>[];
  meetings: { outcome: string | null; notes: string | null; created_at: string }[];
  synthetic: { concept_code: string; prompt_kind: string; raw_text: string; mean: number | null }[];
};

async function loadCalibration(runId: string, businessIds: string[]): Promise<CalibrationView[]> {
  const supabase = createSupabaseServerClient();
  const out: CalibrationView[] = [];
  for (const id of businessIds) {
    const { data: biz } = await supabase.from("businesses").select("name").eq("id", id).maybeSingle();
    const name = (biz?.name as string | undefined)?.trim() ?? "";
    const [zitfRes, meetRes, synRes] = await Promise.all([
      name
        ? supabase
            .from("zitf_responses_archive")
            .select("pay_suppliers_methods, receive_customers_methods, pain_top_headaches, escrow_used_before, escrow_would_use, payment_wish, notes, submitted_at")
            .ilike("business_name", name.replace(/[%_]/g, (m) => `\\${m}`))
        : Promise.resolve({ data: [] }),
      supabase.from("interactions").select("outcome, notes, created_at").eq("business_id", id).eq("type", "meeting"),
      supabase
        .from("ssr_responses")
        .select("concept_code, prompt_kind, raw_text, mean")
        .eq("run_id", runId)
        .eq("variant", "calibration")
        .eq("calibration_business_id", id)
        .order("concept_code"),
    ]);
    out.push({
      businessId: id,
      zitf: (zitfRes.data ?? []) as Record<string, unknown>[],
      meetings: (meetRes.data ?? []) as CalibrationView["meetings"],
      synthetic: (synRes.data ?? []) as CalibrationView["synthetic"],
    });
  }
  return out;
}

function Calibration({ views, summary }: { views: CalibrationView[]; summary: NonNullable<SsrRun["summary"]> }) {
  return (
    <Card padding="lg">
      <Eyebrow>calibration · real answers beside synthetic · n={summary.calibration.n}</Eyebrow>
      <p className="mt-2 text-[12px] text-status-warn">
        n={summary.calibration.n}. Far too small for any statistic. Read it as a sense check of tone and
        objections, not as validation.
      </p>
      {views.length === 0 ? <p className="mt-3 text-[13px] text-fg-mute">No calibration records in this run.</p> : null}
      {views.map((v, i) => (
        <div key={v.businessId} className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">real record {i + 1} · ZITF form and meeting notes</div>
            {v.zitf.map((z, j) => (
              <dl key={j} className="mt-2 grid grid-cols-[150px_1fr] gap-x-3 gap-y-1 text-[12px]">
                {Object.entries(z)
                  .filter(([, val]) => val !== null && val !== "" && !(Array.isArray(val) && val.length === 0))
                  .map(([k, val]) => (
                    <div key={k} className="contents">
                      <dt className="font-mono text-[10px] text-fg-dim">{k.replace(/_/g, " ")}</dt>
                      <dd className="text-fg-mute">{Array.isArray(val) ? val.join(", ") : String(val)}</dd>
                    </div>
                  ))}
              </dl>
            ))}
            {v.meetings.map((m, j) => (
              <p key={j} className="mt-2 text-[12px] text-fg-mute">
                <span className="font-mono text-[10px] text-fg-dim">meeting · {m.outcome ?? ""} · </span>
                {m.notes}
              </p>
            ))}
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">synthetic persona for the same record</div>
            <ul className="mt-2 space-y-2">
              {v.synthetic.map((s, j) => (
                <li key={j} className="text-[12px] text-fg-mute">
                  <span className="font-mono text-[10px] text-fg-dim">
                    {s.concept_code} · {s.prompt_kind} · mean {fmtMean(s.mean)} ·{" "}
                  </span>
                  {s.raw_text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </Card>
  );
}

function RunHistory({ runs, selectedId }: { runs: SsrRun[]; selectedId: string | null }) {
  if (runs.length === 0) return null;
  return (
    <Card padding="lg">
      <Eyebrow>runs</Eyebrow>
      <div className="mt-3 space-y-1 font-mono text-[11px]">
        {runs.map((r) => (
          <div key={r.id} className="grid grid-cols-[80px_1fr_auto] items-baseline gap-2 border-b border-line-10 py-1 sm:grid-cols-[80px_120px_1fr_90px]">
            {r.status === "done" ? (
              <Link href={`/indaba/synthetic-panel?run=${r.id}`} className={r.id === selectedId ? "text-zimx-gold" : "text-white underline-offset-2 hover:underline"}>
                {r.id.slice(0, 8)}
              </Link>
            ) : (
              <span className="text-fg-mute">{r.id.slice(0, 8)}</span>
            )}
            <span className={`hidden sm:inline ${STATUS_TONE[r.status]}`}>{r.status.replace("_", " ")}</span>
            <span className="truncate text-fg-mute">{r.scope} · {r.concept_codes.join(", ")}</span>
            <span className="text-right text-fg-dim">{fmtUsd(r.status === "done" || r.status === "capped" ? r.actual_cost_usd : r.estimate?.expected_usd)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
