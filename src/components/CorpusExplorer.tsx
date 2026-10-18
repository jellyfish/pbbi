import React, { useState } from 'react';
import { Database, Search } from 'lucide-react';
import { AppParams } from '../types';
import { FullLeagueAnalysis } from '../utils/statsEngine';
import { HighlightedName } from './HighlightedName';

interface CorpusExplorerProps {
  analysis: FullLeagueAnalysis;
  params: AppParams;
  onUpdateParams: (patch: Partial<AppParams>) => void;
}

export const CorpusExplorer: React.FC<CorpusExplorerProps> = ({
  analysis,
  params,
  onUpdateParams,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'phallic' | 'non_phallic'>('phallic');

  // Map coach_id -> list of franchise abbreviations coached
  const teamsByCoach = new Map<string, string[]>();
  for (const tr of analysis.teamResults) {
    for (const st of tr.stints) {
      const list = teamsByCoach.get(st.coach_id) || [];
      if (!list.includes(tr.franchise.franchise_id)) {
        list.push(tr.franchise.franchise_id);
      }
      teamsByCoach.set(st.coach_id, list);
    }
  }

  const filteredCoaches = analysis.evaluatedCoaches.filter((c) => {
    if (filterMode === 'phallic' && !c.isPhallic) return false;
    if (filterMode === 'non_phallic' && c.isPhallic) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.legal_first_name.toLowerCase().includes(q) ||
        c.activeHighlights.some((h) => h.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Full SQLite Corpus Browser */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-400" />
              NHL Head Coach Corpus ({analysis.phallicUniqueCoaches} Phallic /{' '}
              {analysis.totalUniqueCoaches} Total Coaches Since {params.sinceYear})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Backed by <code className="text-orange-300">data/nhl_coaches.db</code> (SQLite). Click
              any team badge on a coach card to jump to that team's timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 322 coaches..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              {(
                [
                  ['phallic', `Phallic (${analysis.phallicUniqueCoaches})`],
                  ['all', `All (${analysis.evaluatedCoaches.length})`],
                  [
                    'non_phallic',
                    `Non-Phallic (${analysis.evaluatedCoaches.length - analysis.phallicUniqueCoaches})`,
                  ],
                ] as const
              ).map(([m, lbl]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMode(m)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterMode === m
                      ? 'bg-orange-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCoaches.map((coach) => {
            const teams = teamsByCoach.get(coach.coach_id) || [];
            return (
              <div
                key={coach.coach_id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between ${
                  coach.isPhallic
                    ? 'bg-orange-500/10 border-orange-500/40'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <HighlightedName
                        name={coach.full_name}
                        matchedSubstrings={coach.matchedSubstrings}
                        isPhallic={coach.isPhallic}
                        className="text-sm font-bold text-white"
                      />
                      {coach.legal_first_name !== coach.first_name && (
                        <div className="text-[11px] text-orange-300/90 font-mono">
                          Legal First Name: {coach.legal_first_name} (→ Dick)
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {coach.year_min}–{coach.year_max}
                    </span>
                  </div>

                  {coach.isPhallic && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {coach.activeHighlights.map((hl) => (
                        <span
                          key={hl}
                          className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-200 border border-orange-500/30 px-1.5 py-0.5 rounded"
                        >
                          {hl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {coach.career_gp} GP • {coach.career_w}W
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {teams.map((fid) => (
                      <button
                        key={fid}
                        type="button"
                        onClick={() => onUpdateParams({ team: fid, tab: 'analysis' })}
                        className="text-[10px] font-mono font-bold bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-slate-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        {fid}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
