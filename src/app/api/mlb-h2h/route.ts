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
  score?: number;
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
};

type ScheduleResponse = {
  dates?: Array<{
    games?: ScheduleGame[];
  }>;
};

type H2HMeeting = {
  gamePk: number | null;
  gameDate: string | null;

  awayTeam: string;
  homeTeam: string;

  awayScore: number;
  homeScore: number;
};

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bbaseball club\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/New_York",

      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}

function teamMatches(
  team: MLBTeam,
  requestedName: string
) {
  const requested =
    normalizeTeamName(requestedName);

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

  return candidates.includes(requested);
}

function buildTeamH2HSummary(
  meetings: H2HMeeting[],
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
  let blowoutLosses = 0;

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
        ? meeting.awayScore
        : meeting.homeScore;

    const opponentScore =
      teamWasAway
        ? meeting.homeScore
        : meeting.awayScore;

    runsScored += teamScore;
    runsAllowed += opponentScore;

    if (
      teamScore + 4.5 >
      opponentScore
    ) {
      covers += 1;
    } else {
      failures += 1;
    }

    if (
      opponentScore - teamScore >=
      5
    ) {
      blowoutLosses += 1;
    }
  }

  const gamesCounted =
    covers + failures;

  return {
    team: teamName,
    gamesCounted,

    plus45Covers: covers,
    plus45Failures: failures,

    plus45CoverRecord:
      `${covers}-${failures}`,

    plus45CoverRate:
      gamesCounted > 0
        ? Number(
            (
              (covers /
                gamesCounted) *
              100
            ).toFixed(1)
          )
        : 0,

    blowoutLosses,

    runsScored,
    runsAllowed,

    runDifferential:
      runsScored - runsAllowed,

    averageRunDifferential:
      gamesCounted > 0
        ? Number(
            (
              (runsScored -
                runsAllowed) /
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
            "/api/mlb-h2h?homeTeam=Boston%20Red%20Sox&awayTeam=New%20York%20Yankees",
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

          resolvedTeams: {
            homeTeam:
              resolvedHomeTeam ??
              null,

            awayTeam:
              resolvedAwayTeam ??
              null,
          },
        },
        {
          status: 404,
        }
      );
    }

    

    const currentSeason =
  new Date().getFullYear();

const seasons = Array.from(
  {
    length: 5,
  },
  (_, index) =>
    currentSeason - index
);
const gamesBySeason: ScheduleGame[][] = [];


for (const season of seasons) {
  const scheduleUrl = new URL(
    "https://statsapi.mlb.com/api/v1/schedule"
  );

  scheduleUrl.searchParams.set(
    "sportId",
    "1"
  );

  scheduleUrl.searchParams.set(
    "teamId",
    String(resolvedHomeTeam.id)
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

  const seasonResponse = await fetch(
    scheduleUrl,
    {
      cache: "no-store",
    }
  );

  if (!seasonResponse.ok) {
    console.error(
      `Unable to load MLB H2H schedule for ${season}.`
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


    const gameTeamIds = new Map<
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
          ): H2HMeeting | null => {
            const away =
              game.teams?.away;

            const home =
              game.teams?.home;

            const awayId =
              away?.team?.id;

            const homeId =
              home?.team?.id;

            const awayScore =
              away?.score;

            const homeScore =
              home?.score;

            if (
              !awayId ||
              !homeId ||
              awayScore ===
                undefined ||
              homeScore ===
                undefined
            ) {
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

              awayScore,
              homeScore,
            };
          }
        )
        .filter(
  (
    meeting
  ): meeting is H2HMeeting =>
    meeting !== null
)
.slice(0, 10);

    const homeSummary =
      buildTeamH2HSummary(
        meetings,
        resolvedHomeTeam.id,
        resolvedHomeTeam.name ??
          homeTeam,
        gameTeamIds
      );

    const awaySummary =
      buildTeamH2HSummary(
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
      "MLB H2H error:",
      error
    );

    return Response.json(
      {
        error:
          "Unexpected MLB H2H error.",
      },
      {
        status: 500,
      }
    );
  }
}