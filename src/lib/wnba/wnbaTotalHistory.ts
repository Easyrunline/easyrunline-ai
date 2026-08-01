import type {
  WNBAHistoricalGame,
} from "./wnbaTypes";

export type WNBATotalSimulationSummary = {
  gamesPlayed: number;

  hits: number;
  pushes: number;
  misses: number;

  hitRate: number;

  averageCombinedTotal: number;
  averageDifferenceFromLine: number;

  lowestCombinedTotal: number;
  highestCombinedTotal: number;
};

export type WNBATotalHistoricalAnalysis = {
  direction: "Over" | "Under";
  selectedTotal: number;

  homeTeam: string;
  awayTeam: string;

  homeLast5: WNBATotalSimulationSummary;
  homeLast10: WNBATotalSimulationSummary;

  awayLast5: WNBATotalSimulationSummary;
  awayLast10: WNBATotalSimulationSummary;

  homeVenue: WNBATotalSimulationSummary;
  awayVenue: WNBATotalSimulationSummary;

  combinedRecent: WNBATotalSimulationSummary;
  headToHead: WNBATotalSimulationSummary;

  scoringVolatility: number;

  volatilityLevel:
    | "Low"
    | "Moderate"
    | "High";

  historicalSupport:
    | "Strong"
    | "Moderate"
    | "Mixed"
    | "Weak"
    | "Insufficient Data";
};

type HistoricalTotalGame = {
  eventId: string;
  commenceTime: string;

  homeTeam: string;
  awayTeam: string;

  combinedTotal: number;
};

