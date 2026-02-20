# Fairathon Bounty — Submission Form Guide

Use this when filling out the **Bounty Submission** form. Replace every `[YOUR_...]` and `[TBD]` with your real links and text before submitting.

---

## 1. Link to Your Submission

**What they want:** A single link that represents your submission (e.g. your live app or a landing page).

| You provide |
|-------------|
| Your **live app URL** (e.g. `https://integrating-fair-scale-reputation-i.vercel.app` or wherever you deploy). |

**Note:** Make sure the link is public and works for everyone.

---

## 2. Tweet Link

**What they want:** A link to a tweet that showcases your work (so sponsors can discover/repost). If the bounty is not X-thread specific, one strong tweet is enough.

| You provide |
|-------------|
| `https://x.com/[YOUR_HANDLE]/status/[TWEET_ID]` — e.g. your launch tweet, demo thread, or “We built Fair Allocator for Fairathon” post. |

**Tip:** Tweet before submitting; then paste that tweet’s URL here.

---

## 3. Live app URL

**What they want:** The URL where judges can use your app.

| You provide |
|-------------|
| Same as (1) if that’s your app, e.g. `https://integrating-fair-scale-reputation-i.vercel.app` (or your real deploy URL). |

---

## 4. GitHub repo link

**What they want:** Public repo. Fairathon may ask for it to be under FairScale’s GitHub org — check the bounty text.

| You provide |
|-------------|
| `https://github.com/panagot/Integrating-FairScale-Reputation-Infrastructure-Fair-Allocator-` |

**Check:** README, setup instructions, and integration docs are in the repo.

---

## 5. Telegram Link

**What they want:** A way for sponsors to reach you (you or your team).

| You provide |
|-------------|
| Your Telegram (e.g. `https://t.me/YourUsername`) or a group link. |

---

## 6. Link to your demo video (YouTube/Loom, max 5 minutes)

**What they want:** A single link to your demo video.

| You provide |
|-------------|
| `https://youtube.com/watch?v=...` or `https://www.loom.com/share/...` |

**Use:** Structure from `docs/DEMO_SCRIPT.md` (problem → solution → live round → use cases → “execution layer” closing). Keep it under 5 minutes.

---

## 7. Link to your project’s X/Twitter account and evidence of traction

**What they want:** Project’s X/Twitter + proof of traction (tweets, threads, testimonials, analytics).

| You provide |
|-------------|
| One of: (a) Your project’s X profile, e.g. `https://x.com/[YOUR_PROJECT]`, or (b) A single link to a thread that includes profile + tweets + screenshots. |

**Tip:** In that thread or in “Anything else?”, mention: rounds created, applicants scored, FairScore queries (from in-app “For Judges · Traction”), and any testimonials or analytics screenshots.

---

## 8. Team information (names, roles, contact, experience)

**What they want:** Plain text or a link to a page with team info.

| You provide |
|-------------|
| Either paste in the form or link to a page. Example text: |

```
[Your Name] — [Role, e.g. Full-stack] — [Email / Telegram] — [1–2 lines prior experience]
[Teammate Name] — [Role] — [Contact] — [Experience]
```

If you use a link: e.g. Notion, Google Doc, or your repo’s TEAM.md.

---

## 9. Pitch Deck / Business documentation link

**What they want:** A link to your pitch deck or business doc.

| You provide |
|-------------|
| Link to: Google Slides, PDF on Drive, Notion, or similar. |

**You have:** `docs/SLIDES_OUTLINE.md` (turn it into slides) and `docs/BUSINESS.md` (can link to GitHub raw or a rendered version). You can also upload BUSINESS.md as a PDF and link that.

---

## 10. Brief description of FairScore integration and why it matters

**What they want:** Short explanation of how you use FairScore and why it’s central.

| You provide (copy-paste ready) |
|--------------------------------|
| **FairScore integration:** Fair Allocator uses FairScale’s Score API as the core of the product. (1) **Gating:** Creating rounds and exporting data require committee wallet verification — only FairScore ≥ 40 or tier ≥ silver can proceed. (2) **Eligibility:** Each round has a minimum FairScore; only applicants at or above that threshold are eligible. (3) **Ranking:** All applicants are ranked by FairScore (descending). (4) **Allocation:** Optional weighted mode allocates suggested amounts proportionally to FairScore among eligible applicants. (5) **Risk:** We show risk tiers (Healthy / Borderline / Likely Sybil) and flag low-score applicants. (6) **Transparency:** “Why this score?” shows base, social, and feature breakdown from the API. FairScore is not an add-on; it is the execution layer — we turn reputation into funding and access decisions. |

**Optional shorter version:**

| Short version |
|---------------|
| FairScore gates who can create rounds and export; sets eligibility per round; ranks applicants; optionally weights suggested allocations by score; and powers risk tiers (Healthy / Borderline / Likely Sybil). Fair Allocator is the execution layer for FairScore on Solana. |

---

## 11. Legends.fun product page URL (FAIRAT)

**What they want:** Your Legends.fun product page, listed with invite code **FAIRAT**, including demo video, public traction, and founder’s card.

| You provide |
|-------------|
| `https://legends.fun/[your-product-page]` (or whatever URL Legends.fun gives you). |

**Check:** Page includes demo video, traction (e.g. rounds, applicants scored), and founder’s card; you used code **FAIRAT** when listing.

---

## 12. Anything else?

**What they want:** Any extra links or context.

| You can add |
|-------------|
| • Link to `INTEGRATION.md` or “How FairScore is central” doc.<br>• Link to a short traction thread or analytics screenshot.<br>• One line: “Export/Import round JSON and shareable links for collaboration without backend.”<br>• If applicable: “We have policy templates (Grant, Airdrop, Allowlist, DAO, Bounty) and manual override with reason for governance transparency.” |

---

## Pre-submit checklist

- [ ] Live app deployed and URL works in an incognito window.
- [ ] GitHub repo public; README and setup instructions clear.
- [ ] Demo video recorded (≤5 min), uploaded, link ready.
- [ ] At least one tweet/post with project link; tweet URL copied.
- [ ] Project X/Twitter created; linked in app (replace `[YOUR_TWITTER]` in `src/App.tsx`).
- [ ] Team info written (names, roles, contact, experience).
- [ ] Pitch deck or business doc uploaded; link ready.
- [ ] Legends.fun page created with **FAIRAT**, demo + traction + founder’s card; link ready.
- [ ] “Brief description of FairScore integration” copied from section 10 above (edit if you want).
- [ ] Telegram link ready.
- [ ] “Link to your submission” and “Live app URL” set (and consistent if both point to the app).

Once everything is filled, you can edit the submission until the bounty deadline.
