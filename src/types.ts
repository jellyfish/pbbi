export interface Franchise {
  franchise_id: string;
  current_name: string;
  city: string;
  conference: string;
  division: string;
  is_active: number;
  primary_color: string;
  secondary_color: string;
  relocated_from: string | null;
}

export interface PhallicRule {
  rule_id: string;
  label: string;
  pattern_type: 'substring' | 'richard';
  pattern: string;
  tier: 'strict' | 'broad';
  default_enabled: number;
  description: string;
}

export interface Coach {
  coach_id: string;
  nhl_api_id: number | null;
  full_name: string;
  first_name: string;
  last_name: string;
  legal_first_name: string;
  birth_date: string | null;
  year_min: number;
  year_max: number;
  is_active: number;
  is_hof: number;
  career_gp: number;
  career_w: number;
  career_l: number;
  career_t_otl: number;
  career_cups: number;
  is_phallic_default: number;
  is_phallic_core: number;
  is_phallic_broad: number;
  phallic_tier: string | null;
  phallic_matches: string[];
  phallic_highlights: string[];
}

export interface CoachingStint {
  stint_id: number;
  franchise_id: string;
  team_name: string;
  is_current_identity: number;
  coach_id: string;
  coach_name: string;
  stint_seq: number;
  coach_franchise_stint_num: number;
  start_season: string;
  end_season: string;
  start_year: number;
  end_year: number;
  seasons_count: number;
  games_coached: number;
  wins: number;
  losses: number;
  ties_otl: number;
  points_pct: number;
  is_interim: number;
  is_active_stint: number;
}

export interface NhlDataBundle {
  generatedAt: string;
  seasonThrough: string;
  franchises: Franchise[];
  rules: PhallicRule[];
  coaches: Coach[];
  stints: CoachingStint[];
}

export type BaseRateMode = 'stints' | 'unique';
export type MetricMode = 'streak' | 'history' | 'binomial';
export type PresetMode = 'strict' | 'broad' | 'custom';
export type ActiveTab = 'analysis' | 'leaderboard' | 'corpus' | 'primer';

export interface AppParams {
  team: string;
  preset: PresetMode;
  enabledRules: string[];
  customSubstrings: string[];
  baseRateMode: BaseRateMode;
  metricMode: MetricMode;
  includeInterim: boolean;
  includeRelocated: boolean;
  countRepeatStints: boolean;
  sinceYear: number;
  tab: ActiveTab;
}

export interface EvaluatedCoach extends Coach {
  isPhallic: boolean;
  activeMatches: string[];
  activeHighlights: string[];
  matchedSubstrings: string[];
}

export interface EvaluatedStint extends CoachingStint {
  isPhallic: boolean;
  activeHighlights: string[];
  matchedSubstrings: string[];
  streakAtStint: number;
  filteredSeq: number;
}
