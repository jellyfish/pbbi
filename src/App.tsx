import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Flame,
  HelpCircle,
  Plus,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import rawNhlData from './data/nhlData.json';
import { ActiveTab, AppParams, BaseRateMode, NhlDataBundle, PresetMode } from './types';
import { PRESET_RULES, formatPercent, runFullAnalysis } from './utils/statsEngine';
import { DEFAULT_PARAMS, parseUrlParams, serializeUrlParams } from './utils/urlParams';
import { TeamVerdictHero } from './components/TeamVerdictHero';
import { CoachingTimeline } from './components/CoachingTimeline';
import { LeagueLeaderboard } from './components/LeagueLeaderboard';
import { CorpusExplorer } from './components/CorpusExplorer';
import { StatsPrimer } from './components/StatsPrimer';

const nhlData = rawNhlData as unknown as NhlDataBundle;

const validTeams = new Set(nhlData.franchises.map((f) => f.franchise_id));
const validRules = new Set(nhlData.rules.map((r) => r.rule_id));

export const App: React.FC = () => {
  const [params, setParams] = useState<AppParams>(() =>
    parseUrlParams(window.location.search, validTeams, validRules)
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [customSubInput, setCustomSubInput] = useState('');

  // Sync state to URL query parameters
  useEffect(() => {
    const qs = serializeUrlParams(params);
    const newUrl = `${window.location.pathname}${qs}`;
    window.history.replaceState(null, '', newUrl);
  }, [params]);

  // Listen to browser popstate
  useEffect(() => {
    const handlePop = () => {
      setParams(parseUrlParams(window.location.search, validTeams, validRules));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const updateParams = (patch: Partial<AppParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const handlePresetChange = (preset: Exclude<PresetMode, 'custom'>) => {
    updateParams({
      preset,
      enabledRules: [...PRESET_RULES[preset]],
    });
  };

  const enabledSet = useMemo(() => new Set(params.enabledRules), [params.enabledRules]);

  const handleToggleRule = (ruleId: string) => {
    const next = new Set(enabledSet);
    if (next.has(ruleId)) {
      next.delete(ruleId);
    } else {
      next.add(ruleId);
    }
    const nextArr = Array.from(next);
    const sorted = [...nextArr].sort().join(',');
    let nextPreset: PresetMode = 'custom';
    if (sorted === [...PRESET_RULES.strict].sort().join(',')) nextPreset = 'strict';
    else if (sorted === [...PRESET_RULES.broad].sort().join(',')) nextPreset = 'broad';

    updateParams({
      preset: nextPreset,
      enabledRules: nextArr,
    });
  };

  const handleAddCustomSubstring = () => {
    const sub = customSubInput.trim().toLowerCase();
    if (!sub || params.customSubstrings.includes(sub)) return;
    updateParams({
      customSubstrings: [...params.customSubstrings, sub],
    });
    setCustomSubInput('');
  };

  const handleRemoveCustomSubstring = (sub: string) => {
    updateParams({
      customSubstrings: params.customSubstrings.filter((s) => s !== sub),
    });
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const analysis = useMemo(() => runFullAnalysis(nhlData, params), [params]);

  const activeFranchises = nhlData.franchises.filter((f) => f.is_active === 1);
  const defunctFranchises = nhlData.franchises.filter((f) => f.is_active === 0);

  const presetSummaryLabel =
    params.preset === 'strict'
      ? 'Strict'
      : params.preset === 'broad'
      ? 'Broad'
      : 'Custom';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Flame className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  The Phallic Bench Boss Index
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                  1970–2027 NHL Corpus
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Statistical &amp; Probability Analysis of NHL Head Coach Names Across All 32 Franchises
              </p>
            </div>
          </div>

          {/* Right Controls: Team Picker + Share + Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <label htmlFor="team-select" className="text-xs font-semibold text-slate-400">
                Franchise:
              </label>
              <select
                id="team-select"
                value={params.team}
                onChange={(e) => updateParams({ team: e.target.value })}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                <optgroup label="Active NHL Franchises (32)" className="bg-slate-900 text-white">
                  {activeFranchises.map((f) => (
                    <option key={f.franchise_id} value={f.franchise_id}>
                      {f.current_name} ({f.franchise_id})
                    </option>
                  ))}
                </optgroup>
                {defunctFranchises.length > 0 && (
                  <optgroup label="Defunct / Historical" className="bg-slate-900 text-slate-300">
                    {defunctFranchises.map((f) => (
                      <option key={f.franchise_id} value={f.franchise_id}>
                        {f.current_name} ({f.franchise_id})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setParams(DEFAULT_PARAMS)}
              title="Reset all filters to default (Edmonton Oilers)"
              className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Global Methodology & URL Filter Bar */}
        <section className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Base Rate, Collapsible Name Dictionary Trigger & Start Year */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                <span>Parameters:</span>
              </div>

              {/* Base Rate Selector with Rich Tooltips */}
              <div className="inline-flex flex-wrap items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => updateParams({ baseRateMode: 'season' as BaseRateMode })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      params.baseRateMode === 'season'
                        ? 'bg-orange-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Base Rate: Season Pool ({formatPercent(analysis.baseRateSeasonP)})</span>
                    <HelpCircle className="w-3 h-3 opacity-75" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-full mt-2 w-72 z-40 rounded-xl bg-slate-900 border border-slate-700 p-3 text-[11px] text-slate-200 shadow-2xl leading-relaxed">
                    <div className="font-bold text-orange-300 mb-1">
                      Active Season Pool ({analysis.phallicCoachSeasons} /{' '}
                      {analysis.totalCoachSeasons} coach-seasons)
                    </div>
                    Evaluates each coaching hire against the exact pool of{' '}
                    <code className="text-orange-300">n</code> active NHL coaches in that specific
                    season (e.g., 7/38 in 2018–19 vs. 0/29 in 1980–81), rather than assuming all
                    322 historical coaches were available in every year.
                  </div>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => updateParams({ baseRateMode: 'stints' as BaseRateMode })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      params.baseRateMode === 'stints'
                        ? 'bg-orange-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Hiring Events ({formatPercent(analysis.baseRateStintsP)})</span>
                    <HelpCircle className="w-3 h-3 opacity-75" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-full mt-2 w-72 z-40 rounded-xl bg-slate-900 border border-slate-700 p-3 text-[11px] text-slate-200 shadow-2xl leading-relaxed">
                    <div className="font-bold text-orange-300 mb-1">
                      Hiring Events Base Rate ({analysis.phallicLeagueStints} /{' '}
                      {analysis.totalLeagueStints} hires)
                    </div>
                    Calculates a single historical probability <code className="text-orange-300">p</code>{' '}
                    across every coaching hire in the league since {params.sinceYear}, weighting
                    coaches by how often NHL teams hired them.
                  </div>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => updateParams({ baseRateMode: 'unique' as BaseRateMode })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      params.baseRateMode === 'unique'
                        ? 'bg-orange-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Unique Coaches ({formatPercent(analysis.baseRateUniqueP)})</span>
                    <HelpCircle className="w-3 h-3 opacity-75" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 z-40 rounded-xl bg-slate-900 border border-slate-700 p-3 text-[11px] text-slate-200 shadow-2xl leading-relaxed">
                    <div className="font-bold text-orange-300 mb-1">
                      Unique Coach Pool ({analysis.phallicUniqueCoaches} /{' '}
                      {analysis.totalUniqueCoaches} coaches)
                    </div>
                    Calculates the baseline probability <code className="text-orange-300">p</code>{' '}
                    counting each individual person only once across the entire {params.sinceYear}–2027
                    corpus, regardless of how many teams hired them or when they coached.
                  </div>
                </div>
              </div>

              {/* Collapsible Phallic Name Dictionary Trigger */}
              <button
                type="button"
                onClick={() => setIsDictionaryOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 border text-xs font-semibold transition-colors cursor-pointer ${
                  isDictionaryOpen
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/50'
                    : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>
                  Name Rules: <strong className="text-orange-300">{presetSummaryLabel}</strong> (
                  {analysis.phallicUniqueCoaches} coaches)
                </span>
                {isDictionaryOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Start Year Filter */}
              <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-400">Since:</span>
                <select
                  value={params.sinceYear}
                  onChange={(e) => updateParams({ sinceYear: Number(e.target.value) })}
                  className="bg-transparent font-mono font-bold text-orange-300 focus:outline-none cursor-pointer"
                >
                  <option value={1970} className="bg-slate-900">1970 (Modern Era)</option>
                  <option value={1979} className="bg-slate-900">1979 (WHA Merger)</option>
                  <option value={1990} className="bg-slate-900">1990 (90s–Present)</option>
                  <option value={2000} className="bg-slate-900">2000 (21st Century)</option>
                  <option value={2010} className="bg-slate-900">2010 (Analytics Era)</option>
                  <option value={2018} className="bg-slate-900">2018 (Since 2018–19)</option>
                </select>
              </div>
            </div>

            {/* Right: Data Handling Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={params.includeInterim}
                  onChange={(e) => updateParams({ includeInterim: e.target.checked })}
                  className="accent-orange-500 rounded cursor-pointer"
                />
                <span>Include Interim Coaches</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={params.includeRelocated}
                  onChange={(e) => updateParams({ includeRelocated: e.target.checked })}
                  className="accent-orange-500 rounded cursor-pointer"
                />
                <span>Include Relocated History</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={params.countRepeatStints}
                  onChange={(e) => updateParams({ countRepeatStints: e.target.checked })}
                  className="accent-orange-500 rounded cursor-pointer"
                />
                <span>Count Repeat Stints</span>
              </label>
            </div>
          </div>

          {/* Collapsible Phallic Name Classification Dictionary */}
          {isDictionaryOpen && (
            <div className="mt-4 pt-4 border-t border-slate-800/90 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    Phallic Name Classification Dictionary (URL-Synced)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any rule below to toggle it on or off, or switch between the Strict and
                    Broad presets. All 32 teams' odds recalculate immediately.
                  </p>
                </div>

                {/* Preset Quick-Select Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ['strict', 'Strict (15 Coaches)'],
                      ['broad', 'Broad (22 Coaches)'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetChange(key)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        params.preset === key
                          ? 'bg-orange-500 text-slate-950 border-orange-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Categories: Strict vs Broad */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(
                  [
                    ['strict', 'Strict Category (Default — Direct & Classic Slang)'],
                    ['broad', 'Broad Category (Extended & Double-Entendres)'],
                  ] as const
                ).map(([tierKey, tierTitle]) => (
                  <div
                    key={tierKey}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2.5"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {tierTitle}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {nhlData.rules
                        .filter((r) => r.tier === tierKey)
                        .map((rule) => {
                          const isOn = enabledSet.has(rule.rule_id);
                          return (
                            <button
                              key={rule.rule_id}
                              type="button"
                              onClick={() => handleToggleRule(rule.rule_id)}
                              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
                                isOn
                                  ? 'bg-orange-500/15 border-orange-500/50 text-slate-100'
                                  : 'bg-slate-900/40 border-slate-800/70 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                                  isOn ? 'bg-orange-500 text-slate-950' : 'border border-slate-600'
                                }`}
                              >
                                {isOn && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="text-xs">
                                <div className="font-bold font-mono">{rule.label}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                  {rule.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Substring Input */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={customSubInput}
                    onChange={(e) => setCustomSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubstring();
                      }
                    }}
                    placeholder="Add custom phallic substring (e.g. 'bone', 'cox', 'hard', 'horn')..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubstring}
                    disabled={!customSubInput.trim()}
                    className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Substring
                  </button>
                </div>

                {params.customSubstrings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400">Custom:</span>
                    {params.customSubstrings.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 text-orange-200 text-xs font-mono px-2 py-0.5 rounded-lg"
                      >
                        "{sub}"
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomSubstring(sub)}
                          className="hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Hero Verdict Card for Selected Team */}
        <TeamVerdictHero
          analysis={analysis}
          params={params}
          onUpdateParams={updateParams}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {(
            [
              ['analysis', 'Team Coaching Timeline', Flame],
              ['leaderboard', 'All 32 Teams Obsession Leaderboard', BarChart3],
              ['corpus', `Full Coach Corpus (${analysis.totalUniqueCoaches})`, Database],
              ['primer', 'Stats Novice Guide: Is It Just Coincidence?', BookOpen],
            ] as const
          ).map(([tabKey, label, Icon]) => {
            const isActive = params.tab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => updateParams({ tab: tabKey as ActiveTab })}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab View */}
        {params.tab === 'analysis' && (
          <CoachingTimeline
            analysis={analysis}
            params={params}
          />
        )}

        {params.tab === 'leaderboard' && (
          <LeagueLeaderboard
            analysis={analysis}
            params={params}
            onUpdateParams={updateParams}
          />
        )}

        {params.tab === 'corpus' && (
          <CorpusExplorer
            analysis={analysis}
            params={params}
            onUpdateParams={updateParams}
          />
        )}

        {params.tab === 'primer' && (
          <StatsPrimer
            analysis={analysis}
            params={params}
            onUpdateParams={updateParams}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Data sourced from Hockey-Reference &amp; NHL Records API (1970–2027) • Stored locally in{' '}
            <code className="text-slate-400">data/nhl_coaches.db</code> (SQLite)
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Every filter and dictionary rule is persisted in the URL query string for instant
              sharing.
            </span>
            <span className="text-slate-700">•</span>
            <a
              href="https://github.com/jellyfish/pbbi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-4 transition-colors"
            >
              GitHub Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
