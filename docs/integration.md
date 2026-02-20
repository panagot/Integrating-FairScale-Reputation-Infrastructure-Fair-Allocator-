# FairScale API Integration

This document describes how Fair Allocator uses the FairScale Score API: endpoint, request/response shape, how the app uses each field, how to get an API key, and rate-limit considerations for production.

---

## API Used: GET /score

Fair Allocator uses a single FairScale endpoint:

| Item | Value |
|------|--------|
| **Base URL** | `https://api.fairscale.xyz` |
| **Endpoint** | `GET /score` |
| **Query** | `wallet` — Solana wallet address (required) |
| **Auth** | Header: `fairkey: <your-api-key>` |

**Example request:**

```http
GET https://api.fairscale.xyz/score?wallet=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
fairkey: your_fairkey_here
```

Without an API key, the app does not call the API; it uses deterministic mock scores for demo mode.

---

## Request shape

- **Method:** GET  
- **URL:** `{API_BASE}/score?wallet={encodeURIComponent(wallet)}`  
- **Headers:** `fairkey: <api-key>` when using the real API  

No request body.

---

## Response shape

The app expects a JSON object compatible with the following (see also [FairScale API docs](https://docs.fairscale.xyz/)):

| Field | Type | Description |
|-------|------|-------------|
| `wallet` | string | Normalized wallet address |
| `fairscore_base` | number | Base on-chain score component |
| `social_score` | number | Social/signals component |
| `fairscore` | number | **Combined FairScore (0–100)** — primary value used for ranking |
| `tier` | string | `"bronze"` \| `"silver"` \| `"gold"` \| `"platinum"` |
| `badges` | array | List of badge objects (see below) |
| `timestamp` | string | ISO timestamp of score computation |
| `features` | object? | Optional breakdown/features (see below) |

**Badge object:**

- `id` (string), `label` (string), `description` (string), `tier` (string)

**Features object (optional):**

- `wallet_age_days`, `tx_count`, `active_days`, `median_gap_hours`
- `native_sol_percentile`, `major_percentile_score`, `lst_percentile_score`, `stable_percentile_score` (0–1 or percentile values per FairScale docs)

---

## How the app uses FairScore, tier, badges, and features

| Data | Usage in Fair Allocator |
|------|---------------------------|
| **fairscore** | Primary sort key (ranked by score descending). Compared to round’s **minFairScore** to mark applicants as eligible (✓) or ineligible. Exported in CSV. |
| **tier** | Shown in the “Tier” column (Bronze/Silver/Gold/Platinum) with tier-specific styling. |
| **badges** | Rendered as pills in the “Badges” column; tooltip shows `description`. Exported as semicolon-separated labels in CSV. |
| **features** | Shown in the expandable “Details” row: base score, social score, wallet age (days), tx count, active days, SOL percentile. Used for transparency and manual review. |
| **fairscore_base**, **social_score** | Displayed in the expanded details and in CSV export (Base, Social columns). |
| **timestamp** | Stored on the applicant for reference; can be used to show “last scored” in future UI. |

---

## How to get an API key

- **URL:** [https://sales.fairscale.xyz/](https://sales.fairscale.xyz/)
- Fair Allocator supports:
  - **Build-time:** set `VITE_FAIRSCALE_API_KEY` in `.env` (see `.env.example`).
  - **Runtime:** user enters the key in Settings; it is stored in `localStorage` and sent as the `fairkey` header on each Score API request.

---

## Rate limits and production

- The FairScale API is subject to **rate limits** (e.g. free tier on the order of 1,000 requests/month; confirm current limits at [sales.fairscale.xyz](https://sales.fairscale.xyz/) and [docs.fairscale.xyz](https://docs.fairscale.xyz/)).
- Fair Allocator calls **one GET /score per wallet** when you click “Add & score.” For rounds with many applicants, this can:
  - Hit rate limits if many users or many wallets are scored in a short time.
  - Make the UI feel slow due to sequential or unbatched requests.

**Recommendation for production at scale:** Use **server-side or batch scoring**:

- Backend service (or serverless function) calls the FairScale Score API (or a batch endpoint if FairScale provides one).
- Backend caches scores per wallet and optionally supports “score this list of wallets” or “refresh scores for this round.”
- Frontend calls your backend instead of FairScale directly, so the API key stays server-side and rate limits are managed in one place.

This is documented as a **future improvement** for scalability in the [main README](../README.md#scalability-note).
