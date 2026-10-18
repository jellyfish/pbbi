import {
  AppParams,
  Coach,
  CoachingStint,
  EvaluatedCoach,
  EvaluatedStint,
  Franchise,
  NhlDataBundle,
  PhallicRule,
  PresetMode,
} from '../types';

export const PRESET_RULES: Record<Exclude<PresetMode, 'custom'>, string[]> = {
  strict: ['cock', 'tip', 'wood', 'knob', 'dick', 'rod', 'willie', 'johnson', 'peter', 'creamer'],
  broad: [
    'cock',
    'tip',
    'wood',
    'knob',
    'dick',
    'rod',
    'willie',
    'johnson',
    'peter',
    'creamer',
    'richard',
    'johnston',
    'bush',
    'long',
    'sacco',
  ],
};

export function evaluateCoach(
  coach: Coach,
  rules: PhallicRule[],
  enabledRuleIds: Set<string>,
  customSubstrings: string[]
): EvaluatedCoach {
  const activeMatches: string[] = [];
  const activeHighlights: string[] = [];
  const matchedSubstrings: string[] = [];

  const lowFull = coach.full_name.toLowerCase();

  for (const rule of rules) {
    if (!enabledRuleIds.has(rule.rule_id)) continue;

    if (rule.pattern_type === 'substring') {
      if (lowFull.includes(rule.pattern.toLowerCase())) {
        activeMatches.push(rule.rule_id);
        activeHighlights.push(rule.label);
        matchedSubstrings.push(rule.pattern.toLowerCase());
      }
    } else if (rule.pattern_type === 'richard') {
      if (lowFull.includes('richard') && !lowFull.includes('richardson')) {
        activeMatches.push(rule.rule_id);
        activeHighlights.push(rule.label);
        matchedSubstrings.push('richard');
      }
    }
  }

  for (const rawCustom of customSubstrings) {
    const sub = rawCustom.trim().toLowerCase();
    if (!sub) continue;
    if (lowFull.includes(sub)) {
      activeMatches.push(`custom:${sub}`);
      activeHighlights.push(`"${sub}" (custom)`);
      matchedSubstrings.push(sub);
    }
  }

  return {
    ...coach,
    isPhallic: activeMatches.length > 0,
    activeMatches,
    activeHighlights: Array.from(new Set(activeHighlights)),
    matchedSubstrings: Array.from(new Set(matchedSubstrings)),
  };
}

/**
 * Exact probability of seeing AT LEAST ONE run of length >= k in N independent Bernoulli trials
 * with success probability p, computed via an exact Markov chain transition over states 0..k.
 */
export function probLongestRunAtLeastK(n: number, k: number, p: number): number {
  if (k <= 0) return 1;
  if (n < k || p <= 0) return 0;
  if (p >= 1) return 1;

  // dp[s] = probability of being in current streak state s (0 <= s < k) without having hit k yet
  // dp[k] = absorbing state: probability of having already hit a streak of length >= k
  let dp = new Float64Array(k + 1);
  dp[0] = 1.0;

  for (let step = 0; step < n; step++) {
    const next = new Float64Array(k + 1);
    let sumNotAbsorbed = 0;
    for (let s = 0; s < k; s++) {
      sumNotAbsorbed += dp[s];
      if (s + 1 < k) {
        next[s + 1] = dp[s] * p;
      } else {
        next[k] += dp[s] * p;
      }
    }
    next[0] = sumNotAbsorbed * (1 - p);
    next[k] += dp[k];
    dp = next;
  }

  return Math.min(1, Math.max(0, dp[k]));
}

/**
 * Exact one-sided Binomial tail probability P(Binomial(n, p) >= x)
 */
export function binomialTailProb(n: number, x: number, p: number): number {
  if (x <= 0) return 1;
  if (x > n || p <= 0) return 0;
  if (p >= 1) return 1;

  // Use log-gamma / log-combinations to avoid overflow
  const logFact = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) {
    logFact[i] = logFact[i - 1] + Math.log(i);
  }

  let totalProb = 0;
  const logP = Math.log(p);
  const logQ = Math.log(1 - p);

  for (let j = x; j <= n; j++) {
    const logComb = logFact[n] - logFact[j] - logFact[n - j];
    const logTerm = logComb + j * logP + (n - j) * logQ;
    totalProb += Math.exp(logTerm);
  }

  return Math.min(1, Math.max(0, totalProb));
}

