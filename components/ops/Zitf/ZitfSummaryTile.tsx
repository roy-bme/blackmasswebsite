import Card from "@/components/ops/ui/Card";
import Pill from "@/components/ops/ui/Pill";
import { cn } from "@/lib/ops/cn";
import type { ZitfOpsSummary } from "@/types/zitf";

type ZitfSummaryTileProps = {
  summary: ZitfOpsSummary | null;
};

/**
 * Compact dashboard tile driven by `v_zitf_ops_summary`. Shows the headline
 * count, a digital/paper split bar, a priority-followup chip, the last-24h
 * count, and a link into the full list view.
 *
 * Renders a "no data yet" variant when the view returns null (e.g. first
 * session before the table ships).
 */
export default function ZitfSummaryTile({ summary }: ZitfSummaryTileProps) {
  if (!summary) {
    return (
      <Card padding="none">
        <Card.Header>
          <div>
            <Card.Title>ZITF 2026</Card.Title>
            <Card.Description>Stand intake pipeline</Card.Description>
          </div>
          <a
            href="/indaba/zitf"
            className="font-mono text-[11px] uppercase tracking-tag text-zinc-500 hover:text-zimx-black"
          >
            View all →
          </a>
        </Card.Header>
        <Card.Body>
          <p className="text-[13px] text-zinc-500">
            No responses yet. The tile lights up once the first submission lands.
          </p>
        </Card.Body>
      </Card>
    );
  }

  const {
    total_responses,
    digital_submissions,
    paper_collected,
    priority_followups,
    qualified_count,
    contacted_count,
    avg_score,
    last_24h,
  } = summary;

  const splitTotal = Math.max(1, digital_submissions + paper_collected);
  const digitalPct = (digital_submissions / splitTotal) * 100;

  return (
    <Card padding="none">
      <Card.Header>
        <div className="min-w-0">
          <Card.Title>ZITF 2026</Card.Title>
          <Card.Description>Stand intake pipeline</Card.Description>
        </div>
        <a
          href="/indaba/zitf"
          className="font-mono text-[11px] uppercase tracking-tag text-zinc-500 hover:text-zimx-black"
        >
          View all →
        </a>
      </Card.Header>

      <Card.Body className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
              Total responses
            </p>
            <p className="mt-1 text-[32px] font-semibold leading-none text-zimx-black">
              {total_responses.toLocaleString()}
            </p>
          </div>
          <Pill tone="success" size="md">
            {priority_followups} priority
          </Pill>
        </div>

        <div>
          <div className="flex justify-between font-mono text-[11px] uppercase tracking-tag text-zinc-500">
            <span>Digital {digital_submissions}</span>
            <span>Paper {paper_collected}</span>
          </div>
          <div
            className="mt-1.5 flex h-1.5 w-full overflow-hidden bg-zinc-100"
            aria-hidden="true"
          >
            <div
              className="h-full bg-zimx-black"
              style={{ width: `${digitalPct}%` }}
            />
            <div
              className={cn("h-full bg-zimx-gold", digitalPct === 100 && "hidden")}
              style={{ width: `${100 - digitalPct}%` }}
            />
          </div>
        </div>

        <dl className="grid grid-cols-4 gap-3 border-t border-zinc-200 pt-4">
          <StatBlock label="Last 24h" value={last_24h.toString()} />
          <StatBlock label="Qualified" value={qualified_count.toString()} />
          <StatBlock label="Contacted" value={contacted_count.toString()} />
          <StatBlock
            label="Avg score"
            value={avg_score === null ? "—" : Math.round(avg_score).toString()}
          />
        </dl>
      </Card.Body>
    </Card>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-tag text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-[18px] font-semibold leading-none text-zimx-black">
        {value}
      </dd>
    </div>
  );
}
