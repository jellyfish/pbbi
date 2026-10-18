import React, { useState } from 'react';
import { ArrowUpDown, BarChart3, Flame, Trophy } from 'lucide-react';
import { AppParams } from '../types';
import {
  FullLeagueAnalysis,
  TeamAnalysisResult,
  formatOddsOneIn,
  formatPercent,
} from '../utils/statsEngine';

interface LeagueLeaderboardProps {
  analysis: FullLeagueAnalysis;
  params: AppParams;
  onUpdateParams: (patch: Partial<AppParams>) => void;
}

type SortKey =
  | 'obsessionScore'
  | 'maxStreak'
  | 'currentStreak'
  | 'phallicProportion'
  | 'phallicHires'
  | 'markovHistoryMaxStreakProb'
  | 'binomialProb';

export const LeagueLeaderboard: React.FC<LeagueLeaderboardProps> = ({
  analysis,
  params,
  onUpdateParams,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('obsessionScore');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      // For p-values, default ascending (smallest p-value = most significant first)
      setSortAsc(key === 'markovHistoryMaxStreakProb' || key === 'binomialProb');
    }
  };

  const sortedTeams = [...analysis.teamResults].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return sortAsc ? cmp : -cmp;
  });

  const renderVerdictPill = (tr: TeamAnalysisResult) => {
    const map = {
      red: 'bg-red-500/20 text-red-300 border-red-500/40',
      orange: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      slate: 'bg-slate-800 text-slate-400 border-slate-700',
    }[tr.verdictBadgeColor];
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${map}`}>
        {tr.verdictAnswer.split('—')[0].trim()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Chart Comparison */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              NHL Franchise Phallic Obsession Leaderboard ({params.sinceYear}–2027)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any team bar or table row to inspect its coaching history and update the
              shareable URL.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            League Base Rate:{' '}
            <strong className="text-orange-300">{formatPercent(analysis.baseRateP)}</strong>
          </div>
        </div>

        {/* Visual Horizontal Bar Chart of Top 12 Teams */}
        <div className="space-y-2.5 mt-4">
          {analysis.teamResults.slice(0, 12).map((tr) => {
            const isSelected = tr.franchise.franchise_id === params.team;
            return (
              <button
                key={tr.franchise.franchise_id}
                type="button"
                onClick={() => onUpdateParams({ team: tr.franchise.franchise_id, tab: 'analysis' })}
                className={`w-full text-left group rounded-xl p-2.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500/60'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 w-6">
                      #{tr.leagueRank}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: tr.franchise.primary_color }}
                    >
                      {tr.franchise.franchise_id}
                    </span>
                    <span className="font-bold text-slate-100 group-hover:text-orange-300 transition-colors">
                      {tr.franchise.current_name}
                    </span>
                    {renderVerdictPill(tr)}
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs">
                    <span className="text-slate-300 hidden sm:inline">
                      {tr.phallicHires}/{tr.totalHires} ({(tr.phallicProportion * 100).toFixed(1)}%)
                    </span>
                    <span className="text-orange-300 font-bold">
                      Max Streak: {tr.maxStreak}
                    </span>
                    <span className="text-white font-black w-16 text-right">
                      Score: {tr.obsessionScore}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(2, tr.obsessionScore)}%`,
                      background:
                        tr.obsessionScore >= 80
                          ? 'linear-gradient(90deg, #f97316, #ef4444)'
                          : tr.obsessionScore >= 55
                          ? '#f97316'
                          : '#f59e0b',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Sortable Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" />
            All {sortedTeams.length} Franchises Statistical Comparison Table
          </h3>
          <span className="text-xs text-slate-400">Click column headers to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Rank & Team</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('obsessionScore')}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Obsession Score <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('maxStreak')}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Max Streak <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('currentStreak')}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Active Streak <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('phallicProportion')}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Phallic Share <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('markovHistoryMaxStreakProb')}
                    className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    Streak Odds (History) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Phallic Coaches Hired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {sortedTeams.map((tr) => {
                const isSelected = tr.franchise.franchise_id === params.team;
                const phallicNames = tr.stints
                  .filter((s) => s.isPhallic)
                  .map((s) => `${s.coach_name} (${s.start_season.slice(0, 4)})`);

                return (
                  <tr
                    key={tr.franchise.franchise_id}
                    onClick={() =>
                      onUpdateParams({ team: tr.franchise.franchise_id, tab: 'analysis' })
                    }
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-orange-500/15 hover:bg-orange-500/20'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-slate-400 w-5">
                          #{tr.leagueRank}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: tr.franchise.primary_color }}
                        >
                          {tr.franchise.franchise_id}
                        </span>
                        <span className="font-bold text-slate-100">
                          {tr.franchise.current_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{renderVerdictPill(tr)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {tr.obsessionScore} / 100
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {tr.maxStreak > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-orange-300">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          {tr.maxStreak} in a row
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {tr.currentStreak > 0 ? (
                        <span className="text-emerald-300 font-bold">{tr.currentStreak} active</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      <span className="text-slate-100 font-bold">
                        {tr.phallicHires}/{tr.totalHires}
                      </span>{' '}
                      <span className="text-slate-400 text-xs">
                        ({(tr.phallicProportion * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                      {tr.maxStreak > 0 ? (
                        <div>
                          <div className="text-orange-300 font-semibold">
                            {formatPercent(tr.markovHistoryMaxStreakProb)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            ({formatOddsOneIn(tr.markovHistoryMaxStreakProb)})
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300 max-w-md">
                      {phallicNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {phallicNames.map((n, i) => (
                            <span
                              key={i}
                              className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[11px]"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
