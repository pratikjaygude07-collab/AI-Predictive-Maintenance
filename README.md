# MainAI

MainAI is a Next.js interface for industrial predictive maintenance. It
currently includes a locally rendered, illustrative electric-motor model;
it does **not** connect to equipment, display live telemetry, or make
predictions.

Dashboard, Fleet, and Diagnostics show explicit unavailable states until
their real data sources are integrated. The application does not substitute
mock data when a service is absent. Do not use this frontend for operational
decisions until a verified backend and prediction service are connected.

## Prerequisites

- Node.js 22.6 or later
- npm
- A modern browser; the Digital Twin viewer requires WebGL 2. Component
  descriptions remain available if WebGL cannot initialize.

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev       # Start the development server
npm test          # Run the focused digital-twin tests
npm run lint      # Run ESLint
npm run build     # Create an optimized production build
npm run start     # Serve the production build
```

## Routes

| Route | Current behavior |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Reports that plant, sensor, alerts, and maintenance data are unavailable |
| `/fleet` | Reports that no equipment inventory source is connected |
| `/machine` | Interactive local motor illustration; explicitly not linked to an asset or telemetry |
| `/diagnostics` | Reports that sensor telemetry and the prediction service are unavailable |

Fleet remains in navigation because it is a useful equipment-register surface
and is directly linked to the maintenance workflow. Its data is not populated
with fictional assets.

## Architecture and integrations

- Next.js App Router with TypeScript and React Server Components for route
  entry points.
- `app/components/site-shell.tsx` provides the shared navigation and responsive
  mobile drawer.
- `app/globals.css` contains the dark industrial design system and responsive
  styles.
- `app/components/ui/data-state.tsx` contains distinct loading, empty, error,
  and API-unavailable states. Route loading skeletons and an application error
  boundary provide accessible recovery and status messaging.
- `app/components/digital-twin/` renders a procedural motor illustration
  locally with Three.js, React Three Fiber, and Drei.
- `lib/digital-twin.ts` contains model component descriptions and the WebGL
  support mode.

The motor viewer uses a shadow-casting key light with ambient, hemisphere,
rim, and fill lighting. Keyboard users can focus the model and use arrow keys
to orbit and `+` / `-` to zoom; the component list, auto-rotate, and reset
controls are also keyboard-operable. Reduced-motion preferences disable
auto-rotation and decorative motion.

There is currently **no backend or API integration**: no API base URL,
request/service layer, authentication, environment configuration, equipment
or sensor endpoint, prediction/diagnostics endpoint, OpenRouter integration,
or Mercury Decide integration. No API URL or environment variable is assumed
or fabricated. Add server-side configuration and an explicit typed API
contract when the backend is available; keep private credentials out of
client-side code and `NEXT_PUBLIC_*` variables.

The 3D model is illustrative geometry, not a digital representation of a
registered or measured machine. It does not imply a live connection.

## Deployment

The project uses Next.js and the standard `npm run build` command, so Vercel
can detect it as a Next.js application. The application currently needs no
runtime API environment variables. Configure the actual backend and prediction
service integrations before presenting live monitoring or deploying as an
operational predictive-maintenance tool.
