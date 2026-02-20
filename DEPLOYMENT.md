# Deployment

Instructions for building and deploying Fair Allocator to a static host.

---

## Build

| Item | Value |
|------|--------|
| **Build command** | `npm run build` |
| **Output directory** | `dist` |

Ensure Node.js 18+ and run from the project root:

```bash
npm install
npm run build
```

The production assets will be in `dist/` (e.g. `dist/index.html`, `dist/assets/`).

---

## Recommended hosting

The app is a static Vite/React SPA. Suitable hosts include:

- **Vercel** — Connect the repo; set build command to `npm run build` and output directory to `dist`. No extra config needed for a default Vite SPA.
- **Netlify** — Build command: `npm run build`, Publish directory: `dist`.

Both support client-side routing: ensure **redirects** are set so that routes (if any) fall back to `index.html` (e.g. `/* /index.html 200`). Vite’s default single-entry SPA usually needs this for deep links.

---

## Environment variables (production)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FAIRSCALE_API_KEY` | No | FairScale API key (fairkey). If set, the app uses the real Score API instead of demo mock scores. Get a key at [sales.fairscale.xyz](https://sales.fairscale.xyz/). |

- **Optional:** If you do not set this, users can still enter an API key in the app (Settings); it is stored in `localStorage`.
- **Security note:** `VITE_*` variables are embedded in the client bundle. For high-security setups, prefer server-side scoring (see [README – Scalability note](./README.md#scalability-note) and [docs/integration.md – Rate limits](./docs/integration.md#rate-limits-and-production)).

---

## Health / version (optional)

The app is a static frontend and does not include a dedicated health or version HTTP endpoint. For monitoring:

- Use the host’s default health checks on the root URL (e.g. `GET /` returning 200).
- To expose a version, you could add a small `version.json` or a build-step-generated `config.js` with a version field and document its URL for judges or ops.
