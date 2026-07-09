# Adventum Pharma — Website

Ultra-premium cinematic website for **Adventum Pharma**, an Algerian pharmaceutical
company focused on infectious disease care — HIV/antiretrovirals, hospital
therapeutics and public-health medicines — built as an immersive, scientific
"medical OS" experience that the camera flies through on scroll.

Applies the official Adventum brand charter (blue `#0057B8` / teal `#087084` /
cyan `#68D2DF`, Calibri-family type), ships **light + dark themes** (system
default with a toggle) and a **4-language UI** (EN / FR / Hindi / Chinese).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS** — CSS-variable theme tokens (light/dark) + brand palette
- **Framer Motion** — section reveals, staggered typography, micro-interactions
- **GSAP + ScrollTrigger** — scroll-scrubbed timelines, parallax, progress lines
- **Lenis** — smooth inertial scrolling, synced with ScrollTrigger
- **Three.js / React Three Fiber + Drei** — the persistent scene the camera
  travels through, and the interactive "Infection Intelligence" explorer
- **i18n** — lightweight dictionary provider (EN/FR/HI/ZH), Carlito (Calibri
  clone) + Noto Sans Devanagari + system CJK fonts

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Structure

```
app/
  layout.tsx            # fonts (Inter / Space Grotesk / IBM Plex Mono), metadata, Lenis provider
  globals.css           # design-system utilities (.glass, .shell, .eyebrow, …)
  page.tsx              # single-page composition
components/
  Navbar.tsx            # fixed glass nav, scrollspy, mobile overlay menu
  Hero.tsx              # cinematic full-screen hero over the 3D scene
  InfectiologyFocus.tsx # therapeutic focus cards
  Mission.tsx           # Manufacturer → Regulatory → Hospital → Patient flow
  Portfolio.tsx         # portfolio / pipeline example molecules
  RegulatoryJourney.tsx # 8-step regulatory & market-access engine timeline
  MarketAccess.tsx      # hospital & tender channel console
  ScientificPlatform.tsx# six platform capabilities
  Partnerships.tsx      # partnership models for international manufacturers
  Vision.tsx            # Algeria → MENA particle map (2D canvas)
  Contact.tsx           # strategic partnership form
  Footer.tsx
  three/
    SceneBackdrop.tsx         # persistent full-page R3F "laboratory": DNA
                              # helices, virions, molecular networks, capsules,
                              # vials, holographic panels, hospital network,
                              # molecular lattice, Algeria hologram + the
                              # scroll-driven traveling camera rig
    SceneBackdropClient.tsx   # lazy-load wrapper (code-splits Three.js)
  providers/SmoothScroll.tsx  # Lenis + GSAP ScrollTrigger integration
  ui/                   # GlassCard, SectionHeading, Buttons, AdventumMark,
                        # SquareMosaic (brand tile motif)
lib/
  anim.ts               # shared easing / motion variants
  geo.ts                # stylized Algeria outline + regional map data
```

## Performance & fallbacks

- 3D scene lazy-loads client-side only (`ssr: false`), with a gradient
  fallback when WebGL is unavailable and reduced particle counts on
  mobile / low-core devices.
- `prefers-reduced-motion` disables smooth scroll, camera parallax and
  particle reveals.
- The regional map is a DPR-aware 2D canvas — no second WebGL context.

## Content note

All product references (e.g. dolutegravir, raltegravir, darunavir) are
presented as portfolio / pipeline focus examples only. No approval,
certification or availability claims are made; availability depends on
registration status in each market.
