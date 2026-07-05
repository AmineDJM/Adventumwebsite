# Adventum Pharma — Website

Ultra-premium cinematic website for **Adventum Pharma**, an Algerian pharmaceutical
company focused on infectious disease care — HIV/antiretrovirals, hospital
therapeutics and public-health medicines — built as an immersive, dark,
scientific "medical OS" experience.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS** — design tokens for the midnight/bio-green/cyan palette
- **Framer Motion** — section reveals, staggered typography, micro-interactions
- **GSAP + ScrollTrigger** — scroll-scrubbed timelines, parallax, progress lines
- **Lenis** — smooth inertial scrolling, synced with ScrollTrigger
- **Three.js / React Three Fiber + Drei** — the hero's scientific 3D environment

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
    ThreeScientificScene.tsx  # R3F scene: particles, DNA helix, virions,
                              # molecular network, Algeria hologram, camera rig
  providers/SmoothScroll.tsx  # Lenis + GSAP ScrollTrigger integration
  ui/                   # GlassCard, SectionHeading, Buttons
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
