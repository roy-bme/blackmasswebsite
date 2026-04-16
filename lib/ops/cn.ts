import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditional Tailwind class joiner used across the ops portal.
 *
 * `clsx` handles arrays, objects, and conditional truthy chains; `twMerge`
 * then resolves any conflicting Tailwind utilities so that downstream
 * `className` overrides reliably win (e.g. `cn("px-4", "px-6")` → `"px-6"`).
 *
 * Keep this helper isolated to /lib/ops so the marketing site components
 * stay free of the extra runtime dependency.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
