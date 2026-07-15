export type NBAAlternateSpreadOutcome = {
  name: string;
  price: number;
  point: number;
};

export type NBAAlternateSpreadBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  outcomes: NBAAlternateSpreadOutcome[];
};

export type NBAAlternateSpreadSelection = {
  team: string;
  point: number;
  price: number;
  bookmaker: string;

  safetyScore: number;
  modelCushion: number;
  projectedTeamMargin: number;
};

export type NBAAlternateSpreadLeg =
  NBAAlternateSpreadSelection & {
    eventId: string;
    homeTeam: string;
    awayTeam: string;

    erlScore: number;
    scoreGap: number;
  };

export type NBAAlternateSpreadParlay = {
  legs: NBAAlternateSpreadLeg[];
  combinedPrice: number;
};

export type NBAAlternateSpreadContext = {
  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;

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

export function formatNBASpread(point: number) {
  return point > 0 ? `+${point}` : `${point}`;
}

function calculateNBASpreadSafety(params: {
  team: string;
  point: number;
  context: NBAAlternateSpreadContext;
}) {
  const isPreferredTeam =
    params.team === params.context.preferredTeam;

  const projectedTeamMargin = isPreferredTeam
    ? params.context.projectedMargin
    : -params.context.projectedMargin;

  const modelCushion =
    projectedTeamMargin + params.point;

  /*
   * NBA margins move more frequently than NFL
   * margins, so every point of cushion carries
   * slightly less weight than in the NFL model.
   */
  const protectionScore = clamp(
    50 + modelCushion * 4
  );

  const teamStrengthScore = isPreferredTeam
    ? params.context.erlRating
    : clamp(
        params.context.erlRating -
          params.context.projectedMargin * 2.5
      );

  const certaintyScore = clamp(
    100 - params.context.uncertainty
  );

  const completenessScore = clamp(
    params.context.dataCompleteness
  );

  /*
   * Version 1 NBA spread-safety weighting:
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

export function findSafestNBAAvailableSpread(
  bookmakers: NBAAlternateSpreadBookmaker[],
  context: NBAAlternateSpreadContext
): NBAAlternateSpreadSelection | null {
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
            calculateNBASpreadSafety({
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