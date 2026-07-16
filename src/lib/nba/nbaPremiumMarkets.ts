export type NBAPremiumMarketKey =
  | "alternate_spreads_q1"
  | "alternate_spreads_h1"
  | "alternate_totals"
  | "alternate_totals_h1";

export type NBAPremiumMarketOutcome = {
  name: string;
  description: string | null;
  price: number;
  point: number | null;
};

export type NBAPremiumMarket = {
  key: NBAPremiumMarketKey;
  lastUpdate: string | null;
  outcomes: NBAPremiumMarketOutcome[];
};

export type NBAPremiumMarketBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  markets: NBAPremiumMarket[];
};

export type NBAPremiumMarketResponse = {
  eventId: string;

  homeTeam: string | null;
  awayTeam: string | null;

  requestedMarkets: string[];
  returnedMarketKeys: string[];
  unavailableMarkets: string[];

  available: boolean;
  bookmakerCount: number;

  bookmakers: NBAPremiumMarketBookmaker[];

  message?: string | null;
  error?: string;
};

export type NBAPremiumSelection = {
  eventId: string;

  marketKey: NBAPremiumMarketKey;
  marketLabel: string;

  selection: string;
  team: string | null;

  point: number;
  price: number;
  bookmaker: string;

  safetyScore: number;
  modelCushion: number;

  projectedMargin: number | null;
  projectedTotal: number | null;

  reasons: string[];
};

