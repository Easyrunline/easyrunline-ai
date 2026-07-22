import type {
  NFLGame,
  NFLTeamForm,
  NFLTeamQuarterbacks,
} from "./nflTypes";

import {
  scoreNFLTeam,
  type NFLTeamScore,
} from "./nflScore";

import {
  scoreNFLQuarterbackSituation,
  type NFLQuarterbackScore,
} from "./nflQuarterbackScore";

export type ERLNFLBrainInput = {
  game: NFLGame;

  homeForm?: NFLTeamForm;
  awayForm?: NFLTeamForm;

  homeQuarterbacks?: NFLTeamQuarterbacks;
  awayQuarterbacks?: NFLTeamQuarterbacks;

  homeMarketProbability: number;
  awayMarketProbability: number;
};

export type ERLNFLTeamRating = {
  team: string;
  side: "home" | "away";

  formScore: number;
  quarterbackScore: number;
  marketScore: number;
  homeFieldScore: number;

  dataCompleteness: number;
  powerRating: number;

  reasons: string[];
};

export type ERLNFLBrainResult = {
  eventId: string;

  homeTeam: ERLNFLTeamRating;
  awayTeam: ERLNFLTeamRating;

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

function normalizeProbability(probability: number) {
  if (!Number.isFinite(probability)) {
    return 0.5;
  }

  return clamp(probability, 0, 1);
}

function calculateDataCompleteness(
  form: NFLTeamForm | undefined,
  quarterback: NFLQuarterbackScore
) {
  let completeness = 25;

  if (form) {
    completeness += 45;

    if (form.gamesCounted >= 8) {
      completeness += 10;
    }
  }

  if (quarterback.dataAvailable) {
    completeness += 15;
  }

    if (quarterback.starterConfirmed) {
    completeness += 5;
  }

  /*
   * Without a confirmed game-day starter,
   * the available NFL dataset must not be
   * treated as nearly complete.
   */
  const maximumCompleteness =
    quarterback.starterConfirmed
      ? 100
      : 75;

  return clamp(
    completeness,
    0,
    maximumCompleteness
  );
}

function buildTeamRating(params: {
  team: string;
  side: "home" | "away";
  form?: NFLTeamForm;
  quarterbacks?: NFLTeamQuarterbacks;
  marketProbability: number;
}): ERLNFLTeamRating {
  const isHome = params.side === "home";

  const formResult: NFLTeamScore = scoreNFLTeam(
    params.form,
    params.team,
    isHome
  );

  const quarterbackResult =
    scoreNFLQuarterbackSituation(
      params.quarterbacks
    );

  const marketScore =
    normalizeProbability(
      params.marketProbability
    ) * 100;

  const homeFieldScore = isHome ? 58 : 50;

  const dataCompleteness =
    calculateDataCompleteness(
      params.form,
      quarterbackResult
    );

  /*
   * Version 1 weighting:
   *
   * Team form:             40%
   * Market probability:    30%
   * Quarterback situation: 20%
   * Home-field context:    10%
   */
  const powerRating = clamp(
    formResult.score * 0.4 +
      marketScore * 0.3 +
      quarterbackResult.score * 0.2 +
      homeFieldScore * 0.1
  );

  return {
    team: params.team,
    side: params.side,

    formScore: formResult.score,
    quarterbackScore:
      quarterbackResult.score,
    marketScore: Number(
      marketScore.toFixed(1)
    ),
    homeFieldScore,

    dataCompleteness,
    powerRating: Number(
      powerRating.toFixed(1)
    ),

    reasons: [
      ...formResult.reasons,
      ...quarterbackResult.reasons,
    ],
  };
}

function buildConfidence(
  erlEdge: number,
  uncertainty: number
): ERLNFLBrainResult["confidence"] {
  if (erlEdge >= 20 && uncertainty <= 20) {
    return "Very High";
  }

  if (erlEdge >= 13 && uncertainty <= 35) {
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
): ERLNFLBrainResult["blowoutRisk"] {
  if (erlEdge >= 22 && projectedMargin >= 10) {
    return "Very High";
  }

  if (erlEdge >= 15 && projectedMargin >= 7) {
    return "High";
  }

  if (erlEdge >= 8 && projectedMargin >= 4) {
    return "Moderate";
  }

  return "Low";
}

export function runERLNFLBrain(
  input: ERLNFLBrainInput
): ERLNFLBrainResult {
  const homeTeam = buildTeamRating({
    team: input.game.home_team,
    side: "home",
    form: input.homeForm,
    quarterbacks: input.homeQuarterbacks,
    marketProbability:
      input.homeMarketProbability,
  });

  const awayTeam = buildTeamRating({
    team: input.game.away_team,
    side: "away",
    form: input.awayForm,
    quarterbacks: input.awayQuarterbacks,
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
   * Early point-margin estimate.
   * Later we can replace this with a calibrated
   * scoring-margin model.
   */
    /*
   * Conservative point-margin estimate.
   * ERL rating separation is not equivalent
   * to an NFL scoreboard margin.
   *
   * Keep this provisional until the model
   * is calibrated against completed games.
   */
  const projectedMargin = clamp(
    erlEdge * 0.3,
    0,
    14
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

    /*
   * Overall recommendation strength.
   *
   * Keep rating separation influential without
   * counting it so heavily that strong matchups
   * automatically saturate at 100.
   */
  const erlRating = clamp(
    preferred.powerRating * 0.65 +
      erlEdge * 0.45 +
      dataCompleteness * 0.1 -
      uncertainty * 0.1
  );

  const reasons = [
    `${preferred.team} has the stronger ERL NFL power rating.`,
    `ERL edge: +${erlEdge.toFixed(1)}.`,
    `Projected margin: ${projectedMargin.toFixed(1)} points.`,
  ];

  if (uncertainty >= 50) {
    reasons.push(
      "Missing or uncertain data reduces recommendation confidence."
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