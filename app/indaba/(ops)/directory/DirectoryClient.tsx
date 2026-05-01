"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  id: string; name: string; sector: string; onboarding_stage: BusinessStage; launch_6: boolean; address: string | null;
  zone_id: string | null; est_monthly_volume: number | null; notes: string | null; mapped_by: string | null; created_at: string;
};

export default function DirectoryClient({ suggested, zones, users, role }: { suggested: DiscoveryCandidate[]; zones: Array<{id:string;name:string;centre_lat:number|null;centre_lng:number|null}>; users: Array<{id:string;name:string}>; role: UserRole; }) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BizLite[]>([]);
  const [zoneLookup, setZoneLookup] = useState<Record<string, string>>({});
  const [zoneOptions, setZoneOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [distinctSectors, setDistinctSectors] = useState<string[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [launch6Only, setLaunch6Only] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selected, setSelected] = useState<BizLite | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", sector: "", notes: "", est_monthly_volume: "" });


  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    async function loadBusinesses() {
      const [{ data: businessData }, { data: zonesData }, { data: sectorData }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, sector, onboarding_stage, launch_6, address, zone_id, est_monthly_volume, notes, mapped_by, created_at")
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
      setZoneOptions(loadedZones.filter((zone) => occupiedZoneIds.has(zone.id)));
      setDistinctSectors(Array.from(new Set((sectorData ?? []).map((row) => row.sector).filter((sector): sector is string => Boolean(sector)))).sort());
    }
    void loadBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => businesses
    .filter((b) => !sectorFilter || b.sector === sectorFilter)
    .filter((b) => !zoneFilter || b.zone_id === zoneFilter)
    .filter((b) => !launch6Only || b.launch_6 === true), [businesses, sectorFilter, zoneFilter, launch6Only]);


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


  const canDrag = role !== "bd";
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const businessId = active.id as string;
    const newStage = over.id as string;

    if (!STAGE_ORDER.includes(newStage as BizLite["onboarding_stage"])) return;

    const previousStage = businesses.find((b) => b.id === businessId)?.onboarding_stage;
    if (!previousStage || previousStage === newStage) return;

    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, onboarding_stage: newStage as BizLite["onboarding_stage"] } : b)));

    const res = await fetch("/api/ops/businesses/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: businessId, onboarding_stage: newStage }),
    });

    if (!res.ok) {
      setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, onboarding_stage: previousStage } : b)));
      alert("Could not update stage. Try again.");
    }
  }

  function openPanel(b: BizLite) {
    setSelected(b);
    setEditing(false);
    setForm({ name: b.name, sector: b.sector, notes: b.notes ?? "", est_monthly_volume: b.est_monthly_volume?.toString() ?? "" });
  }

  async function promoteBusiness(b: BizLite) {
    const idx = STAGE_ORDER.indexOf(b.onboarding_stage);
    if (idx < 0 || idx === STAGE_ORDER.length - 1) return;
    const next = STAGE_ORDER[idx + 1];
    setBusinesses((prev) => prev.map((item) => item.id === b.id ? { ...item, onboarding_stage: next } : item));
    const res = await opsApiPost("/api/ops/businesses/update", { id: b.id, onboarding_stage: next });
    if (!res.ok) {
      setBusinesses((prev) => prev.map((item) => item.id === b.id ? { ...item, onboarding_stage: b.onboarding_stage } : item));
      alert("Promote failed. Please retry.");
    }
  }

  async function saveDetails() {
    if (!selected) return;
    const patch = {
      name: form.name.trim(),
      sector: form.sector,
      notes: form.notes.trim() || null,
      est_monthly_volume: form.est_monthly_volume ? Number(form.est_monthly_volume) : null,
    };
    const res = await opsApiPost("/api/ops/businesses/update", { id: selected.id, patch });
    if (!res.ok) {
      alert("Save failed.");
      return;
    }
    setBusinesses((prev) => prev.map((b) => b.id === selected.id ? { ...b, ...patch } as BizLite : b));
    setSelected((prev) => prev ? ({ ...prev, ...patch } as BizLite) : prev);
    setEditing(false);
    router.refresh();
  }

  return (<div>
    <PageHeader eyebrow="indaba · directory · pipeline" title={`${filteredBusinesses.length} businesses`} caption={`Showing ${filteredBusinesses.length} businesses · + ${suggested.length} suggested · ${onboarded} onboarded`} actions={<>
      {distinctSectors.map((s) => <SectorChip key={s} sector={s} active={sectorFilter === s} onClick={() => setSectorFilter((prev) => prev === s ? null : s)} />)}
      <select className="rounded-md border border-line-15 bg-ink-800 px-2 py-1 text-xs text-white" value={zoneFilter ?? ""} onChange={(e) => setZoneFilter(e.target.value || null)}>
        <option value="">All zones</option>
        {zoneOptions.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
      </select>
      <Button variant={launch6Only ? "primary" : "ghost"} size="sm" onClick={() => setLaunch6Only((prev) => !prev)}>Launch 6</Button>
      <button className="text-xs text-fg-mute underline" onClick={() => { setSectorFilter(null); setZoneFilter(null); setLaunch6Only(false); }}>Clear filters</button>
      <Button variant="primary" size="sm" onClick={() => setShowAddDialog(true)}>+ Add</Button>
    </>} />

    <div className="md:hidden">...</div>

    <div className="hidden md:block"><div className="indaba-thin-scroll overflow-x-auto px-6 py-4"><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${LANES.length}, 230px)` }}>{LANES.map((lane)=>{const items=lane.id==="suggested"?[]:byLane.get(lane.id)??[];const candidateItems=lane.id==="suggested"?suggested:[];const total=items.length+candidateItems.length;return <div key={lane.id} className={`flex min-h-[480px] flex-col border ${lane.isAgent?"border-zimx-gold/35 bg-zimx-gold/[0.04]":"border-line-10 bg-ink-800"}`}><div className="flex items-center justify-between border-b border-line-10 px-3 py-2.5"><span className={`font-mono text-[10px] uppercase tracking-eyebrow ${lane.isAgent?"text-zimx-gold":"text-white"}`}>{lane.label}</span><span className="font-mono text-[10px] text-fg-dim">{total}</span></div><div id={lane.id} className="indaba-thin-scroll flex-1 overflow-y-auto p-2">{candidateItems.map((c)=><SuggestedCard key={c.id} c={c} />)}{lane.id !== "suggested" ? <SortableContext items={items.map((b)=>b.id)} strategy={verticalListSortingStrategy}>{items.map((b)=><BizCard key={b.id} b={b} onClick={()=>openPanel(b)} onPromote={()=>promoteBusiness(b)} canDrag={canDrag} laneId={lane.id} />)}</SortableContext> : null}{total===0?<div className="border border-dashed border-line-15 p-3 text-[11px] leading-relaxed text-fg-mute">Empty. Move one when ready.</div>:null}</div></div>;})}</div></DndContext></div></div>

    {showAddDialog ? <AddBusinessDialog open={showAddDialog} onClose={()=>setShowAddDialog(false)} zones={zones} coords={{lat:-20.1325,lng:28.6261}} quickAddMode={false} lastSector={distinctSectors[0] ?? "Agriculture"} onSaved={()=>{setShowAddDialog(false);router.refresh();}} /> : null}

    {selected ? <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line-10 bg-ink-900 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-white">Business details</h3><Button size="sm" variant="ghost" onClick={()=>setSelected(null)}>Close</Button></div><div className="space-y-3 text-sm text-fg-mute"><Field label="Name" value={editing ? <Input name="name" value={form.name} onChange={(e)=>setForm((p)=>({...p,name:e.target.value}))} /> : selected.name} /><Field label="Sector" value={editing ? <Input name="sector" value={form.sector} onChange={(e)=>setForm((p)=>({...p,sector:e.target.value}))} /> : selected.sector} /><Field label="Zone" value={(selected.zone_id ? zoneLookup[selected.zone_id] : null) ?? "—"} /><Field label="Stage" value={selected.onboarding_stage} /><Field label="Est. monthly volume" value={editing ? <Input name="est_monthly_volume" value={form.est_monthly_volume} onChange={(e)=>setForm((p)=>({...p,est_monthly_volume:e.target.value}))} /> : (selected.est_monthly_volume?.toString() ?? "—")} /><Field label="Notes" value={editing ? <Textarea name="notes" value={form.notes} onChange={(e)=>setForm((p)=>({...p,notes:e.target.value}))} rows={4} /> : (selected.notes ?? "—")} /><Field label="Mapped by" value={users.find((u)=>u.id===selected.mapped_by)?.name ?? "—"} /><Field label="Created" value={new Date(selected.created_at).toLocaleString()} /></div>{role !== "bd" ? <div className="mt-4 flex gap-2">{editing ? <><Button size="sm" variant="primary" onClick={saveDetails}>Save</Button><Button size="sm" variant="ghost" onClick={()=>setEditing(false)}>Cancel</Button></> : <Button size="sm" variant="primary" onClick={()=>setEditing(true)}>Edit</Button>}</div> : null}</div> : null}
  </div>);
}

function Field({label, value}:{label:string; value:React.ReactNode}) { return <div><div className="font-mono text-[10px] uppercase tracking-eyebrow">{label}</div><div className="mt-1 text-white">{value}</div></div>; }

function BizCard({ b, onClick, onPromote, canDrag, laneId }: { b: BizLite; onClick: () => void; onPromote: () => void; canDrag: boolean; laneId: BusinessStage | "suggested" }) {
  const sectorHex = getSectorHex(b.sector as any);

  if (!canDrag || laneId === "suggested") {
    return <Card className="mb-1.5 cursor-pointer border border-line-10 bg-ink-700 p-2.5" style={{ borderLeft: `2px solid ${sectorHex}` }} onClick={onClick}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[13px] font-medium leading-snug text-white">{b.name}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-fg-mute">{b.sector} · {b.address ?? "—"}</div></div>{b.launch_6 ? <Pill tone="solid" size="sm">L6</Pill> : null}</div><div className="mt-2 flex justify-end"><Button variant="primary" size="sm" className="text-[9px]" disabled={b.onboarding_stage === "onboarded"} onClick={(e)=>{e.stopPropagation();onPromote();}}>Promote</Button></div></Card>;
  }

  return <SortableBizCard b={b} onClick={onClick} onPromote={onPromote} sectorHex={sectorHex} />;
}

function SortableBizCard({ b, onClick, onPromote, sectorHex }: { b: BizLite; onClick: () => void; onPromote: () => void; sectorHex: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id, data: { stage: b.onboarding_stage } });
  const style = { transform: CSS.Transform.toString(transform), transition, borderLeft: `2px solid ${sectorHex}` };

  return <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className={`mb-1.5 cursor-grab border border-line-10 bg-ink-700 p-2.5 ${isDragging ? "opacity-50" : ""}`} onClick={onClick}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[13px] font-medium leading-snug text-white">{b.name}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-fg-mute">{b.sector} · {b.address ?? "—"}</div></div>{b.launch_6 ? <Pill tone="solid" size="sm">L6</Pill> : null}</div><div className="mt-2 flex justify-end"><Button variant="primary" size="sm" className="text-[9px]" disabled={b.onboarding_stage === "onboarded"} onClick={(e)=>{e.stopPropagation();onPromote();}}>Promote</Button></div></Card>;
}

function SuggestedCard({ c }: { c: DiscoveryCandidate }) { return <div className="mb-1.5 border border-zimx-gold/25 bg-ink-700 p-2.5" style={{ borderLeft: `2px solid ${getSectorHex(c.sector ?? "manufacturing")}` }}><div className="text-[13px] font-medium leading-snug text-white">{c.name}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-fg-mute">agent · {c.source}</div></div>; }
