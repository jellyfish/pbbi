import React from 'react';
import { BookOpen, Calculator, CheckCircle2, HelpCircle, Scale, Sparkles } from 'lucide-react';
import { AppParams } from '../types';
import { FullLeagueAnalysis, formatOddsOneIn, formatPercent } from '../utils/statsEngine';

interface StatsPrimerProps {
  analysis: FullLeagueAnalysis;
  params: AppParams;
  onUpdateParams: (patch: Partial<AppParams>) => void;
}

export const StatsPrimer: React.FC<StatsPrimerProps> = ({
  analysis,
  params,
  onUpdateParams,
}) => {
  const tr = analysis.selectedTeamResult;
  const edmResult =
    analysis.teamResults.find((t) => t.franchise.franchise_id === 'EDM') || tr;
  const k = tr.maxStreak || 5;
  const n = tr.totalHires;
  const p = analysis.baseRateP;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400">
            <BookOpen className="w-4 h-4" />
            <span>A Non-Statistician's Guide to Coaching Name Probability</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Can we say it's statistically unlikely that 5 phallic coaches in a row happened by
            chance?
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Short answer: <strong className="text-orange-300">Yes — emphatically.</strong> Even when
            we bend over backward to give random chance every possible statistical advantage (the
            NHL's "Old Boys' Club" coach recycling, the total number of coaches a team has hired
            since 1970, and the fact that there are 32 teams in the league), a streak of 5 sequential
            phallic-named head coaches still falls well past the scientific threshold for
            statistical significance (<code className="text-emerald-300">p &lt; 0.05</code>).
          </p>
        </div>

        {/* Step 1: The Base Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
              <Calculator className="w-4 h-4" />
              <span>Step 1: What is the "Base Rate" (p) of a Phallic Coach?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Before we can calculate the odds of a streak, we need the probability{' '}
              <code className="text-orange-300">p</code> that any single coaching hire results in a
              phallic-named coach. Intriguingly, there are two ways to measure this:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-white block mb-0.5">
                  Option A: Unique Coach Pool ({analysis.phallicUniqueCoaches} /{' '}
                  {analysis.totalUniqueCoaches} = {formatPercent(analysis.baseRateUniqueP)})
                </strong>
                Out of {analysis.totalUniqueCoaches} unique people who have been NHL head coaches
                since {params.sinceYear}, {analysis.phallicUniqueCoaches} have phallic names under
                your current dictionary. Use this if every coach in history is equally likely to be
                picked.
              </li>
              <li className="p-3 rounded-lg bg-slate-900 border border-orange-500/30">
                <strong className="text-orange-300 block mb-0.5">
                  Option B: All Hiring Events ({analysis.phallicLeagueStints} /{' '}
                  {analysis.totalLeagueStints} = {formatPercent(analysis.baseRateStintsP)}) — Recommended
                </strong>
                Wait—why is the hiring-event rate ~1.3x higher than the unique coach rate? Because{' '}
                <strong>NHL GMs love recycling phallic-named coaches!</strong> Coaches like Peter
                Laviolette (6 teams), Peter DeBoer (6 teams), Ken Hitchcock (5 teams), Mike Babcock
                (4 teams), and Dave Tippett (4 teams) get hired over and over again. Weighting by
                actual hiring events gives random chance a fairer, higher baseline (
                {formatPercent(analysis.baseRateStintsP)}).
              </li>
            </ul>
          </div>

          {/* Step 2: Three Probability Lenses */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
              <Scale className="w-4 h-4" />
              <span>
                Step 2: Three Ways to Calculate the Odds (Live for {tr.franchise.current_name})
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Statisticians distinguish between the odds of a streak happening{' '}
              <em>right now</em> versus <em>somewhere in history</em>:
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between font-bold text-white mb-0.5">
                  <span>1. Naive / Specific Streak Odds (p^{k})</span>
                  <span className="font-mono text-orange-300">
                    {formatPercent(Math.pow(p, k))} ({formatOddsOneIn(Math.pow(p, k))})
                  </span>
                </div>
                <p className="text-slate-400">
                  If you walked into 2018 and predicted that the next {k} consecutive hires would all
                  be phallic, the probability is{' '}
                  <code>
                    ({(p * 100).toFixed(2)}%)^{k}
                  </code>
                  .
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between font-bold text-white mb-0.5">
                  <span>
                    2. Any Streak of {k} in {n} Hires (Markov Chain)
                  </span>
                  <span className="font-mono text-orange-300">
                    {formatPercent(tr.markovHistoryMaxStreakProb)} (
                    {formatOddsOneIn(tr.markovHistoryMaxStreakProb)})
                  </span>
                </div>
                <p className="text-slate-400">
                  Corrects for the "Texas Sharpshooter Fallacy": {tr.franchise.current_name} made{' '}
                  {n} coaching hires since {params.sinceYear}, giving them {n - k + 1} overlapping
                  windows to hit a {k}-coach streak. We solve this exactly using a {k + 1}-state
                  Markov transition matrix.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30">
                <div className="flex justify-between font-bold text-emerald-300 mb-0.5">
                  <span>3. League-Wide 32-Team Correction ("Look-Elsewhere")</span>
                  <span className="font-mono">
                    {formatPercent(tr.leagueWideLookElsewhereProb)} (
                    {formatOddsOneIn(tr.leagueWideLookElsewhereProb)})
                  </span>
                </div>
                <p className="text-slate-400">
                  What if a skeptic says: <em>"Sure, it's rare for one team, but there are 32 NHL teams!"</em>{' '}
                  Across all 32 teams (~{analysis.totalLeagueStints} total hires), the probability
                  that <strong>even a single NHL franchise</strong> would hit a {k}-coach phallic
                  streak is still just <strong>{formatPercent(tr.leagueWideLookElsewhereProb)}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-line summary box */}
        <div className="rounded-xl bg-gradient-to-r from-orange-500/15 via-red-500/10 to-slate-900 border border-orange-500/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                The Verdict on the Edmonton Oilers' 5-Coach Streak (Hitchcock → Tippett → Woodcroft →
                Knoblauch → Babcock)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              In science, a result is considered statistically significant when{' '}
              <code className="text-orange-300">p &lt; 0.05</code> (less than a 5% / 1-in-20 chance).
              Under your current settings, the odds of the Oilers' {edmResult.maxStreak}-coach streak
              are{' '}
              <strong className="text-white">
                {formatOddsOneIn(edmResult.naiveMaxStreakProb)}
              </strong>{' '}
              for this specific {edmResult.maxStreak}-hire window,{' '}
              <strong className="text-white">
                {formatOddsOneIn(edmResult.markovHistoryMaxStreakProb)}
              </strong>{' '}
              anywhere in Oilers history ({edmResult.totalHires} hires), and{' '}
              <strong className="text-white">
                {formatOddsOneIn(edmResult.leagueWideLookElsewhereProb)} (
                {formatPercent(edmResult.leagueWideLookElsewhereProb)})
              </strong>{' '}
              across the entire 32-team NHL since {params.sinceYear}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdateParams({ team: 'EDM', tab: 'analysis' })}
            className="shrink-0 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Inspect Oilers Streak →
          </button>
        </div>
      </div>
    </div>
  );
};
