import type {
  ERLSoccerTeamRating,
} from "./soccerRating";

export type SoccerRiskLevel =
  | "Low"
  | "Medium"
  | "High";

export type ERLSoccerMatchRating = {
  homeTeam: string;
  awayTeam: string;

  homeRating: number;
  awayRating: number;

  preferredTeam: string;
  opponentTeam: string;

  erlEdge: number;
  projectedMargin: number;

  upsetRisk: SoccerRiskLevel;
  blowoutRisk: SoccerRiskLevel;
  uncertainty: number;

  confidence: "Low" | "Medium" | "High";
  grade:
    | "Very Close"
    | "Small Edge"
    | "Strong Edge"
    | "Elite Edge";

  dataCompleteness: number;
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

function buildGrade(
  edge: number
): ERLSoccerMatchRating["grade"] {
  if (edge >= 18) {
    return "Elite Edge";
  }

  if (edge >= 10) {
    return "Strong Edge";
  }

  if (edge >= 5) {
    return "Small Edge";
  }

  return "Very Close";
}

function buildConfidence(
  edge: number,
  uncertainty: number
): ERLSoccerMatchRating["confidence"] {
  if (edge >= 14 && uncertainty <= 35) {
    return "High";
  }

  if (edge >= 6 && uncertainty <= 55) {
    return "Medium";
  }

  return "Low";
}

function buildUpsetRisk(
  edge: number,
  uncertainty: number
): SoccerRiskLevel {
  if (edge <= 5 || uncertainty >= 65) {
    return "High";
  }

  if (edge <= 10 || uncertainty >= 45) {
    return "Medium";
  }

  return "Low";
}

function buildBlowoutRisk(
  edge: number,
  preferredRating: number
): SoccerRiskLevel {
  if (edge >= 20 && preferredRating >= 75) {
    return "High";
  }

  if (edge >= 12 && preferredRating >= 68) {
    return "Medium";
  }

  return "Low";
}

export function buildERLSoccerMatchRating(
  home: ERLSoccerTeamRating,
  away: ERLSoccerTeamRating
): ERLSoccerMatchRating {
  const homeIsPreferred =
    home.powerRating >= away.powerRating;

  const preferred = homeIsPreferred
    ? home
    : away;

  const opponent = homeIsPreferred
    ? away
    : home;

  const erlEdge = Math.abs(
    home.powerRating - away.powerRating
  );

  /*
   * Early projected-margin estimate.
   * This will later be replaced by a proper goal model.
   */
  const projectedMargin = clamp(
    erlEdge / 8,
    0,
    4
  );

  const dataCompleteness =
    (home.dataCompleteness +
      away.dataCompleteness) /
    2;

  const uncertainty = clamp(
    100 - dataCompleteness +
      (erlEdge < 5 ? 20 : 0)
  );

  const reasons: string[] = [];

  reasons.push(
    `${preferred.teamName} has the higher ERL Power Rating.`
  );

  reasons.push(
    `ERL Edge: +${erlEdge.toFixed(1)}.`
  );

  if (dataCompleteness < 70) {
    reasons.push(
      "The current rating has limited historical data, so uncertainty remains elevated."
    );
  }

  if (erlEdge < 5) {
    reasons.push(
      "The teams grade very closely, reducing confidence."
    );
  }

  if (projectedMargin >= 2) {
    reasons.push(
      "The current rating gap indicates meaningful blowout potential."
    );
  }

  return {
    homeTeam: home.teamName,
    awayTeam: away.teamName,

    homeRating: home.powerRating,
    awayRating: away.powerRating,

    preferredTeam: preferred.teamName,
    opponentTeam: opponent.teamName,

    erlEdge: Number(erlEdge.toFixed(1)),
    projectedMargin: Number(
      projectedMargin.toFixed(2)
    ),

    upsetRisk: buildUpsetRisk(
      erlEdge,
      uncertainty
    ),

    blowoutRisk: buildBlowoutRisk(
      erlEdge,
      preferred.powerRating
    ),

    uncertainty: Number(
      uncertainty.toFixed(1)
    ),

    confidence: buildConfidence(
      erlEdge,
      uncertainty
    ),

    grade: buildGrade(erlEdge),

    dataCompleteness: Number(
      dataCompleteness.toFixed(1)
    ),

    reasons,
  };
}