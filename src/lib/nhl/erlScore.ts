/* ===========================================================
   EASYRUNLINE AI
   NHL ERL SCORE ENGINE v1
   =========================================================== */
   import type { ScoreBreakdown } from "./types";

export interface NHLERLInputs {
  goalie: ScoreBreakdown;
  recentForm: ScoreBreakdown;
  goalDifferential: ScoreBreakdown;
  offense: ScoreBreakdown;
  defense: ScoreBreakdown;
  homeIce: ScoreBreakdown;
  injuries: ScoreBreakdown;
  market: ScoreBreakdown;
}
  

export interface NHLERLResult {
  totalScore: number;
  confidence: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  edge: number;
  recommendation:
    | "Avoid"
    | "Lean"
    | "Playable"
    | "Strong"
    | "Best Bet";

  breakdown: ScoreBreakdown[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function calculateNHLERLScore(
  input: NHLERLInputs
): NHLERLResult {

  const goalie =
  clamp(input.goalie.score, -30, 30);

const form =
  clamp(input.recentForm.score, -20, 20);

const goalDifferential =
  clamp(input.goalDifferential.score, -10, 10);

const offense =
  clamp(input.offense.score, -10, 10);

const defense =
  clamp(input.defense.score, -10, 10);

const home =
  clamp(input.homeIce.score, -10, 10);

const injuries =
  clamp(input.injuries.score, -10, 10);

const market =
  clamp(input.market.score, -10, 10);

 const edge =
  goalie +
  form +
  goalDifferential +
  offense +
  defense +
  home +
  injuries +
  market;

  const totalScore =
    clamp(50 + edge, 0, 100);

  let confidence: NHLERLResult["confidence"];

  if (totalScore >= 85)
    confidence = "Very High";
  else if (totalScore >= 75)
    confidence = "High";
  else if (totalScore >= 65)
    confidence = "Moderate";
  else if (totalScore >= 55)
    confidence = "Low";
  else
    confidence = "Very Low";

  let recommendation: NHLERLResult["recommendation"];

  if (totalScore >= 85)
    recommendation = "Best Bet";
  else if (totalScore >= 75)
    recommendation = "Strong";
  else if (totalScore >= 65)
    recommendation = "Playable";
  else if (totalScore >= 55)
    recommendation = "Lean";
  else
    recommendation = "Avoid";

  return {
  totalScore,
  confidence,
  edge,
  recommendation,

  breakdown: [
    input.goalie,
    input.recentForm,
    input.goalDifferential,
    input.offense,
    input.defense,
    input.homeIce,
    input.injuries,
    input.market,
  ],
};
}