"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";

import Button from "@/components/ops/ui/Button";
import {
  approveRunAction,
  cancelRunAction,
  requestEstimateAction,
  rerunConceptAction,
  updateAnchorSetAction,
  updateConceptAction,
  type ActionState,
} from "@/app/indaba/(ops)/synthetic-panel/actions";
import { copyRuleViolations, type SsrAnchorSet, type SsrConcept } from "@/lib/ops/ssr";

const idle: ActionState = { status: "idle" };

function Message({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role="status"
      className={`mt-2 text-[12px] ${state.status === "ok" ? "text-status-ok" : "text-status-bad"}`}
    >
      {state.message}
    </p>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="primary" disabled={pending}>
      {pending ? "…" : children}
    </Button>
  );
}

/** Request a cost estimate. Nothing is spent until an admin approves the estimate. */
export function RequestEstimateForm({ concepts }: { concepts: SsrConcept[] }) {
  const [state, action] = useFormState(requestEstimateAction, idle);
  const active = concepts.filter((c) => c.active);
  return (
    <form action={action} className="space-y-3">
      <fieldset>
        <legend className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">concepts</legend>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {active.map((c) => (
            <label key={c.code} className="flex items-center gap-1.5 text-[13px] text-fg-mute">
              <input type="checkbox" name="concepts" value={c.code} defaultChecked={["C0", "C1", "C3"].includes(c.code)} />
              {c.code}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
          also run without pain tags
        </legend>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {active.map((c) => (
            <label key={c.code} className="flex items-center gap-1.5 text-[13px] text-fg-mute">
              <input type="checkbox" name="pain_compare" value={c.code} defaultChecked={c.code === "C1"} />
              {c.code}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5 text-[13px] text-fg-mute">
          <input type="checkbox" name="include_calibration" defaultChecked />
          calibration records
        </label>
        <label className="flex items-center gap-1.5 text-[13px] text-fg-mute">
          scope
          <select name="scope" defaultValue="pilot" className="border border-line-20 bg-ink-700 px-2 py-1 text-[12px]">
            <option value="pilot">pilot</option>
            <option value="full">full</option>
          </select>
        </label>
        <Submit>get estimate</Submit>
      </div>
      <Message state={state} />
    </form>
  );
}

export function RunDecision({ runId, canApprove }: { runId: string; canApprove: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>(idle);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={pending || !canApprove}
          onClick={() => start(async () => setState(await approveRunAction(runId)))}
        >
          approve and run
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => setState(await cancelRunAction(runId)))}>
          cancel
        </Button>
      </div>
      <Message state={state} />
    </div>
  );
}

export function RerunConceptButton({ code }: { code: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>(idle);
  return (
    <span>
      <Button size="sm" variant="bare" disabled={pending} onClick={() => start(async () => setState(await rerunConceptAction(code)))}>
        re-run {code}
      </Button>
      <Message state={state} />
    </span>
  );
}

const field = "w-full border border-line-20 bg-ink-700 px-2 py-1.5 text-[13px] text-white";

export function ConceptEditor({ concept }: { concept: SsrConcept }) {
  const [state, action] = useFormState(updateConceptAction, idle);
  const [text, setText] = useState(`${concept.title}\n${concept.body}\n${concept.price_text ?? ""}`);
  const problems = copyRuleViolations(text);
  return (
    <form
      action={action}
      onChange={(e) => {
        const f = e.currentTarget;
        const get = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "";
        setText(`${get("title")}\n${get("body")}\n${get("price_text")}`);
      }}
      className="space-y-2"
    >
      <input type="hidden" name="code" value={concept.code} />
      <input name="title" defaultValue={concept.title} className={field} aria-label={`${concept.code} title`} />
      <textarea name="body" defaultValue={concept.body} rows={4} className={field} aria-label={`${concept.code} text`} />
      {concept.price_construct ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
          <input name="price_text" defaultValue={concept.price_text ?? ""} className={field} aria-label="price as said to the persona" />
          <input
            name="price_usd"
            defaultValue={concept.params?.price_usd !== undefined ? String(concept.params.price_usd) : ""}
            className={field}
            inputMode="decimal"
            aria-label="price_usd"
            placeholder="price_usd"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-[12px] text-fg-mute">
          <input type="checkbox" name="active" defaultChecked={concept.active} /> active
        </label>
        <span className="font-mono text-[10px] text-fg-dim">v{concept.version}</span>
        <Submit>save</Submit>
      </div>
      {problems.length ? <p className="text-[12px] text-status-warn">Copy rules: {problems.join(", ")}</p> : null}
      <Message state={state} />
    </form>
  );
}

export function AnchorEditor({ set }: { set: SsrAnchorSet }) {
  const [state, action] = useFormState(updateAnchorSetAction, idle);
  return (
    <form action={action} className="space-y-1.5">
      <input type="hidden" name="code" value={set.code} />
      {set.anchors.map((a, i) => (
        <label key={i} className="flex items-center gap-2">
          <span className="w-4 font-mono text-[11px] text-fg-dim">{i + 1}</span>
          <input name={`anchor_${i + 1}`} defaultValue={a} className={field} />
        </label>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <label className="flex items-center gap-1.5 text-[12px] text-fg-mute">
          <input type="checkbox" name="active" defaultChecked={set.active} /> active
        </label>
        <span className="font-mono text-[10px] text-fg-dim">v{set.version}</span>
        <Submit>save</Submit>
      </div>
      <Message state={state} />
    </form>
  );
}
