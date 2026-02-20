# Fair Allocator

**The execution layer for FairScore on Solana.** Fair Allocator transforms FairScore into executable funding decisions—one sybil-resistant engine for grants, airdrops, allowlists, bounties, DAOs, and access control. [FairScale](https://fairscale.xyz/).

Fair Allocator is a React (Vite) app that uses FairScale’s Score API to rank Solana wallets and allocate (or gate) by credibility. Create rounds (with policy templates), set a minimum FairScore, add wallets, get ranked lists with risk tiers (🟢 Healthy / 🟡 Borderline / 🔴 Likely Sybil), optional suggested allocations, and manual overrides with reason. Export CSV or JSON; share rounds via link. FairScore is the brain: gating, eligibility, ranking, weighting, and risk all depend on it.

---

## Use cases (one engine, many applications)

| Use case | What you get |
|----------|----------------|
| **Grants** | Rank applicants by FairScore; allocate funds to genuine builders; optional weighted suggested amounts. |
| **Airdrops** | Token distribution by credibility; weight amounts by score or take top N. |
| **Allowlists** | NFT mints, IDOs: who gets a spot; export allowlist by min score. |
| **Bounties** | Prioritize payouts by reputation; filter farmers from contributors. |
| **DAO** | Gate proposals or weight votes by FairScore; sybil-resistant governance. |
| **Community / events** | Gated access: only wallets above a score get in; export access list. |

---

## Why Fair Allocator?

**Problem:** Airdrops and grant programs are heavily gamed. FairScale’s data: 60%+ of airdrops deliver negative ROI; 90% of tokens are dumped within a week; &lt;5% of whitelist participants contribute meaningfully. Allocating without reputation leads to funds going to sybils and mercenary farmers instead of real builders.

**Audience:** Grant committees, airdrop operators, NFT/IDO teams, bounty platforms, DAOs, and community managers who want to score participants by on-chain and social reputation. Fair Allocator lets you choose a round type (grant, airdrop, allowlist, bounty, DAO, community), set a minimum FairScore per round, add wallets, fetch scores in one click, and export ranked, eligibility-marked CSV (with optional suggested allocations).

---

## How FairScale / FairScore Is Used

Fair Allocator integrates with the **FairScale Score API**:

| What | Details |
|------|--------|
| **Endpoint** | `GET https://api.fairscale.xyz/score?wallet={address}` |
| **Auth** | Header `fairkey: <your-api-key>` (optional: without key, app uses demo mock scores) |
| **Logic** | On “Add & score,” the app calls the API once per wallet, maps the response to applicants (fairscore, tier, badges, features), ranks by FairScore, and marks eligible vs ineligible using the round’s minimum FairScore. |

**Endpoints and logic:**

- **GET /score** — Single wallet lookup. Request: `?wallet=` (Solana address). Response: `fairscore` (0–100), `fairscore_base`, `social_score`, `tier` (bronze/silver/gold/platinum), `badges[]`, `features` (e.g. wallet_age_days, tx_count, active_days, percentiles). The app uses `fairscore` for ranking and eligibility, `tier` and `badges` in the UI, and `features` in the expandable “Details” row.

See **[Integration & API docs](./docs/integration.md)** for request/response shapes, how to get an API key, and rate limits.

**→ [How FairScore is central to Fair Allocator](./INTEGRATION.md)** — Gating by reputation, eligibility by min FairScore, ranking by FairScore, allocation weighting by FairScore, and risk signals for low-score applicants.

---

## Live demo

**Live app:** [https://fair-allocator.vercel.app](https://fair-allocator.vercel.app) *(or TBD — update with your deployed URL)*

---

## Prerequisites

- **Node.js 18+** (LTS recommended)
- npm (or pnpm/yarn)

---

## Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/FairScale/fair-allocator.git
   cd fair-allocator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Optional: FairScale API key**  
   For real Score API (instead of demo mock scores), either:
   - Copy `.env.example` to `.env` and set `VITE_FAIRSCALE_API_KEY=your_fairkey_here`, or  
   - Enter your key in the app under **API key** (Settings). It is stored in `localStorage`.

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open the URL shown (e.g. http://localhost:5173).

5. **Production build**
   ```bash
   npm run build
   ```
   Output is in `dist/`. Preview with `npm run preview`.

---

## Deployment

- **Build command:** `npm run build`  
- **Output directory:** `dist`  
- **Hosting:** Suited for static hosts (e.g. **Vercel**, **Netlify**). Configure the project to use the build command and publish the `dist` folder.  
- **Env in production:** Set `VITE_FAIRSCALE_API_KEY` in the host’s environment variables if you want the live Score API without users entering a key in the UI.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for build command, output dir, recommended hosting, and env vars.

---

## FairScale resources

- **Docs:** [https://docs.fairscale.xyz/](https://docs.fairscale.xyz/)
- **API access / API key:** [https://sales.fairscale.xyz/](https://sales.fairscale.xyz/)  
- **Score API reference:** [docs.fairscale.xyz/docs/api-score](https://docs.fairscale.xyz/docs/api-score) (or equivalent in current docs)

---

## Architecture note

- **Current:** Frontend-only; rounds and committee state in `localStorage`; one FairScale Score API call per wallet. No backend — deploy as static site (Vercel, Netlify).
- **Extensible:** Rounds and scoring can move to a backend later for persistent multi-user rounds and batch scoring. FairScale logic lives in `src/fairscale.ts`.

## Scalability note

For **many applicants per round**, calling the FairScale Score API once per wallet from the browser can hit rate limits and slow the UI. For production at scale, consider:

- **Server-side or batch scoring:** A backend service that calls the FairScale API (or a batch endpoint if available), caches results, and exposes a single “score this round” or “score these wallets” endpoint. The frontend would then request precomputed scores instead of one request per wallet.

This is documented as a **future improvement** in [docs/integration.md](./docs/integration.md#rate-limits-and-production).

---

## License

MIT (or add your preferred license file and reference it here.)
