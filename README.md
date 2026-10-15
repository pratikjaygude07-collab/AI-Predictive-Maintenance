# MainAI

MainAI is a software-only industrial monitoring demonstration for electric
motors, bearings, and other rotating machinery. It provides a responsive
command-center interface backed by deterministic, seeded sample data.

The project does not connect to equipment or provide real AI predictions.
Readings and signal plots are labelled **SIMULATED DATA**.

## Prerequisites

- Node.js 22.6 or later (the test command uses Node's TypeScript type stripping;
  Node.js 24 is used for current verification)
- npm
- A modern browser; the Digital Twin requires WebGL 2 for its interactive
  viewer. Other Diagnostics and asset information remain available if WebGL is
  unavailable.

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development server
supports hot reload.

## Commands

```bash
npm run dev       # Start the development server
npm test          # Run deterministic simulator and diagnostics tests
npm run lint      # Run ESLint
npm run build     # Create an optimized production build
npm run start     # Serve the production build (after npm run build)
```

The test suite uses Node's built-in test runner and TypeScript type stripping;
it does not require a separate test framework.

## Application routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Fleet KPIs, simulated operating-condition summary, temperature and vibration trends, maintenance review items, and equipment inventory |
| `/fleet` | Searchable, filterable, sortable equipment register with grid/list views and expandable asset details |
| `/machine` | Locally rendered procedural motor model, selectable components, simulated measurements, orbit/zoom, camera reset, and auto-rotate |
| `/diagnostics` | Deterministic illustrative vibration waveform, derived frequency spectrum, temperature trend, and educational fault-pattern references |

Dashboard and Fleet asset links carry the selected asset through the `assetId`
query parameter. Digital Twin and Diagnostics accept the same parameter, for
example `/diagnostics?assetId=MTR-006`. Unknown asset IDs do not replace the
route's default selection.

## Architecture

- **Next.js App Router** with TypeScript and React Server Components for route
  entry points.
- **`app/components/site-shell.tsx`** provides shared navigation, responsive
  mobile drawer, workspace context, and persistent DEMO MODE indicator.
- **`app/globals.css`** contains the dark industrial design system and
  responsive styles.
- **`lib/demo-data.ts`** defines shared fictional assets, deterministic seeded
  readings, filters, summaries, and dashboard trends.
- **`lib/digital-twin.ts`** contains component descriptions, viewer mode, and
  asset-derived measurement formatting.
- **`lib/diagnostics.ts`** generates deterministic simulated waveform samples,
  a discrete Fourier spectrum derived from those samples, temperature history,
  and educational fault-pattern text.
- **Digital Twin scene components** use Three.js, React Three Fiber, and Drei
  to render local procedural geometry without remote 3D assets.
- Charts are accessible inline SVG, avoiding a separate charting dependency.

## Demo-data and safety limitations

- Asset names and readings are fictional, deterministic demonstration data.
- Simulated temperature, vibration, speed, load, trend, waveform, and spectrum
  values are not live sensor telemetry and should not be used for operational
  decisions.
- The Diagnostics page explicitly reports **ML Model: Not Connected**. Its
  example patterns are educational only; the application does not diagnose
  faults, calculate predictions or confidence scores, or estimate remaining
  useful life.
- The Digital Twin is a static illustrative assembly. Camera auto-rotation is
  not machine motion. The local viewer needs WebGL 2; a text fallback is shown
  when the viewer cannot initialize.
- There is no backend, database, authentication, equipment connection, model
  training, or paid API integration.

## Dependency audit note

The configured npm registry currently reports five high-severity affected
package entries from one advisory (`GHSA-vfj7-8cjw-p6xm`) for transitive
`braces@3.0.3`, reached through the
development-only lint chain
`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` →
`micromatch`. The registry has no `braces@3.0.4` release, and `npm audit
fix --dry-run` proposes downgrading `eslint-config-next` to 14.2.35, which
would be incompatible with this Next.js 16 project. No automatic or breaking
dependency changes have been applied. `npm audit --omit=dev` reports zero
production dependency vulnerabilities; the development-tool advisory remains
unresolved.
