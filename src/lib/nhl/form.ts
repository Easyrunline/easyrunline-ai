const NHL_API_BASE = "https://api-web.nhle.com/v1";

type LocalizedName = {
  default?: string;
};

type RawNHLTeam = {
  id?: number;
  abbrev?: string;
  score?: number;
  commonName?: LocalizedName;
  placeName?: LocalizedName;
};

type RawNHLGameOutcome = {
  lastPeriodType?: string;
};

type RawNHLGame = {
  id: number;
  season?: number;
  gameType?: number;
  gameDate?: string;
  startTimeUTC?: string;
  gameState?: string;
  gameScheduleState?: string;

  awayTeam?: RawNHLTeam;
  homeTeam?: RawNHLTeam;

  gameOutcome?: RawNHLGameOutcome;
};

type RawNHLScheduleResponse = {
  previousSeason?: number;
  currentSeason?: number;
  games?: RawNHLGame[];
};

export type NHLFormResult = "W" | "L" | "OTL";

export type NHLRecentGame = {
  gameId: number;
  gameDate: string | null;
  commenceTime: string | null;

  opponent: string;
  venue: "home" | "away";

  teamScore: number;
  opponentScore: number;

  result: NHLFormResult;
  decidedBy: "REG" | "OT" | "SO" | "UNKNOWN";
};

export type NHLMomentum =
  | "Very Strong"
  | "Strong"
  | "Neutral"
  | "Weak"
  | "Very Weak"
  | "Unavailable";

export type NormalizedNHLRecentForm = {
  team: string;
  season: string | null;

  gamesAnalyzed: number;

  wins: number;
  losses: number;
  overtimeLosses: number;

  last10: string;
  pointsEarned: number;
  pointsAvailable: number;
  pointsPct: number | null;

  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;

  averageGoalsFor: number | null;
  averageGoalsAgainst: number | null;

  homeRecord: string;
  awayRecord: string;

  streak: string | null;
  momentum: NHLMomentum;

  recentGames: NHLRecentGame[];

  source: "NHL";
};

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number, decimals = 3): number {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function normalizeSeason(season: number | undefined): string | null {
  if (typeof season !== "number") {
    return null;
  }

  return String(season);
}

function isCompletedGame(game: RawNHLGame): boolean {
  const state = game.gameState?.toUpperCase();

  return state === "FINAL" || state === "OFF";
}

function getDecisionType(
  game: RawNHLGame
): "REG" | "OT" | "SO" | "UNKNOWN" {
  const periodType =
    game.gameOutcome?.lastPeriodType?.toUpperCase();

  if (periodType === "SO") {
    return "SO";
  }

  if (periodType === "OT") {
    return "OT";
  }

  if (periodType === "REG") {
    return "REG";
  }

  return "UNKNOWN";
}

function getResult(
  teamScore: number,
  opponentScore: number,
  decisionType: "REG" | "OT" | "SO" | "UNKNOWN"
): NHLFormResult {
  if (teamScore > opponentScore) {
    return "W";
  }

  if (decisionType === "OT" || decisionType === "SO") {
    return "OTL";
  }

  return "L";
}

function formatRecord(
  games: NHLRecentGame[],
  venue?: "home" | "away"
): string {
  const selectedGames = venue
    ? games.filter((game) => game.venue === venue)
    : games;

  const wins = selectedGames.filter(
    (game) => game.result === "W"
  ).length;

  const losses = selectedGames.filter(
    (game) => game.result === "L"
  ).length;

  const overtimeLosses = selectedGames.filter(
    (game) => game.result === "OTL"
  ).length;

  return `${wins}-${losses}-${overtimeLosses}`;
}

function calculateStreak(
  gamesNewestFirst: NHLRecentGame[]
): string | null {
  const latestGame = gamesNewestFirst[0];

  if (!latestGame) {
    return null;
  }

  const latestResult = latestGame.result;

  let streakLength = 0;

  for (const game of gamesNewestFirst) {
    if (game.result !== latestResult) {
      break;
    }

    streakLength += 1;
  }

  return `${latestResult}${streakLength}`;
}

function calculateMomentum(
  games: NHLRecentGame[],
  pointsPct: number | null,
  goalDifferential: number,
  streak: string | null
): NHLMomentum {
  if (games.length === 0 || pointsPct === null) {
    return "Unavailable";
  }

  let score = 0;

  if (pointsPct >= 0.75) {
    score += 3;
  } else if (pointsPct >= 0.6) {
    score += 2;
  } else if (pointsPct >= 0.5) {
    score += 1;
  } else if (pointsPct < 0.35) {
    score -= 3;
  } else if (pointsPct < 0.45) {
    score -= 2;
  } else {
    score -= 1;
  }

  if (goalDifferential >= 12) {
    score += 3;
  } else if (goalDifferential >= 6) {
    score += 2;
  } else if (goalDifferential > 0) {
    score += 1;
  } else if (goalDifferential <= -12) {
    score -= 3;
  } else if (goalDifferential <= -6) {
    score -= 2;
  } else if (goalDifferential < 0) {
    score -= 1;
  }

  if (streak?.startsWith("W")) {
    const streakLength = Number(streak.slice(1));

    if (streakLength >= 4) {
      score += 2;
    } else if (streakLength >= 2) {
      score += 1;
    }
  }

  if (streak?.startsWith("L")) {
    const streakLength = Number(streak.slice(1));

    if (streakLength >= 4) {
      score -= 2;
    } else if (streakLength >= 2) {
      score -= 1;
    }
  }

  if (score >= 6) {
    return "Very Strong";
  }

  if (score >= 3) {
    return "Strong";
  }

  if (score <= -6) {
    return "Very Weak";
  }

  if (score <= -3) {
    return "Weak";
  }

  return "Neutral";
}

function normalizeGame(
  game: RawNHLGame,
  team: string
): NHLRecentGame | null {
  const homeCode = game.homeTeam?.abbrev?.toUpperCase();
  const awayCode = game.awayTeam?.abbrev?.toUpperCase();

  const isHome = homeCode === team;
  const isAway = awayCode === team;

  if (!isHome && !isAway) {
    return null;
  }

  const teamData = isHome ? game.homeTeam : game.awayTeam;
  const opponentData = isHome
    ? game.awayTeam
    : game.homeTeam;

  const teamScore = safeNumber(teamData?.score);
  const opponentScore = safeNumber(opponentData?.score);

  const decidedBy = getDecisionType(game);

  return {
    gameId: game.id,
    gameDate: game.gameDate ?? null,
    commenceTime: game.startTimeUTC ?? null,

    opponent:
      opponentData?.abbrev?.toUpperCase() ?? "UNKNOWN",

    venue: isHome ? "home" : "away",

    teamScore,
    opponentScore,

    result: getResult(
      teamScore,
      opponentScore,
      decidedBy
    ),

    decidedBy,
  };
}

export async function getNHLRecentForm(
  team: string,
  limit = 10
): Promise<NormalizedNHLRecentForm> {
  const normalizedTeam = team.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalizedTeam)) {
    throw new Error(
      "Invalid NHL team abbreviation. Use a three-letter code such as TOR."
    );
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error(
      "Invalid recent-form limit. Use a number between 1 and 20."
    );
  }

  const response = await fetch(
    `${NHL_API_BASE}/club-schedule-season/${normalizedTeam}/now`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `NHL recent-form request failed with status ${response.status}: ${details}`
    );
  }