/**
 * Hypergeometric sequential draw probability without replacement:
 * Drawing k phallic coaches in a row from a pool of M total coaches containing K phallic coaches.
 */
export function hypergeometricStreakProb(totalPool: number, phallicPool: number, k: number): number {
  if (k <= 0) return 1;
  if (k > phallicPool || k > totalPool || totalPool <= 0) return 0;
  let prob = 1;
  for (let i = 0; i < k; i++) {
    prob *= (phallicPool - i) / (totalPool - i);
  }
  return prob;
}

export interface TeamAnalysisResult {
  franchise: Franchise;
  stints: EvaluatedStint[];
  totalHires: number;
  phallicHires: number;
  phallicProportion: number;
  expectedPhallicHires: number;
  overIndexRatio: number;
  currentStreak: number;
  maxStreak: number;
  maxStreakStartSeason: string | null;
  maxStreakEndSeason: string | null;
  maxStreakCoaches: EvaluatedStint[];
  currentStreakCoaches: EvaluatedStint[];
  // Probabilities
  naiveMaxStreakProb: number; // p^maxStreak
  naiveCurrentStreakProb: number; // p^currentStreak
  hypergeoMaxStreakProb: number; // without replacement
  markovHistoryMaxStreakProb: number; // P(MaxRun >= maxStreak in N hires)
  leagueWideLookElsewhereProb: number; // P(At least 1 of 32 teams has MaxRun >= maxStreak)
  binomialProb: number; // P(Binomial(N, p) >= X)
  selectedMetricProb: number;
  // Obsession Score & Verdict
  obsessionScore: number; // 0 to 100
  verdictTitle: string;
  verdictSubtitle: string;
  verdictBadgeColor: 'red' | 'orange' | 'amber' | 'emerald' | 'slate';
  verdictAnswer: 'YES — STATISTICALLY UNDENIABLE' | 'PROBABLY — SUSPICIOUSLY FIXATED' | 'MAYBE — PHALLIC-CURIOUS' | 'NO — WITHIN NORMAL CHANCE' | 'NO — PHALLIC-AVERSE';
  leagueRank: number;
}

export interface FullLeagueAnalysis {
  baseRateP: number;
  baseRateUniqueP: number;
  baseRateStintsP: number;
  totalUniqueCoaches: number;
  phallicUniqueCoaches: number;
  totalLeagueStints: number;
  phallicLeagueStints: number;
  evaluatedCoaches: EvaluatedCoach[];
  coachMap: Map<string, EvaluatedCoach>;
  teamResults: TeamAnalysisResult[];
  selectedTeamResult: TeamAnalysisResult;
}

export function filterAndMergeStintsForFranchise(
  rawStints: CoachingStint[],
  params: AppParams,
  coachMap: Map<string, EvaluatedCoach>
): EvaluatedStint[] {
  // 1. Filter by year, relocated, interim
  const filtered: CoachingStint[] = [];
  for (const st of rawStints) {
    if (st.end_year <= params.sinceYear && st.start_year < params.sinceYear) {
      continue;
    }
    if (!params.includeRelocated && st.is_current_identity === 0) {
      continue;
    }
    if (!params.includeInterim && st.is_interim === 1) {
      continue;
    }
    filtered.push({ ...st });
  }

  // 2. If interim stints were removed, merge consecutive stints by the same coach
  const merged: CoachingStint[] = [];
  for (const st of filtered) {
    if (merged.length > 0 && merged[merged.length - 1].coach_id === st.coach_id) {
      const prev = merged[merged.length - 1];
      prev.end_season = st.end_season;
      prev.end_year = st.end_year;
      prev.seasons_count += st.seasons_count;
      prev.games_coached += st.games_coached;
      prev.wins += st.wins;
      prev.losses += st.losses;
      prev.ties_otl += st.ties_otl;
      const gp = prev.games_coached;
      prev.points_pct = gp > 0 ? Number(((prev.wins * 2 + prev.ties_otl) / (gp * 2)).toFixed(4)) : 0;
      prev.is_active_stint = st.is_active_stint;
    } else {
      merged.push(st);
    }
  }

  // 3. If countRepeatStints is false, keep only the first stint per coach_id for this franchise
  const deduped: CoachingStint[] = [];
  const seenCoaches = new Set<string>();
  for (const st of merged) {
    if (!params.countRepeatStints) {
      if (seenCoaches.has(st.coach_id)) continue;
      seenCoaches.add(st.coach_id);
    }
    deduped.push(st);
  }

  // 4. Evaluate phallic status and compute running streak
  let runningStreak = 0;
  return deduped.map((st, idx) => {
    const knownCoach = coachMap.get(st.coach_id);
    const isPhallic = knownCoach ? knownCoach.isPhallic : false;
    const activeHighlights = knownCoach ? knownCoach.activeHighlights : [];
    const matchedSubstrings = knownCoach ? knownCoach.matchedSubstrings : [];

    if (isPhallic) {
      runningStreak += 1;
    } else {
      runningStreak = 0;
    }

    return {
      ...st,
      isPhallic,
      activeHighlights,
      matchedSubstrings,
      streakAtStint: runningStreak,
      filteredSeq: idx + 1,
    };
  });
}

