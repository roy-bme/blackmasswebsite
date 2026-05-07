"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AddBusinessDialog from "@/components/ops/Map/AddBusinessDialog";
import PageHeader from "@/components/ops/PageHeader";
import Button from "@/components/ops/ui/Button";
import Card from "@/components/ops/ui/Card";
import EmptyState from "@/components/ops/ui/EmptyState";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import Input from "@/components/ops/ui/Input";
import Pill from "@/components/ops/ui/Pill";
import SectorChip from "@/components/ops/ui/SectorChip";
import Textarea from "@/components/ops/ui/Textarea";
import InteractionsList from "@/components/ops/Interactions/InteractionsList";
import LogInteractionModal from "@/components/ops/Interactions/LogInteractionModal";
import { useToast } from "@/components/ui/Toast";
import { opsApiPost } from "@/lib/ops/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSectorHex } from "@/lib/ops/sector-colors";
import type { BusinessStage, DiscoveryCandidate, UserRole } from "@/types/ops";

const LANES: Array<{ id: BusinessStage | "suggested"; label: string; isAgent?: boolean }> = [
  { id: "suggested", label: "Suggested", isAgent: true },
  { id: "identified", label: "Identified" },
  { id: "intel_gathered", label: "Intel Gathered" },
  { id: "intro_made", label: "Intro Made" },
  { id: "meeting_set", label: "Meeting Set" },
  { id: "meeting_done", label: "Meeting Done" },
  { id: "loi_signed", label: "LOI Signed" },
  { id: "onboarded", label: "Onboarded" },
];

const STAGE_ORDER = ["identified", "intel_gathered", "intro_made", "meeting_set", "meeting_done", "loi_signed", "onboarded"] as const;

type BizLite = {
  id: string; name: string; sector: string; onboarding_stage: BusinessStage; address: string | null;
  zone_id: string | null; est_monthly_volume: number | null; notes: string | null; mapped_by: string | null; created_at: string;
  decision_maker_name: string | null; decision_maker_title: string | null; phone: string | null; email: string | null; linkedin: string | null;
  key_suppliers: string[] | null; key_customers: string[] | null; pain_points: string[] | null; zimx_fit_score: number | null;
};

const COMPLETENESS_FIELDS: Array<keyof BizLite> = [
  "decision_maker_name",
  "phone",
  "est_monthly_volume",
  "key_suppliers",
  "key_customers",
  "pain_points",
  "zone_id",
];

function getCompleteness(b: BizLite) {
  const filled = COMPLETENESS_FIELDS.reduce((count, field) => {
    const value = b[field];
    if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
    return count + (value ? 1 : 0);
  }, 0);
  const total = COMPLETENESS_FIELDS.length;
  return { filled, total, percent: Math.round((filled / total) * 100) };
}

