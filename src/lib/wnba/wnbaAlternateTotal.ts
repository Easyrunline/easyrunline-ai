export type WNBAAlternateTotalOutcome = {
  name: string;
  price: number;
  point: number;
};

export type WNBAAlternateTotalBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  outcomes: WNBAAlternateTotalOutcome[];
};

export type WNBAAlternateTotalContext = {
  standardTotalPoint: number;
  standardOverPrice: number;
  standardUnderPrice: number;
};

export type WNBAAlternateTotalSelection = {
  direction: "Over" | "Under";
  point: number;
  price: number;
  bookmaker: string;

  standardTotalPoint: number;
  protectionPoints: number;

  protectionScore: number;
  marketAlignmentScore: number;
  priceQualityScore: number;
  consensusScore: number;
  availabilityScore: number;
  safetyScore: number;

  supportingBookmakers: number;
  qualification:
  | "STRONG PLAY"
  | "PLAY"
  | "LEAN"
  | "PASS";

  priceProfile:
    | "Very Low Return"
    | "Low Return"
    | "Balanced Return";

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

function getPriceProfile(
  price: number
): WNBAAlternateTotalSelection["priceProfile"] {
  if (price < 1.35) {
    return "Very Low Return";
  }

  if (price < 1.55) {
    return "Low Return";
  }

  return "Balanced Return";
}

function calculatePriceQuality(
  price: number
) {
  if (
    price >= 1.45 &&
    price <= 1.75
  ) {
    return 100;
  }

  if (
    price >= 1.35 &&
    price < 1.45
  ) {
    return 75;
  }

  if (
    price > 1.75 &&
    price <= 1.85
  ) {
    return 72;
  }

  return 20;
}

function calculateProtectionPoints(
  direction: "Over" | "Under",
  alternatePoint: number,
  standardPoint: number
) {
  if (direction === "Under") {
    return alternatePoint - standardPoint;
  }

  return standardPoint - alternatePoint;
}

function calculateProtectionScore(
  protectionPoints: number
) {
  if (protectionPoints <= 0) {
    return 0;
  }

  return clamp(
    35 +
      Math.min(
        protectionPoints,
        10
      ) *
        6.5
  );
}

function calculateMarketAlignment(
  direction: "Over" | "Under",
  overPrice: number,
  underPrice: number
) {
  if (
    !Number.isFinite(overPrice) ||
    !Number.isFinite(underPrice) ||
    overPrice <= 1 ||
    underPrice <= 1
  ) {
    return 0;
  }

  const rawOverProbability =
    1 / overPrice;

  const rawUnderProbability =
    1 / underPrice;

  const probabilityTotal =
    rawOverProbability +
    rawUnderProbability;

  if (probabilityTotal <= 0) {
    return 0;
  }

  const overProbability =
    (rawOverProbability /
      probabilityTotal) *
    100;

  const underProbability =
    (rawUnderProbability /
      probabilityTotal) *
    100;

  return clamp(
    direction === "Over"
      ? overProbability
      : underProbability
  );
}

export function findSafestWNBAAlternateTotal(
  bookmakers: WNBAAlternateTotalBookmaker[],
  context: WNBAAlternateTotalContext
): WNBAAlternateTotalSelection | null {
  if (
  !Number.isFinite(
    context.standardTotalPoint
  ) ||
  !Number.isFinite(
    context.standardOverPrice
  ) ||
  !Number.isFinite(
    context.standardUnderPrice
  )
) {
  return null;
}

  const selections =
    bookmakers.flatMap((bookmaker) =>
      bookmaker.outcomes
        .filter(
          (outcome) =>
            (outcome.name === "Over" ||
              outcome.name === "Under") &&
            Number.isFinite(
              outcome.point
            ) &&
            Number.isFinite(
              outcome.price
            ) &&
            outcome.price >= 1.35 &&
            outcome.price <= 1.85
        )
        .map((outcome) => {
          const direction =
            outcome.name as
              | "Over"
              | "Under";

          const protectionPoints =
            calculateProtectionPoints(
              direction,
              outcome.point,
              context.standardTotalPoint
            );

          if (protectionPoints < 2) {
            return null;
          }

          const protectionScore =
            calculateProtectionScore(
              protectionPoints
            );

            const marketAlignmentScore =
  calculateMarketAlignment(
    direction,
    context.standardOverPrice,
    context.standardUnderPrice
  );

          const priceQualityScore =
            calculatePriceQuality(
              outcome.price
            );

          const supportingBookmakers =
            bookmakers.filter(
              (candidateBookmaker) =>
                candidateBookmaker.outcomes.some(
                  (candidateOutcome) =>
                    candidateOutcome.name ===
                      direction &&
                    Math.abs(
                      candidateOutcome.point -
                        outcome.point
                    ) <= 1 &&
                    candidateOutcome.price >=
                      1.25 &&
                    candidateOutcome.price <=
                      2
                )
            ).length;

          const consensusScore =
            clamp(
              (supportingBookmakers /
                Math.max(
                  bookmakers.length,
                  1
                )) *
                100
            );

          const availabilityScore =
            clamp(
              (bookmakers.length / 5) *
                100
            );

          const safetyScore =
            Number(
              clamp(
                protectionScore * 0.4 +
                  priceQualityScore *
                    0.25 +
                  consensusScore * 0.25 +
                  availabilityScore *
                    0.1
              ).toFixed(1)
            );

          const qualifiesAsStrongPlay =
  safetyScore >= 90 &&
  protectionPoints >= 7 &&
  protectionScore >= 80 &&
  priceQualityScore >= 75 &&
  supportingBookmakers >= 4 &&
  consensusScore >= 65;

const qualifiesAsPlay =
  safetyScore >= 84 &&
  protectionPoints >= 5 &&
  protectionScore >= 67 &&
  priceQualityScore >= 70 &&
  supportingBookmakers >= 3 &&
  consensusScore >= 50;

const qualifiesAsLean =
  safetyScore >= 74 &&
  protectionPoints >= 3 &&
  protectionScore >= 54 &&
  priceQualityScore >= 50 &&
  supportingBookmakers >= 2 &&
  consensusScore >= 35;

const qualification:
  WNBAAlternateTotalSelection["qualification"] =
    qualifiesAsStrongPlay
      ? "STRONG PLAY"
      : qualifiesAsPlay
        ? "PLAY"
        : qualifiesAsLean
          ? "LEAN"
          : "PASS";

          const reasons = [
            `The visible standard total is ${context.standardTotalPoint}.`,
            `${direction} ${outcome.point} provides ${protectionPoints.toFixed(
              1
            )} points of alternate-line protection.`,
            `Verified price: ${outcome.price.toFixed(
              2
            )} with ${bookmaker.title}.`,
            `${supportingBookmakers} bookmakers support a comparable ${direction} line.`,
          ];

          return {
            direction,
            point: outcome.point,
            price: outcome.price,
            bookmaker:
              bookmaker.title,

            standardTotalPoint:
              context.standardTotalPoint,

            protectionPoints:
              Number(
                protectionPoints.toFixed(
                  1
                )
              ),

            protectionScore:
              Number(
                protectionScore.toFixed(
                  1
                )
              ),
              marketAlignmentScore:
  Number(
    marketAlignmentScore.toFixed(
      1
    )
  ),

            priceQualityScore:
              Number(
                priceQualityScore.toFixed(
                  1
                )
              ),

            consensusScore:
              Number(
                consensusScore.toFixed(1)
              ),

            availabilityScore:
              Number(
                availabilityScore.toFixed(
                  1
                )
              ),

            safetyScore,
            supportingBookmakers,
            qualification,

            priceProfile:
              getPriceProfile(
                outcome.price
              ),

            reasons,
          };
        })
        .filter(
          (
            selection
          ): selection is WNBAAlternateTotalSelection =>
            selection !== null
        )
    );

  if (selections.length === 0) {
  return null;
}

const qualificationRank: Record<
  WNBAAlternateTotalSelection["qualification"],
  number
> = {
  "STRONG PLAY": 4,
  PLAY: 3,
  LEAN: 2,
  PASS: 1,
};

selections.sort((a, b) => {
  const verdictDifference =
    qualificationRank[b.qualification] -
    qualificationRank[a.qualification];

  if (verdictDifference !== 0) {
    return verdictDifference;
  }

  if (b.safetyScore !== a.safetyScore) {
    return b.safetyScore - a.safetyScore;
  }

  if (
    b.protectionPoints !==
    a.protectionPoints
  ) {
    return (
      b.protectionPoints -
      a.protectionPoints
    );
  }

  return b.price - a.price;
});

return selections[0];
}