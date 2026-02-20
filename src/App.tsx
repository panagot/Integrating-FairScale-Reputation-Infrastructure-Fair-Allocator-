import { useState, useMemo, Fragment, useEffect, useRef, type ReactNode } from "react";
import type { GrantRound, Applicant } from "./types";
import {
  fetchFairScore,
  formatFairScore,
  getStoredApiKey,
  setStoredApiKey,
  getFairScoreQueryCount,
  tierLabel,
  tierMeetsMinimum,
  isValidSolanaAddress,
} from "./fairscale";
import type { AllocationMode, RoundType, RiskTier } from "./types";
import "./App.css";

/** Sybil risk tier from FairScore (judge-friendly labels) */
function getRiskTier(score: number): RiskTier {
  if (score >= 60) return "healthy";
  if (score >= 25) return "borderline";
  return "likely_sybil";
}

const RISK_TIER_LABELS: Record<RiskTier, string> = {
  healthy: "🟢 Healthy",
  borderline: "🟡 Borderline",
  likely_sybil: "🔴 Likely Sybil",
};

/** Modern line-style icons for templates (24×24) */
const IconNone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="14" y2="6" />
    <line x1="4" y1="18" x2="18" y2="18" />
  </svg>
);
const IconGrant = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M12 9v4" />
    <path d="M9 2h6v2H9z" />
  </svg>
);
const IconAirdrop = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22v-4" />
    <path d="M12 18a2 2 0 0 0 2-2V8" />
    <path d="M4 12a8 8 0 0 1 16 0" />
    <path d="M4 16a4 4 0 0 1 8 0" />
    <path d="M4 20a1 1 0 0 1 2 0" />
  </svg>
);
const IconAllowlist = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const IconDao = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M12 12h.01" />
    <path d="M8 16h8" />
    <path d="M12 16v4" />
  </svg>
);
const IconBounty = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const TEMPLATE_ICONS: Record<string, () => ReactNode> = {
  none: IconNone,
  grant: IconGrant,
  airdrop: IconAirdrop,
  allowlist: IconAllowlist,
  dao: IconDao,
  bounty: IconBounty,
};

/** Policy templates for quick round setup */
const ROUND_TEMPLATES: Array<{
  id: string;
  label: string;
  roundType: RoundType;
  minFairScore: number;
  allocationMode: AllocationMode;
  name: string;
  description: string;
}> = [
  { id: "none", label: "None (custom)", roundType: "grant", minFairScore: 50, allocationMode: "binary", name: "", description: "" },
  { id: "grant", label: "Grant Round", roundType: "grant", minFairScore: 60, allocationMode: "weighted", name: "Grant Round", description: "Weighted funding by FairScore" },
  { id: "airdrop", label: "Airdrop", roundType: "airdrop", minFairScore: 50, allocationMode: "binary", name: "Airdrop", description: "Token distribution by min score" },
  { id: "allowlist", label: "Allowlist", roundType: "allowlist", minFairScore: 55, allocationMode: "binary", name: "Allowlist", description: "Spots for wallets above min score" },
  { id: "dao", label: "DAO Voting", roundType: "dao", minFairScore: 65, allocationMode: "binary", name: "DAO Voting", description: "Governance eligibility (min 65 or gold)" },
  { id: "bounty", label: "Bounty Batch", roundType: "bounty", minFairScore: 45, allocationMode: "weighted", name: "Bounty Batch", description: "Payout priority by reputation" },
];

const STORAGE_ROUNDS = "grant-allocator-rounds";
const STORAGE_COMMITTEE = "grant-allocator-committee";

const COMMITTEE_MIN_SCORE = 40;
const COMMITTEE_MIN_TIER = "silver";

export interface CommitteeVerification {
  wallet: string;
  fairScore: number;
  tier?: "bronze" | "silver" | "gold" | "platinum";
  verifiedAt: number;
}

function loadCommittee(): CommitteeVerification | null {
  try {
    const raw = localStorage.getItem(STORAGE_COMMITTEE);
    if (!raw) return null;
    const data = JSON.parse(raw) as CommitteeVerification;
    return data.wallet && data.verifiedAt ? data : null;
  } catch {
    return null;
  }
}

function saveCommittee(c: CommitteeVerification | null) {
  if (c) localStorage.setItem(STORAGE_COMMITTEE, JSON.stringify(c));
  else localStorage.removeItem(STORAGE_COMMITTEE);
}

function committeeVerified(c: CommitteeVerification | null): boolean {
  if (!c) return false;
  return c.fairScore >= COMMITTEE_MIN_SCORE || tierMeetsMinimum(c.tier, COMMITTEE_MIN_TIER);
}

