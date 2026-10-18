import React from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Flame,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AppParams, MetricMode } from '../types';
import {
  FullLeagueAnalysis,
  formatOddsOneIn,
  formatPercent,
} from '../utils/statsEngine';
import { HighlightedName } from './HighlightedName';

interface TeamVerdictHeroProps {
  analysis: FullLeagueAnalysis;
  params: AppParams;
  onUpdateParams: (patch: Partial<AppParams>) => void;
}

export const TeamVerdictHero: React.FC<TeamVerdictHeroProps> = ({
  analysis,
  params,
  onUpdateParams,
}) => {
  const teamRes = analysis.selectedTeamResult;
  const { franchise } = teamRes;

  const badgeStyles = {
    red: 'bg-red-500/15 text-red-300 border-red-500/40 shadow-red-500/10',
    orange: 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-orange-500/10',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-500/10',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700 shadow-slate-900/20',
  }[teamRes.verdictBadgeColor];

  const VerdictIcon = {
    red: Flame,
    orange: AlertTriangle,
    amber: HelpCircle,
    emerald: ShieldCheck,
    slate: CheckCircle2,
  }[teamRes.verdictBadgeColor];

  const streakK = teamRes.maxStreak;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/85 p-6 sm:p-8 shadow-2xl"
      style={{
        boxShadow: `0 0 80px -25px ${franchise.primary_color}45`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          background: `linear-gradient(90deg, ${franchise.primary_color}, ${
            franchise.secondary_color === '#000000' ? '#f97316' : franchise.secondary_color
          })`,
        }}
      />

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left column: Question & Verdict */}
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-400">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-white shadow-sm"
              style={{ backgroundColor: franchise.primary_color }}
            >
              {franchise.franchise_id}
            </span>
            <span>
              {franchise.conference} Conference • {franchise.division} Division
            </span>
            <span>•</span>
            <span>
              Rank <strong className="text-slate-100">#{teamRes.leagueRank}</strong> of{' '}
              {analysis.teamResults.length} in Phallic Affinity
            </span>
            {franchise.relocated_from && params.includeRelocated && (
              <>
                <span>•</span>
                <span className="text-amber-300/90 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  Includes {franchise.relocated_from}
                </span>
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest font-semibold text-orange-400">
              Bottom-Line Franchise Diagnostic ({params.sinceYear}–2027)
            </p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Are the{' '}
              <span
                className="underline decoration-4 underline-offset-4"
                style={{ textDecorationColor: franchise.primary_color }}
              >
                {franchise.current_name}
              </span>{' '}
              obsessed with hiring coaches with phallic names?
            </h2>
          </div>

          {/* Verdict Banner */}
          <div
            className={`inline-flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border shadow-lg ${badgeStyles}`}
          >
            <div className="flex items-center gap-2.5">
              <VerdictIcon className="w-6 h-6 shrink-0" />
              <span className="text-lg sm:text-xl font-black tracking-tight">
                {teamRes.verdictAnswer}
              </span>
            </div>
            <span className="hidden sm:inline text-current/40">|</span>
            <p className="text-sm text-slate-200/90 font-medium">{teamRes.verdictSubtitle}</p>
          </div>

          {/* Active or Max Streak Showcase */}
          {teamRes.maxStreak > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                {teamRes.currentStreak === teamRes.maxStreak && teamRes.currentStreak >= 2
                  ? `Active Franchise Streak: ${teamRes.maxStreak} Phallic Coaches in a Row (${teamRes.maxStreakStartSeason} to Present)`
                  : `Longest Franchise Streak: ${teamRes.maxStreak} in a Row (${teamRes.maxStreakStartSeason} – ${teamRes.maxStreakEndSeason})`}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {teamRes.maxStreakCoaches.map((st, i) => (
                  <React.Fragment key={`${st.stint_id}_${i}`}>
                    <div className="flex items-center gap-2 bg-slate-950/90 border border-orange-500/40 rounded-lg px-3 py-1.5 shadow-sm">
                      <span className="text-xs font-mono text-orange-400 font-bold">
                        #{i + 1}
                      </span>
                      <HighlightedName
                        name={st.coach_name}
                        matchedSubstrings={st.matchedSubstrings}
                        isPhallic={st.isPhallic}
                        className="text-sm font-semibold text-slate-100"
                      />
                      <span className="text-[11px] font-mono bg-orange-500/15 text-orange-300 px-1.5 py-0.5 rounded">
                        {st.activeHighlights.join(', ')}
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        ({st.start_season.slice(0, 4)}–{st.end_season === '2026-27' ? 'Now' : st.end_season.slice(5)})
                      </span>
                    </div>
                    {i < teamRes.maxStreakCoaches.length - 1 && (
                      <span className="text-orange-400 font-bold text-sm">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Obsession Score Gauge */}
        <div className="lg:w-64 shrink-0 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Phallic Obsession Index
          </div>
          <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={
                  teamRes.obsessionScore >= 80
                    ? '#ef4444'
                    : teamRes.obsessionScore >= 55
                    ? '#f97316'
                    : teamRes.obsessionScore >= 30
                    ? '#f59e0b'
                    : '#10b981'
                }
                strokeWidth="10"
                strokeDasharray={`${(teamRes.obsessionScore / 100) * 263.89} 263.89`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-mono text-white">
                {teamRes.obsessionScore}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                / 100
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-300 font-medium">
            {teamRes.verdictTitle}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            League Base Rate (
            {params.baseRateMode === 'season'
              ? 'Season Pool'
              : params.baseRateMode === 'stints'
              ? 'By Stint'
              : 'Unique Pool'}
            ): <strong className="text-slate-300">{formatPercent(analysis.baseRateP)}</strong>
          </div>
        </div>
      </div>

      {/* 4 Statistical Breakdown Cards */}
      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Simple Streak Odds (p^k) */}
        <button
          type="button"
          onClick={() => onUpdateParams({ metricMode: 'streak' as MetricMode })}
          className={`text-left p-4 rounded-xl border transition-all ${
            params.metricMode === 'streak'
              ? 'bg-orange-500/10 border-orange-500/60 ring-1 ring-orange-500/40'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              1. Exact Streak Odds ({params.baseRateMode === 'season' ? '∏ p_t' : <>p<sup>{streakK}</sup></>})
            </span>
            {params.metricMode === 'streak' && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-bold">
                Selected
              </span>
            )}
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {streakK > 0 ? formatPercent(teamRes.naiveMaxStreakProb) : 'N/A'}
          </div>
          <div className="text-xs font-mono text-orange-300 font-semibold mt-0.5">
            {streakK > 0 ? `(${formatOddsOneIn(teamRes.naiveMaxStreakProb)})` : 'No phallic hires'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {params.baseRateMode === 'season' ? (
              <>
                Product of the active league coaching pool rates across{' '}
                <strong>those exact {streakK || 1} hire seasons</strong>.
              </>
            ) : (
              <>
                Odds that <strong>specifically {streakK || 1} consecutive hires</strong> are all
                phallic at a {formatPercent(analysis.baseRateP)} base rate.
              </>
            )}{' '}
            Without replacement:{' '}
            <span className="text-slate-300 font-mono">
              {streakK > 0 ? formatOddsOneIn(teamRes.hypergeoMaxStreakProb) : 'N/A'}
            </span>
            .
          </p>
        </button>

        {/* Card 2: Any Streak in Team History (Markov Chain) */}
        <button
          type="button"
          onClick={() => onUpdateParams({ metricMode: 'history' as MetricMode })}
          className={`text-left p-4 rounded-xl border transition-all ${
            params.metricMode === 'history'
              ? 'bg-orange-500/10 border-orange-500/60 ring-1 ring-orange-500/40'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              2. Any Run of {streakK} in {teamRes.totalHires} Hires
            </span>
            {params.metricMode === 'history' && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-bold">
                Selected
              </span>
            )}
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {streakK > 0 ? formatPercent(teamRes.markovHistoryMaxStreakProb) : 'N/A'}
          </div>
          <div className="text-xs font-mono text-orange-300 font-semibold mt-0.5">
            {streakK > 0 ? `(${formatOddsOneIn(teamRes.markovHistoryMaxStreakProb)})` : 'No phallic hires'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Exact Markov probability of hitting a streak of {streakK}{' '}
            <strong>anywhere across {teamRes.totalHires} hires</strong>.
          </p>
        </button>

        {/* Card 3: League-Wide 32-Team Look-Elsewhere Odds */}
        <div className="text-left p-4 rounded-xl border bg-slate-950/60 border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              3. League-Wide (32 Teams) Odds
            </span>
            <Award className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {streakK > 0 ? formatPercent(teamRes.leagueWideLookElsewhereProb) : 'N/A'}
          </div>
          <div className="text-xs font-mono text-amber-300 font-semibold mt-0.5">
            {streakK > 0 ? `(${formatOddsOneIn(teamRes.leagueWideLookElsewhereProb)})` : 'No phallic hires'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Odds that <strong>at least one of the 32 NHL teams</strong> would stumble into a{' '}
            {streakK}-coach phallic streak since {params.sinceYear}.{' '}
            {teamRes.leagueWideLookElsewhereProb < 0.05 && streakK > 0 && (
              <strong className="text-emerald-400">Still p &lt; 0.05!</strong>
            )}
          </p>
        </div>

        {/* Card 4: Overall Franchise Proportion (Binomial Test) */}
        <button
          type="button"
          onClick={() => onUpdateParams({ metricMode: 'binomial' as MetricMode })}
          className={`text-left p-4 rounded-xl border transition-all ${
            params.metricMode === 'binomial'
              ? 'bg-orange-500/10 border-orange-500/60 ring-1 ring-orange-500/40'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">
              4. Total Phallic Share (Binomial)
            </span>
            {params.metricMode === 'binomial' && (
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-bold">
                Selected
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-white">
              {teamRes.phallicHires} / {teamRes.totalHires}
            </span>
            <span className="text-sm font-mono text-orange-300 font-bold">
              ({(teamRes.phallicProportion * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="text-xs font-mono text-slate-300 mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            <span>
              {teamRes.overIndexRatio.toFixed(2)}x league avg • p = {formatPercent(teamRes.binomialProb)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Expected <strong className="text-slate-200">{teamRes.expectedPhallicHires.toFixed(1)}</strong>{' '}
            phallic hires by chance; actual is <strong className="text-slate-200">{teamRes.phallicHires}</strong>.
          </p>
        </button>
      </div>
    </section>
  );
};
