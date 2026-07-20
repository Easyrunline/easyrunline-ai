/* ===========================================================
   EASYRUNLINE AI
   NHL COMPARISON ENGINE
   =========================================================== */

import type { NHLRecommendation } from "./types";

export type EdgeRating =
  | "Coin Flip"
  | "Lean"
  | "Playable"
  | "Strong Play"
  | "Best Bet";

export interface ComparisonResult {
  winner: string;
  loser: string;

  winnerScore: number;
  loserScore: number;

  edge: number;

  edgeRating: EdgeRating;

  confidence:
    | "Very Low"
    | "Low"
    | "Moderate"
    | "High"
    | "Very High";
}

export function compareTeams(
  home: NHLRecommendation,
  away: NHLRecommendation
): ComparisonResult {

  const winner =
    home.erlScore >= away.erlScore
      ? home
      : away;

  const loser =
    home.erlScore >= away.erlScore
      ? away
      : home;

  const edge =
    Math.abs(
      winner.erlScore -
      loser.erlScore
    );

  let edgeRating: EdgeRating;

  if (edge >= 13)
    edgeRating = "Best Bet";
  else if (edge >= 8)
    edgeRating = "Strong Play";
  else if (edge >= 4)
    edgeRating = "Playable";
  else if (edge >= 2)
    edgeRating = "Lean";
  else
    edgeRating = "Coin Flip";

  let confidence: ComparisonResult["confidence"];

  if (edge >= 13)
    confidence = "Very High";
  else if (edge >= 8)
    confidence = "High";
  else if (edge >= 4)
    confidence = "Moderate";
  else if (edge >= 2)
    confidence = "Low";
  else
    confidence = "Very Low";

  return {

    winner: winner.team,

    loser: loser.team,

    winnerScore: winner.erlScore,

    loserScore: loser.erlScore,

    edge,

    edgeRating,

    confidence,

  };

}