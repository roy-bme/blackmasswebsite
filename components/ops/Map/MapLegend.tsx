import Eyebrow from "@/components/ops/ui/Eyebrow";

export default function MapLegend() {
  return (
    <div className="inline-flex flex-col gap-2 border border-line-15 bg-ink-900/80 px-3 py-2">
      <Eyebrow>legend</Eyebrow>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#319B42]" /> Brendon (Ground Ops)</div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D4A843]" /> Tafadzwa (BD)</div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed border-[#6B7A8D]" /> Bot Discovery</div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-zimx-gold bg-white/10" /> Launch 6 ring</div>
    </div>
  );
}
