import { redirect } from "next/navigation";

import PaperResponseForm from "@/components/ops/Zitf/PaperResponseForm";
import { loadOpsProfile } from "@/lib/ops/auth";
import { canViewZitf, canWriteZitfPaper } from "@/types/zitf";

export const dynamic = "force-dynamic";

/**
 * Paper-form digitisation surface. Used by Brendon + Tafadzwa to key in
 * the paper questionnaires they collect at the ZimX stand.
 *
 * Access is restricted to roles permitted to INSERT paper rows
 * (admin + ops). Other ZITF-facing roles (bd, compliance) bounce to the
 * list view with a flash message so they understand why.
 */
export default async function NewPaperResponsePage() {
  const result = await loadOpsProfile();

  if (result.status !== "ok") {
    redirect("/login");
  }

  const { user } = result;

  if (!canViewZitf(user.role)) {
    const flash = encodeURIComponent("You don't have access to ZITF.");
    redirect(`/indaba/dashboard?flash=${flash}`);
  }

  if (!canWriteZitfPaper(user.role)) {
    const flash = encodeURIComponent(
      "Only ops and admin can key in paper responses.",
    );
    redirect(`/indaba/zitf?flash=${flash}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-mono text-[13px] uppercase tracking-tag text-zinc-500">
          New paper response
        </h1>
        <p className="mt-1 text-[14px] text-zimx-black">
          Digitise a paper questionnaire collected at the ZimX stand. Channel is
          pre-set to{" "}
          <code className="font-mono text-[12px] text-zinc-600">paper</code>{" "}
          and attributed to you.
        </p>
      </div>

      <PaperResponseForm currentUserId={user.id} />
    </div>
  );
}
