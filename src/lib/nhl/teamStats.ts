const NHL_API_BASE = "https://api-web.nhle.com/v1";

type LocalizedName = {
  default?: string;
};

type RawNHLSkater = {
  playerId: number;
  firstName?: LocalizedName;
  lastName?: LocalizedName;
  positionCode?: string;

  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  penaltyMinutes?: number;

  powerPlayGoals?: number;
  shorthandedGoals?: number;
  gameWinningGoals?: number;

  shots?: number;
  shootingPctg?: number;
  faceoffWinPctg?: number;
};

type RawNHLGoalie = {
  playerId: number;
  firstName?: LocalizedName;
  lastName?: LocalizedName;

  gamesPlayed?: number;
  gamesStarted?: number;

  wins?: number;
  losses?: number;
  overtimeLosses?: number;

  goalsAgainstAverage?: number;
  savePercentage?: number;

  shotsAgainst?: number;
  saves?: number;
  goalsAgainst?: number;

  shutouts?: number;
  timeOnIce?: number;
};

type RawNHLClubStatsResponse = {
  season?: string;
  gameType?: number;
  skaters?: RawNHLSkater[];
  goalies?: RawNHLGoalie[];
};

export type NHLTeamSkaterSummary = {
  playerCount: number;

  totalGoals: number;
  totalAssists: number;
  totalPoints: number;

  totalShots: number;
  shootingPct: number;

  totalPowerPlayGoals: number;
  totalShorthandedGoals: number;
  totalGameWinningGoals: number;

  totalPenaltyMinutes: number;
  combinedPlusMinus: number;

  faceoffWinPct: number | null;
};

export type NHLTeamGoalieSummary = {
  goalieCount: number;

  gamesPlayed: number;
  gamesStarted: number;

  wins: number;
  losses: number;
  overtimeLosses: number;

  savePct: number | null;
  goalsAgainstAverage: number | null;

  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;

  shutouts: number;
};

export type NHLTeamPlayerLeader = {
  playerId: number;
  name: string;
  position: string | null;

  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
};

export type NHLTeamGoalie = {
  playerId: number;
  name: string;

  gamesPlayed: number;
  gamesStarted: number;

  wins: number;
  losses: number;
  overtimeLosses: number;

  savePct: number | null;
  goalsAgainstAverage: number | null;

  shutouts: number;
};

export type NormalizedNHLTeamStats = {
  team: string;
  season: string | null;
  gameType: number | null;

  skaters: NHLTeamSkaterSummary;
  goalies: NHLTeamGoalieSummary;

  scoringLeaders: NHLTeamPlayerLeader[];
  goalieStats: NHLTeamGoalie[];

  source: "NHL";
};

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number, decimals = 3): number {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function getPlayerName(
  firstName: LocalizedName | undefined,
  lastName: LocalizedName | undefined
): string {
  const first = firstName?.default?.trim() ?? "";
  const last = lastName?.default?.trim() ?? "";

  const fullName = `${first} ${last}`.trim();

  return fullName || "Unknown Player";
}

function normalizeSkaters(
  skaters: RawNHLSkater[]
): NHLTeamSkaterSummary {
  const totalGoals = skaters.reduce(
    (sum, player) => sum + safeNumber(player.goals),
    0
  );

  const totalAssists = skaters.reduce(
    (sum, player) => sum + safeNumber(player.assists),
    0
  );

  const totalPoints = skaters.reduce(
    (sum, player) => sum + safeNumber(player.points),
    0
  );

  const totalShots = skaters.reduce(
    (sum, player) => sum + safeNumber(player.shots),
    0
  );

  const totalPowerPlayGoals = skaters.reduce(
    (sum, player) => sum + safeNumber(player.powerPlayGoals),
    0
  );

  const totalShorthandedGoals = skaters.reduce(
    (sum, player) => sum + safeNumber(player.shorthandedGoals),
    0
  );

  const totalGameWinningGoals = skaters.reduce(
    (sum, player) => sum + safeNumber(player.gameWinningGoals),
    0
  );

  const totalPenaltyMinutes = skaters.reduce(
    (sum, player) => sum + safeNumber(player.penaltyMinutes),
    0
  );

  const combinedPlusMinus = skaters.reduce(
    (sum, player) => sum + safeNumber(player.plusMinus),
    0
  );

  const faceoffPlayers = skaters.filter(
    (player) =>
      typeof player.faceoffWinPctg === "number" &&
      player.faceoffWinPctg > 0 &&
      safeNumber(player.gamesPlayed) > 0
  );

  const totalFaceoffWeight = faceoffPlayers.reduce(
    (sum, player) => sum + safeNumber(player.gamesPlayed),
    0
  );

  const weightedFaceoffPct = faceoffPlayers.reduce(
    (sum, player) =>
      sum +
      safeNumber(player.faceoffWinPctg) *
        safeNumber(player.gamesPlayed),
    0
  );

  return {
    playerCount: skaters.length,

    totalGoals,
    totalAssists,
    totalPoints,

    totalShots,
    shootingPct:
      totalShots > 0 ? round(totalGoals / totalShots, 4) : 0,

    totalPowerPlayGoals,
    totalShorthandedGoals,
    totalGameWinningGoals,

    totalPenaltyMinutes,
    combinedPlusMinus,

    faceoffWinPct:
      totalFaceoffWeight > 0
        ? round(weightedFaceoffPct / totalFaceoffWeight, 4)
        : null,
  };
}

function normalizeGoalies(
  goalies: RawNHLGoalie[]
): NHLTeamGoalieSummary {
  const gamesPlayed = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.gamesPlayed),
    0
  );

  const gamesStarted = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.gamesStarted),
    0
  );

  const wins = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.wins),
    0
  );

  const losses = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.losses),
    0
  );

  const overtimeLosses = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.overtimeLosses),
    0
  );

  const shotsAgainst = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.shotsAgainst),
    0
  );

  const saves = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.saves),
    0
  );

  const goalsAgainst = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.goalsAgainst),
    0
  );

  const shutouts = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.shutouts),
    0
  );

  const totalTimeOnIce = goalies.reduce(
    (sum, goalie) => sum + safeNumber(goalie.timeOnIce),
    0
  );

  const savePct =
    shotsAgainst > 0 ? round(saves / shotsAgainst, 4) : null;

  const goalsAgainstAverage =
    totalTimeOnIce > 0
      ? round((goalsAgainst * 3600) / totalTimeOnIce, 3)
      : null;

  return {
    goalieCount: goalies.length,

    gamesPlayed,
    gamesStarted,

    wins,
    losses,
    overtimeLosses,

    savePct,
    goalsAgainstAverage,

    shotsAgainst,
    saves,
    goalsAgainst,

    shutouts,
  };
}

