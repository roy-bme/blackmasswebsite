/** @type {import('next').NextConfig} */

const STORAGE_HOST = "ipqmdinidqpmchggjdov.supabase.co";

const SHARED_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// The CSP template uses NONCE_PLACEHOLDER as a literal; middleware.ts
// replaces it at request time with a per-request nonce, then forwards the
// same value on both the Content-Security-Policy response header and on
// x-nonce so Server Components / inline <Script> tags can read it.
const CSP = [
  "default-src 'self'",
  `img-src 'self' data: https://${STORAGE_HOST} https://*.basemaps.cartocdn.com https://*.openstreetmap.org`,
  `connect-src 'self' https://${STORAGE_HOST} https://nominatim.openstreetmap.org`,
  "script-src 'self' 'nonce-NONCE_PLACEHOLDER' 'strict-dynamic'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...SHARED_HEADERS,
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      {
        // Indaba ops routes: no-referrer to avoid leaking business names
        // (encoded in path) to third-party logs / nominatim.
        source: "/indaba/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
