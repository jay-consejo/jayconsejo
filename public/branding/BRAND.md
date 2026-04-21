# JDC — Brand Guidelines

Jay Consejo (JDC) — AI, Web & Systems Builder
Last updated: 2026-04-21

---

## 1. The mark

The monogram **JDC** set in **Playfair Display Semibold** (600), tight tracking (−0.02em). The serif conveys craft and deliberation; the warm gold conveys warmth over corporate steel.

Two shape containers:

| Shape      | When to use                                                 |
| ---------- | ----------------------------------------------------------- |
| **Circle** | Avatar slots: email signature, Gravatar, Slack, social bio. |
| **Square** | App icon slots, favicon, OG badge, business card front.     |

Two color schemes:

| Scheme         | Background  | Mark     | When to use                                         |
| -------------- | ----------- | -------- | --------------------------------------------------- |
| **Dark**       | `#0B0B0F`   | `#C8A87E`| Default. Matches the live site and OG image.        |
| **Warm light** | `#FAF6F0`   | `#A8886A`| Printed material, light-themed email, letterhead.   |

---

## 2. Files in this folder

```
public/branding/
├── jdc-circle-dark.svg     ← master, scale anywhere
├── jdc-circle-light.svg
├── jdc-square-dark.svg
├── jdc-square-light.svg
├── jdc-circle-dark-400.png     ← email signature (2× retina at 200px display)
├── jdc-circle-dark-1024.png    ← social, print
├── jdc-circle-light-400.png
├── jdc-circle-light-1024.png
├── jdc-square-dark-400.png
├── jdc-square-dark-1024.png
├── jdc-square-light-400.png
├── jdc-square-light-1024.png
└── BRAND.md   ← you are here
```

**Which file to use:**
- **Email signature (Gmail, Outlook, Apple Mail):** `*-400.png` — SVG is unreliable in Outlook.
- **Web / HTML email templates you author:** SVG first, PNG as `<img>` fallback.
- **Social avatars (LinkedIn, X, GitHub):** `*-1024.png`.
- **Favicon / app icon:** square SVG, generate 16/32/192/512 ICO/PNG set as needed.

---

## 3. Color palette

### Primary (dark scheme — default)

| Token            | Hex        | Role                                |
| ---------------- | ---------- | ----------------------------------- |
| `--background`   | `#0B0B0F`  | Near-black, canvas.                 |
| `--foreground`   | `#F5F0EB`  | Warm off-white body text.           |
| `--accent-gold`  | `#C8A87E`  | The mark, links, CTAs.              |
| `--accent-light` | `#E8D5B8`  | Hover, highlights.                  |
| `--text-secondary` | `#B0ADA8`| Muted labels, captions.             |
| `--surface`      | `#1A1A20`  | Cards, elevated panels.             |

### Warm light (opt-in, never auto from `prefers-color-scheme`)

| Token            | Hex        | Role                            |
| ---------------- | ---------- | ------------------------------- |
| `--background`   | `#FAF6F0`  | Cream canvas.                   |
| `--foreground`   | `#1A1615`  | Deep warm near-black body text. |
| `--accent-gold`  | `#A8886A`  | The mark in light contexts.     |
| `--accent-light` | `#C8A87E`  | Secondary accent.               |
| `--surface`      | `#F2ECE3`  | Cards on cream.                 |

**Never use pure black (`#000`) or pure white (`#FFF`).** The palette is warm — neutralizing it cools the whole system.

---

## 4. Typography

| Use                 | Family                 | Weight       | Tracking  |
| ------------------- | ---------------------- | ------------ | --------- |
| Display / headlines | **Playfair Display**   | 600 semibold | −0.02em   |
| Italic accent       | Playfair Display       | 600 italic   | −0.02em   |
| Body / UI           | **Inter**              | 400 / 500    | 0         |
| Mono / code         | **Geist Mono**         | 400          | 0         |
| Small caps labels   | Inter                  | 500          | 0.22em uppercase |

Headline pattern on site + OG: one serif fragment italicized in gold for emphasis (e.g. "AI, web apps & systems, *shipped in weeks.*").

---

## 5. Clear space & minimum size

- **Clear space:** keep at least **12% of the mark's width** of empty room on all sides (e.g. for a 400px logo, leave ~48px padding before any adjacent element).
- **Minimum display size:** 48px for the circle; 56px for the square. Below that the letterforms lose fidelity — use just "JDC" in text form instead.

---

## 6. Do / Don't

**Do**
- Use the gold as the accent, never as the dominant background fill.
- Pair the dark mark with the dark background, light mark with cream. Never invert (gold-on-cream and dark-on-gold both lose contrast).
- Keep the serif — swap to sans only in body copy.

**Don't**
- Don't stretch, skew, or recolor the mark.
- Don't add drop shadows, outer glows, or 3D bevels (the SVG's radial highlight is the only permitted light effect).
- Don't place the mark on busy photography without a dark scrim.
- Don't use the mark below 48px (circle) / 56px (square).
- Don't substitute the serif. If Playfair Display isn't available, use the PNG.

---

## 7. Email signature — copy/paste block

```html
<table cellpadding="0" cellspacing="0" border="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1615;">
  <tr>
    <td style="padding-right:16px;vertical-align:top;">
      <img src="https://jayconsejo.com/branding/jdc-circle-dark-400.png"
           alt="JDC"
           width="72" height="72"
           style="display:block;border-radius:50%;">
    </td>
    <td style="vertical-align:top;">
      <div style="font-size:16px;font-weight:600;color:#1A1615;">Jay Consejo</div>
      <div style="font-size:13px;color:#6B625A;margin-top:2px;">AI, Web &amp; Systems Builder</div>
      <div style="font-size:13px;margin-top:8px;">
        <a href="https://jayconsejo.com" style="color:#A8886A;text-decoration:none;">jayconsejo.com</a>
        &nbsp;·&nbsp;
        <a href="https://www.linkedin.com/in/jayconsejo/" style="color:#A8886A;text-decoration:none;">LinkedIn</a>
      </div>
    </td>
  </tr>
</table>
```

Swap `jdc-circle-dark-400.png` for `jdc-square-dark-400.png` if you prefer the app-icon look, or `-light-` for a cream variant on dark email backgrounds.

---

## 8. Regenerating assets

SVGs are masters. PNGs are rendered via `render-branding.mjs` (headless Chrome + Google Fonts Playfair). To regenerate after editing an SVG:

```bash
node render-branding.mjs
```

Output goes to `public/branding/<variant>-<size>.png`.

---

## 9. Voice & tone (optional — for future use)

- **Direct over decorative.** "Shipped in weeks" > "delivered with uncompromising velocity."
- **Concrete numbers.** "4 products · 19 agents" beats "several projects."
- **Craft language.** "Built," "shipped," "wired up" over "leveraged," "synergized."
- **Warm, not performatively professional.** Addresses the reader as a peer, not a prospect.
