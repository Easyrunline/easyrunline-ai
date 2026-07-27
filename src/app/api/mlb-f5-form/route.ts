type ScheduleTeam = {
  id?: number;
  name?: string;
};

type InningScore = {
  num?: number;
  away?: {
    runs?: number;
  };
  home?: {
    runs?: number;
  };
};

type ScheduleGame = {
  gameDate?: string;

  status?: {
    abstractGameState?: string;
  };

  teams?: {
    away?: {
      team?: ScheduleTeam;
    };
    home?: {
      team?: ScheduleTeam;
    };
  };

  linescore?: {
    innings?: InningScore[];
  };
};

type RecentF5Game = {
  result: "W" | "L" | "T";
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  coveredPlus25: boolean;
  failedPlus25: boolean;
  venue: "Home" | "Away";
};

type TeamF5Accumulator = {
  team: string;
  games: RecentF5Game[];
};

type ScheduleResponse = {
  dates?: Array<{
    games?: ScheduleGame[];
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getFirstFiveScore(
  game: ScheduleGame
) {
  const firstFive = (
    game.linescore?.innings ?? []
  )
    .filter(
      (inning) =>
        inning.num !== undefined &&
        inning.num <= 5
    )
    .sort(
      (a, b) =>
        (a.num ?? 0) -
        (b.num ?? 0)
    );

  if (firstFive.length < 5) {
    return null;
  }

  const awayRuns = firstFive.reduce(
    (total, inning) =>
      total +
      (inning.away?.runs ?? 0),
    0
  );

  const homeRuns = firstFive.reduce(
    (total, inning) =>
      total +
      (inning.home?.runs ?? 0),
    0
  );

  return {
    awayRuns,
    homeRuns,
  };
}

function buildRecentF5Game(
  runsScored: number,
  runsAllowed: number,
  venue: RecentF5Game["venue"]
): RecentF5Game {
  const runDifferential =
    runsScored - runsAllowed;

  const result: RecentF5Game["result"] =
    runDifferential > 0
      ? "W"
      : runDifferential < 0
        ? "L"
        : "T";

  return {
    result,
    runsScored,
    runsAllowed,
    runDifferential,

    // A +2.5 F5 selection covers when the
    // team is leading, tied, or behind by
    // no more than two runs after five.
    coveredPlus25:
      runsScored + 2.5 >
      runsAllowed,

    // Trailing by three or more runs after
    // five innings fails the +2.5 cushion.
    failedPlus25:
      runsAllowed - runsScored >= 3,

    venue,
  };
}

export async function GET() {
  try {
    const endDate = new Date();
    const startDate = new Date();

    // Allow enough time to collect ten
    // completed F5 samples per MLB team.
    startDate.setDate(
      startDate.getDate() - 45
    );

    const scheduleUrl = new URL(
      "https://statsapi.mlb.com/api/v1/schedule"
    );

    scheduleUrl.searchParams.set(
      "sportId",
      "1"
    );

    scheduleUrl.searchParams.set(
      "startDate",
      formatDate(startDate)
    );

    scheduleUrl.searchParams.set(
      "endDate",
      formatDate(endDate)
    );

    scheduleUrl.searchParams.set(
      "gameType",
      "R"
    );

    scheduleUrl.searchParams.set(
      "hydrate",
      "linescore"
    );

    const response = await fetch(
      scheduleUrl,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          error:
            "Unable to load recent MLB F5 games.",
        },
        {
          status: 502,
        }
      );
    }

    const data =
      (await response.json()) as
        ScheduleResponse;

    const completedGames = (
      data.dates?.flatMap(
        (dateEntry) =>
          dateEntry.games ?? []
      ) ?? []
    )
      .filter(
        (game) =>
          game.status
            ?.abstractGameState ===
          "Final"
      )
      .sort(
        (a, b) =>
          new Date(
            b.gameDate ?? 0
          ).getTime() -
          new Date(
            a.gameDate ?? 0
          ).getTime()
      );

    const formByTeam = new Map<
      number,
      TeamF5Accumulator
    >();

    for (const game of completedGames) {
      const awayTeam =
        game.teams?.away?.team;

      const homeTeam =
        game.teams?.home?.team;

      const firstFiveScore =
        getFirstFiveScore(game);

      if (
        !awayTeam?.id ||
        !awayTeam.name ||
        !homeTeam?.id ||
        !homeTeam.name ||
        !firstFiveScore
      ) {
        continue;
      }

      if (!formByTeam.has(awayTeam.id)) {
        formByTeam.set(awayTeam.id, {
          team: awayTeam.name,
          games: [],
        });
      }

      if (!formByTeam.has(homeTeam.id)) {
        formByTeam.set(homeTeam.id, {
          team: homeTeam.name,
          games: [],
        });
      }

      const awayForm =
        formByTeam.get(awayTeam.id);

      const homeForm =
        formByTeam.get(homeTeam.id);

      if (
        awayForm &&
        awayForm.games.length < 10
      ) {
        awayForm.games.push(
          buildRecentF5Game(
            firstFiveScore.awayRuns,
            firstFiveScore.homeRuns,
            "Away"
          )
        );
      }

      if (
        homeForm &&
        homeForm.games.length < 10
      ) {
        homeForm.games.push(
          buildRecentF5Game(
            firstFiveScore.homeRuns,
            firstFiveScore.awayRuns,
            "Home"
          )
        );
      }
    }

    const teams = Array.from(
      formByTeam.values()
    )
      .filter(
        (team) =>
          team.games.length > 0
      )
      .map((team) => {
        const gamesCounted =
          team.games.length;

        const winsF5Last10 =
          team.games.filter(
            (game) =>
              game.result === "W"
          ).length;

        const lossesF5Last10 =
          team.games.filter(
            (game) =>
              game.result === "L"
          ).length;

        const tiesF5Last10 =
          team.games.filter(
            (game) =>
              game.result === "T"
          ).length;

        const runsScoredF5Last10 =
          team.games.reduce(
            (total, game) =>
              total +
              game.runsScored,
            0
          );

        const runsAllowedF5Last10 =
          team.games.reduce(
            (total, game) =>
              total +
              game.runsAllowed,
            0
          );

        const runDifferentialF5Last10 =
          runsScoredF5Last10 -
          runsAllowedF5Last10;

        const plus25CoversF5Last10 =
          team.games.filter(
            (game) =>
              game.coveredPlus25
          ).length;

        const plus25FailuresF5Last10 =
          team.games.filter(
            (game) =>
              game.failedPlus25
          ).length;

        const homeGames =
          team.games.filter(
            (game) =>
              game.venue === "Home"
          );

        const awayGames =
          team.games.filter(
            (game) =>
              game.venue === "Away"
          );

        return {
          team: team.team,
          gamesCounted,

          winsF5Last10,
          lossesF5Last10,
          tiesF5Last10,

          f5Record:
            `${winsF5Last10}-${lossesF5Last10}-${tiesF5Last10}`,

          trend: team.games
            .map((game) => game.result)
            .join(""),

          runsScoredF5Last10,
          runsAllowedF5Last10,
          runDifferentialF5Last10,

          averageRunsScoredF5: Number(
            (
              runsScoredF5Last10 /
              gamesCounted
            ).toFixed(2)
          ),

          averageRunsAllowedF5: Number(
            (
              runsAllowedF5Last10 /
              gamesCounted
            ).toFixed(2)
          ),

          plus25CoversF5Last10,
          plus25FailuresF5Last10,

          plus25CoverRecordF5:
            `${plus25CoversF5Last10}-${plus25FailuresF5Last10}`,

          plus25CoverRateF5: Number(
            (
              (plus25CoversF5Last10 /
                gamesCounted) *
              100
            ).toFixed(1)
          ),

          earlyBlowoutLossesF5Last10:
            plus25FailuresF5Last10,

          homeF5: {
            games: homeGames.length,
            plus25Covers:
              homeGames.filter(
                (game) =>
                  game.coveredPlus25
              ).length,
          },

          awayF5: {
            games: awayGames.length,
            plus25Covers:
              awayGames.filter(
                (game) =>
                  game.coveredPlus25
              ).length,
          },
        };
      })
      .sort(
        (a, b) =>
          a.team.localeCompare(b.team)
      );

    return Response.json({
      status: "ready",
      teams,
    });
  } catch (error) {
    console.error(
      "MLB F5 form error:",
      error
    );

    return Response.json(
      {
        error:
          "Unexpected MLB F5 form error.",
      },
      {
        status: 500,
      }
    );
  }
}