function loadRounds(): GrantRound[] {
  try {
    const raw = localStorage.getItem(STORAGE_ROUNDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRounds(rounds: GrantRound[]) {
  localStorage.setItem(STORAGE_ROUNDS, JSON.stringify(rounds));
}

const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  grant: "Grant",
  airdrop: "Airdrop",
  allowlist: "Allowlist",
  bounty: "Bounty",
  dao: "DAO",
  community: "Community",
};

function createRound(
  name: string,
  description: string,
  totalBudget: number,
  currency: string,
  minFairScore: number,
  allocationMode: AllocationMode = "binary",
  roundType: RoundType = "grant"
): GrantRound {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    totalBudget,
    currency,
    createdAt: Date.now(),
    applicants: [],
    minFairScore,
    allocationMode,
    roundType,
  };
}

type View = "list" | "create" | "round" | "settings";

const FAIRSCALE_LINKS = {
  website: "https://fairscale.xyz/",
  docs: "https://docs.fairscale.xyz/",
  apiAccess: "https://sales.fairscale.xyz/",
  twitter: "https://x.com/fairscalexyz",
  telegram: "https://t.me/+WQlko_c5blJhN2E0",
  support: "https://t.me/+XF23ay9aY1AzYzlk",
};

/** Legends.fun product page */
const LEGENDS_FUN_URL = "https://www.legends.fun/products/70926e32-f6b4-41c5-b03a-188e48b6140b";
/** Fair Allocator / team X (Twitter) */
const PROJECT_TWITTER_URL = "https://x.com/PANAGOT";
const LIVE_APP_URL = "https://integrating-fair-scale-reputation-i.vercel.app";
const GITHUB_REPO_URL = "https://github.com/panagot/Integrating-FairScale-Reputation-Infrastructure-Fair-Allocator-";
const PITCH_DECK_URL = "https://github.com/panagot/Integrating-FairScale-Reputation-Infrastructure-Fair-Allocator-/blob/main/docs/BUSINESS.md";

function App() {
  const [rounds, setRounds] = useState<GrantRound[]>(loadRounds);
  const [view, setView] = useState<View>("list");
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    totalBudget: 5000,
    currency: "USDC",
    minFairScore: 50,
    allocationMode: "binary" as AllocationMode,
    roundType: "grant" as RoundType,
  });
  const [newWallet, setNewWallet] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);
  const [committee, setCommittee] = useState<CommitteeVerification | null>(loadCommittee);
  const [committeeWallet, setCommitteeWallet] = useState("");
  const [committeeLoading, setCommitteeLoading] = useState(false);
  const [committeeError, setCommitteeError] = useState<string | null>(null);
  const [simulatedMinScore, setSimulatedMinScore] = useState<number | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const createFormRef = useRef<HTMLDivElement>(null);

  const selectedRound = useMemo(
    () => rounds.find((r) => r.id === selectedRoundId) ?? null,
    [rounds, selectedRoundId]
  );
  const hasApiKey = Boolean(getStoredApiKey());
  const canUsePrivilegedFeatures = committeeVerified(committee);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("round");
    if (!encoded) return;
    try {
      const json = decodeURIComponent(escape(atob(encoded)));
      const data = JSON.parse(json) as GrantRound;
      const round: GrantRound = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        applicants: (data.applicants ?? []).map((a) => ({ ...a, id: crypto.randomUUID() })),
      };
      setRounds((prev) => {
        const next = [round, ...prev];
        saveRounds(next);
        return next;
      });
      setSelectedRoundId(round.id);
      setView("round");
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      /* ignore invalid */
    }
  }, []);

  const openRound = (id: string) => {
    setSelectedRoundId(id);
    setView("round");
  };

  const handleCreateRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    const round = createRound(
      createForm.name.trim(),
      createForm.description.trim(),
      createForm.totalBudget,
      createForm.currency,
      createForm.minFairScore,
      createForm.allocationMode,
      createForm.roundType
    );
    const next = [round, ...rounds];
    setRounds(next);
    saveRounds(next);
    setView("list");
    setCreateForm({
      name: "",
      description: "",
      totalBudget: 5000,
      currency: "USDC",
      minFairScore: 50,
      allocationMode: "binary",
      roundType: "grant",
    });
  };

  const verifyCommittee = async () => {
    const wallet = committeeWallet.trim();
    if (!wallet) return;
    setCommitteeError(null);
    if (!isValidSolanaAddress(wallet)) {
      setCommitteeError("Invalid Solana address (use 32–44 base58 characters).");
      return;
    }
    setCommitteeLoading(true);
    try {
      const res = await fetchFairScore(wallet);
      const verification: CommitteeVerification = {
        wallet: res.wallet,
        fairScore: res.fairScore,
        tier: res.tier,
        verifiedAt: Date.now(),
      };
      setCommittee(verification);
      saveCommittee(verification);
      setCommitteeWallet("");
      if (!committeeVerified(verification)) {
        setCommitteeError(
          `Score ${res.fairScore.toFixed(1)} / tier ${res.tier ?? "—"} below requirement (FairScore ≥ ${COMMITTEE_MIN_SCORE} or tier ≥ ${COMMITTEE_MIN_TIER}).`
        );
      }
    } catch (err) {
      setCommitteeError(err instanceof Error ? err.message : "Failed to fetch FairScore");
    } finally {
      setCommitteeLoading(false);
    }
  };

  const clearCommittee = () => {
    setCommittee(null);
    saveCommittee(null);
    setCommitteeError(null);
  };

  const addApplicant = async () => {
    const wallet = newWallet.trim();
    if (!wallet || !selectedRound) return;
    setLookupError(null);
    if (!isValidSolanaAddress(wallet)) {
      setLookupError("Invalid Solana address (use 32–44 base58 characters).");
      return;
    }
    setLookupLoading(true);
    try {
      const res = await fetchFairScore(wallet);
      const applicant: Applicant = {
        id: crypto.randomUUID(),
        wallet: res.wallet,
        fairScore: res.fairScore,
        fairscore_base: res.fairscore_base,
        social_score: res.social_score,
        tier: res.tier,
        badges: res.badges,
        features: res.features,
        timestamp: res.timestamp,
      };
      const round = rounds.find((r) => r.id === selectedRoundId);
      if (!round) return;
      const updated: GrantRound = {
        ...round,
        applicants: [...round.applicants, applicant],
      };
      const next = rounds.map((r) => (r.id === updated.id ? updated : r));
      setRounds(next);
      saveRounds(next);
      setNewWallet("");
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Failed to fetch FairScore");
    } finally {
      setLookupLoading(false);
    }
  };

  const removeApplicant = (roundId: string, applicantId: string) => {
    const next = rounds.map((r) => {
      if (r.id !== roundId) return r;
      return { ...r, applicants: r.applicants.filter((a) => a.id !== applicantId) };
    });
    setRounds(next);
    saveRounds(next);
  };

  const saveApiKey = () => {
    setStoredApiKey(apiKeyInput.trim());
    setView("list");
  };

  const rankedApplicants = useMemo(() => {
    if (!selectedRound) return [];
    return [...selectedRound.applicants].sort((a, b) => b.fairScore - a.fairScore);
  }, [selectedRound]);

  const eligibleApplicants = useMemo(
    () =>
      rankedApplicants.filter(
        (a) =>
          a.fairScore >= (selectedRound?.minFairScore ?? 0) || a.overrideApproved
      ),
    [rankedApplicants, selectedRound?.minFairScore]
  );

  const isWeightedAllocation = (selectedRound?.allocationMode ?? "binary") === "weighted";
  const scoreSumEligible = useMemo(() => {
    if (!isWeightedAllocation || eligibleApplicants.length === 0) return 0;
    return eligibleApplicants.reduce((s, a) => s + a.fairScore, 0);
  }, [isWeightedAllocation, eligibleApplicants]);
  const suggestedAllocationByApplicantId = useMemo(() => {
    const map: Record<string, number> = {};
    if (!selectedRound || !isWeightedAllocation || scoreSumEligible <= 0) return map;
    const budget = selectedRound.totalBudget;
    eligibleApplicants.forEach((a) => {
      map[a.id] = (a.fairScore / scoreSumEligible) * budget;
    });
    return map;
  }, [selectedRound, isWeightedAllocation, scoreSumEligible, eligibleApplicants]);

  const simulatedEligibleCount =
    simulatedMinScore != null && selectedRound
      ? rankedApplicants.filter((a) => a.fairScore >= simulatedMinScore).length
      : null;

  const roundStats = useMemo(() => {
    if (!selectedRound || selectedRound.applicants.length === 0) return null;
    const apps = selectedRound.applicants;
    const avgScore = apps.reduce((s, a) => s + a.fairScore, 0) / apps.length;
    const badgeCounts: Record<string, number> = {};
    const overridden = apps.filter((a) => a.overrideApproved).length;
    apps.forEach((a) => {
      (a.badges ?? []).forEach((b) => {
        badgeCounts[b.label] = (badgeCounts[b.label] ?? 0) + 1;
      });
    });
    return { avgScore, badgeCounts, overridden, total: apps.length };
  }, [selectedRound]);

  const exportRoundJSON = () => {
    if (!selectedRound) return;
    const json = JSON.stringify(selectedRound, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fair-allocator-round-${selectedRound.name.replace(/\s+/g, "-")}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyShareLink = () => {
    if (!selectedRound) return;
    try {
      const json = JSON.stringify(selectedRound);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      const url = `${window.location.origin}${window.location.pathname}?round=${encoded}`;
      navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard.");
    } catch {
      alert("Could not copy link.");
    }
  };

  const importRoundFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as GrantRound;
        const round: GrantRound = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          applicants: (data.applicants ?? []).map((a) => ({ ...a, id: crypto.randomUUID() })),
        };
        const next = [round, ...rounds];
        setRounds(next);
        saveRounds(next);
        setView("list");
        setSelectedRoundId(round.id);
        openRound(round.id);
      } catch {
        alert("Invalid round JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const setApplicantOverride = (
    roundId: string,
    applicantId: string,
    overrideApproved: boolean,
    reason?: string
  ) => {
    const next = rounds.map((r) => {
      if (r.id !== roundId) return r;
      return {
        ...r,
        applicants: r.applicants.map((a) =>
          a.id === applicantId
            ? { ...a, overrideApproved, overrideReason: reason ?? a.overrideReason }
            : a
        ),
      };
    });
    setRounds(next);
    saveRounds(next);
  };

  const exportCSV = () => {
    if (!selectedRound) return;
    const roundTypeLabel = ROUND_TYPE_LABELS[selectedRound.roundType ?? "grant"];
    const minScore = selectedRound.minFairScore ?? 0;
    const headers = [
      "Round type",
      "Rank",
      "Wallet",
      "FairScore",
      "Tier",
      "Base",
      "Social",
      "Eligible",
      "Override",
      "Override reason",
      "Suggested allocation",
      "Risk",
      "Badges",
    ];
    const rows = rankedApplicants.map((a, i) => {
      const eligibleByScore = a.fairScore >= minScore;
      const eligible = eligibleByScore || a.overrideApproved;
      const suggested = suggestedAllocationByApplicantId[a.id];
      const riskLabel = RISK_TIER_LABELS[getRiskTier(a.fairScore)];
      return [
        roundTypeLabel,
        i + 1,
        a.wallet,
        a.fairScore.toFixed(1),
        a.tier ?? "",
        a.fairscore_base?.toFixed(1) ?? "",
        a.social_score?.toFixed(1) ?? "",
        eligible ? "Yes" : "No",
        a.overrideApproved ? "Yes" : "",
        a.overrideReason ?? "",
        suggested != null ? suggested.toFixed(2) : "",
        riskLabel,
        (a.badges ?? []).map((b) => b.label).join("; "),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fair-allocator-${(selectedRound.roundType ?? "grant")}-${selectedRound.name.replace(/\s+/g, "-")}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">
            <span className="logo-icon">◇</span> Fair Allocator
          </h1>
          <p className="tagline">
            <strong>The execution layer for FairScore on Solana.</strong>{" "}
            Fair Allocator transforms FairScore into executable funding decisions—one sybil-resistant engine for grants, airdrops, allowlists, bounties, DAOs, and access control.{" "}
            <a href={FAIRSCALE_LINKS.website} target="_blank" rel="noopener noreferrer">
              FairScale
            </a>
          </p>
          <nav className="nav">
            <button type="button" className="nav-btn" onClick={() => setView("list")}>
              Rounds
            </button>
            <button
              type="button"
              className="nav-btn primary"
              onClick={() => setView("create")}
              title={!canUsePrivilegedFeatures ? "Verify committee FairScore (Settings) to create rounds" : undefined}
            >
              + New round
            </button>
            <button
              type="button"
              className={`nav-btn ${hasApiKey ? "nav-btn-ok" : ""}`}
              onClick={() => setView("settings")}
              title={hasApiKey ? "API key set" : "Set FairScale API key"}
            >
              {hasApiKey ? "✓ API" : "API key"}
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {view === "list" && (
          <section className="section">
            <div className="traction-block">
              <h2>For Judges · Traction</h2>
              <div className="traction-stats">
                <span><strong>{rounds.length}</strong> rounds created</span>
                <span><strong>{rounds.reduce((s, r) => s + r.applicants.length, 0)}</strong> applicants scored</span>
                <span><strong>{getFairScoreQueryCount()}</strong> FairScore queries this session</span>
              </div>
              <p className="traction-cta">
                <a href={LEGENDS_FUN_URL} target="_blank" rel="noopener noreferrer">
                  Fair Allocator on Legends.fun
                </a>
              </p>
              <p className="traction-links">
                <a href={LIVE_APP_URL} target="_blank" rel="noopener noreferrer">Live app</a>
                {" · "}
                <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">GitHub repo</a>
                {" · "}
                <a href={PITCH_DECK_URL} target="_blank" rel="noopener noreferrer">Pitch deck</a>
                {" · "}
                <a href={PROJECT_TWITTER_URL} target="_blank" rel="noopener noreferrer">X / Twitter</a>
              </p>
            </div>
            <div className="use-cases-block">
              <h2>Use cases — one engine, many applications</h2>
              <ul className="use-cases-list">
                <li><strong>Grants</strong> — Rank applicants by FairScore; allocate funds to genuine builders.</li>
                <li><strong>Airdrops</strong> — Distribute tokens by credibility; weight amounts by score.</li>
                <li><strong>Allowlists</strong> — NFT mints, IDOs: who gets a spot; export allowlist by min score.</li>
                <li><strong>Bounties</strong> — Prioritize payouts by reputation; filter farmers from contributors.</li>
                <li><strong>DAO</strong> — Gate proposals or weight votes by FairScore; sybil-resistant governance.</li>
                <li><strong>Community / events</strong> — Gated access: only wallets above a score get in.</li>
              </ul>
            </div>
            <div className="about-block">
              <h2>Why use reputation?</h2>
              <p>
                FairScale’s data: <strong>60%+</strong> of airdrops deliver negative ROI;
                <strong> 90%</strong> of tokens are dumped within a week;{" "}
                <strong>&lt;5%</strong> of whitelist participants contribute meaningfully.
                Fair Allocator turns that data into decisions — fund or allow real builders, not sybils.
              </p>
              <p className="about-links">
                <a href={FAIRSCALE_LINKS.website} target="_blank" rel="noopener noreferrer">
                  FairScale
                </a>
                {" · "}
                <a href={FAIRSCALE_LINKS.docs} target="_blank" rel="noopener noreferrer">
                  API docs
                </a>
                {" · "}
                <a href={FAIRSCALE_LINKS.apiAccess} target="_blank" rel="noopener noreferrer">
                  Get API key
                </a>
              </p>
            </div>
            <div className="list-actions">
              <h2>Your rounds</h2>
              <label className="btn secondary small import-btn">
                Import round
                <input type="file" accept=".json" onChange={importRoundFromFile} hidden />
              </label>
            </div>
            {rounds.length === 0 ? (
              <div className="empty">
                <p>No rounds yet. Create one to rank applicants by FairScore (0–100).</p>
                <button type="button" className="btn primary" onClick={() => setView("create")}>
                  Create first round
                </button>
              </div>
            ) : (
              <div className="round-grid">
                {rounds.map((r) => (
                  <article
                    key={r.id}
                    className="round-card"
                    onClick={() => openRound(r.id)}
                  >
                    <div className="round-card-head">
                      <h3>{r.name}</h3>
                      <span className={`round-type-badge round-type-${r.roundType ?? "grant"}`}>
                        {ROUND_TYPE_LABELS[r.roundType ?? "grant"]}
                      </span>
                    </div>
                    {r.description && (
                      <p className="round-desc">{r.description}</p>
                    )}
                    <div className="round-meta">
                      <span>
                        {r.totalBudget.toLocaleString()} {r.currency}
                      </span>
                      <span>{r.applicants.length} applicants</span>
                      <span>Min FairScore {r.minFairScore}+</span>
                      {r.allocationMode === "weighted" && (
                        <span className="round-meta-badge">Weighted allocation</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {view === "create" && (
          <section className="section">
            <h2>New round</h2>
            {!canUsePrivilegedFeatures && (
              <div className="gate-banner">
                <strong>Unlock:</strong> Create round is gated by committee reputation. Go to{" "}
                <button type="button" className="btn-ghost inline" onClick={() => setView("settings")}>
                  Settings
                </button>{" "}
                and enter a committee wallet; your FairScore must be ≥{COMMITTEE_MIN_SCORE} or tier ≥ {COMMITTEE_MIN_TIER} to create rounds.
              </div>
            )}
            <p className="section-desc">
              Use the same reputation engine for grants, airdrops, allowlists, bounties, DAO eligibility, or event access. Set a minimum FairScore (0–100); FairScale combines on-chain + social signals.
            </p>
            <form onSubmit={handleCreateRound} className="form">
              <label>
                Start from template
                <div className="template-select-wrap">
                  <button
                    type="button"
                    className="template-select-trigger"
                    onClick={() => setTemplateDropdownOpen((o) => !o)}
                    aria-expanded={templateDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    {(() => {
                      const currentId = ROUND_TEMPLATES.find((t) => t.roundType === createForm.roundType && t.minFairScore === createForm.minFairScore && t.allocationMode === createForm.allocationMode)?.id ?? "none";
                      const Icon = TEMPLATE_ICONS[currentId];
                      return (
                        <>
                          <span className="template-select-icon">{Icon ? <Icon /> : null}</span>
                          <span>{ROUND_TEMPLATES.find((t) => t.id === currentId)?.label ?? "None (custom)"}</span>
                          <span className="template-select-chevron">{templateDropdownOpen ? "▴" : "▾"}</span>
                        </>
                      );
                    })()}
                  </button>
                  {templateDropdownOpen && (
                    <ul className="template-select-dropdown" role="listbox">
                      {ROUND_TEMPLATES.map((t) => {
                        const Icon = TEMPLATE_ICONS[t.id];
                        return (
                          <li
                            key={t.id}
                            role="option"
                            className="template-select-option"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (t.id !== "none") {
                                setCreateForm((f) => ({
                                  ...f,
                                  roundType: t.roundType,
                                  minFairScore: t.minFairScore,
                                  allocationMode: t.allocationMode,
                                  name: t.name,
                                  description: t.description,
                                }));
                              }
                              setTemplateDropdownOpen(false);
                              requestAnimationFrame(() => {
                                createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                              });
                            }}
                          >
                            <span className="template-select-icon">{Icon ? <Icon /> : null}</span>
                            <span>{t.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {templateDropdownOpen && (
                  <div
                    className="template-select-backdrop"
                    onMouseDown={() => setTemplateDropdownOpen(false)}
                    aria-hidden
                  />
                )}
              </label>
              <div ref={createFormRef}>
              <label>
                Round type
                <select
                  value={createForm.roundType}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, roundType: e.target.value as RoundType }))
                  }
                >
                  <option value="grant">Grant — fund applicants by credibility</option>
                  <option value="airdrop">Airdrop — token distribution by score</option>
                  <option value="allowlist">Allowlist — NFT/IDO spots by min score</option>
                  <option value="bounty">Bounty — payout priority by reputation</option>
                  <option value="dao">DAO — governance eligibility or vote weight</option>
                  <option value="community">Community / event — gated access by score</option>
                </select>
              </label>
              <label>
                Round name
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Fairathon Q1 Grants"
                  required
                />
              </label>
              <label>
                Description (optional)
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="What this round is for..."
                  rows={2}
                />
              </label>
              <div className="form-row">
                <label>
                  Total budget
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={createForm.totalBudget}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        totalBudget: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </label>
                <label>
                  Currency
                  <input
                    type="text"
                    value={createForm.currency}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, currency: e.target.value }))
                    }
                    placeholder="USDC"
                  />
                </label>
                <label>
                  Min FairScore (0–100)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={createForm.minFairScore}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        minFairScore: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </label>
                <label>
                  Allocation mode
                  <select
                    value={createForm.allocationMode}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        allocationMode: e.target.value as AllocationMode,
                      }))
                    }
                  >
                    <option value="binary">Binary (eligible / not)</option>
                    <option value="weighted">Weighted by FairScore (suggested amounts)</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setView("list")}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={!canUsePrivilegedFeatures}
                  title={!canUsePrivilegedFeatures ? "Verify committee FairScore in Settings first" : undefined}
                >
                  Create round
                </button>
              </div>
              </div>
            </form>
          </section>
        )}

        {view === "settings" && (
          <section className="section">
            <h2>FairScale API key</h2>
            <p className="section-desc">
              Fair Allocator uses the FairScale Score API to get real-time reputation
              scores. Without a key, demo mode uses mock scores. Get a key at{" "}
              <a href={FAIRSCALE_LINKS.apiAccess} target="_blank" rel="noopener noreferrer">
                sales.fairscale.xyz
              </a>{" "}
              (free tier: 1,000 requests/month).
            </p>

            <h3 className="settings-subsection">Committee reputation (gate)</h3>
            <p className="section-desc">
              Creating rounds and exporting CSV are gated by FairScore: the committee must prove
              reputation (FairScore ≥ {COMMITTEE_MIN_SCORE} or tier ≥ {COMMITTEE_MIN_TIER}). Enter a
              committee wallet below to verify once per session.
            </p>
            {committee ? (
              <div className="committee-status">
                <span className="committee-verified">
                  {committeeVerified(committee)
                    ? "✓ Verified"
                    : "Below requirement"}
                </span>
                <span className="text-muted">
                  {committee.wallet.slice(0, 8)}…{committee.wallet.slice(-6)} · FairScore{" "}
                  {formatFairScore(committee.fairScore)}
                  {committee.tier && ` · ${tierLabel(committee.tier)}`}
                </span>
                <button type="button" className="btn-ghost small" onClick={clearCommittee}>
                  Clear
                </button>
              </div>
            ) : (
              <div className="form committee-form">
                <label>
                  Committee wallet
                  <input
                    type="text"
                    value={committeeWallet}
                    onChange={(e) => setCommitteeWallet(e.target.value)}
                    placeholder="Solana wallet to verify"
                    disabled={committeeLoading}
                  />
                </label>
                <button
                  type="button"
                  className="btn primary"
                  onClick={verifyCommittee}
                  disabled={!committeeWallet.trim() || committeeLoading}
                >
                  {committeeLoading ? "Checking FairScore…" : "Verify FairScore"}
                </button>
                {committeeError && <p className="error">{committeeError}</p>}
              </div>
            )}

            <div className="form api-key-form">
              <label>
                API key (stored locally; use env <code>VITE_FAIRSCALE_API_KEY</code> in
                production)
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Your FairScale fairkey"
                />
              </label>
              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setView("list")}>
                  Cancel
                </button>
                <button type="button" className="btn primary" onClick={saveApiKey}>
                  Save key
                </button>
              </div>
            </div>
            <div className="settings-links">
              <a href={FAIRSCALE_LINKS.docs} target="_blank" rel="noopener noreferrer">
                API documentation
              </a>
              <a href={FAIRSCALE_LINKS.apiAccess} target="_blank" rel="noopener noreferrer">
                Get API key
              </a>
              <a href={FAIRSCALE_LINKS.support} target="_blank" rel="noopener noreferrer">
                Technical support (Telegram)
              </a>
            </div>
          </section>
        )}

        {view === "round" && selectedRound && (
          <section className="section round-detail">
            <div className="round-detail-header">
              <button type="button" className="back" onClick={() => setView("list")}>
                ← Back
              </button>
              <div>
                <div className="round-detail-title">
                  <h2>{selectedRound.name}</h2>
                  <span className={`round-type-badge round-type-${selectedRound.roundType ?? "grant"}`}>
                    {ROUND_TYPE_LABELS[selectedRound.roundType ?? "grant"]}
                  </span>
                </div>
                {selectedRound.description && (
                  <p className="round-desc">{selectedRound.description}</p>
                )}
                <p className="text-muted">
                  {selectedRound.totalBudget.toLocaleString()} {selectedRound.currency}
                  {" · "}
                  Min FairScore {selectedRound.minFairScore}+ (eligible = at or above this)
                  {selectedRound.allocationMode === "weighted" &&
                    " · Allocation weighted by FairScore (suggested amounts for eligible)"}
                </p>
              </div>
            </div>

            <div className="add-applicant">
              <h3>Add applicant by wallet</h3>
              <p className="hint">
                Enter a Solana wallet address. We call FairScale’s{" "}
                <a href={FAIRSCALE_LINKS.docs} target="_blank" rel="noopener noreferrer">
                  Score API
                </a>{" "}
                (one request per wallet). Scores combine on-chain + social signals and
                update every 24h. {!hasApiKey && "No API key set — using demo mock scores."}
              </p>
              <div className="add-row">
                <input
                  type="text"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addApplicant())
                  }
                  placeholder="Solana wallet (e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)"
                  disabled={lookupLoading}
                />
                <button
                  type="button"
                  className="btn primary"
                  onClick={addApplicant}
                  disabled={!newWallet.trim() || lookupLoading}
                >
                  {lookupLoading ? "Scoring…" : "Add & score"}
                </button>
              </div>
              {lookupError && <p className="error">{lookupError}</p>}
            </div>

            {!canUsePrivilegedFeatures && (
              <div className="gate-banner">
                <strong>Unlock export:</strong> Verify committee FairScore in{" "}
                <button type="button" className="btn-ghost inline" onClick={() => setView("settings")}>
                  Settings
                </button>{" "}
                (FairScore ≥ {COMMITTEE_MIN_SCORE} or tier ≥ {COMMITTEE_MIN_TIER}).
              </div>
            )}
            {roundStats && (
              <div className="round-stats-block">
                <h3>Round stats (FairScore)</h3>
                <div className="round-stats-grid">
                  <span>Average FairScore: <strong>{roundStats.avgScore.toFixed(1)}</strong></span>
                  {Object.keys(roundStats.badgeCounts).length > 0 && (
                    <span>
                      Badges:{" "}
                      {Object.entries(roundStats.badgeCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, n]) => `${n}× ${label}`)
                        .join(", ")}
                    </span>
                  )}
                  {roundStats.overridden > 0 && (
                    <span className="override-stat">
                      Overridden: <strong>{roundStats.overridden}</strong> ({((roundStats.overridden / roundStats.total) * 100).toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
            )}
            {rankedApplicants.length > 0 && (
              <div className="simulate-block">
                <h3>Simulate min score</h3>
                <p className="hint">See how eligibility changes if you used a different min FairScore (does not save).</p>
                <div className="simulate-row">
                  <label>
                    If min FairScore ={" "}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={simulatedMinScore ?? selectedRound.minFairScore}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        setSimulatedMinScore(v);
                      }}
                    />
                  </label>
                  <span className="simulate-result">
                    → <strong>{simulatedEligibleCount ?? eligibleApplicants.length}</strong> eligible
                  </span>
                  <button type="button" className="btn-ghost small" onClick={() => setSimulatedMinScore(null)}>
                    Reset
                  </button>
                </div>
              </div>
            )}
            <div className="ranked-section">
              <div className="ranked-header">
                <h3>Ranked by FairScore</h3>
                <span className="badge">{eligibleApplicants.length} eligible</span>
                {selectedRound.allocationMode === "weighted" && (
                  <span className="badge allocation-badge">Weighted allocation</span>
                )}
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={exportCSV}
                  disabled={rankedApplicants.length === 0 || !canUsePrivilegedFeatures}
                  title={!canUsePrivilegedFeatures ? "Verify committee FairScore in Settings to export" : undefined}
                >
                  Export CSV
                </button>
                <button type="button" className="btn secondary small" onClick={exportRoundJSON}>
                  Export JSON
                </button>
                <button type="button" className="btn secondary small" onClick={copyShareLink} title="Copy link with round data for sharing">
                  Copy share link
                </button>
              </div>
              {rankedApplicants.length === 0 ? (
                <p className="text-muted">
                  Add applicant wallets above to see rankings (FairScore 0–100, tier,
                  badges).
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="ranked-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Wallet</th>
                        <th>FairScore</th>
                        <th>Tier</th>
                        <th>Badges</th>
                        <th>Eligible</th>
                        <th>Override</th>
                        {isWeightedAllocation && <th>Suggested allocation</th>}
                        <th>Risk</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedApplicants.map((a, i) => {
                        const eligibleByScore =
                          a.fairScore >= (selectedRound.minFairScore ?? 0);
                        const eligible = eligibleByScore || a.overrideApproved;
                        const expanded = expandedApplicantId === a.id;
                        const suggested = suggestedAllocationByApplicantId[a.id];
                        const riskTier = getRiskTier(a.fairScore);
                        return (
                          <Fragment key={a.id}>
                            <tr
                              className={`${eligible ? "" : "ineligible"} ${expanded ? "expanded" : ""} ${a.overrideApproved ? "override-row" : ""}`}
                            >
                              <td>{i + 1}</td>
                              <td className="wallet">
                                {a.wallet.slice(0, 8)}…{a.wallet.slice(-6)}
                              </td>
                              <td className="score">{formatFairScore(a.fairScore)}</td>
                              <td>
                                {a.tier ? (
                                  <span className={`tier tier-${a.tier}`}>
                                    {tierLabel(a.tier)}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="badges-cell">
                                {(a.badges ?? []).length > 0 ? (
                                  (a.badges ?? []).map((b) => (
                                    <span
                                      key={b.id}
                                      className="badge-pill"
                                      title={b.description}
                                    >
                                      {b.label}
                                    </span>
                                  ))
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>{eligible ? "✓ Yes" : "No"}</td>
                              <td>
                                {a.overrideApproved ? (
                                  <span className="override-badge" title={a.overrideReason ?? "Manually approved"}>
                                    ✓ Override
                                    {a.overrideReason && `: ${a.overrideReason.slice(0, 20)}…`}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-ghost small"
                                    onClick={() => {
                                      const reason = window.prompt("Reason for override (optional):");
                                      setApplicantOverride(selectedRound.id, a.id, true, reason ?? undefined);
                                    }}
                                  >
                                    Override
                                  </button>
                                )}
                                {a.overrideApproved && (
                                  <button
                                    type="button"
                                    className="btn-ghost small"
                                    onClick={() => setApplicantOverride(selectedRound.id, a.id, false)}
                                  >
                                    Clear
                                  </button>
                                )}
                              </td>
                              {isWeightedAllocation && (
                                <td className="suggested-allocation">
                                  {suggested != null
                                    ? `${selectedRound.currency} ${suggested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : "—"}
                                </td>
                              )}
                              <td>
                                <span className={`risk-tier risk-tier-${riskTier}`} title={`FairScore ${a.fairScore.toFixed(1)}`}>
                                  {RISK_TIER_LABELS[riskTier]}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  onClick={() =>
                                    removeApplicant(selectedRound.id, a.id)
                                  }
                                >
                                  Remove
                                </button>
                                {(a.features || a.fairscore_base != null || a.social_score != null) && (
                                  <button
                                    type="button"
                                    className="btn-ghost expand-btn"
                                    onClick={() =>
                                      setExpandedApplicantId(
                                        expanded ? null : a.id
                                      )
                                    }
                                  >
                                    {expanded ? "▼ Why this score?" : "▶ Why this score?"}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {expanded && (a.features || a.fairscore_base != null || a.social_score != null) && (
                              <tr key={`${a.id}-exp`} className="detail-row">
                                <td colSpan={isWeightedAllocation ? 11 : 10}>
                                  <div className="features-detail">
                                    <h4>Why this score? — FairScore breakdown</h4>
                                    <p className="features-detail-desc">FairScale combines on-chain and social signals. Below are the components for this wallet.</p>
                                    <div className="features-grid">
                                      {a.fairscore_base != null && (
                                        <span>Base (on-chain): {a.fairscore_base.toFixed(1)}</span>
                                      )}
                                      {a.social_score != null && (
                                        <span>Social: {a.social_score.toFixed(1)}</span>
                                      )}
                                      {a.features?.wallet_age_days != null && (
                                        <span>
                                          Wallet age: {a.features?.wallet_age_days} days
                                        </span>
                                      )}
                                      {a.features?.tx_count != null && (
                                        <span>Tx count: {a.features.tx_count}</span>
                                      )}
                                      {a.features?.active_days != null && (
                                        <span>Active days: {a.features.active_days}</span>
                                      )}
                                      {a.features?.native_sol_percentile != null && (
                                        <span>
                                          SOL percentile:{" "}
                                          {(a.features.native_sol_percentile * 100).toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-brand">
            Fair Allocator · Built with{" "}
            <a href={FAIRSCALE_LINKS.website} target="_blank" rel="noopener noreferrer">
              FairScale
            </a>{" "}
            reputation infrastructure for Solana.
            {getFairScoreQueryCount() > 0 && (
              <span className="footer-query-count"> · Powered by {getFairScoreQueryCount()} FairScore queries this session</span>
            )}
          </p>
          <nav className="footer-links">
            <a href={LEGENDS_FUN_URL} target="_blank" rel="noopener noreferrer" className="footer-fairathon">
              Fairathon · Legends.fun
            </a>
            <a href={FAIRSCALE_LINKS.website} target="_blank" rel="noopener noreferrer">
              Website
            </a>
            <a href={FAIRSCALE_LINKS.docs} target="_blank" rel="noopener noreferrer">
              API docs
            </a>
            <a href={FAIRSCALE_LINKS.apiAccess} target="_blank" rel="noopener noreferrer">
              API access (sales)
            </a>
            <a href={FAIRSCALE_LINKS.twitter} target="_blank" rel="noopener noreferrer">
              X / Twitter
            </a>
            <a href={FAIRSCALE_LINKS.telegram} target="_blank" rel="noopener noreferrer">
              Telegram
            </a>
            <a href={FAIRSCALE_LINKS.support} target="_blank" rel="noopener noreferrer">
              Technical support
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default App;
