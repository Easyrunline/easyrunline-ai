"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import NHLGameCard from "@/components/nhl/NHLGameCard";

import {
  getNHLTeamCode,
} from "@/lib/nhl/teams";

import type {
  NormalizedNHLOddsGame,
} from "@/lib/nhl/odds";

import type {
  NormalizedNHLRecentForm,
} from "@/lib/nhl/form";

import type {
  NormalizedNHLTeamStats,
} from "@/lib/nhl/teamStats";

import type {
  NHLGameAnalysis,
  NHLGameRecommendation,
  NHLTeamAnalysis,
} from "@/lib/nhl/types";

type NHLOddsResponse = {
  games?: NormalizedNHLOddsGame[];
  error?: string;
};

type NHLFormResponse = {
  form?: NormalizedNHLRecentForm;
  error?: string;
};

type NHLStatsResponse = {
  stats?: NormalizedNHLTeamStats;
  error?: string;
};
type AnalyzeAnswerResponse = {
  answer?: string;
};

type AnalyzedNHLGame =
  NormalizedNHLOddsGame & {
    analysis?: NHLGameAnalysis;

    recommendation?:
      NHLGameRecommendation;

    analysisError?: string;
  };
  function wait(
  milliseconds: number
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds
    );
  });
}

async function fetchJSON<T>(
  url: string
): Promise<T> {
  const response = await fetch(url);
  const data = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(
      `Request failed: ${url}`
    );
  }

  return data;
}

function impliedProbability(
  decimalOdds: number
): number {
  return 1 / decimalOdds;
}

async function buildTeamAnalysis(
  team: string,
  moneyline: number | null
): Promise<NHLTeamAnalysis> {
  const teamCode =
    getNHLTeamCode(team);

  if (!teamCode) {
    throw new Error(
      `Missing NHL abbreviation for ${team}.`
    );
  }

  if (
    moneyline === null ||
    moneyline <= 1
  ) {
    throw new Error(
      `Missing valid moneyline for ${team}.`
    );
  }

    const formResponse =
    await fetchJSON<NHLFormResponse>(
      `/api/nhl-form?team=${teamCode}&limit=10`
    );

  await wait(600);

  const statsResponse =
    await fetchJSON<NHLStatsResponse>(
      `/api/nhl-team-stats?team=${teamCode}`
    );

  const form = formResponse.form;
  const stats = statsResponse.stats;

  if (!form) {
    throw new Error(
      `Recent form is unavailable for ${team}.`
    );
  }

  if (!stats) {
    throw new Error(
      `Team statistics are unavailable for ${team}.`
    );
  }

  const projectedGoalie =
    stats.goalieStats.find(
      (goalie) =>
        goalie.savePct !== null &&
        goalie.goalsAgainstAverage !== null
    );

  if (
    !projectedGoalie ||
    projectedGoalie.savePct === null ||
    projectedGoalie.goalsAgainstAverage ===
      null
  ) {
    throw new Error(
      `Goalie statistics are unavailable for ${team}.`
    );
  }

  if (
    form.gamesAnalyzed === 0 ||
    form.pointsPct === null ||
    form.averageGoalsFor === null ||
    form.averageGoalsAgainst === null
  ) {
    throw new Error(
      `Recent performance data is unavailable for ${team}.`
    );
  }

  const goalDifferentialPerGame =
    form.goalDifferential /
    form.gamesAnalyzed;

  return {
    team,

    goalie: {
      goalieName:
        projectedGoalie.name,

      savePct:
        projectedGoalie.savePct,

      gaa:
        projectedGoalie
          .goalsAgainstAverage,

      starts:
        projectedGoalie.gamesStarted,

      wins:
        projectedGoalie.wins,

      losses:
        projectedGoalie.losses,
    },

    form: {
      last10: form.last10,

      wins: form.wins,
      losses: form.losses,

      overtimeLosses:
        form.overtimeLosses,

      pointsPct:
        form.pointsPct,

      goalsFor:
        form.goalsFor,

      goalsAgainst:
        form.goalsAgainst,

      goalDifferential:
        goalDifferentialPerGame,

      streak:
        form.streak ?? "None",

      momentum:
        form.momentum,
    },

    stats: {
      goalsPerGame:
        form.averageGoalsFor,

      goalsAgainstPerGame:
        form.averageGoalsAgainst,

      powerPlayPct: null,
      penaltyKillPct: null,
      shotsPerGame: null,
      shotsAgainstPerGame: null,
    },

    injuries: {
      keyPlayersOut: null,
      totalPlayersOut: null,
    },

    market: {
      moneyline,

      impliedProbability:
        impliedProbability(moneyline),
    },
      };
}
  async function analyzeOddsGame(
  game: NormalizedNHLOddsGame
): Promise<AnalyzedNHLGame> {
  try {
    const away =
      await buildTeamAnalysis(
        game.awayTeam,
        game.moneyline.away
      );

    await wait(600);

    const home =
      await buildTeamAnalysis(
        game.homeTeam,
        game.moneyline.home
      );

    const analysis: NHLGameAnalysis = {
      home,
      away,
    };

    const response =
      await fetch("/api/analyze", {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          sport: "nhl",
          game: analysis,
        }),
      });

    const data =
      (await response.json()) as
        NHLGameRecommendation & {
          answer?: string;
        };

    if (!response.ok) {
      throw new Error(
        data.answer ??
          "NHL analysis failed."
      );
    }

        return {
      ...game,
      analysis,
      recommendation: data,
    };
  } catch (error) {
    return {
      ...game,

      analysisError:
        error instanceof Error
          ? error.message
          : "NHL analysis failed.",
    };
  }
}

