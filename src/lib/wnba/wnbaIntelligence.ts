import type { WNBAGame } from "./wnbaTypes";

import {
  scoreWNBAMarket,
  type WNBAMarketScore,
} from "./wnbaScore";

export type RankedWNBAGame = {
  eventId: string;

  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;
  opponentTeam: string;

  preferredProbability: number;
  opponentProbability: number;
  probabilityEdge: number;

  erlScore: number;
  confidence: WNBAMarketScore["confidence"];
  dataCompleteness: number;

  bookmakerCount: number;
  avoid: boolean;
  grade:
    | "Elite Edge"
    | "Strong Edge"
    | "Small Edge"
    | "Very Close";

  reasons: string[];
};

function decimalOddsToProbability(
  price: number
) {
  if (
    !Number.isFinite(price) ||
    price <= 1
  ) {
    return null;
  }

  return 1 / price;
}

function getMarketProbabilities(
  game: WNBAGame
) {
  const homeProbabilities: number[] = [];
  const awayProbabilities: number[] = [];

  for (
    const bookmaker of game.bookmakers ?? []
  ) {
    const moneylineMarket =
      bookmaker.markets.find(
        (market) => market.key === "h2h"
      );

    if (!moneylineMarket) {
      continue;
    }

    const homeOutcome =
      moneylineMarket.outcomes.find(
        (outcome) =>
          outcome.name === game.home_team
      );

    const awayOutcome =
      moneylineMarket.outcomes.find(
        (outcome) =>
          outcome.name === game.away_team
      );

    if (
      !homeOutcome ||
      !awayOutcome
    ) {
      continue;
    }

    const rawHomeProbability =
      decimalOddsToProbability(
        homeOutcome.price
      );

    const rawAwayProbability =
      decimalOddsToProbability(
        awayOutcome.price
      );

    if (
      rawHomeProbability === null ||
      rawAwayProbability === null
    ) {
      continue;
    }

    const probabilityTotal =
      rawHomeProbability +
      rawAwayProbability;

    if (probabilityTotal <= 0) {
      continue;
    }

    /*
     * Remove the bookmaker margin before adding
     * this bookmaker's probabilities to the
     * competition-wide average.
     */
    homeProbabilities.push(
      rawHomeProbability /
        probabilityTotal
    );

    awayProbabilities.push(
      rawAwayProbability /
        probabilityTotal
    );
  }

  const bookmakerCount = Math.min(
    homeProbabilities.length,
    awayProbabilities.length
  );

  if (bookmakerCount === 0) {
    return {
      home: 0.5,
      away: 0.5,
      bookmakerCount: 0,
    };
  }

  const averageHomeProbability =
    homeProbabilities.reduce(
      (total, probability) =>
        total + probability,
      0
    ) / homeProbabilities.length;

  const averageAwayProbability =
    awayProbabilities.reduce(
      (total, probability) =>
        total + probability,
      0
    ) / awayProbabilities.length;

  return {
    home: averageHomeProbability,
    away: averageAwayProbability,
    bookmakerCount,
  };
}

function getMatchupGrade(
  probabilityEdge: number
): RankedWNBAGame["grade"] {
  if (probabilityEdge >= 35) {
    return "Elite Edge";
  }

  if (probabilityEdge >= 20) {
    return "Strong Edge";
  }

  if (probabilityEdge >= 10) {
    return "Small Edge";
  }

  return "Very Close";
}

export function buildWNBAIntelligence(
  games: WNBAGame[]
): RankedWNBAGame[] {
  return games
    .map((game) => {
      const marketProbabilities =
        getMarketProbabilities(game);

      const marketScore =
        scoreWNBAMarket({
          homeTeam: game.home_team,
          awayTeam: game.away_team,

          homeMarketProbability:
            marketProbabilities.home,

          awayMarketProbability:
            marketProbabilities.away,

          bookmakerCount:
            marketProbabilities.bookmakerCount,
        });

      /*
       * Avoid is intentionally based on market
       * strength and availability. Low confidence
       * alone does not automatically reject every
       * matchup while historical WNBA data remains
       * disconnected.
       */
      const avoid =
        marketProbabilities.bookmakerCount <
          2 ||
        marketScore.probabilityEdge < 8;

      return {
        eventId: game.id,

        homeTeam: game.home_team,
        awayTeam: game.away_team,

        preferredTeam:
          marketScore.preferredTeam,

        opponentTeam:
          marketScore.opponentTeam,

        preferredProbability:
          marketScore.preferredProbability,

        opponentProbability:
          marketScore.opponentProbability,

        probabilityEdge:
          marketScore.probabilityEdge,

        erlScore: marketScore.score,
        confidence:
          marketScore.confidence,

        dataCompleteness:
          marketScore.dataCompleteness,

        bookmakerCount:
          marketProbabilities.bookmakerCount,

        avoid,

        grade: getMatchupGrade(
          marketScore.probabilityEdge
        ),

        reasons: marketScore.reasons,
      };
    })
    .sort((firstGame, secondGame) => {
      if (
        secondGame.erlScore !==
        firstGame.erlScore
      ) {
        return (
          secondGame.erlScore -
          firstGame.erlScore
        );
      }

      return (
        secondGame.probabilityEdge -
        firstGame.probabilityEdge
      );
    });
}