export type NBAPremiumMarketContext = {
  eventId: string;

  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;

  erlRating: number;
  projectedMargin: number;

  /*
   * This remains optional until the NBA total
   * projection model is connected.
   */
  projectedTotal?: number;

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

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function getNBAPremiumMarketLabel(
  marketKey: NBAPremiumMarketKey
) {
  switch (marketKey) {
    case "alternate_spreads_q1":
      return "Best Q1 Spread";

    case "alternate_spreads_h1":
      return "Best First-Half Spread";

    case "alternate_totals":
      return "Best Alternate Total";

    case "alternate_totals_h1":
      return "Best First-Half Total";
  }
}

function isSpreadMarket(
  marketKey: NBAPremiumMarketKey
) {
  return (
    marketKey === "alternate_spreads_q1" ||
    marketKey === "alternate_spreads_h1"
  );
}

function getPeriodMarginFactor(
  marketKey: NBAPremiumMarketKey
) {
  if (marketKey === "alternate_spreads_q1") {
    return 0.25;
  }

  if (marketKey === "alternate_spreads_h1") {
    return 0.5;
  }

  return 1;
}

function calculateSpreadSelection(params: {
  marketKey: NBAPremiumMarketKey;
  outcome: NBAPremiumMarketOutcome;
  bookmaker: NBAPremiumMarketBookmaker;
  context: NBAPremiumMarketContext;
}): NBAPremiumSelection | null {
  if (
    params.outcome.point === null ||
    !Number.isFinite(params.outcome.point) ||
    !Number.isFinite(params.outcome.price) ||
    params.outcome.price <= 1
  ) {
    return null;
  }

  const team =
    params.outcome.description ||
    params.outcome.name;

  if (
    team !== params.context.homeTeam &&
    team !== params.context.awayTeam
  ) {
    return null;
  }

  const periodFactor = getPeriodMarginFactor(
    params.marketKey
  );

  const periodProjectedMargin =
    params.context.projectedMargin *
    periodFactor;

  const teamIsPreferred =
    team === params.context.preferredTeam;

  const projectedTeamMargin =
    teamIsPreferred
      ? periodProjectedMargin
      : -periodProjectedMargin;

  const modelCushion =
    projectedTeamMargin +
    params.outcome.point;

  /*
   * Period spreads naturally have smaller margins,
   * so each cushion point receives greater weight.
   */
  const protectionMultiplier =
    params.marketKey ===
    "alternate_spreads_q1"
      ? 8
      : 6;

  const protectionScore = clamp(
    50 +
      modelCushion *
        protectionMultiplier
  );

  const certaintyScore = clamp(
    100 -
      params.context.uncertainty
  );

  const teamStrengthScore =
    teamIsPreferred
      ? params.context.erlRating
      : clamp(
          params.context.erlRating -
            params.context.projectedMargin *
              2.5
        );

  const safetyScore = clamp(
    protectionScore * 0.5 +
      teamStrengthScore * 0.2 +
      certaintyScore * 0.2 +
      params.context.dataCompleteness *
        0.1
  );

  return {
    eventId: params.context.eventId,

    marketKey: params.marketKey,
    marketLabel:
      getNBAPremiumMarketLabel(
        params.marketKey
      ),

    selection: `${team} ${formatSigned(
      params.outcome.point
    )}`,

    team,

    point: params.outcome.point,
    price: params.outcome.price,
    bookmaker:
      params.bookmaker.title,

    safetyScore: Number(
      safetyScore.toFixed(1)
    ),

    modelCushion: Number(
      modelCushion.toFixed(1)
    ),

    projectedMargin: Number(
      projectedTeamMargin.toFixed(1)
    ),

    projectedTotal: null,

    reasons: [
      `Period-adjusted projected margin: ${formatSigned(
        projectedTeamMargin
      )}.`,
      `Handicap protection cushion: ${formatSigned(
        modelCushion
      )}.`,
      `ERL data completeness: ${params.context.dataCompleteness.toFixed(
        0
      )}%.`,
    ],
  };
}

function calculateTotalSelection(params: {
  marketKey: NBAPremiumMarketKey;
  outcome: NBAPremiumMarketOutcome;
  bookmaker: NBAPremiumMarketBookmaker;
  context: NBAPremiumMarketContext;
}): NBAPremiumSelection | null {
  if (
    params.outcome.point === null ||
    !Number.isFinite(params.outcome.point) ||
    !Number.isFinite(params.outcome.price) ||
    params.outcome.price <= 1
  ) {
    return null;
  }

  /*
   * Do not invent a total recommendation when the
   * ERL NBA Brain has no projected-total number.
   */
  if (
    !Number.isFinite(
      params.context.projectedTotal
    )
  ) {
    return null;
  }

  const projectedTotal =
    params.context.projectedTotal as number;

  const isOver =
    params.outcome.name
      .trim()
      .toLowerCase() === "over";

  const isUnder =
    params.outcome.name
      .trim()
      .toLowerCase() === "under";

  if (!isOver && !isUnder) {
    return null;
  }

  const modelDifference = isOver
    ? projectedTotal -
      params.outcome.point
    : params.outcome.point -
      projectedTotal;

  const protectionScore = clamp(
    50 + modelDifference * 4
  );

  const certaintyScore = clamp(
    100 -
      params.context.uncertainty
  );

  const safetyScore = clamp(
    protectionScore * 0.6 +
      certaintyScore * 0.2 +
      params.context.dataCompleteness *
        0.2
  );

  return {
    eventId: params.context.eventId,

    marketKey: params.marketKey,
    marketLabel:
      getNBAPremiumMarketLabel(
        params.marketKey
      ),

    selection: `${params.outcome.name} ${params.outcome.point}`,

    team: null,

    point: params.outcome.point,
    price: params.outcome.price,
    bookmaker:
      params.bookmaker.title,

    safetyScore: Number(
      safetyScore.toFixed(1)
    ),

    modelCushion: Number(
      modelDifference.toFixed(1)
    ),

    projectedMargin: null,

    projectedTotal: Number(
      projectedTotal.toFixed(1)
    ),

    reasons: [
      `ERL projected total: ${projectedTotal.toFixed(
        1
      )}.`,
      `Market line: ${params.outcome.point.toFixed(
        1
      )}.`,
      `Model separation: ${modelDifference.toFixed(
        1
      )} points.`,
    ],
  };
}

export function findSafestNBAPremiumMarket(
  bookmakers: NBAPremiumMarketBookmaker[],
  marketKey: NBAPremiumMarketKey,
  context: NBAPremiumMarketContext
): NBAPremiumSelection | null {
  const selections =
    bookmakers.flatMap((bookmaker) => {
      const market =
        bookmaker.markets.find(
          (item) =>
            item.key === marketKey
        );

      if (!market) {
        return [];
      }

      return market.outcomes
        .map((outcome) =>
          isSpreadMarket(marketKey)
            ? calculateSpreadSelection({
                marketKey,
                outcome,
                bookmaker,
                context,
              })
            : calculateTotalSelection({
                marketKey,
                outcome,
                bookmaker,
                context,
              })
        )
        .filter(
          (
            selection
          ): selection is NBAPremiumSelection =>
            selection !== null
        );
    });

  if (selections.length === 0) {
    return null;
  }

  selections.sort((a, b) => {
    if (
      b.safetyScore !==
      a.safetyScore
    ) {
      return (
        b.safetyScore -
        a.safetyScore
      );
    }

    if (
      b.modelCushion !==
      a.modelCushion
    ) {
      return (
        b.modelCushion -
        a.modelCushion
      );
    }

    return b.price - a.price;
  });

  return selections[0];
}