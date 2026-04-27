import Eyebrow from "@/components/ops/ui/Eyebrow";
import { PRIMARY_SECTORS, SECTOR_THEMES } from "@/lib/ops/sector-colors";

export default function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Eyebrow>legend</Eyebrow>
      {PRIMARY_SECTORS.map((key) => {
        const theme = SECTOR_THEMES[key];
        return (
          <div
            key={key}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute"
          >
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: theme.hex }}
            />
            <span>{theme.label}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rotate-45 bg-zimx-gold"
        />
        <span>Intro contact</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full border-2 border-zimx-gold bg-white/10"
        />
        <span>Gold ring · Launch 6</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
        <span
          aria-hidden="true"
          className="inline-block h-px w-3 border-t border-dashed border-white/40"
        />
        <span>Supply link</span>
      </div>
    </div>
  );
}
