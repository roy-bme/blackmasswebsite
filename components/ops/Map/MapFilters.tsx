"use client";

type MapFiltersProps = {
  brendonCount: number;
  tafadzwaCount: number;
  candidateCount: number;
  showBrendon: boolean;
  showTafadzwa: boolean;
  showCandidates: boolean;
  onToggleBrendon: (next: boolean) => void;
  onToggleTafadzwa: (next: boolean) => void;
  onToggleCandidates: (next: boolean) => void;
};

function ToggleRow({ label, count, color, checked, onChange }: { label: string; count: number; color: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 border border-line-15 bg-ink-800/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label} ({count})</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function MapFilters(props: MapFiltersProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0" style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="flex min-w-max items-center gap-2 md:flex-wrap">
        <ToggleRow label="Brendon" count={props.brendonCount} color="#319B42" checked={props.showBrendon} onChange={props.onToggleBrendon} />
        <ToggleRow label="Tafadzwa" count={props.tafadzwaCount} color="#D4A843" checked={props.showTafadzwa} onChange={props.onToggleTafadzwa} />
        <ToggleRow label="Bot Candidates" count={props.candidateCount} color="#6B7A8D" checked={props.showCandidates} onChange={props.onToggleCandidates} />
      </div>
    </div>
  );
}