function normalizeTeamName(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function roundToOneDecimal(
  value: number
) {
  return Number(value.toFixed(1));
}

function getHistoricalTotalGame(
  game: WNBAHistoricalGame
): HistoricalTotalGame {
  return {
    eventId: game.eventId,
    commenceTime: game.commenceTime,

    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,

    combinedTotal:
      game.homeScore +
      game.awayScore,
  };
}

function gameIncludesTeam(
  game: HistoricalTotalGame,
  teamName: string
) {
  const requestedTeam =
    normalizeTeamName(teamName);

  return (
    normalizeTeamName(
      game.homeTeam
    ) === requestedTeam ||
    normalizeTeamName(
      game.awayTeam
    ) === requestedTeam
  );
}

function isHomeGame(
  game: HistoricalTotalGame,
  teamName: string
) {
  return (
    normalizeTeamName(
      game.homeTeam
    ) ===
    normalizeTeamName(teamName)
  );
}

function isAwayGame(
  game: HistoricalTotalGame,
  teamName: string
) {
  return (
    normalizeTeamName(
      game.awayTeam
    ) ===
    normalizeTeamName(teamName)
  );
}

function isHeadToHeadGame(
  game: HistoricalTotalGame,
  firstTeam: string,
  secondTeam: string
) {
  return (
    gameIncludesTeam(
      game,
      firstTeam
    ) &&
    gameIncludesTeam(
      game,
      secondTeam
    )
  );
}

function buildTotalSimulationSummary(
  games: HistoricalTotalGame[],
  direction: "Over" | "Under",
  selectedTotal: number
): WNBATotalSimulationSummary {
  const gamesPlayed = games.length;

  if (gamesPlayed === 0) {
    return {
      gamesPlayed: 0,

      hits: 0,
      pushes: 0,
      misses: 0,

      hitRate: 0,

      averageCombinedTotal: 0,
      averageDifferenceFromLine: 0,

      lowestCombinedTotal: 0,
      highestCombinedTotal: 0,
    };
  }

  let hits = 0;
  let pushes = 0;
  let misses = 0;

  let totalCombinedPoints = 0;
  let totalDifferenceFromLine = 0;

  let lowestCombinedTotal =
    Number.POSITIVE_INFINITY;

  let highestCombinedTotal =
    Number.NEGATIVE_INFINITY;

  for (const game of games) {
    const differenceFromLine =
      direction === "Over"
        ? game.combinedTotal -
          selectedTotal
        : selectedTotal -
          game.combinedTotal;

    totalCombinedPoints +=
      game.combinedTotal;

    totalDifferenceFromLine +=
      differenceFromLine;

    lowestCombinedTotal = Math.min(
      lowestCombinedTotal,
      game.combinedTotal
    );

    highestCombinedTotal = Math.max(
      highestCombinedTotal,
      game.combinedTotal
    );

    if (differenceFromLine > 0) {
      hits += 1;
    } else if (
      differenceFromLine === 0
    ) {
      pushes += 1;
    } else {
      misses += 1;
    }
  }

  const decidedGames =
    hits + misses;

  return {
    gamesPlayed,

    hits,
    pushes,
    misses,

    hitRate:
      decidedGames > 0
        ? roundToOneDecimal(
            (hits /
              decidedGames) *
              100
          )
        : 0,

    averageCombinedTotal:
      roundToOneDecimal(
        totalCombinedPoints /
          gamesPlayed
      ),

    averageDifferenceFromLine:
      roundToOneDecimal(
        totalDifferenceFromLine /
          gamesPlayed
      ),

    lowestCombinedTotal:
      roundToOneDecimal(
        lowestCombinedTotal
      ),

    highestCombinedTotal:
      roundToOneDecimal(
        highestCombinedTotal
      ),
  };
}

function calculateStandardDeviation(
  totals: number[]
) {
  if (totals.length < 2) {
    return 0;
  }

  const average =
    totals.reduce(
      (total, value) =>
        total + value,
      0
    ) / totals.length;

  const variance =
    totals.reduce(
      (total, value) =>
        total +
        Math.pow(
          value - average,
          2
        ),
      0
    ) / totals.length;

  return roundToOneDecimal(
    Math.sqrt(variance)
  );
}

function getHistoricalSupport(
  combinedRecent:
    WNBATotalSimulationSummary,
  homeLast5:
    WNBATotalSimulationSummary,
  awayLast5:
    WNBATotalSimulationSummary,
  headToHead:
    WNBATotalSimulationSummary
): WNBATotalHistoricalAnalysis["historicalSupport"] {
  if (
    combinedRecent.gamesPlayed < 5 ||
    homeLast5.gamesPlayed === 0 ||
    awayLast5.gamesPlayed === 0
  ) {
    return "Insufficient Data";
  }

  const weightedHitRate =
    combinedRecent.hitRate * 0.4 +
    homeLast5.hitRate * 0.25 +
    awayLast5.hitRate * 0.25 +
    (headToHead.gamesPlayed > 0
      ? headToHead.hitRate * 0.1
      : combinedRecent.hitRate *
        0.1);

  if (weightedHitRate >= 75) {
    return "Strong";
  }

  if (weightedHitRate >= 62) {
    return "Moderate";
  }

  if (weightedHitRate >= 48) {
    return "Mixed";
  }

  return "Weak";
}

export function buildWNBATotalHistoricalAnalysis(
  historicalGames:
    WNBAHistoricalGame[],
  selection: {
    direction: "Over" | "Under";
    selectedTotal: number;

    homeTeam: string;
    awayTeam: string;
  }
): WNBATotalHistoricalAnalysis | null {
  if (
    historicalGames.length === 0 ||
    !Number.isFinite(
      selection.selectedTotal
    )
  ) {
    return null;
  }

  const normalizedGames =
    historicalGames
      .filter(
        (game) =>
          game.completed === true &&
          game.seasonType === 2
      )
      .map(
        getHistoricalTotalGame
      )
      .sort(
        (firstGame, secondGame) =>
          new Date(
            secondGame.commenceTime
          ).getTime() -
          new Date(
            firstGame.commenceTime
          ).getTime()
      );

  const homeTeamGames =
    normalizedGames.filter(
      (game) =>
        gameIncludesTeam(
          game,
          selection.homeTeam
        )
    );

  const awayTeamGames =
    normalizedGames.filter(
      (game) =>
        gameIncludesTeam(
          game,
          selection.awayTeam
        )
    );

  if (
    homeTeamGames.length === 0 ||
    awayTeamGames.length === 0
  ) {
    return null;
  }

  const homeVenueGames =
    homeTeamGames.filter(
      (game) =>
        isHomeGame(
          game,
          selection.homeTeam
        )
    );

  const awayVenueGames =
    awayTeamGames.filter(
      (game) =>
        isAwayGame(
          game,
          selection.awayTeam
        )
    );

  const headToHeadGames =
    normalizedGames.filter(
      (game) =>
        isHeadToHeadGame(
          game,
          selection.homeTeam,
          selection.awayTeam
        )
    );

  /*
   * Combine each team's five most recent games.
   * A head-to-head meeting may appear in both lists,
   * so event IDs are used to remove duplicates.
   */
  const combinedRecentGames =
    Array.from(
      new Map(
        [
          ...homeTeamGames.slice(
            0,
            5
          ),
          ...awayTeamGames.slice(
            0,
            5
          ),
        ].map((game) => [
          game.eventId,
          game,
        ])
      ).values()
    ).sort(
      (firstGame, secondGame) =>
        new Date(
          secondGame.commenceTime
        ).getTime() -
        new Date(
          firstGame.commenceTime
        ).getTime()
    );

  const homeLast5 =
    buildTotalSimulationSummary(
      homeTeamGames.slice(0, 5),
      selection.direction,
      selection.selectedTotal
    );

  const homeLast10 =
    buildTotalSimulationSummary(
      homeTeamGames.slice(0, 10),
      selection.direction,
      selection.selectedTotal
    );

  const awayLast5 =
    buildTotalSimulationSummary(
      awayTeamGames.slice(0, 5),
      selection.direction,
      selection.selectedTotal
    );

  const awayLast10 =
    buildTotalSimulationSummary(
      awayTeamGames.slice(0, 10),
      selection.direction,
      selection.selectedTotal
    );

  const homeVenue =
    buildTotalSimulationSummary(
      homeVenueGames,
      selection.direction,
      selection.selectedTotal
    );

  const awayVenue =
    buildTotalSimulationSummary(
      awayVenueGames,
      selection.direction,
      selection.selectedTotal
    );

  const combinedRecent =
    buildTotalSimulationSummary(
      combinedRecentGames,
      selection.direction,
      selection.selectedTotal
    );

  const headToHead =
    buildTotalSimulationSummary(
      headToHeadGames,
      selection.direction,
      selection.selectedTotal
    );

  const scoringVolatility =
    calculateStandardDeviation(
      combinedRecentGames.map(
        (game) =>
          game.combinedTotal
      )
    );

  const volatilityLevel:
    WNBATotalHistoricalAnalysis["volatilityLevel"] =
      scoringVolatility >= 18
        ? "High"
        : scoringVolatility >= 11
          ? "Moderate"
          : "Low";

  return {
    direction:
      selection.direction,

    selectedTotal:
      selection.selectedTotal,

    homeTeam:
      selection.homeTeam,

    awayTeam:
      selection.awayTeam,

    homeLast5,
    homeLast10,

    awayLast5,
    awayLast10,

    homeVenue,
    awayVenue,

    combinedRecent,
    headToHead,

    scoringVolatility,
    volatilityLevel,

    historicalSupport:
      getHistoricalSupport(
        combinedRecent,
        homeLast5,
        awayLast5,
        headToHead
      ),
  };
}
export type WNBATotalFinalVerdict =
  | "STRONG PLAY"
  | "PLAY"
  | "LEAN"
  | "PASS";

export function getWNBATotalFinalVerdict(
  marketQualification: WNBATotalFinalVerdict,
  analysis: WNBATotalHistoricalAnalysis
): WNBATotalFinalVerdict {
  const {
    historicalSupport,
    volatilityLevel,
  } = analysis;

  if (marketQualification === "PASS") {
    return "PASS";
  }

  /*
   * Weak historical support prevents the market
   * qualification from becoming a recommendation.
   */
  if (historicalSupport === "Weak") {
    return "PASS";
  }

  /*
   * High scoring volatility limits the verdict
   * because recent totals have been inconsistent.
   */
  if (volatilityLevel === "High") {
    if (
      historicalSupport === "Strong" &&
      marketQualification === "STRONG PLAY"
    ) {
      return "PLAY";
    }

    return marketQualification === "LEAN"
      ? "PASS"
      : "LEAN";
  }

  if (historicalSupport === "Insufficient Data") {
    return marketQualification === "STRONG PLAY"
      ? "PLAY"
      : marketQualification;
  }

  if (marketQualification === "STRONG PLAY") {
    if (historicalSupport === "Strong") {
      return "STRONG PLAY";
    }

    if (historicalSupport === "Moderate") {
      return "PLAY";
    }

    return "LEAN";
  }

  if (marketQualification === "PLAY") {
    return historicalSupport === "Strong" ||
      historicalSupport === "Moderate"
      ? "PLAY"
      : "LEAN";
  }

  return historicalSupport === "Strong" ||
    historicalSupport === "Moderate"
    ? "LEAN"
    : "PASS";
}