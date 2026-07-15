export type NFLAlternateSpreadOutcome = {
  name: string;
  price: number;
  point: number;
};

export type NFLAlternateSpreadBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  outcomes: NFLAlternateSpreadOutcome[];
};

export type NFLAlternateSpreadSelection = {
  team: string;
  point: number;
  price: number;
  bookmaker: string;

  safetyScore: number;
  modelCushion: number;
  projectedTeamMargin: number;
};

export type NFLAlternateSpreadLeg =
  NFLAlternateSpreadSelection & {
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    erlScore: number;
    scoreGap: number;
  };

export type NFLAlternateSpreadParlay = {
  legs: NFLAlternateSpreadLeg[];
  combinedPrice: number;
};

export type NFLAlternateSpreadContext = {
  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;

  /**
   * Positive margin for the ERL-preferred team.
   * Example: 6.5 means the preferred team is
   * projected to win by approximately 6.5 points.
   */
  projectedMargin: number;

  erlRating: number;
  uncertainty: number;
  dataCompleteness: number;
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

export function formatNFLSpread(point: number) {
  return point > 0 ? `+${point}` : `${point}`;
}

function calculateSpreadSafety(params: {
  team: string;
  point: number;
  context: NFLAlternateSpreadContext;
}) {
  const isPreferredTeam =
    params.team === params.context.preferredTeam;

  /*
   * The preferred team receives a positive projected
   * margin. Its opponent receives the opposite margin.
   */
  const projectedTeamMargin = isPreferredTeam
    ? params.context.projectedMargin
    : -params.context.projectedMargin;

  /*
   * A spread is added to the projected margin.
   *
   * Projected margin +6 with a -3.5 line:
   * model cushion = +2.5.
   *
   * Projected margin -6 with a +10.5 line:
   * model cushion = +4.5.
   */
  const modelCushion =
    projectedTeamMargin + params.point;

  /*
   * Neutral cushion = 50.
   * Each projected point of protection changes the
   * protection component by five rating points.
   */
  const protectionScore = clamp(
    50 + modelCushion * 5
  );

  const teamStrengthScore = isPreferredTeam
    ? params.context.erlRating
    : clamp(
        params.context.erlRating -
          params.context.projectedMargin * 3
      );

  const certaintyScore = clamp(
    100 - params.context.uncertainty
  );

  const completenessScore = clamp(
    params.context.dataCompleteness
  );

  /*
   * Version 1 spread-safety weighting:
   *
   * Handicap protection:  50%
   * ERL team strength:     20%
   * Model certainty:       20%
   * Data completeness:     10%
   */
  const safetyScore = clamp(
    protectionScore * 0.5 +
      teamStrengthScore * 0.2 +
      certaintyScore * 0.2 +
      completenessScore * 0.1
  );

  return {
    safetyScore: Number(
      safetyScore.toFixed(1)
    ),

    modelCushion: Number(
      modelCushion.toFixed(1)
    ),

    projectedTeamMargin: Number(
      projectedTeamMargin.toFixed(1)
    ),
  };
}

export function findSafestAvailableSpread(
  bookmakers: NFLAlternateSpreadBookmaker[],
  context: NFLAlternateSpreadContext
): NFLAlternateSpreadSelection | null {
  const validTeams = new Set([
    context.homeTeam,
    context.awayTeam,
  ]);

  const availableSelections =
    bookmakers.flatMap((bookmaker) =>
      bookmaker.outcomes
        .filter(
          (outcome) =>
            validTeams.has(outcome.name) &&
            Number.isFinite(outcome.point) &&
            Number.isFinite(outcome.price) &&
            outcome.price > 1
        )
        .map((outcome) => {
          const safety =
            calculateSpreadSafety({
              team: outcome.name,
              point: outcome.point,
              context,
            });

          return {
            team: outcome.name,
            point: outcome.point,
            price: outcome.price,
            bookmaker: bookmaker.title,

            safetyScore:
              safety.safetyScore,

            modelCushion:
              safety.modelCushion,

            projectedTeamMargin:
              safety.projectedTeamMargin,
          };
        })
    );

  if (availableSelections.length === 0) {
    return null;
  }

  availableSelections.sort((a, b) => {
    if (b.safetyScore !== a.safetyScore) {
      return b.safetyScore - a.safetyScore;
    }

    if (b.modelCushion !== a.modelCushion) {
      return b.modelCushion - a.modelCushion;
    }

    return b.price - a.price;
  });

  return availableSelections[0];
}