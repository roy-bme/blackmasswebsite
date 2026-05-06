import { isIndabaHost } from "./host-allowlist";

const INDABA_PATH_PREFIX = "/indaba";

export function resolveRouteMode(host: string | null, pathname: string): "block_portal" | "marketing" | "indaba" {
  const onIndabaHost = isIndabaHost(host);
  if (!onIndabaHost) {
    if (pathname === INDABA_PATH_PREFIX || pathname.startsWith(`${INDABA_PATH_PREFIX}/`)) {
      return "block_portal";
    }
    return "marketing";
  }
  return "indaba";
}
