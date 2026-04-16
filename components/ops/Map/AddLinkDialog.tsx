"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import Button from "@/components/ops/ui/Button";
import Dialog from "@/components/ops/ui/Dialog";
import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import type { MapBusiness } from "./types";

type AddLinkDialogProps = {
  open: boolean;
  onClose: () => void;
  businesses: MapBusiness[];
  currentUserId: string;
};

const PAYMENT_METHODS = [
  "Cash",
  "Bank",
  "ZIPIT",
  "EcoCash",
  "InnBucks",
  "Mixed",
];
const PAYMENT_FREQUENCIES = ["Daily", "Weekly", "Monthly", "Seasonal", "Ad-hoc"];

const EMPTY_FORM = {
  supplier_id: "",
  buyer_id: "",
  product: "",
  est_monthly_volume: "",
  payment_method: "",
  payment_frequency: "",
};

export default function AddLinkDialog({
  open,
  onClose,
  businesses,
  currentUserId,
}: AddLinkDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.supplier_id || !form.buyer_id) {
      setError("Supplier and buyer are required.");
      return;
    }
    if (form.supplier_id === form.buyer_id) {
      setError("Supplier and buyer must be different businesses.");
      return;
    }
    if (!form.product.trim()) {
      setError("Product is required.");
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();

    const { error: insertError } = await supabase
      .from("supply_chain_links")
      .insert({
        supplier_id: form.supplier_id,
        buyer_id: form.buyer_id,
        product: form.product.trim(),
        est_monthly_volume: form.est_monthly_volume
          ? Number(form.est_monthly_volume)
          : null,
        payment_method: form.payment_method || null,
        payment_frequency: form.payment_frequency || null,
        mapped_by: currentUserId,
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm(EMPTY_FORM);
    onClose();
    router.refresh();
  }

  const businessOptions = [...businesses]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((b) => ({ label: b.name, value: b.id }));

  return (
    <Dialog open={open} onClose={handleClose} ariaLabel="Log supply link">
      <Dialog.Header>
        <Dialog.Title>Log supply link</Dialog.Title>
        <Dialog.CloseButton onClose={handleClose} />
      </Dialog.Header>
      <form onSubmit={handleSubmit}>
        <Dialog.Body className="space-y-4">
          <Select
            label="Supplier"
            name="supplier_id"
            value={form.supplier_id}
            onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
            placeholder="Select supplier"
            options={businessOptions}
            required
            data-autofocus
          />
          <Select
            label="Buyer"
            name="buyer_id"
            value={form.buyer_id}
            onChange={(e) => setForm({ ...form, buyer_id: e.target.value })}
            placeholder="Select buyer"
            options={businessOptions}
            required
          />
          <Input
            label="Product"
            name="product"
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
            required
          />
          <Input
            label="Est. monthly volume (USD)"
            name="est_monthly_volume"
            type="number"
            min={0}
            inputMode="numeric"
            value={form.est_monthly_volume}
            onChange={(e) =>
              setForm({ ...form, est_monthly_volume: e.target.value })
            }
          />
          <Select
            label="Payment method"
            name="payment_method"
            value={form.payment_method}
            onChange={(e) =>
              setForm({ ...form, payment_method: e.target.value })
            }
            placeholder="Select method"
            options={PAYMENT_METHODS.map((m) => ({ label: m, value: m }))}
          />
          <Select
            label="Payment frequency"
            name="payment_frequency"
            value={form.payment_frequency}
            onChange={(e) =>
              setForm({ ...form, payment_frequency: e.target.value })
            }
            placeholder="Select frequency"
            options={PAYMENT_FREQUENCIES.map((f) => ({
              label: f,
              value: f,
            }))}
          />
          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] uppercase tracking-tag text-zimx-red"
            >
              {error}
            </p>
          ) : null}
        </Dialog.Body>
        <Dialog.Footer>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save link"}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
