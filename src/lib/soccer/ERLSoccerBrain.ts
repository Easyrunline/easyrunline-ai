import type { SoccerTeamForm } from "./soccerForm";

import {
  buildERLSoccerTeamRating,
  type ERLSoccerTeamRating,
} from "./soccerRating";

import {
  buildERLSoccerMatchRating,
  type ERLSoccerMatchRating,
} from "./soccerMatchRating";

export type ERLSoccerBrainInput = {
  eventId: string;

  homeTeam: string;
  awayTeam: string;

  homeMarketProbability: number;
  drawMarketProbability: number;
  awayMarketProbability: number;

  homeForm?: SoccerTeamForm | null;
  awayForm?: SoccerTeamForm | null;
};

export type ERLSoccerBrainResult = {
  eventId: string;

  homeTeam: string;
  awayTeam: string;

  homeTeamRating: ERLSoccerTeamRating;
  awayTeamRating: ERLSoccerTeamRating;

  matchRating: ERLSoccerMatchRating;

  preferredTeam: string;
  opponentTeam: string;

  erlRating: number;
  erlEdge: number;

  projectedMargin: number;

  confidence: "Low" | "Medium" | "High";

  upsetRisk: "Low" | "Medium" | "High";
  blowoutRisk: "Low" | "Medium" | "High";

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

export function runERLSoccerBrain(
  input: ERLSoccerBrainInput
): ERLSoccerBrainResult {
  const homeTeamRating =
    buildERLSoccerTeamRating({
      teamName: input.homeTeam,
      venue: "home",
      marketProbability:
        input.homeMarketProbability,
      form: input.homeForm ?? null,
    });

  const awayTeamRating =
    buildERLSoccerTeamRating({
      teamName: input.awayTeam,
      venue: "away",
      marketProbability:
        input.awayMarketProbability,
      form: input.awayForm ?? null,
    });

  const matchRating =
    buildERLSoccerMatchRating(
      homeTeamRating,
      awayTeamRating
    );

  const preferredRating =
    matchRating.preferredTeam === input.homeTeam
      ? homeTeamRating.powerRating
      : awayTeamRating.powerRating;

  const erlRating = clamp(
    preferredRating * 0.7 +
      matchRating.erlEdge * 1.5 +
      matchRating.dataCompleteness * 0.15
  );

  const avoid =
    matchRating.confidence === "Low" ||
    matchRating.uncertainty >= 60 ||
    matchRating.erlEdge < 5;

  const reasons: string[] = [
    ...matchRating.reasons,
  ];

  if (avoid) {
    reasons.push(
      "EasyRunLine classifies this matchup as a low-confidence or high-uncertainty opportunity."
    );
  } else {
    reasons.push(
      `${matchRating.preferredTeam} currently holds the stronger overall ERL profile.`
    );
  }

  return {
    eventId: input.eventId,

    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,

    homeTeamRating,
    awayTeamRating,

    matchRating,

    preferredTeam:
      matchRating.preferredTeam,

    opponentTeam:
      matchRating.opponentTeam,

    erlRating: Number(
      erlRating.toFixed(1)
    ),

    erlEdge:
      matchRating.erlEdge,

    projectedMargin:
      matchRating.projectedMargin,

    confidence:
      matchRating.confidence,

    upsetRisk:
      matchRating.upsetRisk,

    blowoutRisk:
      matchRating.blowoutRisk,

    uncertainty:
      matchRating.uncertainty,

    dataCompleteness:
      matchRating.dataCompleteness,

    avoid,

    reasons,
  };
}

export function runERLSoccerBrainForMatches(
  matches: ERLSoccerBrainInput[]
): ERLSoccerBrainResult[] {
  return matches
    .map(runERLSoccerBrain)
    .sort((a, b) => {
      if (b.erlRating !== a.erlRating) {
        return b.erlRating - a.erlRating;
      }

      return b.erlEdge - a.erlEdge;
    });
}