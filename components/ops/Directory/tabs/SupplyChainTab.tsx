"use client";

import { useEffect, useState } from "react";

import AddLinkDialog from "@/components/ops/Map/AddLinkDialog";
import type { MapBusiness } from "@/components/ops/Map/types";
import Button from "@/components/ops/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupplyChainLink } from "@/types/ops";

import type { DirectoryBusiness } from "../types";

type SupplyChainTabProps = {
  business: DirectoryBusiness;
  allBusinesses: DirectoryBusiness[];
  canEdit: boolean;
  currentUserId: string;
  onMutated: () => void;
};

type DirectionalLink = SupplyChainLink & {
  /** True when the current business is the supplier on this link. */
  isSupplier: boolean;
  counterpartyName: string;
};

export default function SupplyChainTab({
  business,
  allBusinesses,
  canEdit,
  currentUserId,
  onMutated,
}: SupplyChainTabProps) {
  const [links, setLinks] = useState<DirectionalLink[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from("supply_chain_links")
        .select("*")
        .or(`supplier_id.eq.${business.id},buyer_id.eq.${business.id}`)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      const nameById = new Map(allBusinesses.map((b) => [b.id, b.name]));
      const directional: DirectionalLink[] = (
        (data ?? []) as SupplyChainLink[]
      ).map((link) => {
        const isSupplier = link.supplier_id === business.id;
        const counterpartyId = isSupplier ? link.buyer_id : link.supplier_id;
        return {
          ...link,
          isSupplier,
          counterpartyName:
            (counterpartyId && nameById.get(counterpartyId)) ?? "Unknown",
        };
      });
      setLinks(directional);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [business.id, allBusinesses]);

  const mapBusinesses: MapBusiness[] = allBusinesses.map((b) => ({
    id: b.id,
    name: b.name,
    sector: b.sector,
    zone_id: b.zone_id,
    lat: Number(b.lat),
    lng: Number(b.lng),
    est_monthly_volume:
      b.est_monthly_volume != null ? Number(b.est_monthly_volume) : null,
    launch_6: b.launch_6,
    notes: b.notes,
  }));

  function handleClose() {
    setAddOpen(false);
    onMutated();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-zinc-500">Loading supply links…</p>
      ) : !links || links.length === 0 ? (
        <p className="text-[13px] text-zinc-500">
          No supply chain links recorded yet.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 border border-zinc-200 bg-white">
          {links.map((link) => (
            <li key={link.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-[14px] text-zimx-black">
                <span className="font-medium">
                  {link.isSupplier ? business.name : link.counterpartyName}
                </span>
                <span className="text-zinc-400">{"\u2192"}</span>
                <span className="font-medium">
                  {link.isSupplier ? link.counterpartyName : business.name}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                {link.product ?? "Product n/a"}
                {link.est_monthly_volume != null
                  ? ` \u00B7 $${Number(link.est_monthly_volume).toLocaleString()}/mo`
                  : ""}
                {link.payment_method
                  ? ` \u00B7 ${link.payment_method}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAddOpen(true)}
          >
            Log new link
          </Button>
        </div>
      ) : null}

      <AddLinkDialog
        open={addOpen}
        onClose={handleClose}
        businesses={mapBusinesses}
        currentUserId={currentUserId}
      />
    </div>
  );
}
