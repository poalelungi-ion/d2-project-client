# d2-project-client

React single-page app for the Study Progress Analysis (SPA) system. Lecturers
use it to import exam data files, review and correct records before saving,
and explore student and course analytics.

The API it talks to lives in a separate repository,
[`d2-project-backend`](https://gitlab.gwdg.de/sudarshan.bashyal/d2-project-backend).
This app holds no database access and no business rules of its own: it reaches
the backend only over HTTP, through `src/api/`.

## Stack

| Concern | Library |
| :--- | :--- |
| Language | TypeScript 5 (strict) |
| Framework | React 18 + Vite |
| Components | Material-UI (MUI) |
| Data grids | AG Grid |
| Charts | Recharts |
| Tests | Vitest + Testing Library |
| Linting | ESLint 9 + typescript-eslint (type-aware) |

## Layout

```
src/
  api/                 the only code that knows the backend exists
    client.ts          base URL, auth token, fetch helpers
    courses.ts         one module per backend router
    grades.ts
    stats.ts
    students.ts
    uploads.ts
    index.ts           import from here
  hooks/
    useAppLogic.tsx    shared application state and handlers
  components/
    features/          screens (AnalysisHub, BatchUploadWizard, ...)
    forms/             dialogs for creating and editing
  types.ts             the shapes the backend returns, and the form shapes
  utils/constants.ts   static UI values
  theme.ts             MUI theme, light and dark
  App.tsx              layout, navigation, screen switching
  vite-env.d.ts        the VITE_ variables this app reads
```

Components and hooks never call `fetch` directly. Every request goes through
`src/api/`, so the backend's address and credentials are configured in exactly
one place.

### Types

`src/types.ts` mirrors the JSON the FastAPI routers assemble, not the
SQLAlchemy models — the API flattens and aggregates on the way out, so a
`Course` carries a pass rate and a `Student` carries an exam count that exist
nowhere in the database. Request payload types sit next to the call that sends
them, in `src/api/*.ts`, mirroring the backend's `schemas.py`.

Every feature component takes the whole application state as its props, typed
as `AppState`. That type is derived from the hook itself
(`ReturnType<typeof useAppLogic>`), so the two cannot drift apart.

## Running it

```bash
npm install
npm run dev
```

The app is then on `http://localhost:5173` and expects a backend on
`http://localhost:8000`. Start that from the `d2-project-backend` repository:

```bash
cd ../d2-project-backend && docker compose up
```

To run the whole system from published images instead, use the compose file in
the sibling `docker-compose/` directory.

## Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Vite dev server on 5173 |
| `npm run build` | `tsc -b` then `vite build` — a type error fails the build |
| `npm run preview` | Serve the built bundle locally |
| `npm run typecheck` | `tsc -b`, no bundle |
| `npm run lint` | ESLint, type-aware |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |

## Configuration

Copy `.env.example` to `.env` to point the app somewhere other than a local
backend.

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Root of the backend API |
| `VITE_API_TOKEN` | `sse-staff-token` | Bearer token for mutating endpoints |

`VITE_API_TOKEN` must match the backend's `API_TOKEN`.

Three things to know about these values:

* Vite inlines `VITE_`-prefixed variables **at build time**. A production image
  must be built with the values it will run against; setting them on an
  existing build has no effect. The Dockerfile takes both as build args.
* `VITE_API_BASE_URL` is resolved by the **browser**, not from inside the
  container, so it must be an address the user's browser can reach.
* `VITE_API_TOKEN` ends up **inside the JavaScript bundle**, which anyone can
  read. It gates casual access, not determined access; treat it as public and
  do not reuse it as a secret anywhere else.

## Docker

One Dockerfile, two targets:

```bash
docker build --target dev .   # Vite dev server on 5173, hot reload
docker build .                # type-checked production bundle on nginx, port 5173
```

The default target is `production`: `npm run build` runs `tsc -b` first, so a
type error fails the image rather than shipping. The result is static assets
served by nginx with an SPA fallback, on port 5173 so the published port
matches what the compose files already expose.

To build against a different backend:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.org/api \
  --build-arg VITE_API_TOKEN=... .
```

The root `docker-compose.yml` builds the `dev` target and bind-mounts the
source, so edits hot-reload. The registry stack in `docker-compose/` runs the
published production image.

## Tests

```bash
npm test          # once
npm run test:watch
```

`src/api/client.test.ts` covers the contract with the backend: the URL each
call builds, its method, and whether it carries the bearer token.
