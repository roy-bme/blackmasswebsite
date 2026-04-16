"use client";

import { useEffect, useState, type FormEvent } from "react";

import Avatar from "@/components/ops/ui/Avatar";
import Button from "@/components/ops/ui/Button";
import Textarea from "@/components/ops/ui/Textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Activity,
  ActivityChannel,
  UserRole,
} from "@/types/ops";

type ActivityTabProps = {
  businessId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  onMutated: () => void;
};

type ActivityWithUser = Activity & { user_name: string | null };

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function channelForRole(role: UserRole): ActivityChannel {
  if (role === "ops") return "ground_ops";
  if (role === "bd") return "bd_networking";
  return "admin";
}

export default function ActivityTab({
  businessId,
  currentUserId,
  currentUserRole,
  onMutated,
}: ActivityTabProps) {
  const [activities, setActivities] = useState<ActivityWithUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from("activities")
        .select("*")
        .eq("linked_business_id", businessId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as Activity[];
      const userIds = Array.from(new Set(rows.map((a) => a.user_id)));
      let nameById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, name")
          .in("id", userIds);
        nameById = new Map(
          ((users ?? []) as { id: string; name: string }[]).map((u) => [
            u.id,
            u.name,
          ]),
        );
      }
      if (cancelled) return;
      setActivities(
        rows.map((a) => ({ ...a, user_name: nameById.get(a.user_id) ?? null })),
      );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = note.trim();
    if (!content) return;

    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: insertError } = await supabase
      .from("activities")
      .insert({
        user_id: currentUserId,
        channel: channelForRole(currentUserRole),
        type: "comment",
        content,
        linked_business_id: businessId,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setSubmitting(false);
      setError(insertError?.message ?? "Unable to post note.");
      return;
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", currentUserId)
      .maybeSingle();

    const row = data as Activity;
    setActivities((prev) => [
      {
        ...row,
        user_name: (userRow as { name: string } | null)?.name ?? null,
      },
      ...(prev ?? []),
    ]);
    setNote("");
    setSubmitting(false);
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
        <p className="text-[13px] text-zinc-500">Loading activity…</p>
      ) : !activities || activities.length === 0 ? (
        <p className="text-[13px] text-zinc-500">No activity logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((a) => (
            <li
              key={a.id}
              className="flex gap-3 border border-zinc-200 bg-white p-3"
            >
              <Avatar name={a.user_name ?? "Unknown"} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-zimx-black">
                    {a.user_name ?? "Unknown"}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                    {DATE_FMT.format(new Date(a.created_at))}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-zimx-black">
                  {a.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-3 border border-zinc-200 bg-zimx-offwhite p-4"
      >
        <Textarea
          label="Add note"
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Log intel, next steps, follow-ups…"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !note.trim()}
          >
            {submitting ? "Posting…" : "Post note"}
          </Button>
        </div>
      </form>
    </div>
  );
}
