/** FairScale API badge (from docs.fairscale.xyz) */
export interface FairScaleBadge {
  id: string;
  label: string;
  description: string;
  tier: string;
}

/** FairScale API features (subset from docs) */
export interface FairScaleFeatures {
  wallet_age_days?: number;
  tx_count?: number;
  active_days?: number;
  median_gap_hours?: number;
  native_sol_percentile?: number;
  major_percentile_score?: number;
  lst_percentile_score?: number;
  stable_percentile_score?: number;
}

export interface Applicant {
  id: string;
  wallet: string;
  label?: string;
  /** Combined FairScore 0–100 (from FairScale API) */
  fairScore: number;
  fairscore_base?: number;
  social_score?: number;
  tier?: "bronze" | "silver" | "gold" | "platinum";
  badges?: FairScaleBadge[];
  features?: FairScaleFeatures;
  timestamp?: string;
  requestedAmount?: number;
  notes?: string;
  /** Manual override: treat as approved regardless of FairScore (governance transparency) */
  overrideApproved?: boolean;
  overrideReason?: string;
}

/** Sybil risk tier for display (judge-friendly) */
export type RiskTier = "healthy" | "borderline" | "likely_sybil";

/** How grant amounts are determined: binary (eligible/not) or weighted by FairScore */
export type AllocationMode = "binary" | "weighted";

/** Use case for this round — same engine, different context for judges and export */
export type RoundType =
  | "grant"
  | "airdrop"
  | "allowlist"
  | "bounty"
  | "dao"
  | "community";

export interface GrantRound {
  id: string;
  name: string;
  description: string;
  totalBudget: number;
  currency: string;
  createdAt: number;
  applicants: Applicant[];
  /** Minimum FairScore (0–100) to be eligible */
  minFairScore: number;
  /** If "weighted", suggested allocations are proportional to FairScore among eligible */
  allocationMode?: AllocationMode;
  /** Use case: grant, airdrop, allowlist, bounty, dao, community (default grant for legacy) */
  roundType?: RoundType;
}
