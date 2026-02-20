# How FairScore is Central to Fair Allocator

Fair Allocator uses [FairScale](https://fairscale.xyz/) FairScore (0–100) and reputation tiers as **core product logic**, not decoration. The same logic applies across all round types (grants, airdrops, allowlists, bounties, DAO, community/events). Below is how FairScore drives access, eligibility, ranking, allocation, and risk.

---

## (a) Gating by reputation

**Committee verification:** Creating a new grant round and exporting CSV are **gated** by FairScore. The committee must prove reputation once per session:

- In **Settings**, the committee enters a Solana wallet.
- The app fetches that wallet’s FairScore via the FairScale Score API.
- **Create round** and **Export CSV** are only enabled when the committee wallet has **FairScore ≥ 40** or **tier ≥ silver**.

Without meeting this threshold, the UI shows “Unlock” messaging and the Create round / Export actions remain disabled. This ensures that privileged actions (creating rounds, exporting data) are restricted to users with sufficient on-chain and social reputation.

---

## (b) Eligibility by minimum FairScore

Each grant round has a **minimum FairScore** (0–100). Applicants are marked **eligible** only if their FairScore is at or above this threshold. This is a direct use of FairScore in product logic: low-reputation wallets are excluded from eligibility by design.

---

## (c) Ranking by FairScore

Applicants in a round are **ranked by FairScore** (descending). The table and CSV export both use this ordering, so higher-reputation applicants appear first and allocation decisions can follow a clear credibility order.

---

## (d) Allocation weighting by FairScore

Rounds can use an **allocation mode**:

- **Binary:** Only eligibility (above/below min FairScore) is used.
- **Weighted:** Among **eligible** applicants, **suggested grant amounts** are proportional to FairScore. Each applicant’s share of the round budget is  
  `(applicant FairScore / sum of eligible FairScores) × total budget`.

So allocation is explicitly **credibility-weighted**: higher FairScore implies a larger suggested share of the round budget. The UI shows a **Suggested allocation** column and the CSV includes this column when the round is in weighted mode.

---

## (e) Risk signal: low-score applicants flagged

Applicants with **low FairScore** are surfaced as a **risk signal**:

- Anyone **below** the round’s minimum FairScore is marked ineligible and can be flagged.
- Applicants with **FairScore &lt; 25** (or ineligible) are explicitly labeled **“Low score”** in the table and in the CSV **Risk** column.

This uses FairScore as a **reputation signal for risk management**: committees can quickly see which applicants carry higher risk based on on-chain and social reputation.

---

## Summary

| Area              | How FairScore is used                                      |
|-------------------|------------------------------------------------------------|
| **Gating**        | Committee must have FairScore ≥ 40 or tier ≥ silver to create rounds and export CSV. |
| **Eligibility**   | Per-round min FairScore; only applicants at or above are eligible. |
| **Ranking**       | Applicants ordered by FairScore (descending).              |
| **Allocation**    | Optional weighted mode: suggested amounts ∝ FairScore among eligible. |
| **Risk**          | Low-score applicants flagged (“Low score” / Risk column). |

FairScore is required for committee verification, drives eligibility and ranking, optionally weights suggested allocations, and powers risk flags—making it central to how Fair Allocator works.

---

## Code snippets (how we call FairScale)

**1. Committee gating check** — before allowing Create round or Export, we fetch the committee wallet’s score and require FairScore ≥ 40 or tier ≥ silver:

```ts
const res = await fetch(
  `https://api.fairscale.xyz/score?wallet=${encodeURIComponent(wallet)}`,
  { headers: { fairkey: API_KEY } }
);
const data = await res.json();
const canCreate = data.fairscore >= 40 || tierMeetsMinimum(data.tier, "silver");
```

**2. Per-wallet score fetch** — when adding an applicant, one API call per wallet:

```ts
const response = await fetch(
  `https://api.fairscale.xyz/score?wallet=${encodeURIComponent(wallet)}`,
  { headers: { fairkey: getStoredApiKey() } }
);
const { fairscore, tier, badges, fairscore_base, social_score, features } = await response.json();
// Store and rank by fairscore; mark eligible if fairscore >= round.minFairScore
```

**3. Weighted allocation formula** — among eligible applicants, suggested amount ∝ FairScore:

```ts
const scoreSum = eligibleApplicants.reduce((s, a) => s + a.fairScore, 0);
const suggestedAmount = (applicant.fairScore / scoreSum) * round.totalBudget;
```
