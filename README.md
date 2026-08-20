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
| Framework | React 18 + Vite |
| Components | Material-UI (MUI) |
| Data grids | AG Grid |
| Charts | Recharts |
| Tests | Vitest + Testing Library |

## Layout

```
src/
  api/                 the only code that knows the backend exists
    client.js          base URL, auth token, fetch helpers
    courses.js         one module per backend router
    grades.js
    stats.js
    students.js
    uploads.js
    index.js           import from here
  hooks/
    useAppLogic.jsx    shared application state and handlers
  components/
    features/          screens (AnalysisHub, BatchUploadWizard, ...)
    forms/             dialogs for creating and editing
  utils/constants.js   static UI values
  theme.js             MUI theme, light and dark
  App.jsx              layout, navigation, screen switching
```

Components and hooks never call `fetch` directly. Every request goes through
`src/api/`, so the backend's address and credentials are configured in exactly
one place.

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

## Configuration

Copy `.env.example` to `.env` to point the app somewhere other than a local
backend.

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Root of the backend API |
| `VITE_API_TOKEN` | `sse-staff-token` | Bearer token for mutating endpoints |

`VITE_API_TOKEN` must match the backend's `API_TOKEN`.

Two things to know about these values:

* Vite inlines `VITE_`-prefixed variables **at build time**. A production image
  must be built with the values it will run against; setting them on an
  existing build has no effect.
* `VITE_API_BASE_URL` is resolved by the **browser**, not from inside the
  container, so it must be an address the user's browser can reach.

## Tests

```bash
npm test          # once
npm run test:watch
```

`src/api/client.test.js` covers the contract with the backend: the URL each
call builds, its method, and whether it carries the bearer token.

## Notes

The Docker image runs the Vite **dev server**, because the compose stack
expects the app on port 5173. Serving a production build behind a static web
server would be the better deployment, but that changes the contract with
`docker-compose/` and so is left as a separate change.
