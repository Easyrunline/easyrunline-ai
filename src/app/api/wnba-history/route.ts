import { NextRequest } from "next/server";
import {
  buildWNBATeamForm,
} from "@/lib/wnba/wnbaForm";

type ESPNTeam = {
  id?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
};

type ESPNCompetitor = {
  homeAway?: "home" | "away";
  score?: string;
  winner?: boolean;
  team?: ESPNTeam;
};

type ESPNCompetition = {
  id?: string;
  date?: string;
  neutralSite?: boolean;

  status?: {
    type?: {
      completed?: boolean;
      description?: string;
    };
  };

  competitors?: ESPNCompetitor[];
};

type ESPNEvent = {
  id?: string;
  date?: string;

  season?: {
    year?: number;
    type?: number;
    slug?: string;
  };

  competitions?: ESPNCompetition[];
};

type ESPNScoreboardResponse = {
  events?: ESPNEvent[];
};

type NormalizedWNBAGame = {
  eventId: string;
  commenceTime: string;

  seasonYear: number;
  seasonType: number | null;
  seasonTypeName: string;

  homeTeamId: string;
  homeTeam: string;
  homeTeamAbbreviation: string;
  homeScore: number;

  awayTeamId: string;
  awayTeam: string;
  awayTeamAbbreviation: string;
  awayScore: number;

  winner: string;
  loser: string;
  pointMargin: number;

  neutralSite: boolean;
  completed: true;
};
const officialWNBAFranchises = new Set([
  "Atlanta Dream",
  "Chicago Sky",
  "Connecticut Sun",
  "Dallas Wings",
  "Golden State Valkyries",
  "Indiana Fever",
  "Las Vegas Aces",
  "Los Angeles Sparks",
  "Minnesota Lynx",
  "New York Liberty",
  "Phoenix Mercury",
  "Portland Fire",
  "Seattle Storm",
  "Toronto Tempo",
  "Washington Mystics",
]);
function getDefaultSeasonYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  /*
   * The WNBA season normally runs through the
   * middle portion of the calendar year.
   * Before May, use the most recently completed
   * season by default.
   */
  return currentMonth >= 4
    ? currentYear
    : currentYear - 1;
}

function getSeasonTypeName(
  seasonType?: number
) {
  if (seasonType === 1) {
    return "Preseason";
  }

  if (seasonType === 2) {
    return "Regular Season";
  }

  if (seasonType === 3) {
    return "Postseason";
  }

  return "Unknown";
}

export async function GET(
  request: NextRequest
) {
  try {
    const requestedSeason =
      request.nextUrl.searchParams.get(
        "season"
      );

    const seasonYear = requestedSeason
      ? Number(requestedSeason)
      : getDefaultSeasonYear();

    if (
      !Number.isInteger(seasonYear) ||
      seasonYear < 1997 ||
      seasonYear > new Date().getFullYear()
    ) {
      return Response.json(
        {
          error: "Invalid WNBA season.",
          usage:
            "/api/wnba-history?season=2026",
        },
        {
          status: 400,
        }
      );
    }

    const url = new URL(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard"
    );

    url.searchParams.set(
      "limit",
      "1000"
    );

    url.searchParams.set(
      "dates",
      String(seasonYear)
    );

    const response = await fetch(
      url,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      const details =
        await response.text();

      return Response.json(
        {
          error:
            "Unable to load historical WNBA games.",
          details,
          seasonYear,
          games: [],
        },
        {
          status: 502,
        }
      );
    }

    const data =
      (await response.json()) as
        ESPNScoreboardResponse;

    const games: NormalizedWNBAGame[] =
      [];

    for (
      const event of data.events ?? []
    ) {
      for (
        const competition of
          event.competitions ?? []
      ) {
        if (
          competition.status?.type
            ?.completed !== true
        ) {
          continue;
        }

        const home =
          competition.competitors?.find(
            (competitor) =>
              competitor.homeAway ===
              "home"
          );

        const away =
          competition.competitors?.find(
            (competitor) =>
              competitor.homeAway ===
              "away"
          );

        if (
          !home?.team?.id ||
          !home.team.displayName ||
          !away?.team?.id ||
          !away.team.displayName
        ) {
          continue;
        }

        const homeTeamName =
  home.team.displayName.trim();

const awayTeamName =
  away.team.displayName.trim();

/*
 * Exclude All-Star teams, national teams,
 * exhibition opponents and any other
 * non-franchise records from WNBA form.
 */
if (
  !officialWNBAFranchises.has(
    homeTeamName
  ) ||
  !officialWNBAFranchises.has(
    awayTeamName
  )
) {
  continue;
}

        const homeScore = Number(
          home.score
        );

        const awayScore = Number(
          away.score
        );

        if (
          !Number.isFinite(homeScore) ||
          !Number.isFinite(awayScore)
        ) {
          continue;
        }

        /*
         * WNBA games cannot finish tied.
         * Exclude an incomplete or malformed
         * record if equal scores are returned.
         */
        if (homeScore === awayScore) {
          continue;
        }

        const homeWon =
          homeScore > awayScore;

        games.push({
          eventId:
            competition.id ??
            event.id ??
            `${home.team.id}-${away.team.id}-${competition.date ?? event.date ?? ""}`,

          commenceTime:
            competition.date ??
            event.date ??
            "",

          seasonYear:
            event.season?.year ??
            seasonYear,

          seasonType:
            event.season?.type ??
            null,

          seasonTypeName:
            getSeasonTypeName(
              event.season?.type
            ),

          homeTeamId: home.team.id,

          homeTeam: homeTeamName,

          homeTeamAbbreviation:
            home.team.abbreviation ??
            "",

          homeScore,

          awayTeamId: away.team.id,

          awayTeam: awayTeamName,

          awayTeamAbbreviation:
            away.team.abbreviation ??
            "",

          awayScore,

          winner: homeWon
            ? home.team.displayName
            : away.team.displayName,

          loser: homeWon
            ? away.team.displayName
            : home.team.displayName,

          pointMargin: Math.abs(
            homeScore - awayScore
          ),

          neutralSite:
            competition.neutralSite ??
            false,

          completed: true,
        });
      }
    }

    games.sort(
      (firstGame, secondGame) =>
        new Date(
          secondGame.commenceTime
        ).getTime() -
        new Date(
          firstGame.commenceTime
        ).getTime()
    );
const teams =
  buildWNBATeamForm(games);
    return Response.json(
  {
    seasonYear,
    gameCount: games.length,
    teamCount: teams.length,
    games,
    teams,
    source: "ESPN",
        cacheMinutes: 60,
        fetchedAt:
          new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error(
      "WNBA historical results error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong loading historical WNBA games.",
        games: [],
      },
      {
        status: 500,
      }
    );
  }
}