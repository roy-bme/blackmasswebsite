import type { Business } from "@/types/ops";

/**
 * Subset of `businesses` pulled for the supply-chain graph. Only the columns
 * the SVG and loop list actually use — the rest stays on the server to keep
 * the client bundle lean.
 */
export type GraphBusiness = Pick<
  Business,
  "id" | "name" | "sector" | "launch_6" | "est_monthly_volume" | "lat" | "lng"
>;
