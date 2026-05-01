"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Textarea from "@/components/ops/ui/Textarea";
import { opsApiPost } from "@/lib/ops/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BusinessOption = { id: string; name: string; sector: string | null };

function SearchBusiness({ label, value, onChange, options, blockedId }: { label: string; value: string | null; onChange: (id: string | null) => void; options: BusinessOption[]; blockedId?: string | null }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => options.filter((o) => {
    if (blockedId && o.id === blockedId) return false;
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return o.name.toLowerCase().includes(term) || (o.sector ?? "").toLowerCase().includes(term);
  }), [blockedId, options, query]);

  return <div><div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">{label}</div><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search business..." /><div className="mt-2 max-h-40 overflow-y-auto rounded border border-line-10 p-1">{filtered.map((option) => <button type="button" key={option.id} onClick={() => onChange(option.id)} className={`block w-full rounded px-2 py-1.5 text-left text-xs ${value === option.id ? "bg-zimx-gold/15 text-zimx-gold" : "text-fg-mute hover:bg-ink-700 hover:text-white"}`}>{option.name} {option.sector ? `· ${option.sector}` : ""}</button>)}{!filtered.length ? <div className="px-2 py-1 text-xs text-fg-dim">No businesses found.</div> : null}</div></div>;
}

export default function CreateIntroModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [options, setOptions] = useState<BusinessOption[]>([]);
  const [businessAId, setBusinessAId] = useState<string | null>(null);
  const [businessBId, setBusinessBId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { (async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.from("businesses").select("id,name,sector").order("name", { ascending: true });
    setOptions((data ?? []) as BusinessOption[]);
  })(); }, []);

  const errors = useMemo(() => ({ contact_name_required: "Contact name is required.", contact_name_too_long: "Contact name is too long.", db_error: "Could not create introduction. Please try again." }), []);

  async function handleSave() {
    setSaving(true); setError(null);
    const businessA = options.find((o) => o.id === businessAId) ?? null;
    const businessB = options.find((o) => o.id === businessBId) ?? null;
    const res = await opsApiPost("/api/ops/introductions/create", { contact_name: contactName, business_id: businessAId, business: businessA?.name ?? null, why_relevant: note, recommended_action: businessB ? `Introduce to ${businessB.name}` : null, warmth: "warm" });
    setSaving(false);
    if (!res.ok) { const code = res.error as keyof typeof errors | undefined; setError((code && errors[code]) || "Unable to create introduction."); return; }
    onSaved(); onClose();
  }

  return <Dialog open onClose={onClose} size="md" ariaLabel="Log an introduction"><Dialog.Header><Dialog.Title>Log an introduction</Dialog.Title><Dialog.CloseButton onClose={onClose} /></Dialog.Header><Dialog.Body><div className="space-y-4"><SearchBusiness label="Business A" value={businessAId} onChange={setBusinessAId} options={options} blockedId={businessBId} /><SearchBusiness label="Business B" value={businessBId} onChange={setBusinessBId} options={options} blockedId={businessAId} /><div><div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">Contact name</div><Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Who is being introduced?" /></div><div><div className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">Introduction note</div><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="What's the context for this intro?" /></div>{error ? <div className="text-xs text-rose-300">{error}</div> : null}</div></Dialog.Body><Dialog.Footer><Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button><Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !businessAId || !businessBId || !contactName.trim()}>{saving ? "Creating..." : "Create Introduction"}</Button></Dialog.Footer></Dialog>;
}
