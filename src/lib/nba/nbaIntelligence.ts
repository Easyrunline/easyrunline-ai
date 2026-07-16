import type {
  NBAGame,
  NBATeamForm,
} from "./nbaTypes";

import {
  runERLNBABrain,
  type ERLNBABrainResult,
} from "./ERLNBABrain";

export type RankedNBAGame = {
  eventId: string;

  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;
  opponentTeam: string;

  preferredScore: number;
  scoreGap: number;

  projectedMargin: number;
  projectedTotal: number | null;

totalProjectionSource:
  ERLNBABrainResult["totalProjectionSource"];
  

 confidence:
    ERLNBABrainResult["confidence"];

  blowoutRisk:
    ERLNBABrainResult["blowoutRisk"];

  uncertainty: number;
  dataCompleteness: number;

  avoid: boolean;
  reasons: string[];

  bookmakerCount: number;
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
  game: NBAGame
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

    const total =
      rawHomeProbability +
      rawAwayProbability;

    if (total <= 0) {
      continue;
    }

    homeProbabilities.push(
      rawHomeProbability / total
    );

    awayProbabilities.push(
      rawAwayProbability / total
    );
  }

  if (
    homeProbabilities.length === 0 ||
    awayProbabilities.length === 0
  ) {
    return {
      home: 0.5,
      away: 0.5,
      bookmakerCount: 0,
    };
  }

  const averageHome =
    homeProbabilities.reduce(
      (sum, probability) =>
        sum + probability,
      0
    ) / homeProbabilities.length;

  const averageAway =
    awayProbabilities.reduce(
      (sum, probability) =>
        sum + probability,
      0
    ) / awayProbabilities.length;

  return {
    home: averageHome,
    away: averageAway,

    bookmakerCount: Math.min(
      homeProbabilities.length,
      awayProbabilities.length
    ),
  };
}
function getAverageMarketTotal(
  game: NBAGame
) {
  const totals: number[] = [];

  for (const bookmaker of game.bookmakers ?? []) {
    const totalsMarket =
      bookmaker.markets.find(
        (market) => market.key === "totals"
      );

    if (!totalsMarket) {
      continue;
    }

    for (const outcome of totalsMarket.outcomes) {
      if (
        Number.isFinite(outcome.point) &&
        (outcome.point as number) >= 150 &&
        (outcome.point as number) <= 300
      ) {
        totals.push(outcome.point as number);
      }
    }
  }

  if (totals.length === 0) {
    return null;
  }

  return (
    totals.reduce(
      (sum, total) => sum + total,
      0
    ) / totals.length
  );
}

export function buildNBAIntelligence(
  games: NBAGame[],
  teamForm: NBATeamForm[]
): RankedNBAGame[] {
  return games
    .map((game) => {
      const homeForm = teamForm.find(
        (team) =>
          team.team === game.home_team
      );

      const awayForm = teamForm.find(
        (team) =>
          team.team === game.away_team
      );

      const marketProbabilities =
        getMarketProbabilities(game);
        const marketTotal =
  getAverageMarketTotal(game);

      const brainResult =
        runERLNBABrain({
          game,

          homeForm,
          awayForm,

          homeMarketProbability:
            marketProbabilities.home,

          awayMarketProbability:
            marketProbabilities.away,
            marketTotal,
        });

      return {
        eventId: game.id,

        homeTeam: game.home_team,
        awayTeam: game.away_team,

        preferredTeam:
          brainResult.preferredTeam,

        opponentTeam:
          brainResult.opponentTeam,

        preferredScore: Math.round(
          brainResult.erlRating
        ),

        scoreGap:
          brainResult.erlEdge,

        projectedMargin:
          brainResult.projectedMargin,
          projectedTotal:
  brainResult.projectedTotal,

totalProjectionSource:
  brainResult.totalProjectionSource,

        confidence:
          brainResult.confidence,

        blowoutRisk:
          brainResult.blowoutRisk,

        uncertainty:
          brainResult.uncertainty,

        dataCompleteness:
          brainResult.dataCompleteness,

        avoid:
          brainResult.avoid,

        reasons:
          brainResult.reasons,

        bookmakerCount:
          marketProbabilities
            .bookmakerCount,
      };
    })
    .sort((a, b) => {
      if (
        b.preferredScore !==
        a.preferredScore
      ) {
        return (
          b.preferredScore -
          a.preferredScore
        );
      }

      return (
        b.scoreGap -
        a.scoreGap
      );
    });
}