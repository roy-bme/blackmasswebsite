"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import CreateIntroModal from "@/components/ops/Intros/CreateIntroModal";
import IntroNotesModal from "@/components/ops/Intros/IntroNotesModal";
import PageHeader from "@/components/ops/PageHeader";
import Button from "@/components/ops/ui/Button";
import Card from "@/components/ops/ui/Card";
import EmptyState from "@/components/ops/ui/EmptyState";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import Pill from "@/components/ops/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { opsApiPost } from "@/lib/ops/api-client";
import type { Introduction } from "@/types/ops";

export default function IntrosClient({ intros, isAdmin, selectedId }: { intros: Introduction[]; isAdmin: boolean; selectedId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const pending = intros.filter((i) => !i.roy_approved).length;
  const approved = intros.length - pending;
  const selected = useMemo(() => intros.find((i) => i.id === selectedId) ?? intros.find((i) => !i.roy_approved) ?? intros[0] ?? null, [intros, selectedId]);

  async function updateStatus(status: "approved" | "declined") {
    if (!selected) return;
    setSavingStatus(true);
    const res = await opsApiPost("/api/ops/introductions/update", { id: selected.id, status });
    setSavingStatus(false);
    if (!res.ok) {
      toast.error(status === "approved" ? "Could not approve intro. Try again." : "Could not decline intro. Try again.");
      return;
    }
    toast.success(status === "approved" ? "Intro approved." : "Intro declined.");
    router.refresh();
  }

  return <div><PageHeader eyebrow={`introductions · ${pending} awaiting${isAdmin ? " your" : ""} approval`} title="intros pipeline" actions={<><Pill tone="gold">All · {intros.length}</Pill><Pill>Pending · {pending}</Pill><Pill>Approved · {approved}</Pill><Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ New intro</Button></>} />

      <div className="grid gap-4 px-4 py-4 md:px-6 md:py-5 lg:grid-cols-[1fr_460px]">
        <div className="grid gap-2 md:grid-cols-2">{intros.length === 0 ? <EmptyState title="No introductions yet." description="BD adds intros after first contact. Roy approves them here." className="md:col-span-2" /> : intros.map((it) => <a key={it.id} href={`/indaba/intros?id=${it.id}`} className={`block border bg-ink-800 p-4 transition-colors hover:bg-ink-700 ${selected?.id === it.id ? "border-zimx-gold" : "border-line-10"}`}><div className="flex items-start justify-between"><div><div className="text-[15px] font-medium text-white">{it.contact_name}</div><div className="mt-1 text-[12px] text-fg-mute">{it.role ?? "—"}{it.business ? ` · ${it.business}` : ""}</div></div><Pill tone={it.roy_approved ? "ok" : "warn"}>{it.roy_approved ? "approved" : "pending"}</Pill></div><div className="mt-3 flex items-center justify-between border-t border-line-10 pt-3"><span className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">biz · {it.business ?? "—"}</span><Pill tone={it.warmth === "warm" ? "gold" : "neutral"}>{it.warmth}</Pill></div></a>)}</div>

        {selected ? <Card padding="lg" className="lg:sticky lg:top-20 lg:h-fit"><Eyebrow gold>{selected.roy_approved ? "approved" : "selected · pending approval"}</Eyebrow><h2 className="mt-2 text-[24px] font-light tracking-tight">{selected.contact_name}</h2><div className="text-[12px] text-fg-mute">{selected.role ?? "—"} {selected.business ? ` · ${selected.business}` : ""}</div><div className="mt-3 flex flex-wrap gap-1.5"><Pill tone="gold">{selected.warmth}</Pill>{selected.cross_border ? <Pill>cross-border</Pill> : null}{selected.how_connected ? <Pill>via · {selected.how_connected.slice(0, 22)}</Pill> : null}</div>{selected.pain_points_identified?.length ? <div className="mt-5"><Eyebrow className="mb-2">pain points</Eyebrow><p className="text-[13px] leading-relaxed text-fg-mute">{selected.pain_points_identified.join(" · ")}</p></div> : null}{selected.recommended_action ? <div className="mt-4"><Eyebrow className="mb-2">recommended action</Eyebrow><p className="text-[13px] leading-relaxed text-fg-mute">{selected.recommended_action}</p></div> : null}{selected.notes ? <div className="mt-4"><Eyebrow className="mb-2">notes</Eyebrow><p className="whitespace-pre-line text-[13px] leading-relaxed text-fg-mute">{selected.notes}</p></div> : null}<div className="mt-6 flex items-center gap-2 border-t border-line-10 pt-4">{isAdmin && !selected.roy_approved ? <Button variant="primary" onClick={() => updateStatus("approved")} disabled={savingStatus}>Approve (Roy)</Button> : null}<Button variant="ghost" onClick={() => setShowNotes(true)}>{selected.notes ? "Edit notes" : "Add notes"}</Button><Button variant="bare" className="ml-auto text-status-bad" onClick={() => updateStatus("declined")} disabled={savingStatus}>Decline</Button></div></Card> : null}
      </div>

      {showCreate ? <CreateIntroModal onClose={() => setShowCreate(false)} onSaved={() => router.refresh()} /> : null}
      {showNotes && selected ? <IntroNotesModal introId={selected.id} initialNotes={selected.notes} onClose={() => setShowNotes(false)} onSaved={() => router.refresh()} /> : null}
    </div>;
}
