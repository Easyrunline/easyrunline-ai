import type {
  WNBAHistoricalGame,
} from "./wnbaTypes";

export type WNBALineSimulationSummary = {
  gamesPlayed: number;

  covers: number;
  pushes: number;
  misses: number;

  coverRate: number;

  averageActualMargin: number;
  averageAdjustedMargin: number;

  largestDefeat: number;
};

export type WNBASpreadHistoricalAnalysis = {
  selectedTeam: string;
  opponent: string;
  selectedLine: number;

  venueLabel: "Home" | "Away";

  last5: WNBALineSimulationSummary;
  last10: WNBALineSimulationSummary;
  venue: WNBALineSimulationSummary;
  headToHead: WNBALineSimulationSummary;

  opponentLast5AverageMargin: number;
  opponentLast10AverageMargin: number;

  opponentBlowoutWins: number;
  opponentGamesChecked: number;
  opponentBlowoutThreshold: number;

  blowoutRisk:
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

type WNBATeamGamePerspective = {
  commenceTime: string;
  opponent: string;
  homeAway: "home" | "away";
  pointMargin: number;
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

function getTeamPerspective(
  game: WNBAHistoricalGame,
  teamName: string
): WNBATeamGamePerspective | null {
  const requestedTeam =
    normalizeTeamName(teamName);

  const homeTeam =
    normalizeTeamName(
      game.homeTeam
    );

  const awayTeam =
    normalizeTeamName(
      game.awayTeam
    );

  if (homeTeam === requestedTeam) {
    return {
      commenceTime:
        game.commenceTime,

      opponent:
        game.awayTeam,

      homeAway: "home",

      pointMargin:
        game.homeScore -
        game.awayScore,
    };
  }

  if (awayTeam === requestedTeam) {
    return {
      commenceTime:
        game.commenceTime,

      opponent:
        game.homeTeam,

      homeAway: "away",

      pointMargin:
        game.awayScore -
        game.homeScore,
    };
  }

  return null;
}

function buildSimulationSummary(
  games: WNBATeamGamePerspective[],
  selectedLine: number
): WNBALineSimulationSummary {
  const gamesPlayed =
    games.length;

  if (gamesPlayed === 0) {
    return {
      gamesPlayed: 0,

      covers: 0,
      pushes: 0,
      misses: 0,

      coverRate: 0,

      averageActualMargin: 0,
      averageAdjustedMargin: 0,

      largestDefeat: 0,
    };
  }

  let covers = 0;
  let pushes = 0;
  let misses = 0;

  let totalActualMargin = 0;
  let totalAdjustedMargin = 0;
  let largestDefeat = 0;

  for (const game of games) {
    const adjustedMargin =
      game.pointMargin +
      selectedLine;

    totalActualMargin +=
      game.pointMargin;

    totalAdjustedMargin +=
      adjustedMargin;

    if (adjustedMargin > 0) {
      covers += 1;
    } else if (adjustedMargin === 0) {
      pushes += 1;
    } else {
      misses += 1;
    }

    if (game.pointMargin < 0) {
      largestDefeat = Math.max(
        largestDefeat,
        Math.abs(
          game.pointMargin
        )
      );
    }
  }

  const decidedGames =
    covers + misses;

  return {
    gamesPlayed,

    covers,
    pushes,
    misses,

    coverRate:
      decidedGames > 0
        ? roundToOneDecimal(
            (covers /
              decidedGames) *
              100
          )
        : 0,

    averageActualMargin:
      roundToOneDecimal(
        totalActualMargin /
          gamesPlayed
      ),

    averageAdjustedMargin:
      roundToOneDecimal(
        totalAdjustedMargin /
          gamesPlayed
      ),

    largestDefeat:
      roundToOneDecimal(
        largestDefeat
      ),
  };
}

function averageMargin(
  games: WNBATeamGamePerspective[]
) {
  if (games.length === 0) {
    return 0;
  }

  return roundToOneDecimal(
    games.reduce(
      (total, game) =>
        total +
        game.pointMargin,
      0
    ) / games.length
  );
}

function determineHistoricalSupport(
  last5: WNBALineSimulationSummary,
  last10: WNBALineSimulationSummary,
  venue: WNBALineSimulationSummary,
  headToHead: WNBALineSimulationSummary
): WNBASpreadHistoricalAnalysis["historicalSupport"] {
  if (last5.gamesPlayed < 3) {
    return "Insufficient Data";
  }

  const weightedRates: {
    rate: number;
    weight: number;
  }[] = [];

  if (last5.gamesPlayed >= 3) {
    weightedRates.push({
      rate: last5.coverRate,
      weight: 0.4,
    });
  }

  if (last10.gamesPlayed >= 5) {
    weightedRates.push({
      rate: last10.coverRate,
      weight: 0.3,
    });
  }

  if (venue.gamesPlayed >= 3) {
    weightedRates.push({
      rate: venue.coverRate,
      weight: 0.2,
    });
  }

  if (
    headToHead.gamesPlayed >= 3
  ) {
    weightedRates.push({
      rate:
        headToHead.coverRate,
      weight: 0.1,
    });
  }

  const totalWeight =
    weightedRates.reduce(
      (total, item) =>
        total + item.weight,
      0
    );

  if (totalWeight === 0) {
    return "Insufficient Data";
  }

  const weightedCoverRate =
    weightedRates.reduce(
      (total, item) =>
        total +
        item.rate *
          item.weight,
      0
    ) / totalWeight;

  if (weightedCoverRate >= 72) {
    return "Strong";
  }

  if (weightedCoverRate >= 60) {
    return "Moderate";
  }

  if (weightedCoverRate >= 48) {
    return "Mixed";
  }

  return "Weak";
}

export function buildWNBASpreadHistoricalAnalysis({
  selectedTeam,
  opponent,
  selectedLine,
  homeTeam,
  commenceTime,
  historicalGames,
}: {
  selectedTeam: string;
  opponent: string;
  selectedLine: number;
  homeTeam: string;
  commenceTime: string;
  historicalGames: WNBAHistoricalGame[];
}): WNBASpreadHistoricalAnalysis {
  const selectedTeamIsHome =
    normalizeTeamName(
      selectedTeam
    ) ===
    normalizeTeamName(
      homeTeam
    );

  const selectedVenue:
    "home" | "away" =
      selectedTeamIsHome
        ? "home"
        : "away";

  const cutoffTime =
    new Date(
      commenceTime
    ).getTime();

  const eligibleGames =
    historicalGames
      .filter(
        (game) =>
          game.completed === true &&
          game.seasonType === 2
      )
      .filter((game) => {
        const historicalTime =
          new Date(
            game.commenceTime
          ).getTime();

        if (
          !Number.isFinite(
            historicalTime
          )
        ) {
          return false;
        }

        if (
          !Number.isFinite(
            cutoffTime
          )
        ) {
          return true;
        }

        return (
          historicalTime <
          cutoffTime
        );
      })
      .sort(
        (firstGame, secondGame) =>
          new Date(
            secondGame.commenceTime
          ).getTime() -
          new Date(
            firstGame.commenceTime
          ).getTime()
      );

  const selectedTeamGames =
    eligibleGames
      .map((game) =>
        getTeamPerspective(
          game,
          selectedTeam
        )
      )
      .filter(
        (
          game
        ): game is WNBATeamGamePerspective =>
          game !== null
      );

  const opponentGames =
    eligibleGames
      .map((game) =>
        getTeamPerspective(
          game,
          opponent
        )
      )
      .filter(
        (
          game
        ): game is WNBATeamGamePerspective =>
          game !== null
      );

  const last5Games =
    selectedTeamGames.slice(
      0,
      5
    );

  const last10Games =
    selectedTeamGames.slice(
      0,
      10
    );

  const venueGames =
    selectedTeamGames.filter(
      (game) =>
        game.homeAway ===
        selectedVenue
    );

  const normalizedOpponent =
    normalizeTeamName(
      opponent
    );

  const headToHeadGames =
    selectedTeamGames.filter(
      (game) =>
        normalizeTeamName(
          game.opponent
        ) ===
        normalizedOpponent
    );

  const opponentLast5 =
    opponentGames.slice(0, 5);

  const opponentLast10 =
    opponentGames.slice(0, 10);

  /*
   * For +10.5, an opponent victory by
   * 11 or more defeats the handicap.
   */
  const opponentBlowoutThreshold =
    selectedLine >= 0
      ? Math.floor(
          selectedLine
        ) + 1
      : Math.floor(
          Math.abs(
            selectedLine
          )
        ) + 1;

  const opponentBlowoutWins =
    opponentLast10.filter(
      (game) =>
        game.pointMargin >=
        opponentBlowoutThreshold
    ).length;

  const opponentGamesChecked =
    opponentLast10.length;

  const blowoutRate =
    opponentGamesChecked > 0
      ? (opponentBlowoutWins /
          opponentGamesChecked) *
        100
      : 0;

  const blowoutRisk:
    WNBASpreadHistoricalAnalysis["blowoutRisk"] =
      blowoutRate >= 40
        ? "High"
        : blowoutRate >= 20
          ? "Moderate"
          : "Low";

  const last5 =
    buildSimulationSummary(
      last5Games,
      selectedLine
    );

  const last10 =
    buildSimulationSummary(
      last10Games,
      selectedLine
    );

  const venue =
    buildSimulationSummary(
      venueGames,
      selectedLine
    );

  const headToHead =
    buildSimulationSummary(
      headToHeadGames,
      selectedLine
    );

  return {
    selectedTeam,
    opponent,
    selectedLine,

    venueLabel:
      selectedTeamIsHome
        ? "Home"
        : "Away",

    last5,
    last10,
    venue,
    headToHead,

    opponentLast5AverageMargin:
      averageMargin(
        opponentLast5
      ),

    opponentLast10AverageMargin:
      averageMargin(
        opponentLast10
      ),

    opponentBlowoutWins,
    opponentGamesChecked,
    opponentBlowoutThreshold,

    blowoutRisk,

    historicalSupport:
      determineHistoricalSupport(
        last5,
        last10,
        venue,
        headToHead
      ),
  };
}