export default function NHLPage() {
  const [games, setGames] =
    useState<AnalyzedNHLGame[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

      const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [
    reportLoading,
    setReportLoading,
  ] = useState(false);
      const hasLoaded =
    useRef(false);

      async function analyzeQuestion(
    customQuestion?: string
  ) {
    const finalQuestion =
      customQuestion?.trim() ||
      question.trim();

    if (!finalQuestion) {
      return;
    }

    try {
      setReportLoading(true);
      setAnswer("");

      const response =
        await fetch("/api/analyze", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            question: finalQuestion,
          }),
        });

      const data =
        (await response.json()) as
          AnalyzeAnswerResponse;

      if (!response.ok) {
        throw new Error(
          data.answer ??
            "Unable to create NHL report."
        );
      }

      setAnswer(
        data.answer ??
          "No report was returned."
      );
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? error.message
          : "Unable to create NHL report."
      );
    } finally {
      setReportLoading(false);
    }
  }

    async function findSafestSingle() {
    const candidates = games
      .filter(
        (game) =>
          game.analysis &&
          game.recommendation
      )
      .sort(
        (gameA, gameB) =>
          gameB.recommendation!
            .recommendedTeam
            .erlScore -
          gameA.recommendation!
            .recommendedTeam
            .erlScore
      );

    const safestGame =
      candidates[0];

    if (
      !safestGame?.analysis ||
      !safestGame.recommendation
    ) {
      setAnswer(
        "The NHL engine is still analyzing today’s games."
      );

      return;
    }

    const analysis =
      safestGame.analysis;

    const result =
      safestGame.recommendation;

    const target =
      result.recommendedTeam;

    const opponent =
      target.team ===
      analysis.home.team
        ? analysis.away.team
        : analysis.home.team;

    const targetAnalysis =
      target.team ===
      analysis.home.team
        ? analysis.home
        : analysis.away;

    const edgeOwner =
      result.comparison.winner ===
      target.team
        ? "Selected target"
        : "Opponent";

    const reasons =
      Object.values(
        target.breakdown
      )
        .map(
          (item) =>
            `• ${item.title}: ${item.reason} (${item.score})`
        )
        .join("\n");

    const reportRequest = `
Create an EasyRunLine AI report for the safest NHL underdog +2.5 puck-line target.

IMPORTANT:

This selection was produced by the EasyRunLine fixed NHL scoring engine.

Do not perform a separate prediction.
Do not change the selected team.
Do not recommend the favourite +2.5.
Do not replace this target with another game.

Use the supplied ERL Score exactly.
Use the supplied confidence exactly.
Use the supplied engine recommendation exactly.
Do not upgrade or downgrade any engine rating.

Do not invent:
- cover probabilities
- unsupported percentages
- alternate-line availability
- alternate-line prices
- expected value
- positive EV
- injury information
- confirmed starting-goalie status

The listed goalie is projected from season usage and is not a confirmed starter.

The visible market does not confirm the exact +2.5 alternate puck line or price.

Tell the user to verify the exact +2.5 line and price in their betting app.

If the exact +2.5 line is unavailable, the verdict must be PASS.

If the supplied engine recommendation is "Avoid", the verdict must be PASS.

Use this report structure:

══════════════════════════════
🏒 EASYRUNLINE AI REPORT
══════════════════════════════

🎯 Safest Single +2.5 Target

${target.team} +2.5 vs ${opponent}

ERL Score: ${target.erlScore}/100
Engine Confidence: ${target.confidence}
Engine Recommendation: ${target.recommendation}

━━━━━━━━━━━━━━━━━━━━━━

📊 Engine Confidence

Reproduce and explain the supplied confidence without changing it.

━━━━━━━━━━━━━━━━━━━━━━

🛡 +2.5 Cushion Outlook

Give a qualitative outlook only.
Do not invent a cover percentage.

━━━━━━━━━━━━━━━━━━━━━━

🥅 Projected Goaltending

Goalie: ${targetAnalysis.goalie.goalieName}
Save Percentage: ${targetAnalysis.goalie.savePct.toFixed(3)}
Goals-Against Average: ${targetAnalysis.goalie.gaa.toFixed(2)}
Starts: ${targetAnalysis.goalie.starts}

Clearly state that this goalie is projected, not confirmed.

━━━━━━━━━━━━━━━━━━━━━━

📈 Recent Form

Last 10: ${targetAnalysis.form.last10}
Momentum: ${targetAnalysis.form.momentum}
Goals Per Game: ${targetAnalysis.stats.goalsPerGame.toFixed(2)}
Goals Allowed Per Game: ${targetAnalysis.stats.goalsAgainstPerGame.toFixed(2)}
Streak: ${targetAnalysis.form.streak}

━━━━━━━━━━━━━━━━━━━━━━

⚡ Matchup Edge

Edge: ${result.comparison.edge}
Edge Rating: ${result.comparison.edgeRating}
Edge belongs to: ${edgeOwner}

Do not describe an opponent edge as support for the selected target.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market

Moneyline: ${targetAnalysis.market.moneyline}
Implied Probability: ${(targetAnalysis.market.impliedProbability * 100).toFixed(1)}%

Exact +2.5 Line: Not supplied.
Exact +2.5 Price: Not supplied.

Do not claim betting value without the exact alternate-line price.

━━━━━━━━━━━━━━━━━━━━━━

🧠 Engine Reasons

${reasons}

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Confirmed Starting Goalie: Not supplied.
Live Injuries: Not supplied.
Exact +2.5 Line: Not supplied.
Exact +2.5 Price: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

Give one verdict only:
PLAY, LEAN, or PASS.

If Engine Recommendation is "Avoid", use PASS.
If the exact +2.5 market cannot be verified, use PASS.

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.
Never chase losses.
Never call anything a lock.
Always verify the exact alternate line and price.
`;

    setQuestion(
      "Find the safest NHL +2.5 puck-line target."
    );

    await analyzeQuestion(
      reportRequest
    );
  }

        useEffect(() => {
    if (hasLoaded.current) {
      return;
    }

    hasLoaded.current = true;

  
    async function loadGames() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch("/api/nhl-odds");

        const data =
          (await response.json()) as
            NHLOddsResponse;

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Unable to load NHL games."
          );
        }
                setGames(data.games ?? []);
        setLoading(false);

               

                const oddsGames =
          data.games ?? [];

        setGames(oddsGames);
        setLoading(false);

        for (const game of oddsGames) {
          const analyzedGame =
            await analyzeOddsGame(game);

          setGames((currentGames) =>
            currentGames.map(
              (currentGame) =>
                currentGame.id ===
                analyzedGame.id
                  ? analyzedGame
                  : currentGame
            )
          );

          await wait(600);
        }

      
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load NHL games."
        );
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            🏒 EASYRUNLINE AI
          </h1>

          <p className="mt-3 text-lg text-zinc-400">
            National Hockey League
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
            NHL puck-line intelligence,
            goalie analysis, team form and
            market-based recommendations.
          </p>
        </div>
                <section className="mx-auto mt-8 max-w-3xl">
          <div className="rounded-2xl border border-yellow-500/30 bg-zinc-950 p-4 shadow-xl">
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              placeholder="Ask EasyRunLine AI: Is Montréal Canadiens +2.5 a suitable puck-line target?"
              className="h-32 w-full resize-none rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-yellow-500"
            />

            <button
              type="button"
              onClick={() =>
                analyzeQuestion()
              }
              disabled={
                reportLoading ||
                !question.trim()
              }
              className="mt-4 w-full rounded-xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reportLoading
                ? "Analyzing..."
                : "Analyze NHL Question"}
            </button>
          </div>

          {answer && (
            <div className="mt-6 whitespace-pre-line rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-left leading-7 text-zinc-200">
              {answer}
            </div>
          )}
        </section>
                <div className="mx-auto mt-6 flex max-w-3xl justify-center">
          <button
            type="button"
            onClick={
              findSafestSingle
            }
            disabled={
              reportLoading ||
              !games.some(
                (game) =>
                  game.recommendation
              )
            }
            className="w-full rounded-xl bg-blue-500 px-6 py-4 font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Safest Single +2.5
          </button>
        </div>

        {loading && (
          <p className="mt-10 text-center text-zinc-400">
            Loading and analyzing NHL
            games...
          </p>
        )}

        {error && (
          <p className="mt-10 text-center text-red-400">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          games.length === 0 && (
            <p className="mt-10 text-center text-zinc-400">
              No upcoming NHL games are
              currently available.
            </p>
          )}

        {!loading &&
          !error &&
          games.length > 0 && (
            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              {games.map((game) => (
                <div key={game.id}>
                  <NHLGameCard
  awayTeam={game.awayTeam}
  homeTeam={game.homeTeam}
  analysis={game.analysis}
  recommendation={
    game.recommendation
  }
/>

                  

                  {game.analysisError && (
                    <p className="mt-2 text-center text-xs text-red-400">
                      {
                        game.analysisError
                      }
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
      </div>
    </main>
  );
}