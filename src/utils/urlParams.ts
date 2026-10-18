import { ActiveTab, AppParams, BaseRateMode, MetricMode, PresetMode } from '../types';
import { PRESET_RULES } from './statsEngine';

export const DEFAULT_PARAMS: AppParams = {
  team: 'EDM',
  preset: 'strict',
  enabledRules: [...PRESET_RULES.strict],
  customSubstrings: [],
  baseRateMode: 'stints',
  metricMode: 'history',
  includeInterim: true,
  includeRelocated: true,
  countRepeatStints: true,
  sinceYear: 1970,
  tab: 'analysis',
};

export function parseUrlParams(search: string, validTeams: Set<string>, validRules: Set<string>): AppParams {
  const sp = new URLSearchParams(search);

  const rawTeam = (sp.get('team') || DEFAULT_PARAMS.team).toUpperCase();
  const team = validTeams.has(rawTeam) ? rawTeam : DEFAULT_PARAMS.team;

  const rawPreset = sp.get('preset') as PresetMode | null;
  let preset: PresetMode =
    rawPreset && ['strict', 'broad', 'custom'].includes(rawPreset)
      ? rawPreset
      : DEFAULT_PARAMS.preset;

  let enabledRules: string[] = [...PRESET_RULES.strict];
  const rulesParam = sp.get('rules');
  if (rulesParam !== null) {
    enabledRules = rulesParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => validRules.has(s));
    const sorted = [...enabledRules].sort().join(',');
    if (sorted === [...PRESET_RULES.strict].sort().join(',')) preset = 'strict';
    else if (sorted === [...PRESET_RULES.broad].sort().join(',')) preset = 'broad';
    else preset = 'custom';
  } else if (preset !== 'custom') {
    enabledRules = [...PRESET_RULES[preset]];
  }

  const customParam = sp.get('custom');
  const customSubstrings = customParam
    ? customParam
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const rawBase = sp.get('base') as BaseRateMode | null;
  const baseRateMode: BaseRateMode =
    rawBase && ['stints', 'unique'].includes(rawBase) ? rawBase : DEFAULT_PARAMS.baseRateMode;

  const rawMetric = sp.get('metric') as MetricMode | null;
  const metricMode: MetricMode =
    rawMetric && ['streak', 'history', 'binomial'].includes(rawMetric)
      ? rawMetric
      : DEFAULT_PARAMS.metricMode;

  const includeInterim = sp.get('interim') !== '0';
  const includeRelocated = sp.get('relocated') !== '0';
  const countRepeatStints = sp.get('repeats') !== '0';

  const rawSince = Number(sp.get('since'));
  const sinceYear =
    !Number.isNaN(rawSince) && rawSince >= 1970 && rawSince <= 2026
      ? Math.round(rawSince)
      : DEFAULT_PARAMS.sinceYear;

  const rawTab = sp.get('tab') as ActiveTab | null;
  const tab: ActiveTab =
    rawTab && ['analysis', 'leaderboard', 'corpus', 'primer'].includes(rawTab)
      ? rawTab
      : DEFAULT_PARAMS.tab;

  return {
    team,
    preset,
    enabledRules,
    customSubstrings,
    baseRateMode,
    metricMode,
    includeInterim,
    includeRelocated,
    countRepeatStints,
    sinceYear,
    tab,
  };
}

export function serializeUrlParams(params: AppParams): string {
  const sp = new URLSearchParams();

  sp.set('team', params.team);

  if (params.preset !== 'custom') {
    if (params.preset !== DEFAULT_PARAMS.preset) {
      sp.set('preset', params.preset);
    }
  } else {
    sp.set('preset', 'custom');
    sp.set('rules', params.enabledRules.join(','));
  }

  if (params.customSubstrings.length > 0) {
    sp.set('custom', params.customSubstrings.join(','));
  }

  if (params.baseRateMode !== DEFAULT_PARAMS.baseRateMode) {
    sp.set('base', params.baseRateMode);
  }

  if (params.metricMode !== DEFAULT_PARAMS.metricMode) {
    sp.set('metric', params.metricMode);
  }

  if (!params.includeInterim) {
    sp.set('interim', '0');
  }

  if (!params.includeRelocated) {
    sp.set('relocated', '0');
  }

  if (!params.countRepeatStints) {
    sp.set('repeats', '0');
  }

  if (params.sinceYear !== DEFAULT_PARAMS.sinceYear) {
    sp.set('since', String(params.sinceYear));
  }

  if (params.tab !== DEFAULT_PARAMS.tab) {
    sp.set('tab', params.tab);
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
