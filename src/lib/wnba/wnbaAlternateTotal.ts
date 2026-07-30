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
};

export type WNBAAlternateTotalSelection = {
  direction: "Over" | "Under";
  point: number;
  price: number;
  bookmaker: string;

  standardTotalPoint: number;
  protectionPoints: number;

  protectionScore: number;
  priceQualityScore: number;
  consensusScore: number;
  availabilityScore: number;
  safetyScore: number;

  supportingBookmakers: number;
  qualification: "LEAN" | "PASS";

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

export function findSafestWNBAAlternateTotal(
  bookmakers: WNBAAlternateTotalBookmaker[],
  context: WNBAAlternateTotalContext
): WNBAAlternateTotalSelection | null {
  if (
    !Number.isFinite(
      context.standardTotalPoint
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

          const qualification:
            WNBAAlternateTotalSelection["qualification"] =
              safetyScore >= 80 &&
              protectionPoints >= 5 &&
              protectionScore >= 67 &&
              priceQualityScore >= 70 &&
              supportingBookmakers >= 3 &&
              consensusScore >= 45
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

  const qualifiedSelections =
    selections.filter(
      (selection) =>
        selection.qualification ===
        "LEAN"
    );

  if (
    qualifiedSelections.length === 0
  ) {
    return null;
  }

  qualifiedSelections.sort((a, b) => {
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

  return qualifiedSelections[0];
}