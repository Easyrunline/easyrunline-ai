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
      const hasLoaded =
    useRef(false);

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