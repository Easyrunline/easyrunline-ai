import { runERLSoccerBrain } from "./ERLSoccerBrain";
export type SoccerIntelligenceOutcome = {
  name: string;
  price: number;
  point?: number;
};

export type SoccerIntelligenceMarket = {
  key: string;
  outcomes: SoccerIntelligenceOutcome[];
};

export type SoccerIntelligenceBookmaker = {
  key: string;
  title: string;
  markets: SoccerIntelligenceMarket[];
};

export type SoccerIntelligenceGame = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: SoccerIntelligenceBookmaker[];
};

export type RankedSoccerGame = {
  eventId: string;
  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;
  opponentTeam: string;

  preferredPrice: number;
  opponentPrice: number;
  drawPrice: number;

  preferredProbability: number;
  opponentProbability: number;
  drawProbability: number;

  probabilityEdge: number;
  erlScore: number;

  confidence: "Low" | "Medium" | "High";
  grade:
    | "Very Close"
    | "Small Edge"
    | "Strong Edge"
    | "Elite Edge";

  bookmaker: string;
};

function decimalToProbability(price: number) {
  if (!Number.isFinite(price) || price <= 1) {
    return 0;
  }

  return 1 / price;
}

function normalizeProbabilities(
  homeProbability: number,
  drawProbability: number,
  awayProbability: number
) {
  const total =
    homeProbability +
    drawProbability +
    awayProbability;

  if (total <= 0) {
    return {
      home: 0,
      draw: 0,
      away: 0,
    };
  }

  return {
    home: homeProbability / total,
    draw: drawProbability / total,
    away: awayProbability / total,
  };
}

function buildGrade(edge: number): RankedSoccerGame["grade"] {
  if (edge >= 20) {
    return "Elite Edge";
  }

  if (edge >= 12) {
    return "Strong Edge";
  }

  if (edge >= 6) {
    return "Small Edge";
  }

  return "Very Close";
}

function buildConfidence(
  edge: number
): RankedSoccerGame["confidence"] {
  if (edge >= 15) {
    return "High";
  }

  if (edge >= 7) {
    return "Medium";
  }

  return "Low";
}

function findH2HMarket(
  game: SoccerIntelligenceGame
): {
  bookmaker: SoccerIntelligenceBookmaker;
  market: SoccerIntelligenceMarket;
} | null {
  for (const bookmaker of game.bookmakers || []) {
    const market = bookmaker.markets.find(
      (item) => item.key === "h2h"
    );

    if (market) {
      return {
        bookmaker,
        market,
      };
    }
  }

  return null;
}

export function buildSoccerIntelligence(
  games: SoccerIntelligenceGame[]
): RankedSoccerGame[] {
  const rankedGames: RankedSoccerGame[] = [];

  for (const game of games) {
    const marketResult = findH2HMarket(game);

    if (!marketResult) {
      continue;
    }

    const { bookmaker, market } = marketResult;

    const homeOutcome = market.outcomes.find(
      (outcome) => outcome.name === game.home_team
    );

    const awayOutcome = market.outcomes.find(
      (outcome) => outcome.name === game.away_team
    );

    const drawOutcome = market.outcomes.find(
      (outcome) => outcome.name === "Draw"
    );

    if (
      !homeOutcome ||
      !awayOutcome ||
      !drawOutcome
    ) {
      continue;
    }

    const probabilities = normalizeProbabilities(
      decimalToProbability(homeOutcome.price),
      decimalToProbability(drawOutcome.price),
      decimalToProbability(awayOutcome.price)
    );

    const homeIsPreferred =
      probabilities.home >= probabilities.away;

    const preferredTeam = homeIsPreferred
      ? game.home_team
      : game.away_team;

    const opponentTeam = homeIsPreferred
      ? game.away_team
      : game.home_team;

    const preferredPrice = homeIsPreferred
      ? homeOutcome.price
      : awayOutcome.price;

    const opponentPrice = homeIsPreferred
      ? awayOutcome.price
      : homeOutcome.price;

    const preferredProbability = homeIsPreferred
      ? probabilities.home
      : probabilities.away;

    const opponentProbability = homeIsPreferred
      ? probabilities.away
      : probabilities.home;

    const probabilityEdge =
      (preferredProbability - opponentProbability) * 100;

    const brainResult = runERLSoccerBrain({
  eventId: game.id,

  homeTeam: game.home_team,
  awayTeam: game.away_team,

  homeMarketProbability: probabilities.home,
  drawMarketProbability: probabilities.draw,
  awayMarketProbability: probabilities.away,

  homeForm: null,
  awayForm: null,
});

const erlScore = Math.round(
  brainResult.erlRating
);

    rankedGames.push({
      eventId: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,

      preferredTeam,
      opponentTeam,

      preferredPrice,
      opponentPrice,
      drawPrice: drawOutcome.price,

      preferredProbability: Number(
        (preferredProbability * 100).toFixed(1)
      ),

      opponentProbability: Number(
        (opponentProbability * 100).toFixed(1)
      ),

      drawProbability: Number(
        (probabilities.draw * 100).toFixed(1)
      ),

      probabilityEdge: Number(
        probabilityEdge.toFixed(1)
      ),

      erlScore,

      confidence: brainResult.confidence,
grade: brainResult.matchRating.grade,

      bookmaker: bookmaker.title,
    });
  }

  return rankedGames.sort((a, b) => {
    if (b.erlScore !== a.erlScore) {
      return b.erlScore - a.erlScore;
    }

    return b.probabilityEdge - a.probabilityEdge;
  });
}