function getScoringLeaders(
  skaters: RawNHLSkater[]
): NHLTeamPlayerLeader[] {
  return [...skaters]
    .sort(
      (a, b) =>
        safeNumber(b.points) - safeNumber(a.points)
    )
    .slice(0, 5)
    .map((player) => ({
      playerId: player.playerId,
      name: getPlayerName(player.firstName, player.lastName),
      position: player.positionCode ?? null,

      gamesPlayed: safeNumber(player.gamesPlayed),
      goals: safeNumber(player.goals),
      assists: safeNumber(player.assists),
      points: safeNumber(player.points),
    }));
}

function getGoalieStats(
  goalies: RawNHLGoalie[]
): NHLTeamGoalie[] {
  return [...goalies]
    .sort(
      (a, b) =>
        safeNumber(b.gamesStarted) - safeNumber(a.gamesStarted)
    )
    .map((goalie) => ({
      playerId: goalie.playerId,
      name: getPlayerName(goalie.firstName, goalie.lastName),

      gamesPlayed: safeNumber(goalie.gamesPlayed),
      gamesStarted: safeNumber(goalie.gamesStarted),

      wins: safeNumber(goalie.wins),
      losses: safeNumber(goalie.losses),
      overtimeLosses: safeNumber(goalie.overtimeLosses),

      savePct:
        typeof goalie.savePercentage === "number"
          ? round(goalie.savePercentage, 4)
          : null,

      goalsAgainstAverage:
        typeof goalie.goalsAgainstAverage === "number"
          ? round(goalie.goalsAgainstAverage, 3)
          : null,

      shutouts: safeNumber(goalie.shutouts),
    }));
}

export async function getNHLTeamStats(
  team: string
): Promise<NormalizedNHLTeamStats> {
  const normalizedTeam = team.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalizedTeam)) {
    throw new Error(
      "Invalid NHL team abbreviation. Use a three-letter code such as TOR."
    );
  }

  const response = await fetch(
    `${NHL_API_BASE}/club-stats/${normalizedTeam}/now`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `NHL team stats request failed with status ${response.status}: ${details}`
    );
  }

  const data =
    (await response.json()) as RawNHLClubStatsResponse;

  const skaters = data.skaters ?? [];
  const goalies = data.goalies ?? [];

  return {
    team: normalizedTeam,
    season: data.season ?? null,
    gameType: data.gameType ?? null,

    skaters: normalizeSkaters(skaters),
    goalies: normalizeGoalies(goalies),

    scoringLeaders: getScoringLeaders(skaters),
    goalieStats: getGoalieStats(goalies),

    source: "NHL",
  };
}