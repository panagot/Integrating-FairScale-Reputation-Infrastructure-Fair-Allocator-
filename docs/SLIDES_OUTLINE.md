# Slide Deck Outline (Fairathon Pitch)

**Target: 8–10 slides.** Bold visuals; FairScale branding nods. Emphasize FairScore integration and “canonical app” positioning.

---

## Slide 1 — Title

- **Headline:** The execution layer for FairScore on Solana.
- **Sub:** Fair Allocator transforms FairScore into executable funding decisions — one sybil-resistant engine for grants, airdrops, allowlists, bounties, DAOs, and access control.
- **Visual:** App logo or hero screenshot.

---

## Slide 2 — Problem

- **Headline:** Reputation is computed. Allocation is guesswork.
- **Bullets:** 60%+ airdrops negative ROI · 90% tokens dumped in a week · &lt;5% whitelist meaningful.
- **Visual:** Simple chart or stat callouts (source: FairScale).

---

## Slide 3 — Solution

- **Headline:** We make FairScore executable.
- **One sentence:** One app: rank wallets by FairScore, set min score, allocate or gate by credibility.
- **Visual:** Flow diagram: Committee verify → Create round → Add wallets → Rank → Export.

---

## Slide 4 — FairScore integration (judges’ 30%)

- **Headline:** FairScore is the brain of the product.
- **Bullets:**
  - Gating: Create/Export only if committee FairScore ≥ 40 or tier ≥ silver.
  - Eligibility: Per-round min FairScore.
  - Ranking: Always by FairScore (desc).
  - Allocation: Optional weighted by FairScore (suggested amounts).
  - Risk: Low-score applicants flagged.
- **Visual:** Short code snippet (e.g. weighted formula or API call) or screenshot of “Why this score?”.

---

## Slide 5 — Use cases

- **Headline:** One engine, six applications.
- **Table or icons:** Grant · Airdrop · Allowlist · Bounty · DAO · Community/events.
- **One line:** Same flow; different round type and export label.

---

## Slide 6 — Tech & traction

- **Tech:** React, FairScale Score API, no backend — deploy anywhere.
- **Traction:** Rounds created · Applicants scored · FairScore queries this session · Legends.fun (FAIRAT).
- **Visual:** Screenshot of “For Judges · Traction” and/or leaderboard.

---

## Slide 7 — Business

- **Headline:** Path to revenue.
- **Phases:** Free today → $49–$199/mo (unlimited rounds, batch, API) → Enterprise (DAO integrations, custom weighting).
- **Numbers:** e.g. 50 hackathons × $199 ≈ $10k; 100 airdrop teams × $99 ≈ $10k.
- **Visual:** Simple roadmap or pricing tiers.

---

## Slide 8 — Team & why us

- **Headline:** Committed to long-term building.
- **Bullets:** Names, roles, 1-line background; responsiveness and iteration.
- **Line:** “Fair Allocator is the canonical FairScore application for allocation and gating.”

---

## Slide 9 — Ask

- **Headline:** Try it. Vote for us.
- **Live URL:** [your deployed link]
- **GitHub:** [repo link]
- **Legends.fun:** List with FAIRAT · Futarchy: vote for Fair Allocator.
- **Visual:** QR or big CTA button.

---

## Optional Slide 10 — Roadmap

- **Next:** On-chain enforcement module — Solana program for score-gated minting, FairScore-based voting weight, airdrop distribution contract (signals infra potential; mitigates “frontend-only” risk).
- **Later:** Backend for persistent rounds, multi-user, batch scoring at scale. Wallet connect (Phantom) for committee verification.
