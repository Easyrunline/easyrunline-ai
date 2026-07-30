export type WNBAFirstHalfTotalOutcome = {
  name: string;
  price: number;
  point: number;
};

export type WNBAFirstHalfTotalBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  outcomes: WNBAFirstHalfTotalOutcome[];
};

export type WNBAFirstHalfTotalSelection = {
  direction: "Over" | "Under";
  point: number;
  price: number;
  bookmaker: string;

  consensusPoint: number;
  lineDifference: number;

  marketAlignmentScore: number;
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

function getMedian(
  values: number[]
) {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [
    ...values,
  ].sort(
    (first, second) =>
      first - second
  );

  const middleIndex =
    Math.floor(
      sortedValues.length / 2
    );

  if (
    sortedValues.length % 2 ===
    0
  ) {
    return (
      sortedValues[middleIndex - 1] +
      sortedValues[middleIndex]
    ) / 2;
  }

  return sortedValues[middleIndex];
}

function getPriceProfile(
  price: number
): WNBAFirstHalfTotalSelection["priceProfile"] {
  if (price < 1.55) {
    return "Very Low Return";
  }

  if (price < 1.75) {
    return "Low Return";
  }

  return "Balanced Return";
}

function calculatePriceQuality(
  price: number
) {
  if (
    price >= 1.75 &&
    price <= 2.05
  ) {
    return 100;
  }

  if (
    price >= 1.6 &&
    price < 1.75
  ) {
    return 82;
  }

  if (
    price > 2.05 &&
    price <= 2.2
  ) {
    return 72;
  }

  return 35;
}

function calculateMarketAlignment(
  lineDifference: number
) {
  if (lineDifference <= 0.5) {
    return 100;
  }

  if (lineDifference <= 1) {
    return 88;
  }

  if (lineDifference <= 1.5) {
    return 72;
  }

  if (lineDifference <= 2) {
    return 55;
  }

  return 25;
}

export function findSafestWNBAFirstHalfTotal(
  bookmakers: WNBAFirstHalfTotalBookmaker[]
): WNBAFirstHalfTotalSelection | null {
  const validBookmakers =
    bookmakers.filter(
      (bookmaker) =>
        bookmaker.outcomes.some(
          (outcome) =>
            (outcome.name === "Over" ||
              outcome.name === "Under") &&
            Number.isFinite(
              outcome.point
            ) &&
            Number.isFinite(
              outcome.price
            )
        )
    );

  if (
    validBookmakers.length === 0
  ) {
    return null;
  }

  const visiblePoints =
    validBookmakers.flatMap(
      (bookmaker) =>
        bookmaker.outcomes
          .filter(
            (outcome) =>
              Number.isFinite(
                outcome.point
              )
          )
          .map(
            (outcome) =>
              outcome.point
          )
    );

  const consensusPoint =
    getMedian(visiblePoints);

  const selections =
    validBookmakers.flatMap(
      (bookmaker) =>
        bookmaker.outcomes
          .filter(
            (outcome) =>
              (outcome.name ===
                "Over" ||
                outcome.name ===
                  "Under") &&
              Number.isFinite(
                outcome.point
              ) &&
              Number.isFinite(
                outcome.price
              ) &&
              outcome.price >=
                1.55 &&
              outcome.price <=
                2.2
          )
          .map((outcome) => {
            const direction =
              outcome.name as
                | "Over"
                | "Under";

            const lineDifference =
              Math.abs(
                outcome.point -
                  consensusPoint
              );

            const marketAlignmentScore =
              calculateMarketAlignment(
                lineDifference
              );

            const priceQualityScore =
              calculatePriceQuality(
                outcome.price
              );

            const supportingBookmakers =
              validBookmakers.filter(
                (
                  candidateBookmaker
                ) =>
                  candidateBookmaker.outcomes.some(
                    (
                      candidateOutcome
                    ) =>
                      candidateOutcome.name ===
                        direction &&
                      Math.abs(
                        candidateOutcome.point -
                          outcome.point
                      ) <= 1 &&
                      candidateOutcome.price >=
                        1.45 &&
                      candidateOutcome.price <=
                        2.25
                  )
              ).length;

            const consensusScore =
              clamp(
                (supportingBookmakers /
                  Math.max(
                    validBookmakers.length,
                    1
                  )) *
                  100
              );

            const availabilityScore =
              clamp(
                (validBookmakers.length /
                  5) *
                  100
              );

            const safetyScore =
              Number(
                clamp(
                  marketAlignmentScore *
                    0.35 +
                    priceQualityScore *
                      0.25 +
                    consensusScore *
                      0.3 +
                    availabilityScore *
                      0.1
                ).toFixed(1)
              );

            const qualification:
              WNBAFirstHalfTotalSelection["qualification"] =
                safetyScore >= 78 &&
                marketAlignmentScore >=
                  72 &&
                priceQualityScore >=
                  72 &&
                supportingBookmakers >=
                  3 &&
                consensusScore >= 45
                  ? "LEAN"
                  : "PASS";

            const reasons = [
              `The market consensus first-half total is ${consensusPoint.toFixed(
  1
)}.`,
              `${direction} ${outcome.point} is ${lineDifference.toFixed(
                1
              )} points from the consensus line.`,
              `Verified price: ${outcome.price.toFixed(
                2
              )} with ${bookmaker.title}.`,
              `${supportingBookmakers} bookmakers support a comparable ${direction} first-half total.`,
            ];

            return {
              direction,
              point:
                outcome.point,
              price:
                outcome.price,
              bookmaker:
                bookmaker.title,

              consensusPoint:
                Number(
                  consensusPoint.toFixed(
                    1
                  )
                ),

              lineDifference:
                Number(
                  lineDifference.toFixed(
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
                  consensusScore.toFixed(
                    1
                  )
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
    );

  const qualifiedSelections =
    selections.filter(
      (selection) =>
        selection.qualification ===
        "LEAN"
    );

  if (
    qualifiedSelections.length ===
    0
  ) {
    return null;
  }

  qualifiedSelections.sort(
    (first, second) => {
      if (
        second.safetyScore !==
        first.safetyScore
      ) {
        return (
          second.safetyScore -
          first.safetyScore
        );
      }

      if (
        second.consensusScore !==
        first.consensusScore
      ) {
        return (
          second.consensusScore -
          first.consensusScore
        );
      }

      return (
  first.price -
  second.price
);
    }
  );

  return qualifiedSelections[0];
}