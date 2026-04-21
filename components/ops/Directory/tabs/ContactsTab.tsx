"use client";

import { useEffect, useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Input from "@/components/ops/ui/Input";
import Pill, { type PillTone } from "@/components/ops/ui/Pill";
import Select from "@/components/ops/ui/Select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { opsApiPost } from "@/lib/ops/api-client";
import type { Contact } from "@/types/ops";

type ContactsTabProps = {
  businessId: string;
  canEdit: boolean;
  currentUserId: string;
  onMutated: () => void;
};

const WARMTH_OPTIONS = [
  { label: "Cold", value: "cold" },
  { label: "Warm", value: "warm" },
  { label: "Hot", value: "hot" },
];

const WARMTH_TONE: Record<string, PillTone> = {
  cold: "info",
  warm: "warning",
  hot: "danger",
};

const EMPTY_FORM = {
  name: "",
  title: "",
  phone: "",
  email: "",
  warmth_level: "",
};

export default function ContactsTab({
  businessId,
  canEdit,
  currentUserId,
  onMutated,
}: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from("contacts")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setContacts((data ?? []) as Contact[]);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await opsApiPost<{ contact: Contact }>(
      "/api/ops/contacts/create",
      {
        business_id: businessId,
        name: form.name.trim(),
        title: form.title.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        warmth_level: form.warmth_level || null,
      },
    );

    setSubmitting(false);

    if (!res.ok) {
      setError("Unable to save contact.");
      return;
    }

    setContacts((prev) => [res.data.contact, ...(prev ?? [])]);
    setForm(EMPTY_FORM);
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
        <p className="text-[13px] text-zinc-500">Loading contacts…</p>
      ) : !contacts || contacts.length === 0 ? (
        <p className="text-[13px] text-zinc-500">No contacts yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 border border-zinc-200 bg-white">
          {contacts.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-zimx-black">
                    {c.name}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                    {c.title ?? "—"}
                  </p>
                </div>
                {c.warmth_level ? (
                  <Pill
                    tone={WARMTH_TONE[c.warmth_level] ?? "neutral"}
                    size="sm"
                  >
                    {c.warmth_level}
                  </Pill>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-[13px] text-zinc-600">
                {c.phone ? <span>{c.phone}</span> : null}
                {c.email ? <span>{c.email}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 border border-zinc-200 bg-zimx-offwhite p-4"
        >
          <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
            Add contact
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Title"
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Select
              label="Warmth"
              name="warmth_level"
              value={form.warmth_level}
              onChange={(e) =>
                setForm({ ...form, warmth_level: e.target.value })
              }
              placeholder="Select warmth"
              options={WARMTH_OPTIONS}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving…" : "Add contact"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
