import { SECTOR_LIST } from "@/lib/ops/sector-colors";

export default function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-600">
      {SECTOR_LIST.filter((sector) => sector.key !== "contact").map((sector) => (
        <div key={sector.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: sector.hex }}
          />
          <span>{sector.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rotate-45 border-2 border-white"
          style={{ backgroundColor: "#D85A30" }}
        />
        <span>Intro contact</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full border-2 border-zimx-gold bg-zinc-300"
        />
        <span>Gold ring = Launch 6</span>
      </div>
    </div>
  );
}
