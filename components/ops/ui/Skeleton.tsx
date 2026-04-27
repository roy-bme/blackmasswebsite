import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: number | string;
  height?: number | string;
};

/**
 * Shimmer placeholder. Background uses the global `indaba-skeleton` keyframe
 * so all skeletons animate in lock-step.
 */
export default function Skeleton({
  width,
  height = 12,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const inline: CSSProperties = {
    width,
    height,
    ...style,
  };
  return (
    <div
      aria-hidden="true"
      className={cn("indaba-skeleton", className)}
      style={inline}
      {...rest}
    />
  );
}
