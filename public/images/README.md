# Image Assets

This directory holds static image assets for blackmass.co.uk. All files are served from `/images/...` at runtime.

## Required assets (placeholders currently in use)

| File | Purpose | Recommended spec |
|------|---------|------------------|
| `logo.png` | Primary Blackmass wordmark. Referenced from Organization schema (JSON-LD). | 512×512 PNG with transparent background, white mark on transparent. |
| `logo.svg` | Vector wordmark for inline or future use. | SVG, single-colour (white). |
| `og-image.png` | Open Graph / Twitter card image used on every page. | 1200×630 PNG, dark background (`#1f2228`) with white "BLACKMASS" wordmark. |
| `apple-touch-icon.png` | iOS home-screen icon. | 180×180 PNG, dark background (`#1f2228`) with white mark. |
| `founder-roy.jpg` | Headshot of Emperor Roy on the About page. | ≥ 800×800, colour or B&W, neutral background. |

## Venture marks (optional — not currently used, reserved for future)

| File | Venture |
|------|---------|
| `ventures/zimx.svg` | ZimX Finance |
| `ventures/zira.svg` | ZiRA |
| `ventures/zigx.svg` | ZiGX |
| `ventures/project-tg.svg` | Project TG |
| `ventures/lovemusiclive.svg` | LoveMusicLive |

## Favicon

`favicon.ico` lives at the project root (`/public/favicon.ico`) — replace the placeholder with a multi-resolution ICO (16px, 32px, 48px) featuring a white "B" on a `#1f2228` background.

## Design rules (keep assets consistent with the site)

- Palette: white (`#ffffff`) and dark (`#1f2228`) only. No colour accents.
- No gradients, no shadows, sharp corners.
- Typography within assets should use GeistMono at weight 300 or 400 where possible.
