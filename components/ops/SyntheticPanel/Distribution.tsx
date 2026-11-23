import type { Dist } from "@/lib/ops/ssr";
import { fmtMean } from "@/lib/ops/ssr";

type Props = {
  dist: Dist | null;
  /** Adoption (A) in gold, price (B) in blue. One series per chart. */
  construct: "A" | "B";
  label?: string;
  compact?: boolean;
};

/**
 * 1–5 distribution as five thin bars on a shared baseline, with the mean as text.
 * Hover any bar for its share; the numbers are also in the screen-reader table.
 */
export default function Distribution({ dist, construct, label, compact }: Props) {
  if (!dist) {
    return <p className="font-mono text-[11px] text-fg-dim">{label ? `${label}: ` : ""}not asked</p>;
  }
  const max = Math.max(...dist.pmf, 0.0001);
  const h = compact ? 36 : 64;
  const fill = construct === "A" ? "bg-zimx-gold" : "bg-status-info";
  return (
    <figure className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        {label ? (
          <figcaption className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
            {label}
          </figcaption>
        ) : (
          <span />
        )}
        <span className="font-mono text-[12px] text-white">
          mean {fmtMean(dist.mean)}
          <span className="text-fg-dim"> · n={dist.n_records}</span>
        </span>
      </div>
      <div
        className="mt-2 flex items-end gap-[2px] border-b border-line-20"
        style={{ height: h }}
        aria-hidden="true"
      >
        {dist.pmf.map((p, i) => (
          <div
            key={i}
            className="group relative flex h-full flex-1 items-end"
            title={`${i + 1}: ${(p * 100).toFixed(1)}%`}
          >
            <div
              className={`w-full rounded-t-[4px] ${fill} opacity-90 group-hover:opacity-100`}
              style={{ height: `${Math.max((p / max) * 100, p > 0 ? 2 : 0)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[2px] font-mono text-[10px] text-fg-dim" aria-hidden="true">
        {dist.pmf.map((p, i) => (
          <span key={i} className="flex-1 text-center">
            {i + 1}
            {compact ? null : <span className="block text-fg-faint">{Math.round(p * 100)}%</span>}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{label ?? "distribution"}</caption>
        <tbody>
          {dist.pmf.map((p, i) => (
            <tr key={i}>
              <th scope="row">{i + 1}</th>
              <td>{(p * 100).toFixed(1)}%</td>
            </tr>
          ))}
          <tr>
            <th scope="row">mean</th>
            <td>{fmtMean(dist.mean)}</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}
