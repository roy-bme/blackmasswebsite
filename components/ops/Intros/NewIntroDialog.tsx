"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import Textarea from "@/components/ops/ui/Textarea";
import { cn } from "@/lib/ops/cn";
import { opsApiPost } from "@/lib/ops/api-client";

import {
  PAIN_POINT_OPTIONS,
  WARMTH_OPTIONS,
  type IntroBusinessOption,
  type PainPoint,
} from "./types";

type NewIntroDialogProps = {
  open: boolean;
  onClose: () => void;
  businesses: IntroBusinessOption[];
  currentUserId: string;
};

type FormState = {
  contact_name: string;
  role: string;
  business: string;
  business_id: string | null;
  how_connected: string;
  why_relevant: string;
  pain_points: PainPoint[];
  cross_border: boolean;
  warmth: "cold" | "warm" | "hot";
  recommended_action: string;
};

const EMPTY_FORM: FormState = {
  contact_name: "",
  role: "",
  business: "",
  business_id: null,
  how_connected: "",
  why_relevant: "",
  pain_points: [],
  cross_border: false,
  warmth: "cold",
  recommended_action: "",
};

export default function NewIntroDialog({
  open,
  onClose,
  businesses,
  currentUserId,
}: NewIntroDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessFocused, setBusinessFocused] = useState(false);

  const matches = useMemo(() => {
    const query = form.business.trim().toLowerCase();
    if (!query) return [] as IntroBusinessOption[];
    return businesses
      .filter((b) => b.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [form.business, businesses]);

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setError(null);
    setBusinessFocused(false);
    onClose();
  }

  function togglePainPoint(value: PainPoint) {
    setForm((prev) => {
      const has = prev.pain_points.includes(value);
      return {
        ...prev,
        pain_points: has
          ? prev.pain_points.filter((p) => p !== value)
          : [...prev.pain_points, value],
      };
    });
  }

  function pickBusiness(option: IntroBusinessOption) {
    setForm((prev) => ({
      ...prev,
      business: option.name,
      business_id: option.id,
    }));
    setBusinessFocused(false);
  }

  function handleBusinessTyping(value: string) {
    setForm((prev) => ({
      ...prev,
      business: value,
      // Clear the link if the user starts editing away from the picked name.
      business_id:
        prev.business_id &&
        businesses.find((b) => b.id === prev.business_id)?.name === value
          ? prev.business_id
          : null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.contact_name.trim()) {
      setError("Contact name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await opsApiPost<{ id: string }>(
      "/api/ops/introductions/create",
      {
        contact_name: form.contact_name.trim(),
        role: form.role.trim() || null,
        business: form.business.trim() || null,
        business_id: form.business_id,
        how_connected: form.how_connected.trim() || null,
        why_relevant: form.why_relevant.trim() || null,
        pain_points_identified:
          form.pain_points.length > 0 ? form.pain_points : null,
        cross_border: form.cross_border,
        warmth: form.warmth,
        recommended_action: form.recommended_action.trim() || null,
      },
    );

    setSubmitting(false);

    if (!res.ok) {
      setError("Could not save introduction.");
      return;
    }

    resetAndClose();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      size="lg"
      ariaLabel="New introduction"
    >
      <Dialog.Header>
        <Dialog.Title>New introduction</Dialog.Title>
        <Dialog.CloseButton onClose={resetAndClose} />
      </Dialog.Header>

      <form onSubmit={handleSubmit}>
        <Dialog.Body className="space-y-4">
          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
            >
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Contact name"
              name="contact_name"
              value={form.contact_name}
              onChange={(e) =>
                setForm({ ...form, contact_name: e.target.value })
              }
              required
              data-autofocus
            />
            <Input
              label="Role"
              name="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>

          <div className="relative">
            <Input
              label="Business"
              name="business"
              value={form.business}
              onChange={(e) => handleBusinessTyping(e.target.value)}
              onFocus={() => setBusinessFocused(true)}
              onBlur={() => {
                // Delay so click on a suggestion fires first.
                setTimeout(() => setBusinessFocused(false), 120);
              }}
              hint={
                form.business_id
                  ? "Linked to existing business."
                  : "Type to search — pick an existing business or enter a new name."
              }
              autoComplete="off"
            />
            {businessFocused && matches.length > 0 ? (
              <ul className="absolute left-0 right-0 top-[calc(100%-0.25rem)] z-20 max-h-56 overflow-y-auto border border-zinc-200 bg-white shadow-[0_4px_0_0_rgba(27,27,27,0.08)]">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickBusiness(m)}
                      className="block w-full px-3 py-2 text-left text-[14px] text-zimx-black hover:bg-zimx-offwhite"
                    >
                      {m.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Textarea
            label="How connected"
            name="how_connected"
            value={form.how_connected}
            onChange={(e) =>
              setForm({ ...form, how_connected: e.target.value })
            }
            rows={3}
          />

          <Textarea
            label="Why relevant"
            name="why_relevant"
            value={form.why_relevant}
            onChange={(e) =>
              setForm({ ...form, why_relevant: e.target.value })
            }
            rows={3}
          />

          <div>
            <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
              Pain points identified
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {PAIN_POINT_OPTIONS.map((pp) => {
                const active = form.pain_points.includes(pp);
                return (
                  <button
                    key={pp}
                    type="button"
                    onClick={() => togglePainPoint(pp)}
                    aria-pressed={active}
                    className={cn(
                      "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag transition-colors",
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zimx-black",
                    )}
                  >
                    {pp}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 border border-zinc-200 bg-white px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.cross_border}
                onChange={(e) =>
                  setForm({ ...form, cross_border: e.target.checked })
                }
                className="h-4 w-4 accent-zimx-black"
              />
              <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-700">
                Cross-border
              </span>
            </label>
            <Select
              label="Warmth"
              name="warmth"
              value={form.warmth}
              onChange={(e) =>
                setForm({
                  ...form,
                  warmth: e.target.value as FormState["warmth"],
                })
              }
              options={WARMTH_OPTIONS.map((w) => ({
                label: w.label,
                value: w.value,
              }))}
            />
          </div>

          <Input
            label="Recommended action"
            name="recommended_action"
            value={form.recommended_action}
            onChange={(e) =>
              setForm({ ...form, recommended_action: e.target.value })
            }
          />
        </Dialog.Body>

        <Dialog.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={resetAndClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving\u2026" : "Log introduction"}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
