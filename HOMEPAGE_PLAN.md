# Nebula Home Page — Replication Plan

A complete, build-it-from-scratch spec to recreate this landing page **exactly** in a new project: navbar, every section, the color scheme, typography, animation system, and dependencies.

---

## 1. Tech stack & dependencies

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4 (CSS-first config via `@theme inline`, no `tailwind.config.js`) |
| Animation | `motion` (Framer Motion v12) + a lightweight CSS `Reveal` |
| Icons | `lucide-react`; custom SVG "3D" icons hand-rolled |
| Fonts | `next/font/google` — Geist Sans + Geist Mono |
| Utilities | `clsx` + `tailwind-merge` (`cn()`), `class-variance-authority` |
| shadcn primitives | `@radix-ui/react-tabs`, `@radix-ui/react-slot` |

Install:
```bash
npm i next@16 react@19 react-dom@19 motion lucide-react clsx tailwind-merge \
  class-variance-authority @radix-ui/react-tabs @radix-ui/react-slot
npm i -D tailwindcss@4 @tailwindcss/postcss typescript @types/node @types/react @types/react-dom
```

`lib/utils.ts` must export:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
```

---

## 2. Color scheme (the single most important part)

Theme is **dark-first**: `<html class="dark">` ships in SSR; a tiny inline script removes `.dark` only if `localStorage.theme === 'light'` (prevents flash). All colors are CSS variables that flip with the `.dark` class.

### Brand accents (constant in both themes)
| Token | Value | Use |
|---|---|---|
| `--accent-violet` | `#8b5cf6` | primary brand, nav active, dots |
| `--accent-fuchsia` | `#d946ef` | secondary brand, gradient mid |
| `--accent-cyan` | `#22d3ee` | tertiary brand, charts, pricing highlight |
| `--accent-amber` | `#f59e0b` | rare warm accent |
| Violet-600 CTA | `#7c3aed` (`bg-violet-600`) | the accent CTA pill |

### Light theme (`:root`)
```
--background #ffffff      --foreground #0a0a0f
--primary #0a0a0f         --primary-foreground #ffffff
--muted-foreground #64748b
--border rgba(0,0,0,.10)  --input rgba(0,0,0,.12)
--ring rgba(139,92,246,.55)   --radius .75rem
--surface-tint 0,0,0      (dark tint over light bg)
```

### Dark theme (`.dark`)
```
--background #07070b      --foreground #f5f5f7
--primary #ffffff         --primary-foreground #07070b
--muted-foreground #9095a3
--border rgba(255,255,255,.10)   --input rgba(255,255,255,.12)
--surface-tint 255,255,255   (light tint over dark bg)
```

**Key idea — `--surface-tint`:** all glass/grid/scrollbar effects use `rgba(var(--surface-tint), α)` so the same utility renders a dark tint on light backgrounds and a light tint on dark — one set of utilities, both themes. Selection: `rgba(139,92,246,.35)`.

### `.dark-island`
A scoped class that **forces a dark sub-tree** even in light mode (`--foreground:#f5f5f7; --surface-tint:255,255,255`). Used for the in-hero dashboard mock and the bento mini-diagrams so they always read as dark "screenshots."

---

## 3. Typography
- `--font-geist-sans` → body + display; `--font-geist-mono` → stats/labels/code-feel numbers.
- Headings: `font-semibold tracking-tight`, balanced (`text-balance`). Section H2 = `text-4xl sm:text-5xl`. Hero H1 = `text-[40px] sm:text-6xl md:text-7xl leading-[1.02]`.
- Body copy: `text-foreground/60`, `text-pretty`, `leading-relaxed`.
- Eyebrow labels: `text-xs uppercase tracking-widest text-foreground/40`.

---

## 4. Global CSS utilities (`app/globals.css`)
Define with Tailwind v4 `@utility`:
- **`glass`** — `linear-gradient(180deg, tint/.06, tint/.02)` + `1px tint/.10` border.
- **`glass-strong`** — tint/.10→/.04 fill, tint/.14 border.
- **`text-gradient`** — `linear-gradient(100deg, foreground 0%, #c4b5fd 50%, #d946ef 100%)` clipped to text.
- **`grid-bg`** — 60px×60px tint/.06 grid, radially masked at top.
- **`animate-fade-up`** — `fade-up` keyframe (opacity 0→1, y 12px→0), `cubic-bezier(.22,1,.36,1)`, `backwards`.
- Custom scrollbar (10px, tint/.12 thumb), smooth scroll, `scroll-padding-top:6rem` (clears fixed nav), and a `prefers-reduced-motion` block that kills all animation.

---

