const NHL_API_BASE = "https://api-web.nhle.com/v1";

type LocalizedName = {
  default?: string;
};

type NHLTeam = {
  abbrev?: string;
  commonName?: LocalizedName;
  placeName?: LocalizedName;
};

type NHLGame = {
  id: number;
  gameState?: string;
  startTimeUTC?: string;
  awayTeam?: NHLTeam;
  homeTeam?: NHLTeam;
};

type NHLScoreResponse = {
  games?: NHLGame[];
};

export type NormalizedGoalie = {
  name: string | null;
  status: "confirmed" | "projected" | "unknown";
  playerId: number | null;
};

export type NormalizedNHLGoalieGame = {
  gameId: number;
  commenceTime: string | null;
  gameState: string;

  awayTeam: string;
  homeTeam: string;

  awayGoalie: NormalizedGoalie;
  homeGoalie: NormalizedGoalie;

  source: "NHL";
};

function getTeamName(team: NHLTeam | undefined): string {
  const place = team?.placeName?.default?.trim();
  const common = team?.commonName?.default?.trim();

  if (place && common) {
    return `${place} ${common}`;
  }

  return common ?? team?.abbrev ?? "Unknown Team";
}

function unknownGoalie(): NormalizedGoalie {
  return {
    name: null,
    status: "unknown",
    playerId: null,
  };
}

export async function getNHLGoalies(
  date: string
): Promise<NormalizedNHLGoalieGame[]> {
  const response = await fetch(`${NHL_API_BASE}/score/${date}`, {
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `NHL goalie request failed with status ${response.status}: ${details}`
    );
  }

  const data = (await response.json()) as NHLScoreResponse;

  return (data.games ?? []).map((game) => ({
    gameId: game.id,
    commenceTime: game.startTimeUTC ?? null,
    gameState: game.gameState ?? "UNKNOWN",

    awayTeam: getTeamName(game.awayTeam),
    homeTeam: getTeamName(game.homeTeam),

    awayGoalie: unknownGoalie(),
    homeGoalie: unknownGoalie(),

    source: "NHL",
  }));
}