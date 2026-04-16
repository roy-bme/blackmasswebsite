"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

type DraggableCardProps = {
  id: string;
  disabled?: boolean;
  children: ReactNode;
};

/**
 * Wrapper around `useDraggable` that still lets nested buttons receive clicks.
 * `DndContext` + `PointerSensor` with `distance: 4` is what prevents a simple
 * click from registering as a drag.
 */
export default function DraggableCard({
  id,
  disabled,
  children,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? "pointer" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
    >
      {children}
    </div>
  );
}
