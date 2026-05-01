"use client";

import Button from "@/components/ops/ui/Button";
import { useToast } from "@/components/ui/Toast";

type DetectLoopsButtonProps = {
  linksCount: number;
};

const REQUIRED_LINKS = 50;

export default function DetectLoopsButton({ linksCount }: DetectLoopsButtonProps) {
  const toast = useToast();
  const ready = linksCount >= REQUIRED_LINKS;

  return (
    <Button
      variant="primary"
      size="sm"
      disabled={!ready}
      title={
        ready
          ? "Detect supply chain loops"
          : `Coming soon — needs ${REQUIRED_LINKS}+ mapped supply chain links (have ${linksCount}).`
      }
      onClick={() => {
        if (!ready) return;
        toast.info("Loop detection scheduled. Results appear in the agent feed.");
      }}
    >
      Detect loops
    </Button>
  );
}
