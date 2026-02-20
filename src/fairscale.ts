/**
 * FairScale API integration.
 * API: https://api.fairscale.xyz/score?wallet=...
 * Docs: https://docs.fairscale.xyz/
 * Get API key: https://sales.fairscale.xyz/
 */

import type { FairScaleBadge, FairScaleFeatures } from "./types";

const API_BASE = "https://api.fairscale.xyz";

const STORAGE_KEY = "grant-allocator-fairkey";
const STORAGE_MOCK_CACHE = "grant-allocator-mock-cache";
const STORAGE_QUERY_COUNT = "grant-allocator-fairscore-query-count";

function incrementFairScoreQueryCount() {
  try {
    const raw = sessionStorage.getItem(STORAGE_QUERY_COUNT);
    const n = raw ? Math.max(0, parseInt(raw, 10) + 1) : 1;
    sessionStorage.setItem(STORAGE_QUERY_COUNT, String(n));
    return n;
  } catch {
    return 0;
  }
}

/** Total FairScore lookups this session (for traction / judges). */
export function getFairScoreQueryCount(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_QUERY_COUNT);
    return raw ? Math.max(0, parseInt(raw, 10)) : 0;
  } catch {
    return 0;
  }
}

export function getStoredApiKey(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_FAIRSCALE_API_KEY) {
    return import.meta.env.VITE_FAIRSCALE_API_KEY;
  }
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredApiKey(key: string) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** Response shape from FairScale GET /score (docs.fairscale.xyz/docs/api-score) */
export interface FairScaleScoreResponse {
  wallet: string;
  fairscore_base: number;
  social_score: number;
  fairscore: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  badges: FairScaleBadge[];
  timestamp: string;
  features?: FairScaleFeatures;
}

export interface FairScoreResult {
  wallet: string;
  fairScore: number;
  fairscore_base?: number;
  social_score?: number;
  tier?: "bronze" | "silver" | "gold" | "platinum";
  badges?: FairScaleBadge[];
  features?: FairScaleFeatures;
  timestamp?: string;
}

/** Deterministic mock data for demo when no API key */
function mockScore(wallet: string): FairScaleScoreResponse {
  const normalized = wallet.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < normalized.length; i++) {
    h = (h * 31 + normalized.charCodeAt(i)) | 0;
  }
  const r = Math.abs(h);
  const fairscore = (r % 10000) / 100; // 0–100
  const fairscore_base = Math.min(100, fairscore * 0.85);
  const social_score = Math.min(100, fairscore * 0.5 + (r % 30));
  const tiers: Array<"bronze" | "silver" | "gold" | "platinum"> = ["bronze", "silver", "gold", "platinum"];
  const tierIndex = fairscore < 25 ? 0 : fairscore < 50 ? 1 : fairscore < 75 ? 2 : 3;
  const badges: FairScaleBadge[] = [];
  if (fairscore >= 40) badges.push({ id: "active", label: "Active", description: "Consistent on-chain activity", tier: "silver" });
  if (fairscore >= 60) badges.push({ id: "diamond_hands", label: "Diamond Hands", description: "Long-term holder with conviction", tier: "platinum" });
  if (social_score >= 30) badges.push({ id: "social", label: "Social", description: "Verified social presence", tier: "gold" });
  return {
    wallet: normalized,
    fairscore_base: Math.round(fairscore_base * 10) / 10,
    social_score: Math.round(social_score * 10) / 10,
    fairscore: Math.round(fairscore * 10) / 10,
    tier: tiers[tierIndex],
    badges,
    timestamp: new Date().toISOString(),
    features: {
      wallet_age_days: 30 + (r % 400),
      tx_count: 50 + (r % 2000),
      active_days: 10 + (r % 180),
      native_sol_percentile: (r % 100) / 100,
      major_percentile_score: (r % 80) / 100,
    },
  };
}

/**
 * Fetch FairScore for a Solana wallet.
 * Uses real FairScale API when API key is set; otherwise returns mock data for demo.
 */
export async function fetchFairScore(wallet: string): Promise<FairScoreResult> {
  const normalized = wallet.trim();
  if (!normalized) {
    return { wallet: normalized, fairScore: 0 };
  }

  const apiKey = getStoredApiKey();

  if (apiKey) {
    const url = `${API_BASE}/score?wallet=${encodeURIComponent(normalized)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { fairkey: apiKey },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { message?: string }).message ?? res.statusText;
      if (res.status === 401) throw new Error("Invalid API key. Get one at sales.fairscale.xyz");
      if (res.status === 429) throw new Error("Rate limit exceeded. Upgrade at sales.fairscale.xyz");
      throw new Error(msg || `HTTP ${res.status}`);
    }
    const data = (await res.json()) as FairScaleScoreResponse;
    incrementFairScoreQueryCount();
    return {
      wallet: data.wallet,
      fairScore: data.fairscore,
      fairscore_base: data.fairscore_base,
      social_score: data.social_score,
      tier: data.tier,
      badges: data.badges,
      features: data.features,
      timestamp: data.timestamp,
    };
  }

  // Mock: cache per wallet for consistency (session-only to avoid stale data)
  try {
    const raw = sessionStorage.getItem(STORAGE_MOCK_CACHE);
    const cache: Record<string, FairScaleScoreResponse> = raw ? JSON.parse(raw) : {};
    if (cache[normalized]) {
      const c = cache[normalized];
      incrementFairScoreQueryCount();
      return {
        wallet: c.wallet,
        fairScore: c.fairscore,
        fairscore_base: c.fairscore_base,
        social_score: c.social_score,
        tier: c.tier,
        badges: c.badges,
        features: c.features,
        timestamp: c.timestamp,
      };
    }
    const mock = mockScore(normalized);
    cache[normalized] = mock;
    sessionStorage.setItem(STORAGE_MOCK_CACHE, JSON.stringify(cache));
    incrementFairScoreQueryCount();
    return {
      wallet: mock.wallet,
      fairScore: mock.fairscore,
      fairscore_base: mock.fairscore_base,
      social_score: mock.social_score,
      tier: mock.tier,
      badges: mock.badges,
      features: mock.features,
      timestamp: mock.timestamp,
    };
  } catch {
    const mock = mockScore(normalized);
    incrementFairScoreQueryCount();
    return {
      wallet: mock.wallet,
      fairScore: mock.fairscore,
      fairscore_base: mock.fairscore_base,
      social_score: mock.social_score,
      tier: mock.tier,
      badges: mock.badges,
      features: mock.features,
      timestamp: mock.timestamp,
    };
  }
}

/** Basic Solana address check (base58, 32–44 chars). */
export function isValidSolanaAddress(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  const base58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58.test(trimmed);
}

export function formatFairScore(score: number): string {
  return score.toFixed(1);
}

export function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

const TIER_ORDER: Array<"bronze" | "silver" | "gold" | "platinum"> = ["bronze", "silver", "gold", "platinum"];

/** True if tier is at least the minimum (e.g. "silver" for silver+). */
export function tierMeetsMinimum(
  tier: "bronze" | "silver" | "gold" | "platinum" | undefined,
  minimum: "bronze" | "silver" | "gold" | "platinum"
): boolean {
  if (!tier) return false;
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minimum);
}
