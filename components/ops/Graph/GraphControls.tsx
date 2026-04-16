"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Button from "@/components/ops/ui/Button";
import { cn } from "@/lib/ops/cn";
import { getSectorTheme, type SectorKey } from "@/lib/ops/sector-colors";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GraphControlsProps = {
  sectors: SectorKey[];
  hiddenSectors: Set<SectorKey>;
  onToggleSector: (key: SectorKey) => void;
};

export default function GraphControls({
  sectors,
  hiddenSectors,
  onToggleSector,
}: GraphControlsProps) {
  const router = useRouter();
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDetect() {
    setDetecting(true);
    setError(null);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: rpcError } = await supabase.rpc(
      "detect_supply_chain_loops",
    );
    setDetecting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const count =
      typeof data === "number"
        ? data
        : Array.isArray(data)
          ? data.length
          : 0;
    setMessage(
      count === 0
        ? "No new loops detected."
        : `${count} loop${count === 1 ? "" : "s"} detected.`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {sectors.map((key) => {
            const theme = getSectorTheme(key);
            const hidden = hiddenSectors.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleSector(key)}
                aria-pressed={!hidden}
                className={cn(
                  "inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag transition-colors",
                  hidden
                    ? "border-zinc-200 bg-white text-zinc-400"
                    : "border-zinc-300 bg-white text-zimx-black hover:border-zimx-black",
                )}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5"
                  style={{
                    backgroundColor: hidden ? "#D4D4D8" : theme.hex,
                  }}
                />
                {theme.label}
              </button>
            );
          })}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleDetect}
          disabled={detecting}
        >
          {detecting ? "Detecting\u2026" : "Detect loops"}
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="font-mono text-[11px] uppercase tracking-tag text-zimx-green">
          {message}
        </p>
      ) : null}
    </div>
  );
}
