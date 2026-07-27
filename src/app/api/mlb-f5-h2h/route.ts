type MLBTeam = {
  id?: number;
  name?: string;
  teamName?: string;
  clubName?: string;
  abbreviation?: string;
};

type MLBTeamsResponse = {
  teams?: MLBTeam[];
};

type ScheduleTeam = {
  id?: number;
  name?: string;
};

type ScheduleGameSide = {
  team?: ScheduleTeam;
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
  gamePk?: number;
  gameDate?: string;

  status?: {
    abstractGameState?: string;
  };

  teams?: {
    away?: ScheduleGameSide;
    home?: ScheduleGameSide;
  };

  linescore?: {
    innings?: InningScore[];
  };
};

type ScheduleResponse = {
  dates?: Array<{
    games?: ScheduleGame[];
  }>;
};

type F5H2HMeeting = {
  gamePk: number | null;
  gameDate: string | null;

  awayTeam: string;
  homeTeam: string;

  awayF5Score: number;
  homeF5Score: number;
};

function normalizeTeamName(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(
      /\bbaseball club\b/g,
      ""
    )
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function teamMatches(
  team: MLBTeam,
  requestedName: string
) {
  const requested =
    normalizeTeamName(
      requestedName
    );

  const candidates = [
    team.name,
    team.teamName,
    team.clubName,
    team.abbreviation,
  ]
    .filter(
      (value): value is string =>
        Boolean(value)
    )
    .map(normalizeTeamName);

  return candidates.includes(
    requested
  );
}

function getFirstFiveScore(
  game: ScheduleGame
) {
  const innings =
    game.linescore?.innings ?? [];

  const firstFive = innings
    .filter(
      (inning) =>
        inning.num !== undefined &&
        inning.num >= 1 &&
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

  const awayRuns =
    firstFive.reduce(
      (total, inning) =>
        total +
        (inning.away?.runs ?? 0),
      0
    );

  const homeRuns =
    firstFive.reduce(
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

function buildF5H2HSummary(
  meetings: F5H2HMeeting[],
  teamId: number,
  teamName: string,
  gameTeamIds: Map<
    number,
    {
      awayId: number;
      homeId: number;
    }
  >
) {
  let covers = 0;
  let failures = 0;
  let earlyBlowoutLosses = 0;

  let runsScored = 0;
  let runsAllowed = 0;

  for (const meeting of meetings) {
    const ids = meeting.gamePk
      ? gameTeamIds.get(
          meeting.gamePk
        )
      : undefined;

    if (!ids) {
      continue;
    }

    const teamWasAway =
      ids.awayId === teamId;

    const teamScore =
      teamWasAway
        ? meeting.awayF5Score
        : meeting.homeF5Score;

    const opponentScore =
      teamWasAway
        ? meeting.homeF5Score
        : meeting.awayF5Score;

    runsScored += teamScore;
    runsAllowed += opponentScore;

    if (
      teamScore + 2.5 >
      opponentScore
    ) {
      covers += 1;
    } else {
      failures += 1;
    }

    if (
      opponentScore -
        teamScore >=
      3
    ) {
      earlyBlowoutLosses += 1;
    }
  }

  const gamesCounted =
    covers + failures;

  const runDifferential =
    runsScored - runsAllowed;

  return {
    team: teamName,
    gamesCounted,

    plus25CoversF5: covers,
    plus25FailuresF5:
      failures,

    plus25CoverRecordF5:
      `${covers}-${failures}`,

    plus25CoverRateF5:
      gamesCounted > 0
        ? Number(
            (
              (covers /
                gamesCounted) *
              100
            ).toFixed(1)
          )
        : 0,

    earlyBlowoutLossesF5:
      earlyBlowoutLosses,

    runsScoredF5: runsScored,
    runsAllowedF5: runsAllowed,

    runDifferentialF5:
      runDifferential,

    averageRunDifferentialF5:
      gamesCounted > 0
        ? Number(
            (
              runDifferential /
              gamesCounted
            ).toFixed(2)
          )
        : 0,

    averageRunsScoredF5:
      gamesCounted > 0
        ? Number(
            (
              runsScored /
              gamesCounted
            ).toFixed(2)
          )
        : 0,

    averageRunsAllowedF5:
      gamesCounted > 0
        ? Number(
            (
              runsAllowed /
              gamesCounted
            ).toFixed(2)
          )
        : 0,
  };
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const homeTeam =
      searchParams
        .get("homeTeam")
        ?.trim() || "";

    const awayTeam =
      searchParams
        .get("awayTeam")
        ?.trim() || "";

    if (!homeTeam || !awayTeam) {
      return Response.json(
        {
          error:
            "homeTeam and awayTeam are required.",

          usage:
            "/api/mlb-f5-h2h?homeTeam=Boston%20Red%20Sox&awayTeam=New%20York%20Yankees",
        },
        {
          status: 400,
        }
      );
    }

    const teamsResponse =
      await fetch(
        "https://statsapi.mlb.com/api/v1/teams?sportId=1",
        {
          next: {
            revalidate: 86400,
          },
        }
      );

    if (!teamsResponse.ok) {
      return Response.json(
        {
          error:
            "Unable to resolve MLB teams.",
        },
        {
          status: 502,
        }
      );
    }

    const teamsData =
      (await teamsResponse.json()) as
        MLBTeamsResponse;

    const resolvedHomeTeam =
      teamsData.teams?.find(
        (team) =>
          teamMatches(
            team,
            homeTeam
          )
      );

    const resolvedAwayTeam =
      teamsData.teams?.find(
        (team) =>
          teamMatches(
            team,
            awayTeam
          )
      );

    if (
      !resolvedHomeTeam?.id ||
      !resolvedAwayTeam?.id
    ) {
      return Response.json(
        {
          error:
            "One or both MLB teams could not be resolved.",

          requestedTeams: {
            homeTeam,
            awayTeam,
          },
        },
        {
          status: 404,
        }
      );
    }

    const currentSeason =
      new Date().getFullYear();

    const seasons =
      Array.from(
        {
          length: 5,
        },
        (_, index) =>
          currentSeason - index
      );

    const gamesBySeason:
      ScheduleGame[][] = [];

    for (const season of seasons) {
      const scheduleUrl =
        new URL(
          "https://statsapi.mlb.com/api/v1/schedule"
        );

      scheduleUrl.searchParams.set(
        "sportId",
        "1"
      );

      scheduleUrl.searchParams.set(
        "teamId",
        String(
          resolvedHomeTeam.id
        )
      );

      scheduleUrl.searchParams.set(
        "startDate",
        `${season}-01-01`
      );

      scheduleUrl.searchParams.set(
        "endDate",
        `${season}-12-31`
      );

      scheduleUrl.searchParams.set(
        "gameType",
        "R"
      );

      scheduleUrl.searchParams.set(
        "hydrate",
        "linescore"
      );

      const seasonResponse =
        await fetch(
          scheduleUrl,
          {
            cache: "no-store",
          }
        );

      if (!seasonResponse.ok) {
        console.error(
          `Unable to load MLB F5 H2H schedule for ${season}.`
        );

        gamesBySeason.push([]);
        continue;
      }

      const seasonData =
        (await seasonResponse.json()) as
          ScheduleResponse;

      const seasonGames =
        seasonData.dates?.flatMap(
          (dateEntry) =>
            dateEntry.games ?? []
        ) ?? [];

      gamesBySeason.push(
        seasonGames
      );
    }

    const allGames =
      gamesBySeason.flat();

    const gameTeamIds =
      new Map<
        number,
        {
          awayId: number;
          homeId: number;
        }
      >();

    const meetings =
      allGames
        .filter((game) => {
          if (
            game.status
              ?.abstractGameState !==
            "Final"
          ) {
            return false;
          }

          const awayId =
            game.teams?.away?.team
              ?.id;

          const homeId =
            game.teams?.home?.team
              ?.id;

          const matchupIds =
            new Set([
              awayId,
              homeId,
            ]);

          return (
            matchupIds.has(
              resolvedHomeTeam.id
            ) &&
            matchupIds.has(
              resolvedAwayTeam.id
            )
          );
        })
        .sort(
          (a, b) =>
            new Date(
              b.gameDate ?? 0
            ).getTime() -
            new Date(
              a.gameDate ?? 0
            ).getTime()
        )
        .map(
          (
            game
          ): F5H2HMeeting | null => {
            const away =
              game.teams?.away;

            const home =
              game.teams?.home;

            const awayId =
              away?.team?.id;

            const homeId =
              home?.team?.id;

            if (
              !awayId ||
              !homeId
            ) {
              return null;
            }

            const f5Score =
              getFirstFiveScore(
                game
              );

            if (!f5Score) {
              return null;
            }

            if (game.gamePk) {
              gameTeamIds.set(
                game.gamePk,
                {
                  awayId,
                  homeId,
                }
              );
            }

            return {
              gamePk:
                game.gamePk ?? null,

              gameDate:
                game.gameDate ??
                null,

              awayTeam:
                away.team?.name ??
                awayTeam,

              homeTeam:
                home.team?.name ??
                homeTeam,

              awayF5Score:
                f5Score.awayRuns,

              homeF5Score:
                f5Score.homeRuns,
            };
          }
        )
        .filter(
          (
            meeting
          ): meeting is F5H2HMeeting =>
            meeting !== null
        )
        .slice(0, 10);

    const homeSummary =
      buildF5H2HSummary(
        meetings,
        resolvedHomeTeam.id,
        resolvedHomeTeam.name ??
          homeTeam,
        gameTeamIds
      );

    const awaySummary =
      buildF5H2HSummary(
        meetings,
        resolvedAwayTeam.id,
        resolvedAwayTeam.name ??
          awayTeam,
        gameTeamIds
      );

    return Response.json({
      status: "ready",

      requestedMatchup: {
        homeTeam,
        awayTeam,
      },

      meetingsCounted:
        meetings.length,

      teams: {
        home: homeSummary,
        away: awaySummary,
      },

      meetings,
    });
  } catch (error) {
    console.error(
      "MLB F5 H2H error:",
      error
    );

    return Response.json(
      {
        error:
          "Unexpected MLB F5 H2H error.",
      },
      {
        status: 500,
      }
    );
  }
}