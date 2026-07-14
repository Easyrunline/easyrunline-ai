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
  rating: ERLRating;
  reasons: string[];
};

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

      if (rating.edge <= 4) {
        reasons.push(
          `EasyRunLine Edge is only +${rating.edge}.`
        );
      }

      if (rating.confidence === "Low") {
        reasons.push("Model confidence is low.");
      }

      if (rating.edgeGrade === "Very Close") {
        reasons.push(
          "The teams grade too closely for a dependable edge."
        );
      }

      if (reasons.length === 0) {
        reasons.push(
          "The matchup ranks below stronger available NFL opportunities."
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
        rating,
        reasons,
      };
    })
    .sort((a, b) => {
      if (a.rating.edge !== b.rating.edge) {
        return a.rating.edge - b.rating.edge;
      }

      return a.preferredScore - b.preferredScore;
    })
    .slice(0, limit);
}