import type {
  NBAGame,
  NBATeamForm,
} from "./nbaTypes";

import {
  scoreNBATeam,
  type NBATeamScore,
} from "./nbaScore";

export type ERLNBABrainInput = {
  game: NBAGame;

  homeForm?: NBATeamForm;
  awayForm?: NBATeamForm;

  homeMarketProbability: number;
  awayMarketProbability: number;
};

export type ERLNBATeamRating = {
  team: string;
  side: "home" | "away";

  formScore: number;
  marketScore: number;
  homeCourtScore: number;

  dataCompleteness: number;
  powerRating: number;

  reasons: string[];
};

export type ERLNBABrainResult = {
  eventId: string;

  homeTeam: ERLNBATeamRating;
  awayTeam: ERLNBATeamRating;

  preferredTeam: string;
  opponentTeam: string;

  erlRating: number;
  erlEdge: number;

  projectedMargin: number;

  confidence:
    | "Very High"
    | "High"
    | "Moderate"
    | "Low"
    | "Very Low";

  blowoutRisk:
    | "Low"
    | "Moderate"
    | "High"
    | "Very High";

  uncertainty: number;
  dataCompleteness: number;

  avoid: boolean;
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

function normalizeProbability(
  probability: number
) {
  if (!Number.isFinite(probability)) {
    return 0.5;
  }

  return clamp(probability, 0, 1);
}

function buildTeamRating(params: {
  team: string;
  side: "home" | "away";
  form?: NBATeamForm;
  marketProbability: number;
}): ERLNBATeamRating {
  const isHome = params.side === "home";

  const formResult: NBATeamScore =
    scoreNBATeam(
      params.form,
      params.team,
      isHome
    );

  const marketScore =
    normalizeProbability(
      params.marketProbability
    ) * 100;

  const homeCourtScore = isHome ? 56 : 50;

  /*
   * Version 1 NBA weighting:
   *
   * Team form:          50%
   * Market probability: 40%
   * Home-court context: 10%
   *
   * Form will become more influential once the
   * live NBA form route is connected.
   */
  const powerRating = clamp(
    formResult.score * 0.5 +
      marketScore * 0.4 +
      homeCourtScore * 0.1
  );

  return {
    team: params.team,
    side: params.side,

    formScore: formResult.score,

    marketScore: Number(
      marketScore.toFixed(1)
    ),

    homeCourtScore,

    dataCompleteness:
      formResult.dataCompleteness,

    powerRating: Number(
      powerRating.toFixed(1)
    ),

    reasons: formResult.reasons,
  };
}

function buildConfidence(
  erlEdge: number,
  uncertainty: number
): ERLNBABrainResult["confidence"] {
  if (erlEdge >= 18 && uncertainty <= 20) {
    return "Very High";
  }

  if (erlEdge >= 12 && uncertainty <= 35) {
    return "High";
  }

  if (erlEdge >= 6 && uncertainty <= 55) {
    return "Moderate";
  }

  if (erlEdge >= 3 && uncertainty <= 70) {
    return "Low";
  }

  return "Very Low";
}

function buildBlowoutRisk(
  erlEdge: number,
  projectedMargin: number
): ERLNBABrainResult["blowoutRisk"] {
  if (erlEdge >= 22 && projectedMargin >= 14) {
    return "Very High";
  }

  if (erlEdge >= 15 && projectedMargin >= 10) {
    return "High";
  }

  if (erlEdge >= 8 && projectedMargin >= 6) {
    return "Moderate";
  }

  return "Low";
}

export function runERLNBABrain(
  input: ERLNBABrainInput
): ERLNBABrainResult {
  const homeTeam = buildTeamRating({
    team: input.game.home_team,
    side: "home",
    form: input.homeForm,
    marketProbability:
      input.homeMarketProbability,
  });

  const awayTeam = buildTeamRating({
    team: input.game.away_team,
    side: "away",
    form: input.awayForm,
    marketProbability:
      input.awayMarketProbability,
  });

  const homeIsPreferred =
    homeTeam.powerRating >=
    awayTeam.powerRating;

  const preferred = homeIsPreferred
    ? homeTeam
    : awayTeam;

  const opponent = homeIsPreferred
    ? awayTeam
    : homeTeam;

  const erlEdge = Math.abs(
    homeTeam.powerRating -
      awayTeam.powerRating
  );

  /*
   * Early NBA point-margin estimate.
   * This will later be calibrated against
   * historical scoring margins.
   */
  const projectedMargin = clamp(
    erlEdge * 0.7,
    0,
    25
  );

  const dataCompleteness =
    (homeTeam.dataCompleteness +
      awayTeam.dataCompleteness) /
    2;

  const uncertainty = clamp(
    100 - dataCompleteness +
      (erlEdge < 5 ? 15 : 0)
  );

  const confidence = buildConfidence(
    erlEdge,
    uncertainty
  );

  const avoid =
    confidence === "Very Low" ||
    uncertainty >= 65 ||
    erlEdge < 3;

  const erlRating = clamp(
    preferred.powerRating * 0.75 +
      erlEdge * 1.2 +
      dataCompleteness * 0.12 -
      uncertainty * 0.08
  );

  const reasons = [
    `${preferred.team} has the stronger ERL NBA power rating.`,
    `ERL edge: +${erlEdge.toFixed(1)}.`,
    `Projected margin: ${projectedMargin.toFixed(
      1
    )} points.`,
  ];

  if (uncertainty >= 50) {
    reasons.push(
      "Missing or incomplete data reduces recommendation confidence."
    );
  }

  if (avoid) {
    reasons.push(
      "EasyRunLine classifies this matchup as low-confidence or high-uncertainty."
    );
  }

  return {
    eventId: input.game.id,

    homeTeam,
    awayTeam,

    preferredTeam: preferred.team,
    opponentTeam: opponent.team,

    erlRating: Number(
      erlRating.toFixed(1)
    ),

    erlEdge: Number(
      erlEdge.toFixed(1)
    ),

    projectedMargin: Number(
      projectedMargin.toFixed(1)
    ),

    confidence,

    blowoutRisk: buildBlowoutRisk(
      erlEdge,
      projectedMargin
    ),

    uncertainty: Number(
      uncertainty.toFixed(1)
    ),

    dataCompleteness: Number(
      dataCompleteness.toFixed(1)
    ),

    avoid,
    reasons,
  };
}