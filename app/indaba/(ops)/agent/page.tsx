import Card from "@/components/ops/ui/Card";
import EmptyState from "@/components/ops/ui/EmptyState";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import Pill from "@/components/ops/ui/Pill";
import PageHeader from "@/components/ops/PageHeader";
import SuggestionsList from "@/components/ops/Agent/SuggestionsList";
import { requireModuleAccess } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AgentBrief,
  AgentRun,
  AgentSuggestion,
  DiscoveryCandidate,
  RegulatorySignal,
} from "@/types/ops";

export const dynamic = "force-dynamic";

const RUN_STATUS_GLYPH: Record<AgentRun["status"], string> = {
  ok: "✓",
  warn: "!",
  error: "✕",
  running: "·",
  queued: "·",
};

const RUN_STATUS_TONE: Record<AgentRun["status"], string> = {
  ok: "text-status-ok",
  warn: "text-status-warn",
  error: "text-status-bad",
  running: "text-fg-dim",
  queued: "text-fg-dim",
};

export default async function AgentConsolePage() {
  const user = await requireModuleAccess("/indaba/agent");
  const supabase = createSupabaseServerClient();

  // Compliance gets a read-only subset (brief + regulatory signals only).
  const isCompliance = user.role === "compliance";
  const audience = isCompliance ? "compliance" : "admin";

  const [briefRes, runsRes, suggestionsRes, candidatesRes, signalsRes] =
    await Promise.all([
      supabase
        .from("v_latest_agent_brief")
        .select("*")
        .eq("audience", audience)
        .maybeSingle(),
      supabase
        .from("agent_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10),
      isCompliance
        ? Promise.resolve({ data: [] })
        : supabase
            .from("agent_suggestions")
            .select("*")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(8),
      isCompliance
        ? Promise.resolve({ data: [] })
        : supabase
            .from("discovery_candidates")
            .select("*")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(8),
      supabase
        .from("regulatory_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const brief = (briefRes.data ?? null) as Pick<
    AgentBrief,
    "markdown" | "created_at" | "run_id"
  > | null;
  const runs = (runsRes.data ?? []) as AgentRun[];
  const suggestions = (suggestionsRes.data ?? []) as AgentSuggestion[];
  const candidates = (candidatesRes.data ?? []) as DiscoveryCandidate[];
  const signals = (signalsRes.data ?? []) as RegulatorySignal[];

  return (
    <div>
      <PageHeader
        eyebrow={`indaba · agent · console${isCompliance ? " · read-only" : ""}`}
        title="agent console."
        caption={
          brief
            ? `today's brief · ${new Date(brief.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
            : "no brief generated yet"
        }
      />

      <div className="grid gap-4 px-4 py-4 md:px-6 md:py-5 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card padding="xl" accent="gold">
            <div className="flex items-center justify-between">
              <Eyebrow gold>
                today&apos;s brief · {brief ? timeOf(brief.created_at) : "—"}
              </Eyebrow>
              <Eyebrow>indaba.intel · v0.7</Eyebrow>
            </div>
            {brief ? (
              <BriefMarkdown markdown={brief.markdown} />
            ) : (
              <p className="mt-3 text-[13px] text-fg-mute">
                The agent hasn&apos;t generated a brief yet today. Briefs run at 06:00.
              </p>
            )}
          </Card>

          {!isCompliance ? (
            <Card padding="lg">
              <Eyebrow>suggested actions · {suggestions.length}</Eyebrow>
              <div className="mt-3">
                <SuggestionsList suggestions={suggestions} />
              </div>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Card padding="lg">
            <Eyebrow>recent runs · last 24h</Eyebrow>
            <div className="mt-3 space-y-1.5 font-mono text-[11px] leading-loose text-fg-mute">
              {runs.length === 0 ? (
                <p className="text-fg-dim">No runs yet.</p>
              ) : (
                runs.map((r) => (
                  <div
                    key={r.id}
                    className="grid items-baseline gap-2 border-b border-line-10 py-1"
                    style={{
                      gridTemplateColumns: "46px 1fr 22px 64px",
                    }}
                  >
                    <span className="text-fg-dim">{timeOf(r.started_at)}</span>
                    <span className="text-white">{r.agent_name}</span>
                    <span className={RUN_STATUS_TONE[r.status]}>
                      {RUN_STATUS_GLYPH[r.status]}
                    </span>
                    <span>{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {!isCompliance ? (
            <Card padding="lg">
              <Eyebrow>discovery feed · newest first</Eyebrow>
              <div className="mt-3 divide-y divide-line-10">
                {candidates.length === 0 ? (
                  <EmptyState
                    title="No candidates yet."
                    description="The agent will surface businesses worth contacting."
                  />
                ) : (
                  candidates.map((c) => (
                    <div key={c.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] font-medium text-white">
                          {c.name}
                        </div>
                        <span className="font-mono text-[10px] text-fg-dim">
                          {timeOf(c.created_at)}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
                        candidate · {c.sector ?? "—"} · {c.confidence ?? "?"}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : null}

          {isCompliance ? (
            <Card padding="lg">
              <Eyebrow>regulatory signals · 7d</Eyebrow>
              <div className="mt-3 divide-y divide-line-10">
                {signals.length === 0 ? (
                  <p className="py-3 text-[12px] text-fg-mute">
                    No signals in the last 7 days.
                  </p>
                ) : (
                  signals.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div>
                        <div className="font-mono text-[11px] uppercase tracking-eyebrow text-white">
                          {s.source}
                        </div>
                        <div className="mt-1 text-[13px] text-white">
                          {s.headline}
                        </div>
                      </div>
                      <Pill
                        tone={
                          s.severity === "high"
                            ? "bad"
                            : s.severity === "med"
                              ? "warn"
                              : "neutral"
                        }
                      >
                        {s.severity}
                      </Pill>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BriefMarkdown({ markdown }: { markdown: string }) {
  // Minimal markdown — preserve paragraphs and bold runs. Full markdown
  // rendering belongs to a follow-up; keeping the dependency list lean.
  const paragraphs = markdown.split(/\n{2,}/);
  return (
    <div className="mt-4 space-y-4 text-[13px] leading-relaxed text-fg-mute">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Replace **bold** runs with gold-coloured strong elements.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const match = /^\*\*(.+)\*\*$/.exec(part);
    if (match) {
      return (
        <strong key={i} className="text-zimx-gold">
          {match[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