export function runFullAnalysis(data: NhlDataBundle, params: AppParams): FullLeagueAnalysis {
  const enabledRuleIds = new Set(params.enabledRules);

  // 1. Evaluate all coaches in the corpus (filtered by sinceYear)
  const eligibleCoaches = data.coaches.filter((c) => c.year_max >= params.sinceYear);
  const evaluatedCoaches = eligibleCoaches.map((c) =>
    evaluateCoach(c, data.rules, enabledRuleIds, params.customSubstrings)
  );
  const coachMap = new Map<string, EvaluatedCoach>();
  for (const c of data.coaches) {
    coachMap.set(c.coach_id, evaluateCoach(c, data.rules, enabledRuleIds, params.customSubstrings));
  }

  // 2. Group raw stints by franchise
  const stintsByFranchise = new Map<string, CoachingStint[]>();
  for (const f of data.franchises) {
    stintsByFranchise.set(f.franchise_id, []);
  }
  for (const st of data.stints) {
    const arr = stintsByFranchise.get(st.franchise_id);
    if (arr) arr.push(st);
  }

  // 3. First pass: filter stints for all franchises to compute league-wide base rates
  let totalLeagueStints = 0;
  let phallicLeagueStints = 0;
  const activeCoachIdsInWindow = new Set<string>();

  for (const f of data.franchises) {
    const raw = stintsByFranchise.get(f.franchise_id) || [];
    const evalStints = filterAndMergeStintsForFranchise(raw, params, coachMap);
    for (const st of evalStints) {
      totalLeagueStints += 1;
      if (st.isPhallic) phallicLeagueStints += 1;
      activeCoachIdsInWindow.add(st.coach_id);
    }
  }

  const windowCoaches = evaluatedCoaches.filter((c) => activeCoachIdsInWindow.has(c.coach_id));
  const totalUniqueCoaches = windowCoaches.length || evaluatedCoaches.length;
  const phallicUniqueCoaches = windowCoaches.filter((c) => c.isPhallic).length;

  const baseRateUniqueP = totalUniqueCoaches > 0 ? phallicUniqueCoaches / totalUniqueCoaches : 0;
  const baseRateStintsP = totalLeagueStints > 0 ? phallicLeagueStints / totalLeagueStints : 0;
  const baseRateP = params.baseRateMode === 'unique' ? baseRateUniqueP : baseRateStintsP;

  // Precompute all franchise hire counts for Look-Elsewhere correction
  const franchiseHireCounts: number[] = [];
  for (const f of data.franchises) {
    if (!f.is_active && f.franchise_id !== params.team) continue;
    const raw = stintsByFranchise.get(f.franchise_id) || [];
    const stints = filterAndMergeStintsForFranchise(raw, params, coachMap);
    if (stints.length > 0) franchiseHireCounts.push(stints.length);
  }

  // 4. Compute full metrics for each franchise
  const teamResults: TeamAnalysisResult[] = [];

  for (const f of data.franchises) {
    const raw = stintsByFranchise.get(f.franchise_id) || [];
    const stints = filterAndMergeStintsForFranchise(raw, params, coachMap);

    const totalHires = stints.length;
    const phallicHires = stints.filter((s) => s.isPhallic).length;
    const phallicProportion = totalHires > 0 ? phallicHires / totalHires : 0;
    const expectedPhallicHires = totalHires * baseRateP;
    const overIndexRatio = baseRateP > 0 ? phallicProportion / baseRateP : 0;

    // Streaks
    let maxStreak = 0;
    let maxEndIdx = -1;
    for (let i = 0; i < stints.length; i++) {
      if (stints[i].streakAtStint >= maxStreak && stints[i].streakAtStint > 0) {
        maxStreak = stints[i].streakAtStint;
        maxEndIdx = i;
      }
    }

    const maxStreakCoaches =
      maxStreak > 0 && maxEndIdx >= 0
        ? stints.slice(maxEndIdx - maxStreak + 1, maxEndIdx + 1)
        : [];
    const maxStreakStartSeason = maxStreakCoaches.length > 0 ? maxStreakCoaches[0].start_season : null;
    const maxStreakEndSeason =
      maxStreakCoaches.length > 0 ? maxStreakCoaches[maxStreakCoaches.length - 1].end_season : null;

    const currentStreak = stints.length > 0 ? stints[stints.length - 1].streakAtStint : 0;
    const currentStreakCoaches =
      currentStreak > 0 ? stints.slice(stints.length - currentStreak) : [];

    // Probabilities
    const naiveMaxStreakProb = maxStreak > 0 ? Math.pow(baseRateP, maxStreak) : 1;
    const naiveCurrentStreakProb = currentStreak > 0 ? Math.pow(baseRateP, currentStreak) : 1;
    const hypergeoMaxStreakProb =
      maxStreak > 0
        ? hypergeometricStreakProb(totalUniqueCoaches, phallicUniqueCoaches, maxStreak)
        : 1;
    const markovHistoryMaxStreakProb =
      maxStreak > 0 ? probLongestRunAtLeastK(totalHires, maxStreak, baseRateP) : 1;

    // League-wide probability that AT LEAST ONE of the active NHL franchises would hit maxStreak
    let probNoTeamHitsStreak = 1.0;
    if (maxStreak > 0) {
      for (const nHires of franchiseHireCounts) {
        const pTeam = probLongestRunAtLeastK(nHires, maxStreak, baseRateP);
        probNoTeamHitsStreak *= 1 - pTeam;
      }
    }
    const leagueWideLookElsewhereProb = maxStreak > 0 ? 1 - probNoTeamHitsStreak : 1;

    const binomialProb = phallicHires > 0 ? binomialTailProb(totalHires, phallicHires, baseRateP) : 1;

    let selectedMetricProb = markovHistoryMaxStreakProb;
    if (params.metricMode === 'streak') {
      selectedMetricProb = maxStreak > 0 ? naiveMaxStreakProb : 1;
    } else if (params.metricMode === 'binomial') {
      selectedMetricProb = binomialProb;
    }

    // Composite Phallic Obsession Score (0-100)
    // Combines surprise (-log10(p)) of longest streak in team history + binomial proportion + active streak bonus
    let obsessionScore = 0;
    if (phallicHires > 0 && baseRateP > 0) {
      const runSurprise = Math.min(4.5, -Math.log10(Math.max(1e-6, markovHistoryMaxStreakProb))); // 0..4.5
      const binomSurprise = Math.min(3.0, -Math.log10(Math.max(1e-4, binomialProb))); // 0..3.0
      const activeBonus = Math.min(15, currentStreak * 3.5);
      const rawScore = (runSurprise / 4.0) * 55 + (binomSurprise / 2.5) * 30 + activeBonus;
      obsessionScore = Math.round(Math.min(99, Math.max(4, rawScore)));
      if (maxStreak >= 5) {
        obsessionScore = Math.max(96, obsessionScore);
      }
    }

    let verdictAnswer: TeamAnalysisResult['verdictAnswer'] = 'NO — WITHIN NORMAL CHANCE';
    let verdictTitle = 'Statistically Normal Hiring Pattern';
    let verdictSubtitle = 'Phallic-named hires fall well within random chance expectations.';
    let verdictBadgeColor: TeamAnalysisResult['verdictBadgeColor'] = 'slate';

    if (phallicHires === 0) {
      verdictAnswer = 'NO — PHALLIC-AVERSE';
      verdictTitle = '100% Chaste Coaching History';
      verdictSubtitle = `Zero phallic-named coaches across ${totalHires} hires.`;
      verdictBadgeColor = 'emerald';
    } else if (markovHistoryMaxStreakProb < 0.01 || binomialProb < 0.01 || maxStreak >= 4) {
      verdictAnswer = 'YES — STATISTICALLY UNDENIABLE';
      verdictTitle = 'Statistically Significant Phallic Fixation';
      verdictSubtitle = `A streak of ${maxStreak} in a row has just a ${(markovHistoryMaxStreakProb * 100).toFixed(3)}% chance across ${totalHires} hires.`;
      verdictBadgeColor = 'red';
    } else if (markovHistoryMaxStreakProb < 0.08 || binomialProb < 0.08 || maxStreak >= 3) {
      verdictAnswer = 'PROBABLY — SUSPICIOUSLY FIXATED';
      verdictTitle = 'Suspiciously High Phallic Affinity';
      verdictSubtitle = `Hired ${phallicHires} phallic coaches (${(phallicProportion * 100).toFixed(1)}%, ${overIndexRatio.toFixed(1)}x league rate) with a ${maxStreak}-coach streak.`;
      verdictBadgeColor = 'orange';
    } else if (overIndexRatio >= 1.25 || maxStreak >= 2 || currentStreak >= 1) {
      verdictAnswer = 'MAYBE — PHALLIC-CURIOUS';
      verdictTitle = 'Mildly Phallic-Curious Front Office';
      verdictSubtitle = `Some notable double-entendre hires, though still plausible by random chance (p = ${(Math.min(markovHistoryMaxStreakProb, binomialProb) * 100).toFixed(1)}%).`;
      verdictBadgeColor = 'amber';
    }

    teamResults.push({
      franchise: f,
      stints,
      totalHires,
      phallicHires,
      phallicProportion,
      expectedPhallicHires,
      overIndexRatio,
      currentStreak,
      maxStreak,
      maxStreakStartSeason,
      maxStreakEndSeason,
      maxStreakCoaches,
      currentStreakCoaches,
      naiveMaxStreakProb,
      naiveCurrentStreakProb,
      hypergeoMaxStreakProb,
      markovHistoryMaxStreakProb,
      leagueWideLookElsewhereProb,
      binomialProb,
      selectedMetricProb,
      obsessionScore,
      verdictTitle,
      verdictSubtitle,
      verdictBadgeColor,
      verdictAnswer,
      leagueRank: 0,
    });
  }

  // Sort by obsessionScore desc, then maxStreak desc, then phallicProportion desc to assign leagueRank
  const sortedForRank = [...teamResults]
    .filter((r) => r.totalHires > 0)
    .sort((a, b) => {
      if (b.obsessionScore !== a.obsessionScore) return b.obsessionScore - a.obsessionScore;
      if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
      if (b.phallicProportion !== a.phallicProportion) return b.phallicProportion - a.phallicProportion;
      return b.phallicHires - a.phallicHires;
    });

  sortedForRank.forEach((item, idx) => {
    item.leagueRank = idx + 1;
  });

  const selectedTeamResult =
    teamResults.find((r) => r.franchise.franchise_id === params.team) || teamResults[0];

  return {
    baseRateP,
    baseRateUniqueP,
    baseRateStintsP,
    totalUniqueCoaches,
    phallicUniqueCoaches,
    totalLeagueStints,
    phallicLeagueStints,
    evaluatedCoaches,
    coachMap,
    teamResults: sortedForRank,
    selectedTeamResult,
  };
}

export function formatOddsOneIn(prob: number): string {
  if (prob <= 0) return '∞';
  if (prob >= 0.9999) return '1 in 1';
  const oneIn = 1 / prob;
  if (oneIn >= 1_000_000) {
    return `1 in ${(oneIn / 1_000_000).toFixed(2)}M`;
  }
  if (oneIn >= 10_000) {
    return `1 in ${Math.round(oneIn).toLocaleString()}`;
  }
  if (oneIn >= 100) {
    return `1 in ${Math.round(oneIn).toLocaleString()}`;
  }
  return `1 in ${oneIn.toFixed(1)}`;
}

export function formatPercent(prob: number): string {
  const pct = prob * 100;
  if (pct === 0) return '0%';
  if (pct < 0.0001) return `${pct.toExponential(2)}%`;
  if (pct < 0.01) return `${pct.toFixed(4)}%`;
  if (pct < 1) return `${pct.toFixed(3)}%`;
  return `${pct.toFixed(1)}%`;
}