## 5. Page composition (`app/page.tsx`)
```
<div relative min-h-screen overflow-x-hidden>
  <AnimatedGradient />        // fixed -z-10 background
  <Nav />                     // fixed top pill
  <main>
    <Hero />                  // #home
    <Stats />
    <Bento />                 // #features
    <Workflow />             // #workflow
    <FeatureTabs />
    <Pricing />              // #pricing
    <CTA />                  // #cta
  </main>
  <Footer />
</div>
```
Anchor IDs (`#home #features #workflow #pricing #cta`) must match the nav links + scroll-spy.

---

## 6. Background — `AnimatedGradient`
Fixed full-screen, `-z-10`, `contain:strict`, `pointer-events-none`. Three radial blobs:
- violet `rgba(139,92,246,.28)` top-left (12% 18%)
- cyan `rgba(34,211,238,.22)` top-right (92% 8%)
- fuchsia `rgba(217,70,239,.22)` bottom-center (50% 110%)

Over it: a `grid-bg` layer at `opacity-50` and a vignette `radial-gradient(transparent 55%, rgba(7,7,11,.85) 100%)`.

---

## 7. Navbar — `Nav` (client)
A **floating dual-pill** header, `fixed inset-x-0 top-0 z-50`.

- **Main pill:** `bg-foreground text-background`, `rounded-full`, soft shadow. Holds logo + centered links + theme toggle.
- **Separate accent CTA pill:** `bg-violet-600 hover:bg-violet-500 text-white` with arrow icon, violet glow shadow.
- **Logo:** `LogoMark` (gradient-bordered rounded square w/ stylized "N" stroke + cyan live-dot) + stacked wordmark `NEBULA` / `AGENT PLATFORM` (violet, tracked).
- **Links:** Home, Features, Workflow, Pricing, Docs. Active link = `text-violet-500` + a growing 3px violet underline.
- **Scroll behaviors (two `useEffect`s):**
  1. **Shrink** past `scrollY > 24`: container `max-w-7xl → max-w-3xl`, padding tightens, wordmark collapses (`max-w-0 opacity-0`), link gaps shrink, CTA padding shrinks. All via `transition-[…] duration-500`.
  2. **Scroll-spy:** `IntersectionObserver` with `rootMargin: "-40% 0px -55% 0px"` sets the active section.
- **`ThemeToggle`:** crossfaded sun/moon, toggles `.dark` + persists to `localStorage`. Render-stable for SSR (moon shown until mounted).

---

## 8. Hero — `Hero` (client) — `#home`
- `BGPattern variant="dots"` (`size 28`, `fill rgba(var(--surface-tint),.22)`, `mask fade-edges`).
- **`ContainerScroll`** (motion) — scroll-linked 3D tilt: a "browser card" rotates `rotateX 20°→0`, scales, and translates up as you scroll. Card frame `#222` w/ `#6C6C6C` border, big layered shadow.
- **Title block:**
  - Pill badge: violet dot + "Nebula 2.0 agents now ship to production" + chevron, `glass`.
  - H1: `text-gradient` line "The operating system for" + a **rotating word** (motion spring, swaps every 2200ms through: AI-native teams / fast-moving builders / production agents / ambitious founders / shipping engineers).
  - Subcopy (`max-w-2xl text-foreground/60`).
  - Two CTAs: solid `bg-foreground` "Start building free" + arrow; `glass` "Watch the 90s tour" + play icon. Both `h-12 rounded-full`.
  - "Trusted by builders at" + logo row: Linear, Notion, Vercel, Stripe, Ramp, Cursor.
  - Staggered entrance via `animate-fade-up` with `animationDelay` 0/120/240/360ms.
- **`DashboardMock`** (the card contents, `.dark-island bg-zinc-950`): fake browser chrome (3 dots + URL `nebula.ai/workspace/agents`), 3-col sidebar (Agents active), main canvas with "Customer Triage Agent" header (Live / Auto-deploy chips), 3 metric tiles (Success 98.7%, Latency 842ms, Cost $0.0021), and a 48-bar "live traces" chart with violet→fuchsia→cyan gradient bars.

---

## 9. Stats — `Stats`
`max-w-7xl`, 2-col→4-col grid of `glass` tiles (`gap-px` for hairline dividers): **28M+** runs/day · **99.99%** uptime · **26** edge regions · **842ms** median latency. Values `text-3xl sm:text-4xl font-semibold`, labels uppercase tracked.

---

## 10. Features (Bento) — `Bento` — `#features`
Eyebrow pill (fuchsia dot, "What's inside") + H2 + subcopy, wrapped in `Reveal direction="left"`.

