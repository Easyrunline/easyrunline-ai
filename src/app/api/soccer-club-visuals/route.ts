import { NextRequest, NextResponse } from "next/server";

type SportsDbTeam = {
  strTeam?: string | null;
  strTeamShort?: string | null;
  strAlternate?: string | null;
  strBadge?: string | null;
  strColour1?: string | null;
  strColour2?: string | null;
  strColour3?: string | null;
};

type SportsDbResponse = {
  teams?: SportsDbTeam[] | null;
};

const competitionLeagueNames: Record<string, string> = {
  MLS: "American Major League Soccer",
  "Premier League": "English Premier League",
  "La Liga": "Spanish La Liga",
  Bundesliga: "German Bundesliga",
  "Serie A": "Italian Serie A",
  "Ligue 1": "French Ligue 1",
  "Champions League": "UEFA Champions League",
  "Europa League": "UEFA Europa League",
};
const teamNameAliases: Record<string, string> = {
  "arsenal": "Arsenal",
  "aston villa": "Aston Villa",
  "bournemouth": "Bournemouth",
  "brentford": "Brentford",
  "brighton and hove albion": "Brighton and Hove Albion",
  "chelsea": "Chelsea",
  "coventry city": "Coventry City",
  "crystal palace": "Crystal Palace",
  "everton": "Everton",
  "fulham": "Fulham",
  "hull city": "Hull City",
  "ipswich town": "Ipswich Town",
  "leeds united": "Leeds United",
  "liverpool": "Liverpool",
  "manchester city": "Manchester City",
  "manchester united": "Manchester United",
  "newcastle united": "Newcastle United",
  "nottingham forest": "Nottingham Forest",
  "sunderland": "Sunderland",
  "tottenham hotspur": "Tottenham Hotspur",

  "1. fc köln": "FC Köln",
  "bayer leverkusen": "Bayer Leverkusen",
  "borussia mönchengladbach": "Borussia Monchengladbach",
  "athletic bilbao": "Athletic Bilbao",
  "atlético madrid": "Atletico Madrid",
  "alavés": "Deportivo Alaves",
  "ca osasuna": "Osasuna",
"elche cf": "Elche",
"deportivo la coruña":
  "Deportivo de A Coruña",
  "real racing club de santander":
  "Racing de Santander",
};

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bfc\b/g, "")
    .replace(/\bafc\b/g, "")
    .replace(/\bsc\b/g, "")
    .replace(/\bcalcio\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
function teamMatches(
  team: SportsDbTeam,
  requestedName: string
) {
  const requested = normalizeTeamName(requestedName);

  const candidates = [
    team.strTeam,
    team.strTeamShort,
    team.strAlternate,
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => normalizeTeamName(value))
    .filter(Boolean);

  return candidates.some(
    (candidate) => candidate === requested
  );
}
export async function GET(request: NextRequest) {
  const teamName =
    request.nextUrl.searchParams.get("team")?.trim() || "";
    const resolvedTeamName =
  teamNameAliases[teamName.toLowerCase()] || teamName;

  const competition =
    request.nextUrl.searchParams.get("competition")?.trim() || "";

  if (!teamName || !competition) {
    return NextResponse.json(
      {
        error: "Team and competition are required.",
      },
      {
        status: 400,
      }
    );
  }

  const leagueName = competitionLeagueNames[competition];

  if (!leagueName) {
    return NextResponse.json(
      {
        error: "Unsupported soccer competition.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const apiKey =
      process.env.THESPORTSDB_API_KEY || "123";

    const url = new URL(
  `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php`
);

url.searchParams.set("t", resolvedTeamName);

    const response = await fetch(url, {
      next: {
        revalidate: 86400,
      },
    });

    const data = (await response.json()) as SportsDbResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Could not load club visuals.",
        },
        {
          status: response.status,
        }
      );
    }

    let matchedTeam =
  data.teams?.find((team) =>
    teamMatches(team, resolvedTeamName)
  ) || null;

/*
 * TheSportsDB league searches may return only a
 * limited number of clubs. If the requested club
 * is absent, search for that team directly.
 */
if (!matchedTeam) {
  const teamSearchUrl = new URL(
    `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php`
  );

  teamSearchUrl.searchParams.set(
    "t",
    resolvedTeamName
  );

  const teamSearchResponse = await fetch(
    teamSearchUrl,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (teamSearchResponse.ok) {
    const teamSearchData =
      (await teamSearchResponse.json()) as
        SportsDbResponse;

    matchedTeam =
      teamSearchData.teams?.find((team) =>
        teamMatches(
          team,
          resolvedTeamName
        )
      ) || null;
  }
}

if (!matchedTeam) {
  return NextResponse.json({
    team: teamName,
    badge: null,
    primaryColor: null,
    secondaryColor: null,
    tertiaryColor: null,
  });
}

    return NextResponse.json({
      team: matchedTeam.strTeam || teamName,
      badge: matchedTeam.strBadge
        ? `${matchedTeam.strBadge}/small`
        : null,
      primaryColor: matchedTeam.strColour1 || null,
      secondaryColor: matchedTeam.strColour2 || null,
      tertiaryColor: matchedTeam.strColour3 || null,
    });
  } catch (error) {
    console.error("Soccer club visual route error:", error);

    return NextResponse.json(
      {
        error: "Could not load club visuals.",
      },
      {
        status: 500,
      }
    );
  }
}