# NOVORA — Premium Football Jersey Shopify Theme

> Wear Your Passion. Represent Your Colors.

A production-ready, conversion-optimized **Shopify Online Store 2.0** theme for a
premium football (soccer) jersey brand. Built with Liquid, modern CSS, and
dependency-free vanilla JavaScript. Luxury aesthetic, mobile-first, fast.

Novora is an **independent apparel brand**. The theme is intentionally designed
with original branding and carries no official affiliation with FIFA or any
national football federation.

---

## 📦 What's in the box

```
.
├── assets/
│   ├── base.css              # Design tokens, reset, typography, buttons, utilities
│   ├── component.css         # Header, hero, sections, product cards, footer
│   ├── product.css           # Product page, cart drawer, popups, drawers
│   └── global.js             # All interactivity (cart, variants, animations, CRO)
├── config/
│   ├── settings_schema.json  # Theme editor settings (colors, type, cart, CRO…)
│   └── settings_data.json    # Default values (clay + gold + electric-blue palette)
├── layout/
│   ├── theme.liquid          # Main layout
│   └── password.liquid       # "Coming soon" password page layout
├── locales/
│   └── en.default.json       # All copy / translation strings
├── sections/                 # 25 modular, editor-friendly sections
├── snippets/                 # Reusable partials (icons, product card, cart, popups…)
└── templates/                # JSON templates + customer account templates
```

## 🎨 Design system

| Token        | Value     | Usage                                   |
|--------------|-----------|-----------------------------------------|
| Matte Black  | `#0A0A0A` | Text, dark sections, buttons            |
| Clay White   | `#F4F1EA` | Page background (warm, premium)         |
| Pure White   | `#FFFFFF` | Cards / surfaces                        |
| Metallic Gold| `#D4AF37` | Primary accent, CTAs, highlights        |
| Electric Blue| `#00C2FF` | Secondary highlight, focus states       |

All tokens are editable live in **Theme Editor → Theme settings**. Fonts default
to **Archivo** (headings) + **Assistant** (body) via Shopify's font library.

## 🏠 Homepage sections (in order)

1. **Hero** — full-screen, animated floating SVG paths, char-by-char headline reveal, parallax overlay, scroll indicator, stats.
2. **Featured Teams** — country-inspired collection grid with flag-accent bars + hover.
3. **Jersey Showcase** — the **stacked "front box"** of jerseys + a clickable price rail below.
4. **Best Sellers** — horizontal premium product slider with quick-add, rating, wishlist.
5. **Why Choose Novora** — animated feature icons.
6. **Promo Banner** — cinematic banner with live **countdown timer**.
7. **Testimonials** — verified-buyer review carousel.
8. **Social Gallery** — Instagram-style lifestyle grid.
9. **Newsletter** — first-order discount signup.

Add / remove / reorder any section in the Theme Editor. Most sections ship with
`presets` so they can be added to any JSON template.

## 🛍️ Product page highlights

Large zoom gallery · sticky add-to-cart · size & color pickers · quantity ·
delivery estimate · trust badges · **bundle tiers (Buy 2/3/4 save 10/20/30%)** ·
**Frequently Bought Together** · accordion (description, details, size guide,
shipping) · low-stock bar · live visitor counter · related products · recently
viewed.

## 🛒 Cart, conversion & social proof

Slide-out **cart drawer** with free-shipping progress bar, upsells, coupon field,
and express-checkout buttons · exit-intent / first-order **discount popup** ·
**recent-purchase toasts** (pulled from real products) · wishlist (localStorage) ·
predictive search · sticky transparent→solid header with mega menu.

---

## 🔌 React component integration — how it was handled

This task included two React/shadcn components (`display-cards.tsx` and
`background-paths.tsx`). **This repository is a Shopify theme, not a React/
Tailwind/shadcn project**, so a literal `components/ui/` integration does not
apply. Instead, both designs were **faithfully re-implemented in native Liquid +
CSS + JS** so they run inside Shopify with **zero JS dependencies** (no
`framer-motion`, no `lucide-react`, no build step):

| Original React component | Translated to | Notes |
|--------------------------|---------------|-------|
| `background-paths.tsx` (animated SVG paths + framer-motion) | `snippets/background-paths.liquid` (used in `sections/hero.liquid`) | The 36-path math is reproduced in Liquid; motion is pure CSS (`@keyframes dashFlow`), respecting `prefers-reduced-motion`. |
| `display-cards.tsx` (stacked, skewed, grayscale-on-hover cards) | `.stack` / `.stack-card` in `sections/jersey-showcase.liquid` + `assets/component.css` | The skew/translate/grayscale stack + hover lift is reproduced in CSS; each card is a real merchandised jersey link. |
| `lucide-react` icons | `snippets/icon.liquid` | Inline SVG icon set (cart, search, star, shield, etc.). |
| shadcn `button` | `.btn` utility classes | `base.css` button system with luxury shimmer/hover. |

> If you instead want these as real React components in a separate app, scaffold
> with `npx shadcn@latest init` (which sets up Tailwind + TS and the
> `components/ui/` path — important because shadcn's CLI and generated imports
> resolve to `@/components/ui`), then `npx shadcn@latest add button` and drop the
> two files into `components/ui/`, and `npm i framer-motion lucide-react`.

## 🖼️ Images (you add your own)

The theme ships with **no bundled photos** — every image slot uses a clean
Shopify placeholder until you upload your own. Add images in the **Theme
Editor**:

- **Hero:** Home page → Hero → *Background image*
- **Jersey Showcase ("front box" + rail):** Home page → Jersey Showcase → each
  *Jersey* block → *Jersey photo*
- **Featured Teams / Promo / Social Gallery:** their respective sections → upload
  on each block

Product cards across the store use your **product images** automatically, so
once your products have photos, collections and sliders fill in on their own.

---

## 🚀 Install

**Option A — Upload (recommended)**
1. Zip the contents of this repo (the folders `assets/`, `config/`, `layout/`,
   `locales/`, `sections/`, `snippets/`, `templates/` must be at the zip root).
2. Shopify Admin → **Online Store → Themes → Add theme → Upload zip file**.
3. **Customize** to configure, then **Publish**.

**Option B — Shopify CLI**
```bash
shopify theme dev      # local preview against your store
shopify theme push     # upload to your store
```

### First-run setup
- **Navigation:** create a `main-menu` (with nested items for the mega menu) and
  a `footer` menu under **Online Store → Navigation**.
- **Collections:** create team collections (Portugal, Brazil, …) and assign them
  in *Featured Teams* + *Best Sellers* + cart upsell (Theme settings → Cart).
- **Products:** add jerseys with size/color variants and multiple images.

## ⚡ Performance & accessibility

- Dependency-free JS, lazy-loaded responsive images (`srcset`/`sizes`), no layout
  shift, deferred animations via `IntersectionObserver`.
- Semantic HTML, skip-link, focus-visible styles, ARIA on drawers/dialogs,
  `prefers-reduced-motion` honored, WCAG-minded contrast.
- SEO: Open Graph/Twitter meta + Product & Organization JSON-LD (`snippets/meta-tags.liquid`).

Built to target **Lighthouse 95+** on a well-configured store.