**12-col bento grid** (`auto-rows-[minmax(220px,auto)]`, `gap-4`) of `BentoCard`s (`glass rounded-3xl p-7`, hover lift `-translate-y-1` + lighten). Each card has an `Icon3D` + heading + copy + a mini-viz:
1. **Visual agent builder** (col-span-4, row-span-2, `orbit` icon) → `FlowDiagram`: 5 labeled glass nodes wired by a violet→cyan dashed SVG path on a dark-island grid.
2. **Sub-second routing** (col-span-2, `bolt`) → `LatencyChart` cyan area spark-line.
3. **Guardrails by default** (col-span-2, `shield`) → 6 compliance chips (SOC 2, GDPR, HIPAA, ISO 27001, PII, CSP).
4. **Deploy to 26 regions** (col-span-3, `globe`) → `RegionMap` violet dots on dark-island grid.
5. **Evaluations** (col-span-3, `chip`) → `EvalRows`: 3 rows w/ emerald→cyan progress bars (98/94/91%).
6. **Versioned prompts** (col-span-2, `stack`), **Live traces** (col-span-2, `wave`), **Auto-tuned prompts** (col-span-2, `spark`).

**`Icon3D`** = hand-built SVG (64×64) per name (spark/cube/shield/bolt/globe/chip/wave/stack/orbit), each with a 3-stop gradient palette, edge highlight, radial shine, blurred glow halo, and drop shadow.

---

## 11. Workflow — `Workflow` — `#workflow`
Eyebrow (cyan dot, "How it works") + H2, `Reveal direction="right"`. Then a 1→2→4-col grid of `glass` step cards (hover lift): **Compose / Evaluate / Deploy / Observe**, each with an `Icon3D` (spark/shield/globe/wave), a mono `01–04` index, title + body.

---

## 12. FeatureTabs — `FeatureTabs`
Wraps the shadcn **`Feature108`** block (Radix Tabs) in `Reveal`. Badge "Platform deep-dive", heading "Three pillars. One coherent platform." Three tabs (`lucide` icons): **Agent SDKs / Live Telemetry / Edge Network** — each with badge, title, description, button, and an Unsplash image (2-col split layout, `bg-muted` panel). Uses shadcn `Badge` + `Button`.

---

## 13. Pricing — `Pricing` — `#pricing`
Centered eyebrow (emerald dot) + H2 ("Find the **perfect plan**" — `perfect plan` in `text-cyan-400`) + subcopy, in `Reveal`. Three **`PricingCard`**s (from `animated-glassy-pricing`, which renders a WebGL `ShaderCanvas` backdrop that swaps black/white with the theme):
- **Starter $0** — 5k runs, 1 workspace, community, basic evals (secondary btn).
- **Team $49** — `isPopular`, unlimited workspaces, versioned prompts, PR-gated evals, 26-region deploy, SOC 2 + SSO (primary).
- **Business $199** — private VPC, HIPAA/FedRAMP, custom residency, dedicated support (primary).

---

## 14. CTA — `CTA` — `#cta`
`Reveal direction="right"` `glass-strong rounded-[32px]` panel with a radial violet+cyan glow background. H2 "Ship the agent. / **Then ship the next one.**" (2nd line `text-gradient`), subcopy, solid + glass buttons, and 3 emerald-dotted trust badges (SOC 2 Type II · 99.99% uptime · 4.9/5 G2).

---

## 15. Footer — `Footer`
`max-w-7xl`, top border. 6-col grid: brand col (`Logo` + tagline) + 4 link columns (Product / Resources / Company / Legal). Bottom bar: "© 2026 Nebula Labs, Inc." + Twitter / GitHub / Discord.

---

## 16. Animation system summary
- **`Reveal`** (no lib): single `IntersectionObserver` (disconnects after firing) → CSS opacity+transform transition. Props: `direction` (up/left/right/down), `delay`, `distance`, `duration`. Respects reduced-motion. This is the workhorse for section entrances.
- **`motion`**: hero rotating words (spring) + `ContainerScroll` scroll-linked tilt only.
- **CSS**: `animate-fade-up` for hero stagger; hover lifts on cards.

---

## 17. Recommended build order
1. Scaffold Next 16 + Tailwind v4, fonts in `layout.tsx`, theme-init script, `.dark` default.
2. Port **`globals.css`** verbatim (tokens + utilities) — everything depends on it.
3. `lib/utils.ts`, then primitives: `Logo`, `Icon3D`, `Reveal`, `BentoCard`, `ThemeToggle`, `BGPattern`, `button`, `badge`.
4. `AnimatedGradient` → `Nav` → `Hero` (+ `ContainerScroll`).
5. `Stats` → `Bento` → `Workflow` → `FeatureTabs` (+ `Feature108`) → `Pricing` (+ glassy pricing/ripple button) → `CTA` → `Footer`.
6. Wire `page.tsx`, verify anchor IDs vs nav scroll-spy, test light/dark + reduced-motion.

---

## 18. Asset / external checklist
- Geist + Geist Mono via `next/font/google` (no network asset).
- FeatureTabs images are Unsplash hotlinks — swap for owned/optimized `next/image` assets for production.
- `app/icon.svg` favicon.
- Metadata (title/description/OG) set in `layout.tsx`.
