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
    client.ts          base URL, access token, fetch + refresh-on-401
    auth.ts            sign in, register, sign out
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
  stores/
    authStore.ts       the signed-in user and the session lifecycle
  utils/constants.ts   static UI values, incl. the university email domain
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

### Configuring the Backend API (Global vs. Local)

#### A. Global Configuration (Affects ALL users across all devices)
To configure the base API endpoint for all users globally, set `VITE_API_BASE_URL` in `.env` or in your container deployment:

1. **Runtime Container Environment (`/config.js` via `.env`)**:
   When running the production Nginx container via Docker Compose, `/docker-entrypoint.d/40-generate-config.sh` automatically reads `VITE_API_BASE_URL` from the container's environment (`.env`) and injects it into `/usr/share/nginx/html/config.js` at container boot.
   - **Advantage**: You can change `VITE_API_BASE_URL` in `.env` on your server and restart containers (`docker compose up -d`) **without needing to rebuild the image**.
   - Every visitor who opens the web app loads this global default automatically.

2. **Docker Compose & Build Arguments (Build-time)**:
   In `docker-compose.yml`, `VITE_API_BASE_URL` is also passed as a build argument:
   ```bash
   docker compose build --build-arg VITE_API_BASE_URL=https://api.example.org/api client
   ```

3. **Local Development Server (`.env` file)**:
   Set `VITE_API_BASE_URL=http://localhost:8000/api` in `.env` before running `npm run dev`.

#### B. Local In-Browser Setting (Rescue & Debugging Tool)
In case of connection issues or when testing against a different backend without reconfiguring the server:
- On the **Sign In / Registration** screen, click the **Settings (gear ⚙️)** icon button in the top-right header.
- Or when authenticated, open **Settings** from the user account menu or click the University logo.
- Under **Backend API Connection**, you can view the active URL, enter a custom target URL, click **Test Connection** to verify network reachability and CORS, and **Save & Apply**.
- **Scope**: The custom URL is stored in that specific browser's `localStorage` (`spa_api_base_url`) as a client-side override. Click **Reset Default** anytime to revert back to the global container default.

There is no API token here any more. Access is per-account: the user signs in,
and nothing secret is compiled into the bundle. See **Authentication** below.

### Backend CORS Configuration

The backend's `CORS_ORIGINS` in `.env` must list the exact origin(s) the client is accessed from in the browser:
- Localhost default: `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- Server deployment: `CORS_ORIGINS=http://<server-ip-or-domain>:5173` (or `https://<server-domain>`)

> **Note**: A wildcard (`*`) cannot be used because authentication uses credentialed requests with `httpOnly` refresh cookies (`credentials: 'include'`), which browsers strictly refuse on wildcard origins. Trailing slashes are automatically stripped by the backend. Set `COOKIE_SECURE=true` once running over HTTPS.

## Authentication

Everything below `/` except `/login` and `/register` requires a signed-in
user. `src/app/SessionGate.tsx` holds the three layout routes that arrange it:
`SessionGate` restores the session once on load, `RequireAuth` redirects anyone
without one, and `GuestOnly` keeps a signed-in user off the two forms.

### Where the tokens live

The **access token** is a module variable in `src/api/client.ts` and nowhere
else -- not `localStorage`, not a readable cookie. Both of those survive a page
load, which sounds convenient but means any script running on the page can read
the credential and keep it. A closure variable dies with the tab.

The **refresh token** is an `httpOnly` cookie the backend sets, scoped to
`/api/auth`. This app never sees it; `fetch` is called with
`credentials: 'include'` so the browser attaches it to the two endpoints that
need it.

So after a reload there is no credential at all, and `SessionGate` trades the
cookie for a new pair before any screen renders -- which is why there is a brief
spinner rather than a flash of the login form.

### Keeping the session alive

Access tokens last minutes. Two things renew them:

* `authStore` arms a timer from each response's `expires_in` and refreshes
  shortly before expiry, so a long upload is not interrupted.
* `client.ts` retries once on a 401, refreshing first. A failed refresh means
  the session is genuinely over, and the store clears the user so `RequireAuth`
  redirects.

Refresh tokens are single-use on the backend, and a second exchange of the same
one is treated as a stolen cookie -- it ends every session for that account. So
`refreshSession()` coalesces concurrent callers onto one in-flight request:
three panels loading at once must produce one rotation, not three.

### The email domain

`UNIVERSITY_EMAIL_DOMAIN` in `src/utils/constants.ts` mirrors the backend's
value of the same name. It exists to flag a wrong address before a round trip
and enforces nothing -- the backend re-checks every registration. Change both
together.

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
docker build --build-arg VITE_API_BASE_URL=https://api.example.org/api .
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

### Pre-commit hook

`.githooks/pre-commit` runs the pipeline's `quality` jobs (duplication,
complexity, unit tests) with the same commands and coverage floor, plus the
lockfile check `npm ci` makes and the e2e job's `npm run build:e2e`. That build
type-checks with `noUnusedLocals`/`noUnusedParameters` on, so it catches
unused variables. `npm install` enables it. It checks the staged files only,
so unstaged edits can't make it pass. It doesn't run the e2e tests themselves
or the approval check. Skip it once with `git commit --no-verify`.
