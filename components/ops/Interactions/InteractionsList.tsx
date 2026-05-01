"use client";

import { useEffect, useState } from "react";

import Pill from "@/components/ops/ui/Pill";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Interaction = {
  id: string;
  type: "call" | "visit" | "whatsapp" | "email" | "other";
  outcome: string | null;
  created_at: string;
};

export default function InteractionsList({ businessId }: { businessId: string }) {
  const [items, setItems] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("interactions")
        .select("id, type, outcome, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!mounted) return;
      setItems((data ?? []) as Interaction[]);
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  if (loading) {
    return <div className="flex items-center gap-2 py-2 text-xs text-fg-mute"><span className="h-3 w-3 animate-spin rounded-full border border-line-15 border-t-zimx-gold" /> Loading interactions...</div>;
  }

  if (items.length === 0) {
    return <div className="py-2 text-xs text-fg-mute">No interactions logged yet.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2 text-xs text-fg-mute">
          <Pill size="sm">{item.type}</Pill>
          <div className="min-w-0 pt-0.5">
            <span className="text-white">{new Date(item.created_at).toLocaleDateString()}</span>
            <span> — {(item.outcome ?? "(no outcome)").slice(0, 80)}{(item.outcome ?? "").length > 80 ? "…" : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
