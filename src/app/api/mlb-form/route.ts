type ScheduleTeam = {
  id?: number;
  name?: string;
};

type ScheduleGameSide = {
  team?: ScheduleTeam;
  isWinner?: boolean;
  score?: number;
};

type ScheduleGame = {
  gameDate?: string;

  status?: {
    abstractGameState?: string;
  };

  teams?: {
    away?: ScheduleGameSide;
    home?: ScheduleGameSide;
  };
};

type RecentTeamGame = {
  result: "W" | "L";
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  coveredPlus45: boolean;
  blowoutLoss: boolean;
  venue: "Home" | "Away";
};

type TeamFormAccumulator = {
  team: string;
  games: RecentTeamGame[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildRecentTeamGame(
  runsScored: number,
  runsAllowed: number,
  venue: RecentTeamGame["venue"]
): RecentTeamGame | null {
  if (
    !Number.isFinite(runsScored) ||
    !Number.isFinite(runsAllowed) ||
    runsScored === runsAllowed
  ) {
    return null;
  }

  const result =
    runsScored > runsAllowed ? "W" : "L";

  const runDifferential =
    runsScored - runsAllowed;

  return {
    result,
    runsScored,
    runsAllowed,
    runDifferential,

    // This measures whether the team would have
    // remained inside an exact +4.5-run cushion.
    coveredPlus45:
      runsScored + 4.5 > runsAllowed,

    // A loss by five or more runs fails +4.5.
    blowoutLoss:
      runsAllowed - runsScored >= 5,

    venue,
  };
}

function buildStreak(games: RecentTeamGame[]) {
  const latestResult = games[0]?.result;

  if (!latestResult) {
    return {
      streakType: null,
      streakLength: 0,
      streak: "N/A",
    };
  }

  let streakLength = 0;

  for (const game of games) {
    if (game.result !== latestResult) {
      break;
    }

    streakLength += 1;
  }

  return {
    streakType: latestResult,
    streakLength,
    streak: `${latestResult}${streakLength}`,
  };
}

export async function GET() {
  try {
    const endDate = new Date();
    const startDate = new Date();

    // Use a wide enough window to capture at least
    // 10 completed games for every MLB team.
    startDate.setDate(
      startDate.getDate() - 30
    );

    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${formatDate(
        startDate
      )}&endDate=${formatDate(endDate)}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          error:
            "Unable to load recent MLB games.",
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    const games: ScheduleGame[] =
      data.dates?.flatMap(
        (dateEntry: {
          games?: ScheduleGame[];
        }) => dateEntry.games ?? []
      ) ?? [];

    const completedGames = games
      .filter(
        (game) =>
          game.status?.abstractGameState ===
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
      TeamFormAccumulator
    >();

    for (const game of completedGames) {
      const awaySide = game.teams?.away;
      const homeSide = game.teams?.home;

      const awayTeam = awaySide?.team;
      const homeTeam = homeSide?.team;

      const awayScore = awaySide?.score;
      const homeScore = homeSide?.score;

      if (
        !awayTeam?.id ||
        !awayTeam.name ||
        !homeTeam?.id ||
        !homeTeam.name ||
        awayScore === undefined ||
        homeScore === undefined
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
        const recentGame =
          buildRecentTeamGame(
            awayScore,
            homeScore,
            "Away"
          );

        if (recentGame) {
          awayForm.games.push(recentGame);
        }
      }

      if (
        homeForm &&
        homeForm.games.length < 10
      ) {
        const recentGame =
          buildRecentTeamGame(
            homeScore,
            awayScore,
            "Home"
          );

        if (recentGame) {
          homeForm.games.push(recentGame);
        }
      }
    }

    const teams = Array.from(
      formByTeam.values()
    )
      .filter(
        (team) => team.games.length > 0
      )
      .map((team) => {
        const gamesCounted =
          team.games.length;

        const winsLast10 =
          team.games.filter(
            (game) => game.result === "W"
          ).length;

        const lossesLast10 =
          team.games.filter(
            (game) => game.result === "L"
          ).length;

        const runsScoredLast10 =
          team.games.reduce(
            (total, game) =>
              total + game.runsScored,
            0
          );

        const runsAllowedLast10 =
          team.games.reduce(
            (total, game) =>
              total + game.runsAllowed,
            0
          );

        const runDifferentialLast10 =
          runsScoredLast10 -
          runsAllowedLast10;

        const plus45CoversLast10 =
          team.games.filter(
            (game) =>
              game.coveredPlus45
          ).length;

        const plus45FailuresLast10 =
          gamesCounted -
          plus45CoversLast10;

        const blowoutLossesLast10 =
          team.games.filter(
            (game) =>
              game.blowoutLoss
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

        const streak =
          buildStreak(team.games);

        return {
          team: team.team,

          winsLast10,
          lossesLast10,
          gamesCounted,

          recentGames: team.games.map(
  (game) => ({
    runsScored:
      game.runsScored,
    runsAllowed:
      game.runsAllowed,

    combinedRuns:
      game.runsScored +
      game.runsAllowed,

    venue:
      game.venue,
  })
),

          trend: team.games
            .map((game) => game.result)
            .join(""),

          runsScoredLast10,
          runsAllowedLast10,
          runDifferentialLast10,

          averageRunsScored: Number(
            (
              runsScoredLast10 /
              gamesCounted
            ).toFixed(2)
          ),

          averageRunsAllowed: Number(
            (
              runsAllowedLast10 /
              gamesCounted
            ).toFixed(2)
          ),

          plus45CoversLast10,
          plus45FailuresLast10,

          plus45CoverRecord:
            `${plus45CoversLast10}-${plus45FailuresLast10}`,

          plus45CoverRate: Number(
            (
              (plus45CoversLast10 /
                gamesCounted) *
              100
            ).toFixed(1)
          ),

          blowoutLossesLast10,

          homeRecord: {
            wins: homeGames.filter(
              (game) =>
                game.result === "W"
            ).length,

            losses: homeGames.filter(
              (game) =>
                game.result === "L"
            ).length,

            games: homeGames.length,
          },

          awayRecord: {
            wins: awayGames.filter(
              (game) =>
                game.result === "W"
            ).length,

            losses: awayGames.filter(
              (game) =>
                game.result === "L"
            ).length,

            games: awayGames.length,
          },

          streakType:
            streak.streakType,

          streakLength:
            streak.streakLength,

          streak:
            streak.streak,
        };
      })
      .sort((a, b) =>
        a.team.localeCompare(b.team)
      );

    return Response.json({
      status: "ready",
      strategy:
        "Historical team performance against a +4.5-run cushion",
      teams,
    });
  } catch (error) {
    console.error(
      "Recent form error:",
      error
    );

    return Response.json(
      {
        error:
          "Unexpected recent-form error.",
      },
      {
        status: 500,
      }
    );
  }
}