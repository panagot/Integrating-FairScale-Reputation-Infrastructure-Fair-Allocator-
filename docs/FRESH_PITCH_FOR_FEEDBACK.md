# Fair Allocator — What We Built & Why (for fresh ChatGPT / Grok feedback)

**Copy this into a new ChatGPT or Grok conversation and ask:** *"Review this project. How can we improve it further? Be specific and actionable."*

---

## Context: The competition

We built this for **Fairathon** (FairScale’s bounty): build a **production app** that uses **FairScale’s reputation infrastructure** (FairScore API on Solana). There is **one winner** (5,000 USDC), chosen via a futarchy market after FairScale shortlists 3 finalists. Judging: **FairScore integration 30%** · Technical quality 25% · Traction & users 20% · Business viability 15% · Team & commitment 10%.

---

## What we built

**Product name:** **Fair Allocator**

**One-liner:** Fair Allocator turns FairScore into funding decisions. Today, reputation is computed — we make it executable. One engine for grants, airdrops, allowlists, bounties, DAO eligibility, and community/event access. FairScale FairScore · sybil-resistant allocation.

**What it is:** A web app where you create “rounds” (e.g. a grant round, an airdrop, an allowlist, a bounty batch, a DAO cohort, or an event). For each round you set a minimum FairScore (0–100). You add applicants by **Solana wallet address**. The app calls **FairScale’s Score API** for each wallet and gets: FairScore (0–100), tier (bronze/silver/gold/platinum), badges, and features (wallet age, tx count, active days, etc.). Applicants are **ranked by FairScore**; only those at or above the min are “eligible.” You can optionally use **weighted allocation** (suggested grant amounts proportional to FairScore among eligible). You can **export CSV** (rank, wallet, score, tier, eligible, suggested allocation, risk, badges). Creating rounds and exporting are **gated**: the user must first prove “committee” reputation by entering a wallet; only if that wallet has FairScore ≥ 40 or tier ≥ silver can they create rounds or export. Low-score applicants are flagged as **risk** (“Low score”). We also added: **Round stats** (average FairScore, badge distribution), **“Simulate min score”** (see how many would be eligible if you changed the threshold, without saving), **“Why this score?”** expandable breakdown per applicant (base score, social, wallet age, tx count, etc.), **FairScore query counter** (session total), and **Solana address validation** before calling the API.

**Tech:** React (Vite), TypeScript. FairScale `GET https://api.fairscale.xyz/score?wallet=...` with `fairkey` header. No backend; data in localStorage (rounds, committee verification, optional API key). Static deploy (e.g. Vercel/Netlify).

**Docs we have:** README (setup, use cases, FairScale usage, architecture), INTEGRATION.md (how FairScore is central + code snippets), docs/integration.md (API details), docs/BUSINESS.md (problem, audience, market, phased revenue, 3-month plan), docs/SUBMISSION.md (checklist), docs/DEMO_SCRIPT.md (5-min video script), docs/SLIDES_OUTLINE.md (pitch deck outline), DEPLOYMENT.md.

---

## Why we built it (problem & audience)

**Problem:** Grant committees, airdrop operators, and DAOs struggle to allocate fairly. FairScale’s data: 60%+ of airdrops deliver negative ROI; 90% of tokens dumped in a week; &lt;5% of whitelist participants contribute meaningfully. Without reputation, allocation is guesswork — funds and access go to sybils and farmers instead of real builders.

**Reason we built it:** To win Fairathon by showing FairScore as the **core product logic** (gating, eligibility, ranking, allocation weighting, risk), not decoration — and to serve multiple use cases (grants, airdrops, allowlists, bounties, DAO, community access) so the app feels like a real, scalable tool with clear business viability.

**Who it’s for:** Grant committees, airdrop/launchpad teams, NFT/IDO allowlist operators, bounty platforms (e.g. Superteam), DAOs (governance eligibility or vote weight), and community/event organizers who want to rank or gate by on-chain + social reputation (FairScore).

---

## What we want from you (ChatGPT / Grok)

1. **Positioning:** Is the one-liner and “we make reputation executable” framing strong enough for judges? What would you change?
2. **FairScore (30%):** We have gating, min-score eligibility, ranking, weighted allocation, risk flags, round stats, simulate min score, and “Why this score?” breakdown. What’s still missing or weak?
3. **Technical:** Frontend-only, no backend. What would make it feel more production-ready or scalable without building a full backend?
4. **Traction:** We have in-app traction (rounds created, applicants scored, FairScore queries), Legends.fun (FAIRAT) CTA, and submission docs. What concrete traction actions would most impress judges in the last days before deadline?
5. **Business:** We have phased revenue (free → $49–$199/mo → enterprise), market context, and 3-month plan in BUSINESS.md. How would you strengthen the revenue or go-to-market story?
6. **Demo & slides:** We have a 5-min script and slide outline. What should we emphasize so judges remember us?
7. **Risks:** What could make us lose to another submission? What’s our biggest weakness, and how would you mitigate it?

Please be specific and actionable so we can implement changes before the submission deadline.
