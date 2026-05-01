"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ops/ui/Button";

import CreateEventModal from "./CreateEventModal";

export default function LogEventButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        + Log event
      </Button>
      {open ? (
        <CreateEventModal
          onClose={() => setOpen(false)}
          onSaved={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