export default function DirectoryClient({ suggested, zones, users, role }: { suggested: DiscoveryCandidate[]; zones: Array<{id:string;name:string;centre_lat:number|null;centre_lng:number|null}>; users: Array<{id:string;name:string}>; role: UserRole; }) {
  const router = useRouter();
  const toast = useToast();
  const [businesses, setBusinesses] = useState<BizLite[]>([]);
  const [zoneLookup, setZoneLookup] = useState<Record<string, string>>({});
  const [zoneOptions, setZoneOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [distinctSectors, setDistinctSectors] = useState<string[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [selected, setSelected] = useState<BizLite | null>(null);
  const [editing, setEditing] = useState(false);
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [form, setForm] = useState({
    name: "", sector: "", notes: "", est_monthly_volume: "", zone_id: "",
    decision_maker_name: "", decision_maker_title: "", phone: "", email: "", linkedin: "",
    key_suppliers: "", key_customers: "", pain_points: "", zimx_fit_score: "",
  });


  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    async function loadBusinesses() {
      setIsLoadingBusinesses(true);
      const [{ data: businessData }, { data: zonesData }, { data: sectorData }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, sector, onboarding_stage, address, zone_id, est_monthly_volume, notes, mapped_by, created_at, decision_maker_name, decision_maker_title, phone, email, linkedin, key_suppliers, key_customers, pain_points, zimx_fit_score")
          .order("name"),
        supabase.from("zones").select("id, name").order("name"),
        supabase.from("businesses").select("sector").not("sector", "is", null),
      ]);

      const loadedBusinesses = (businessData ?? []) as BizLite[];
      const loadedZones = zonesData ?? [];
      const zoneMap = Object.fromEntries(loadedZones.map((zone) => [zone.id, zone.name]));
      const occupiedZoneIds = new Set(loadedBusinesses.map((biz) => biz.zone_id).filter((id): id is string => Boolean(id)));

      setBusinesses(loadedBusinesses);
      setZoneLookup(zoneMap);
      setZoneOptions(loadedZones);
      setDistinctSectors(Array.from(new Set((sectorData ?? []).map((row) => row.sector).filter((sector): sector is string => Boolean(sector)))).sort());
      setIsLoadingBusinesses(false);
    }
    void loadBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => businesses
    .filter((b) => !sectorFilter || b.sector === sectorFilter)
    .filter((b) => !zoneFilter || b.zone_id === zoneFilter), [businesses, sectorFilter, zoneFilter]);


  const byLane = useMemo(() => {
    const map = new Map<string, BizLite[]>();
    for (const b of filteredBusinesses) {
      const arr = map.get(b.onboarding_stage) ?? [];
      arr.push(b);
      map.set(b.onboarding_stage, arr);
    }
    return map;
  }, [filteredBusinesses]);

  const onboarded = byLane.get("onboarded")?.length ?? 0;
  const stageLabelMap = useMemo(() => Object.fromEntries(LANES.filter((lane) => lane.id !== "suggested").map((lane) => [lane.id, lane.label])) as Record<BusinessStage, string>, []);
  const mobileSortedBusinesses = useMemo(() => [...filteredBusinesses].sort((a, b) => {
    const stageDiff = STAGE_ORDER.indexOf(b.onboarding_stage) - STAGE_ORDER.indexOf(a.onboarding_stage);
    if (stageDiff !== 0) return stageDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [filteredBusinesses]);


  const canDrag = role !== "bd";
  async function handleDrop(businessId: string, newStage: string) {
    if (!STAGE_ORDER.includes(newStage as BizLite["onboarding_stage"])) return;

    const business = businesses.find((b) => b.id === businessId);
    if (!business || business.onboarding_stage === newStage) return;
    const previousStage = business.onboarding_stage;

    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, onboarding_stage: newStage as BizLite["onboarding_stage"] } : b)));

    const res = await fetch("/api/ops/businesses/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: businessId, patch: { onboarding_stage: newStage } }),
    });

    if (!res.ok) {
      setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, onboarding_stage: previousStage } : b)));
      toast.error("Could not update stage. Try again.");
    }
  }

  function openPanel(b: BizLite) {
    setSelected(b);
    setEditing(false);
    setForm({
      name: b.name,
      sector: b.sector,
      notes: b.notes ?? "",
      est_monthly_volume: b.est_monthly_volume?.toString() ?? "",
      zone_id: b.zone_id ?? "",
      decision_maker_name: b.decision_maker_name ?? "",
      decision_maker_title: b.decision_maker_title ?? "",
      phone: b.phone ?? "",
      email: b.email ?? "",
      linkedin: b.linkedin ?? "",
      key_suppliers: b.key_suppliers?.join(", ") ?? "",
      key_customers: b.key_customers?.join(", ") ?? "",
      pain_points: b.pain_points?.join(", ") ?? "",
      zimx_fit_score: b.zimx_fit_score?.toString() ?? "",
    });
  }

  async function promoteBusiness(b: BizLite) {
    const idx = STAGE_ORDER.indexOf(b.onboarding_stage);
    if (idx < 0 || idx === STAGE_ORDER.length - 1) return;
    const next = STAGE_ORDER[idx + 1];
    setBusinesses((prev) => prev.map((item) => item.id === b.id ? { ...item, onboarding_stage: next } : item));
    const res = await opsApiPost("/api/ops/businesses/update", { id: b.id, patch: { onboarding_stage: next } });
    if (!res.ok) {
      setBusinesses((prev) => prev.map((item) => item.id === b.id ? { ...item, onboarding_stage: b.onboarding_stage } : item));
      toast.error("Promote failed. Please retry.");
    }
  }

  async function saveDetails() {
    if (!selected) return;
    const patch = {
      name: form.name.trim(),
      sector: form.sector,
      notes: form.notes.trim() || null,
      est_monthly_volume: form.est_monthly_volume ? Number(form.est_monthly_volume) : null,
      zone_id: form.zone_id || null,
      decision_maker_name: form.decision_maker_name.trim() || null,
      decision_maker_title: form.decision_maker_title.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      linkedin: form.linkedin.trim() || null,
      key_suppliers: form.key_suppliers.split(",").map((s) => s.trim()).filter(Boolean),
      key_customers: form.key_customers.split(",").map((s) => s.trim()).filter(Boolean),
      pain_points: form.pain_points.split(",").map((s) => s.trim()).filter(Boolean),
      zimx_fit_score: form.zimx_fit_score ? Math.min(100, Math.max(0, Number(form.zimx_fit_score))) : null,
    };
    const res = await opsApiPost("/api/ops/businesses/update", { id: selected.id, patch });
    if (!res.ok) {
      toast.error("Save failed. Try again.");
      return;
    }
    setBusinesses((prev) => prev.map((b) => b.id === selected.id ? { ...b, ...patch } as BizLite : b));
    setSelected((prev) => prev ? ({ ...prev, ...patch } as BizLite) : prev);
    setEditing(false);
    toast.success("Saved.");
    router.refresh();
  }

  return (<div>
    <PageHeader eyebrow="indaba · directory · pipeline" title={`${filteredBusinesses.length} businesses`} caption={`Showing ${filteredBusinesses.length} businesses · + ${suggested.length} suggested · ${onboarded} onboarded`} actions={<>
      {distinctSectors.map((s) => <SectorChip key={s} sector={s} active={sectorFilter === s} onClick={() => setSectorFilter((prev) => prev === s ? null : s)} />)}
      <select className="rounded-md border border-line-15 bg-ink-800 px-2 py-1 text-xs text-white" value={zoneFilter ?? ""} onChange={(e) => setZoneFilter(e.target.value || null)}>
        <option value="">All zones</option>
        {zoneOptions.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
      </select>
      <button className="text-xs text-fg-mute underline" onClick={() => { setSectorFilter(null); setZoneFilter(null); }}>Clear filters</button>
      <Button variant="primary" size="sm" onClick={() => setShowAddDialog(true)}>+ Add</Button>
    </>} />

    <div className="block md:hidden px-4 pb-24">
      <div className="max-h-[calc(100vh-220px)] space-y-2 overflow-y-auto pr-1">
        {isLoadingBusinesses ? Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-md border border-line-10 bg-ink-800 p-3">
            <div className="h-4 w-2/3 rounded bg-ink-700" />
            <div className="mt-2 h-3 w-1/2 rounded bg-ink-700" />
            <div className="mt-2 h-3 w-1/3 rounded bg-ink-700" />
          </div>
        )) : null}
        {!isLoadingBusinesses && mobileSortedBusinesses.length === 0 ? <EmptyState title="No businesses match your filters." /> : null}
        {!isLoadingBusinesses ? mobileSortedBusinesses.map((b) => (
          <button key={b.id} type="button" onClick={() => openPanel(b)} className="w-full rounded-md border border-line-10 bg-ink-800 p-3 text-left">
            <div className="text-sm font-medium text-white">{b.name}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-mute">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: getSectorHex(b.sector as any) }} />{b.sector}</span>
              <Pill size="sm">{stageLabelMap[b.onboarding_stage] ?? b.onboarding_stage}</Pill>
            </div>
            <div className="mt-2 text-xs text-fg-mute">{b.zone_id ? (zoneLookup[b.zone_id] ?? "Unassigned") : "Unassigned"}</div>
            {b.est_monthly_volume ? <div className="mt-1 text-xs text-fg-mute">${b.est_monthly_volume.toLocaleString()}/mo</div> : null}
            <CompletenessBar business={b} className="mt-2" />
          </button>
        )) : null}
      </div>
      <Button variant="primary" className="fixed bottom-4 right-4 z-30" onClick={() => setShowAddDialog(true)}>+ Add Business</Button>
    </div>

    <div className="hidden md:block"><div className="indaba-thin-scroll overflow-x-auto px-6 py-4"><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${LANES.length}, 230px)` }}>{LANES.map((lane)=>{const items=lane.id==="suggested"?[]:byLane.get(lane.id)??[];const candidateItems=lane.id==="suggested"?suggested:[];const total=items.length+candidateItems.length;return <div key={lane.id} className={`flex min-h-[480px] flex-col border ${lane.isAgent?"border-zimx-gold/35 bg-zimx-gold/[0.04]":"border-line-10 bg-ink-800"}`}><div className="flex items-center justify-between border-b border-line-10 px-3 py-2.5"><span className={`font-mono text-[10px] uppercase tracking-eyebrow ${lane.isAgent?"text-zimx-gold":"text-white"}`}>{lane.label}</span><span className="font-mono text-[10px] text-fg-dim">{total}</span></div><div id={lane.id} className="indaba-thin-scroll flex-1 overflow-y-auto p-2" onDragOver={lane.id !== "suggested" ? (e)=>e.preventDefault() : undefined} onDrop={lane.id !== "suggested" ? (e)=>{e.preventDefault();const businessId=e.dataTransfer.getData("businessId");if(businessId){void handleDrop(businessId,lane.id);}} : undefined}>{candidateItems.map((c)=><SuggestedCard key={c.id} c={c} />)}{lane.id !== "suggested" ? items.map((b)=><BizCard key={b.id} b={b} onClick={()=>openPanel(b)} onPromote={()=>promoteBusiness(b)} canDrag={canDrag} laneId={lane.id} />) : null}{total===0?<div className="border border-dashed border-line-15 p-3 text-[11px] leading-relaxed text-fg-mute">Empty. Move one when ready.</div>:null}</div></div>;})}</div></div></div>

    {showAddDialog ? <AddBusinessDialog open={showAddDialog} onClose={()=>setShowAddDialog(false)} zones={zones} coords={{lat:-20.1325,lng:28.6261}} quickAddMode={false} lastSector={distinctSectors[0] ?? "Agriculture"} onSaved={()=>{setShowAddDialog(false);router.refresh();}} /> : null}

    {selected ? <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line-10 bg-ink-900 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-white">Business details</h3><Button size="sm" variant="ghost" onClick={()=>setSelected(null)}>Close</Button></div><CompletenessBar business={selected} className="mb-4" /><div className="space-y-3 text-sm text-fg-mute"><Field label="Name" value={editing ? <Input name="name" value={form.name} onChange={(e)=>setForm((p)=>({...p,name:e.target.value}))} /> : selected.name} /><Field label="Sector" value={editing ? <Input name="sector" value={form.sector} onChange={(e)=>setForm((p)=>({...p,sector:e.target.value}))} /> : selected.sector} /><Field label="Contact — Decision maker" value={editing ? <Input name="decision_maker_name" value={form.decision_maker_name} onChange={(e)=>setForm((p)=>({...p,decision_maker_name:e.target.value}))} /> : (selected.decision_maker_name ?? "—")} /><Field label="Contact — Title / role" value={editing ? <Input name="decision_maker_title" value={form.decision_maker_title} onChange={(e)=>setForm((p)=>({...p,decision_maker_title:e.target.value}))} /> : (selected.decision_maker_title ?? "—")} /><Field label="Contact — Phone" value={editing ? <Input type="tel" name="phone" value={form.phone} onChange={(e)=>setForm((p)=>({...p,phone:e.target.value}))} /> : (selected.phone ?? "—")} /><Field label="Contact — Email" value={editing ? <Input type="email" name="email" value={form.email} onChange={(e)=>setForm((p)=>({...p,email:e.target.value}))} /> : (selected.email ?? "—")} /><Field label="Contact — LinkedIn" value={editing ? <Input type="url" name="linkedin" value={form.linkedin} onChange={(e)=>setForm((p)=>({...p,linkedin:e.target.value}))} /> : (selected.linkedin ?? "—")} /><Field label="Zone" value={editing ? <select className="w-full rounded-md border border-line-15 bg-ink-800 px-3 py-2 text-sm text-white" value={form.zone_id} onChange={(e)=>setForm((p)=>({...p,zone_id:e.target.value}))}><option value="">Unassigned</option>{zoneOptions.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select> : ((selected.zone_id ? zoneLookup[selected.zone_id] : null) ?? "—")} /><Field label="Stage" value={selected.onboarding_stage} /><Field label="Est. monthly volume" value={editing ? <Input name="est_monthly_volume" value={form.est_monthly_volume} onChange={(e)=>setForm((p)=>({...p,est_monthly_volume:e.target.value}))} /> : (selected.est_monthly_volume?.toString() ?? "—")} /><Field label="ZIMX fit score" value={editing ? <Input type="number" min={0} max={100} name="zimx_fit_score" value={form.zimx_fit_score} onChange={(e)=>setForm((p)=>({...p,zimx_fit_score:e.target.value}))} /> : (selected.zimx_fit_score === null ? "—" : <Pill tone={fitTone(selected.zimx_fit_score)}>{selected.zimx_fit_score}</Pill>)} /><Field label="Key suppliers" value={editing ? <Input name="key_suppliers" value={form.key_suppliers} onChange={(e)=>setForm((p)=>({...p,key_suppliers:e.target.value}))} /> : (selected.key_suppliers?.length ? <div className="flex flex-wrap gap-1.5">{selected.key_suppliers.map((item) => <Pill key={item} size="sm">{item}</Pill>)}</div> : "—")} /><Field label="Key customers" value={editing ? <Input name="key_customers" value={form.key_customers} onChange={(e)=>setForm((p)=>({...p,key_customers:e.target.value}))} /> : (selected.key_customers?.length ? <div className="flex flex-wrap gap-1.5">{selected.key_customers.map((item) => <Pill key={item} size="sm">{item}</Pill>)}</div> : "—")} /><Field label="Pain points" value={editing ? <Input name="pain_points" value={form.pain_points} onChange={(e)=>setForm((p)=>({...p,pain_points:e.target.value}))} /> : (selected.pain_points?.length ? <div className="flex flex-wrap gap-1.5">{selected.pain_points.map((item) => <Pill key={item} size="sm" tone="warn">{item}</Pill>)}</div> : "—")} /><Field label="Notes" value={editing ? <Textarea name="notes" value={form.notes} onChange={(e)=>setForm((p)=>({...p,notes:e.target.value}))} rows={4} /> : (selected.notes ?? "—")} /><Field label="Mapped by" value={users.find((u)=>u.id===selected.mapped_by)?.name ?? "—"} /><Field label="Created" value={new Date(selected.created_at).toLocaleString()} /></div><div className="mt-4">
      <Button size="sm" variant="ghost" onClick={()=>setShowLogInteraction(true)}>+ Log Interaction</Button>
      <div className="mt-3">
        <InteractionsList businessId={selected.id} />
      </div>
    </div>{role !== "bd" ? <div className="mt-4 flex gap-2">{editing ? <><Button size="sm" variant="primary" onClick={saveDetails}>Save</Button><Button size="sm" variant="ghost" onClick={()=>setEditing(false)}>Cancel</Button></> : <Button size="sm" variant="primary" onClick={()=>setEditing(true)}>Edit</Button>}</div> : null}</div> : null}
    {selected && showLogInteraction ? <LogInteractionModal businessId={selected.id} businessName={selected.name} onClose={() => setShowLogInteraction(false)} onSaved={() => router.refresh()} /> : null}
  </div>);
}

function Field({label, value}:{label:string; value:React.ReactNode}) { return <div><div className="font-mono text-[10px] uppercase tracking-eyebrow">{label}</div><div className="mt-1 text-white">{value}</div></div>; }

function BizCard({ b, onClick, onPromote, canDrag, laneId }: { b: BizLite; onClick: () => void; onPromote: () => void; canDrag: boolean; laneId: BusinessStage | "suggested" }) {
  const sectorHex = getSectorHex(b.sector as any);
  return <Card draggable={canDrag && laneId !== "suggested"} onDragStart={canDrag && laneId !== "suggested" ? (e)=>{e.dataTransfer.setData("businessId", b.id);e.currentTarget.style.opacity="0.5";} : undefined} onDragEnd={canDrag && laneId !== "suggested" ? (e)=>{e.currentTarget.style.opacity="1";} : undefined} className={`mb-1.5 cursor-pointer border border-line-10 bg-ink-700 p-2.5 ${canDrag && laneId !== "suggested" ? "cursor-grab" : ""}`} style={{ borderLeft: `2px solid ${sectorHex}` }} onClick={onClick}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[13px] font-medium leading-snug text-white">{b.name}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-fg-mute">{b.sector} · {b.address ?? "—"}</div></div></div><div className="mt-2 flex justify-end"><Button variant="primary" size="sm" className="text-[9px]" disabled={b.onboarding_stage === "onboarded"} onClick={(e)=>{e.stopPropagation();onPromote();}}>Promote</Button></div></Card>;
}

function SuggestedCard({ c }: { c: DiscoveryCandidate }) { return <div className="mb-1.5 border border-zimx-gold/25 bg-ink-700 p-2.5" style={{ borderLeft: `2px solid ${getSectorHex(c.sector ?? "manufacturing")}` }}><div className="text-[13px] font-medium leading-snug text-white">{c.name}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-fg-mute">agent · {c.source}</div></div>; }
function CompletenessBar({ business, className = "" }: { business: BizLite; className?: string }) {
  const completeness = getCompleteness(business);
  return <div className={className}>
    <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-eyebrow text-fg-mute">
      <span>Data completeness</span>
      <span>{completeness.percent}% ({completeness.filled}/{completeness.total})</span>
    </div>
    <div className="h-1.5 w-full rounded bg-ink-700">
      <div className="h-1.5 rounded bg-zimx-gold" style={{ width: `${completeness.percent}%` }} />
    </div>
  </div>;
}
  function fitTone(score: number | null): "neutral" | "warn" | "gold" {
    if (score === null) return "neutral";
    if (score <= 40) return "neutral";
    if (score <= 70) return "warn";
    return "gold";
  }
