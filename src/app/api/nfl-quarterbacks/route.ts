type ESPNAthlete = {
  id?: string;
  fullName?: string;
  displayName?: string;
  jersey?: string;
  depth?: number;

  headshot?: {
    href?: string;
  };

  position?: {
    abbreviation?: string;
  };

  experience?: {
    years?: number;
  };

  status?: {
    type?: string;
    name?: string;
  };
};

type ESPNRosterGroup = {
  items?: ESPNAthlete[];
};

type NFLTeamReference = {
  team: string;
  abbreviation: string;
  code: string;
};

const nflTeams: NFLTeamReference[] = [
  { team: "Arizona Cardinals", abbreviation: "ARI", code: "ari" },
  { team: "Atlanta Falcons", abbreviation: "ATL", code: "atl" },
  { team: "Baltimore Ravens", abbreviation: "BAL", code: "bal" },
  { team: "Buffalo Bills", abbreviation: "BUF", code: "buf" },
  { team: "Carolina Panthers", abbreviation: "CAR", code: "car" },
  { team: "Chicago Bears", abbreviation: "CHI", code: "chi" },
  { team: "Cincinnati Bengals", abbreviation: "CIN", code: "cin" },
  { team: "Cleveland Browns", abbreviation: "CLE", code: "cle" },
  { team: "Dallas Cowboys", abbreviation: "DAL", code: "dal" },
  { team: "Denver Broncos", abbreviation: "DEN", code: "den" },
  { team: "Detroit Lions", abbreviation: "DET", code: "det" },
  { team: "Green Bay Packers", abbreviation: "GB", code: "gb" },
  { team: "Houston Texans", abbreviation: "HOU", code: "hou" },
  { team: "Indianapolis Colts", abbreviation: "IND", code: "ind" },
  { team: "Jacksonville Jaguars", abbreviation: "JAX", code: "jax" },
  { team: "Kansas City Chiefs", abbreviation: "KC", code: "kc" },
  { team: "Las Vegas Raiders", abbreviation: "LV", code: "lv" },
  { team: "Los Angeles Chargers", abbreviation: "LAC", code: "lac" },
  { team: "Los Angeles Rams", abbreviation: "LAR", code: "lar" },
  { team: "Miami Dolphins", abbreviation: "MIA", code: "mia" },
  { team: "Minnesota Vikings", abbreviation: "MIN", code: "min" },
  { team: "New England Patriots", abbreviation: "NE", code: "ne" },
  { team: "New Orleans Saints", abbreviation: "NO", code: "no" },
  { team: "New York Giants", abbreviation: "NYG", code: "nyg" },
  { team: "New York Jets", abbreviation: "NYJ", code: "nyj" },
  { team: "Philadelphia Eagles", abbreviation: "PHI", code: "phi" },
  { team: "Pittsburgh Steelers", abbreviation: "PIT", code: "pit" },
  { team: "San Francisco 49ers", abbreviation: "SF", code: "sf" },
  { team: "Seattle Seahawks", abbreviation: "SEA", code: "sea" },
  { team: "Tampa Bay Buccaneers", abbreviation: "TB", code: "tb" },
  { team: "Tennessee Titans", abbreviation: "TEN", code: "ten" },
  {
    team: "Washington Commanders",
    abbreviation: "WSH",
    code: "wsh",
  },
];

async function loadTeamQuarterbacks(team: NFLTeamReference) {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.code}/roster`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        team: team.team,
        abbreviation: team.abbreviation,
        quarterbacks: [],
      };
    }

    const data = await response.json();

    const rosterGroups: ESPNRosterGroup[] = data.athletes ?? [];

    const athletes = rosterGroups.flatMap(
      (group) => group.items ?? []
    );

    const quarterbacks = athletes
      .filter(
        (athlete) =>
          athlete.position?.abbreviation === "QB"
      )
      .map((athlete) => ({
  playerId: athlete.id ?? "",

  player:
    athlete.fullName ??
    athlete.displayName ??
    "Unknown quarterback",

  jersey: athlete.jersey ?? "N/A",
  depth: athlete.depth ?? null,

  experienceYears:
    athlete.experience?.years ?? 0,

  headshot:
    athlete.headshot?.href ?? null,

  status:
    athlete.status?.name ??
    athlete.status?.type ??
    "Not available",
}));

    return {
      team: team.team,
      abbreviation: team.abbreviation,
      quarterbacks,
    };
  } catch (error) {
    console.error(
      `Unable to load quarterbacks for ${team.team}:`,
      error
    );

    return {
      team: team.team,
      abbreviation: team.abbreviation,
      quarterbacks: [],
    };
  }
}

export async function GET() {
  try {
    const teams = await Promise.all(
      nflTeams.map((team) => loadTeamQuarterbacks(team))
    );

    return Response.json({
      status: "ready",
      note: "Quarterbacks are roster candidates and are not confirmed starters.",
      teams,
    });
  } catch (error) {
    console.error("NFL quarterback route error:", error);

    return Response.json(
      { error: "Unexpected NFL quarterback data error." },
      { status: 500 }
    );
  }
}