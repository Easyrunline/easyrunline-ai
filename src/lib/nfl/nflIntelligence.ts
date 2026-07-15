import type {
  NFLGame,
  NFLTeamForm,
  NFLTeamQuarterbacks,
} from "./nflTypes";

import {
  runERLNFLBrain,
  type ERLNFLBrainResult,
} from "./ERLNFLBrain";

export type RankedNFLGame = {
  eventId: string;

  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;

  preferredScore: number;

  scoreGap: number;

  confidence: ERLNFLBrainResult["confidence"];
  blowoutRisk: ERLNFLBrainResult["blowoutRisk"];

  projectedMargin: number;
  uncertainty: number;
  dataCompleteness: number;

  avoid: boolean;
  reasons: string[];
};

function decimalOddsToProbability(price: number) {
  if (!Number.isFinite(price) || price <= 1) {
    return null;
  }

  return 1 / price;
}

function getMarketProbabilities(game: NFLGame) {
  const homeProbabilities: number[] = [];
  const awayProbabilities: number[] = [];

  for (const bookmaker of game.bookmakers ?? []) {
    const moneylineMarket = bookmaker.markets.find(
      (market) => market.key === "h2h"
    );

    if (!moneylineMarket) {
      continue;
    }

    const homeOutcome = moneylineMarket.outcomes.find(
      (outcome) => outcome.name === game.home_team
    );

    const awayOutcome = moneylineMarket.outcomes.find(
      (outcome) => outcome.name === game.away_team
    );

    if (!homeOutcome || !awayOutcome) {
      continue;
    }

    const rawHomeProbability =
      decimalOddsToProbability(homeOutcome.price);

    const rawAwayProbability =
      decimalOddsToProbability(awayOutcome.price);

    if (
      rawHomeProbability === null ||
      rawAwayProbability === null
    ) {
      continue;
    }

    const total =
      rawHomeProbability + rawAwayProbability;

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
      (sum, probability) => sum + probability,
      0
    ) / homeProbabilities.length;

  const averageAway =
    awayProbabilities.reduce(
      (sum, probability) => sum + probability,
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

export function buildNFLIntelligence(
  games: NFLGame[],
  teamForm: NFLTeamForm[],
  teamQuarterbacks: NFLTeamQuarterbacks[]
): RankedNFLGame[] {
  return games
    .map((game) => {
      const awayForm = teamForm.find(
        (team) => team.team === game.away_team
      );

      const homeForm = teamForm.find(
        (team) => team.team === game.home_team
      );

      const awayQuarterbacks =
        teamQuarterbacks.find(
          (team) => team.team === game.away_team
        );

      const homeQuarterbacks =
        teamQuarterbacks.find(
          (team) => team.team === game.home_team
        );

      const marketProbabilities =
        getMarketProbabilities(game);

      const brainResult = runERLNFLBrain({
        game,

        homeForm,
        awayForm,

        homeQuarterbacks,
        awayQuarterbacks,

        homeMarketProbability:
          marketProbabilities.home,

        awayMarketProbability:
          marketProbabilities.away,
      });

      const preferredScore = Math.round(
        brainResult.erlRating
      );

      return {
        eventId: game.id,

        homeTeam: game.home_team,
        awayTeam: game.away_team,

        preferredTeam:
          brainResult.preferredTeam,

        preferredScore,

        scoreGap: brainResult.erlEdge,

        confidence:
          brainResult.confidence,

        blowoutRisk:
          brainResult.blowoutRisk,

        projectedMargin:
          brainResult.projectedMargin,

        uncertainty:
          brainResult.uncertainty,

        dataCompleteness:
          brainResult.dataCompleteness,

        avoid:
          brainResult.avoid,

        reasons:
          brainResult.reasons,
      };
    })
    .sort((a, b) => {
      if (b.preferredScore !== a.preferredScore) {
        return (
          b.preferredScore -
          a.preferredScore
        );
      }

      return b.scoreGap - a.scoreGap;
    });
}