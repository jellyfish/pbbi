import React from 'react';
import { Calendar, Flame, Trophy } from 'lucide-react';
import { AppParams } from '../types';
import { FullLeagueAnalysis } from '../utils/statsEngine';
import { HighlightedName } from './HighlightedName';

interface CoachingTimelineProps {
  analysis: FullLeagueAnalysis;
  params: AppParams;
}

export const CoachingTimeline: React.FC<CoachingTimelineProps> = ({ analysis, params }) => {
  const teamRes = analysis.selectedTeamResult;
  const { stints, franchise } = teamRes;

  return (
    <div className="space-y-6">
      {/* Chronological Coaching Stints Grid / Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              Chronological Head Coaching History ({params.sinceYear}–2027)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing all {stints.length} qualifying coaching hires for {franchise.current_name} in
              chronological order (oldest to most recent). Phallic-named coaches are highlighted in
              orange.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-orange-300 font-semibold">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              Phallic Name ({teamRes.phallicHires})
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
              Non-Phallic ({teamRes.totalHires - teamRes.phallicHires})
            </span>
          </div>
        </div>

        {/* Visual Streak Barcode Strip */}
        <div className="mb-6 bg-slate-950/90 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Sequential Hiring Barcode (Left = Oldest, Right = Current)</span>
            <span className="font-mono text-orange-300">
              Max Streak: {teamRes.maxStreak} • Active Streak: {teamRes.currentStreak}
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {stints.map((st) => (
              <div
                key={st.filteredSeq}
                title={`#${st.filteredSeq}: ${st.coach_name} (${st.start_season}–${st.end_season})${
                  st.isPhallic ? ` — Match: ${st.activeHighlights.join(', ')}` : ''
                }`}
                className={`h-8 flex-1 min-w-[18px] rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-transform hover:scale-110 ${
                  st.isPhallic
                    ? 'bg-gradient-to-b from-orange-400 to-red-600 text-slate-950 shadow-md shadow-orange-500/20 ring-1 ring-orange-300/60'
                    : 'bg-slate-800/80 text-slate-500 hover:bg-slate-700'
                }`}
              >
                {st.isPhallic ? st.streakAtStint : '·'}
              </div>
            ))}
          </div>
        </div>

        {/* Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {stints.map((st) => {
            const winPct = (st.points_pct * 100).toFixed(1);
            return (
              <div
                key={`${st.stint_id}_${st.filteredSeq}`}
                className={`relative rounded-xl border p-4 transition-all ${
                  st.isPhallic
                    ? 'bg-gradient-to-br from-orange-500/15 via-slate-900 to-slate-950 border-orange-500/50 shadow-lg shadow-orange-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold ${
                        st.isPhallic
                          ? 'bg-orange-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {st.filteredSeq}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <HighlightedName
                          name={st.coach_name}
                          matchedSubstrings={st.matchedSubstrings}
                          isPhallic={st.isPhallic}
                          className="text-base font-bold text-white"
                        />
                        {st.is_active_stint === 1 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            Active 2026–27
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono">
                          {st.start_season === st.end_season
                            ? st.start_season
                            : `${st.start_season} → ${st.end_season}`}
                        </span>
                        {st.is_current_identity === 0 && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            {st.team_name}
                          </span>
                        )}
                        {st.is_interim === 1 && (
                          <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                            Interim
                          </span>
                        )}
                        {st.coach_franchise_stint_num > 1 && (
                          <span className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                            Stint #{st.coach_franchise_stint_num}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Streak Badge if Phallic */}
                  {st.isPhallic && (
                    <div className="shrink-0 flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-black bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        {st.streakAtStint} in a row
                      </span>
                    </div>
                  )}
                </div>

                {/* Record footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{st.games_coached} GP</span>
                  <span>
                    {st.wins}-{st.losses}-{st.ties_otl}
                  </span>
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-slate-500" />
                    {winPct}% Pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