let data =
  (await response.json()) as RawNHLScheduleResponse;

const currentSeasonHasCompletedGames = (data.games ?? []).some(
  isCompletedGame
);

if (!currentSeasonHasCompletedGames && data.previousSeason) {
  const previousSeasonResponse = await fetch(
    `${NHL_API_BASE}/club-schedule-season/${normalizedTeam}/${data.previousSeason}`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!previousSeasonResponse.ok) {
    const details = await previousSeasonResponse.text();

    throw new Error(
      `NHL previous-season request failed with status ${previousSeasonResponse.status}: ${details}`
    );
  }

  data =
    (await previousSeasonResponse.json()) as RawNHLScheduleResponse;
}

  const completedGames = (data.games ?? [])
    .filter(isCompletedGame)
    .sort((a, b) => {
      const dateA = new Date(
        a.startTimeUTC ?? a.gameDate ?? 0
      ).getTime();

      const dateB = new Date(
        b.startTimeUTC ?? b.gameDate ?? 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, limit)
    .map((game) => normalizeGame(game, normalizedTeam))
    .filter(
      (game): game is NHLRecentGame => game !== null
    );

  const wins = completedGames.filter(
    (game) => game.result === "W"
  ).length;

  const losses = completedGames.filter(
    (game) => game.result === "L"
  ).length;

  const overtimeLosses = completedGames.filter(
    (game) => game.result === "OTL"
  ).length;

  const goalsFor = completedGames.reduce(
    (sum, game) => sum + game.teamScore,
    0
  );

  const goalsAgainst = completedGames.reduce(
    (sum, game) => sum + game.opponentScore,
    0
  );

  const gamesAnalyzed = completedGames.length;

  const pointsEarned = wins * 2 + overtimeLosses;
  const pointsAvailable = gamesAnalyzed * 2;

  const pointsPct =
    pointsAvailable > 0
      ? round(pointsEarned / pointsAvailable, 3)
      : null;

  const goalDifferential = goalsFor - goalsAgainst;

  const streak = calculateStreak(completedGames);

  return {
    team: normalizedTeam,
    season: normalizeSeason(
      data.currentSeason ?? data.previousSeason
    ),

    gamesAnalyzed,

    wins,
    losses,
    overtimeLosses,

    last10: formatRecord(completedGames),
    pointsEarned,
    pointsAvailable,
    pointsPct,

    goalsFor,
    goalsAgainst,
    goalDifferential,

    averageGoalsFor:
      gamesAnalyzed > 0
        ? round(goalsFor / gamesAnalyzed, 2)
        : null,

    averageGoalsAgainst:
      gamesAnalyzed > 0
        ? round(goalsAgainst / gamesAnalyzed, 2)
        : null,

    homeRecord: formatRecord(completedGames, "home"),
    awayRecord: formatRecord(completedGames, "away"),

    streak,
    momentum: calculateMomentum(
      completedGames,
      pointsPct,
      goalDifferential,
      streak
    ),

    recentGames: completedGames,

    source: "NHL",
  };
}