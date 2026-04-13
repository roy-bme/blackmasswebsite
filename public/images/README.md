# Image Assets

Static image assets for blackmass.co.uk. Served from `/images/...` at runtime.

## Files in use

| File | Used in | Purpose |
|------|---------|---------|
| `blackmass.png` | `components/Footer.tsx`, Organization JSON-LD, Open Graph | Blackmass Enterprises wreath + wordmark logo. |
| `zimx-finance.webp` | ZimX Finance venture card (`lib/ventures.ts`) | ZimX Finance brand mark. |
| `logo-stacked-1-scaled.png` | ZiRA venture card | ZiRA brand mark ("Chat With ZiRA"). |
| `zimx-2.webp` | ZiGX venture card | ZiGX brand mark. Rendered on a white panel because the artwork is designed for a white background (`logoBg: "light"` in ventures data). |
| `love-music.webp` | LoveMusicLive venture card | LoveMusicLive brand mark. |
| `About-Blackmass.webp` | `app/about/page.tsx` — leadership card | Founder photo of Emperor Roy. |
| `Alaska-House.jpg` | `app/about/page.tsx` — landscape accent between Story and Leadership sections | Zimbabwean landscape. |

## Notes

- **Project TG** has no logo file; its venture card renders the title in GeistMono as a text-only placeholder. Drop a logo here and reference it in `lib/ventures.ts` when ready.
- **OG / Twitter share image** currently points at `/images/blackmass.png`. For better social previews, consider producing a dedicated 1200×630 PNG (dark `#1f2228` background, white wordmark) and updating `metadataBase` + `images` in `app/layout.tsx`.
- **Favicon** is generated from `app/icon.svg` at build time — replace that file to change the tab icon.

## Design rules (for new assets)

- Site palette: white (`#ffffff`) and dark (`#1f2228`); vendor-supplied brand marks keep their native colours inside their card panel.
- No gradients or shadows in UI-owned artwork.
- When a logo is designed for a light background, set `logoBg: "light"` on its venture in `lib/ventures.ts` so the card renders a white panel behind it.
