import type { RankedNFLGame } from "./nflIntelligence";
import {
  buildERLRating,
  type ERLRating,
} from "../erl/erlRating";

export type NFLAvoidGame = {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  preferredTeam: string;

  preferredScore: number;
  opponentScore: number;
  scoreGap: number;

  projectedMargin: number;
  uncertainty: number;
  dataCompleteness: number;

  confidence: RankedNFLGame["confidence"];
  blowoutRisk: RankedNFLGame["blowoutRisk"];

  rating: ERLRating;
  avoidScore: number;
  reasons: string[];
};

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
) {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

function buildAvoidScore(game: RankedNFLGame) {
  let avoidScore = 0;

  /*
   * A small ERL edge makes the matchup less dependable.
   */
  if (game.scoreGap < 3) {
    avoidScore += 35;
  } else if (game.scoreGap < 6) {
    avoidScore += 22;
  } else if (game.scoreGap < 9) {
    avoidScore += 10;
  }

  /*
   * High uncertainty is one of the strongest
   * reasons to avoid a matchup.
   */
  avoidScore += game.uncertainty * 0.35;

  /*
   * Missing data increases risk.
   */
  avoidScore +=
    (100 - game.dataCompleteness) * 0.25;

  /*
   * Very close projected margins are more volatile.
   */
  if (game.projectedMargin < 2) {
    avoidScore += 18;
  } else if (game.projectedMargin < 4) {
    avoidScore += 10;
  }

  if (
    game.confidence === "Very Low" ||
    game.confidence === "Low"
  ) {
    avoidScore += 20;
  } else if (game.confidence === "Moderate") {
    avoidScore += 8;
  }

  if (game.avoid) {
    avoidScore += 20;
  }

  return clamp(avoidScore);
}

export function buildNFLGamesToAvoid(
  rankedGames: RankedNFLGame[],
  limit = 3
): NFLAvoidGame[] {
  return rankedGames
    .map((game) => {
      const opponentScore =
        game.preferredScore - game.scoreGap;

      const rating = buildERLRating(
        game.preferredScore,
        opponentScore
      );

      const reasons: string[] = [];

      if (game.scoreGap < 4) {
        reasons.push(
          `ERL matchup edge is only +${game.scoreGap.toFixed(
            1
          )}.`
        );
      } else if (game.scoreGap < 7) {
        reasons.push(
          "The ERL matchup advantage is relatively small."
        );
      }

      if (game.uncertainty >= 65) {
        reasons.push(
          `Model uncertainty is very high at ${game.uncertainty.toFixed(
            0
          )}%.`
        );
      } else if (game.uncertainty >= 50) {
        reasons.push(
          `Model uncertainty remains elevated at ${game.uncertainty.toFixed(
            0
          )}%.`
        );
      }

      if (game.dataCompleteness < 60) {
        reasons.push(
          `Only ${game.dataCompleteness.toFixed(
            0
          )}% of the targeted intelligence data is available.`
        );
      } else if (game.dataCompleteness < 75) {
        reasons.push(
          "Some important matchup data remains incomplete."
        );
      }

      if (game.projectedMargin < 2) {
        reasons.push(
          "The projected scoring margin is extremely close."
        );
      } else if (game.projectedMargin < 4) {
        reasons.push(
          "The projected scoring margin offers limited separation."
        );
      }

      if (
        game.confidence === "Very Low" ||
        game.confidence === "Low"
      ) {
        reasons.push(
          `ERL confidence is ${game.confidence.toLowerCase()}.`
        );
      }

      if (game.avoid) {
        reasons.push(
          "The central ERL NFL Brain classified this matchup as an avoid."
        );
      }

      if (reasons.length === 0) {
        reasons.push(
          "This matchup ranks below stronger and more complete NFL opportunities."
        );
      }

      return {
        eventId: game.eventId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        preferredTeam: game.preferredTeam,

        preferredScore: game.preferredScore,
        opponentScore,
        scoreGap: game.scoreGap,

        projectedMargin: game.projectedMargin,
        uncertainty: game.uncertainty,
        dataCompleteness:
          game.dataCompleteness,

        confidence: game.confidence,
        blowoutRisk: game.blowoutRisk,

        rating,
        avoidScore: buildAvoidScore(game),
        reasons,
      };
    })
    .sort((a, b) => {
      if (b.avoidScore !== a.avoidScore) {
        return b.avoidScore - a.avoidScore;
      }

      if (b.uncertainty !== a.uncertainty) {
        return b.uncertainty - a.uncertainty;
      }

      return a.scoreGap - b.scoreGap;
    })
    .slice(0, limit);
}