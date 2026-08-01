export type WNBAAlternateSpreadOutcome = {
  name: string;
  price: number;
  point: number;
};

export type WNBAAlternateSpreadBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  outcomes: WNBAAlternateSpreadOutcome[];
};

export type WNBAAlternateSpreadContext = {
  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;

  erlScore: number;
  probabilityEdge: number;
  confidence: "Low" | "Moderate" | "High";
  dataCompleteness: number;
  bookmakerCount: number;
  avoid: boolean;
};

export type WNBAAlternateSpreadSelection = {
  team: string;
  point: number;
  price: number;
  bookmaker: string;

  protectionScore: number;
  marketAlignmentScore: number;
  priceQualityScore: number;
    safetyScore: number;

  qualification:
  | "STRONG PLAY"
  | "PLAY"
  | "LEAN"
  | "PASS";

  alignedWithPreferredTeam: boolean;
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

export function formatWNBASpread(
  point: number
) {
  return point > 0
    ? `+${point}`
    : `${point}`;
}

function getPriceProfile(
  price: number
): WNBAAlternateSpreadSelection["priceProfile"] {
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
  /*
   * Prices below 1.35 provide very little return.
   * Prices above 1.90 provide less market protection.
   * The preferred safety range is approximately
   * 1.45 to 1.75.
   */
  if (price >= 1.45 && price <= 1.75) {
    return 100;
  }

  if (price >= 1.35 && price < 1.45) {
    return 82;
  }

  if (price > 1.75 && price <= 1.85) {
    return 78;
  }

  if (price >= 1.25 && price < 1.35) {
    return 52;
  }

  if (price > 1.85 && price <= 2) {
    return 45;
  }

  return 20;
}

function calculateProtectionScore(
  point: number
) {
  /*
   * Positive alternate spreads provide protection.
   * The influence is capped so very large lines
   * cannot automatically receive a perfect score.
   */
  if (point <= 0) {
    return clamp(
      35 + point * 3
    );
  }

  return clamp(
    45 + Math.min(point, 15) * 3.5
  );
}

function calculateMarketAlignmentScore(
  team: string,
  context: WNBAAlternateSpreadContext
) {
  const isPreferredTeam =
    team === context.preferredTeam;

  if (isPreferredTeam) {
    return clamp(
      55 +
        context.probabilityEdge * 0.8 +
        context.erlScore * 0.2
    );
  }

  /*
   * An underdog may still qualify when receiving
   * substantial protection, but it does not receive
   * the preferred-team alignment bonus.
   */
  return clamp(
    42 -
      context.probabilityEdge * 0.25 +
      context.erlScore * 0.1
  );
}

export function findSafestWNBAAvailableSpread(
  bookmakers: WNBAAlternateSpreadBookmaker[],
  context: WNBAAlternateSpreadContext
): WNBAAlternateSpreadSelection | null {
  const validTeams = new Set([
    context.homeTeam,
    context.awayTeam,
  ]);

  const selections =
    bookmakers.flatMap((bookmaker) =>
      bookmaker.outcomes
        .filter(
          (outcome) =>
            validTeams.has(outcome.name) &&
            Number.isFinite(outcome.point) &&
            Number.isFinite(outcome.price) &&
            outcome.price >= 1.35 &&
            outcome.price <= 1.85
        )
        .map((outcome) => {
          const alignedWithPreferredTeam =
            outcome.name ===
            context.preferredTeam;

          const protectionScore =
            calculateProtectionScore(
              outcome.point
            );

          const marketAlignmentScore =
            calculateMarketAlignmentScore(
              outcome.name,
              context
            );

          const priceQualityScore =
            calculatePriceQuality(
              outcome.price
            );

          const completenessScore =
            clamp(
              context.dataCompleteness
            );

          /*
           * Initial WNBA alternate-spread weighting:
           *
           * Handicap protection:  40%
           * Market alignment:      25%
           * Price quality:         20%
           * Data completeness:     15%
           */
          let safetyScore =
            protectionScore * 0.4 +
            marketAlignmentScore * 0.25 +
            priceQualityScore * 0.2 +
            completenessScore * 0.15;

          if (context.avoid) {
            safetyScore -= 8;
          }

                    if (
            context.confidence === "Low"
          ) {
            safetyScore -= 10;
          }

          const finalSafetyScore =
            Number(
              clamp(
                safetyScore
              ).toFixed(1)
            );

          const qualifiesAsStrongPlay =
  !context.avoid &&
  context.confidence === "High" &&
  finalSafetyScore >= 88 &&
  protectionScore >= 80 &&
  marketAlignmentScore >= 60 &&
  priceQualityScore >= 75 &&
  completenessScore >= 75;

const qualifiesAsPlay =
  !context.avoid &&
  context.confidence !== "Low" &&
  finalSafetyScore >= 82 &&
  protectionScore >= 75 &&
  marketAlignmentScore >= 50 &&
  priceQualityScore >= 65 &&
  completenessScore >= 65;

const qualifiesAsLean =
  !context.avoid &&
  context.confidence !== "Low" &&
  finalSafetyScore >= 75 &&
  protectionScore >= 75 &&
  marketAlignmentScore >= 38 &&
  priceQualityScore >= 50 &&
  completenessScore >= 60;

const qualification:
  WNBAAlternateSpreadSelection["qualification"] =
    qualifiesAsStrongPlay
      ? "STRONG PLAY"
      : qualifiesAsPlay
        ? "PLAY"
        : qualifiesAsLean
          ? "LEAN"
          : "PASS";

          const reasons = [
            `${outcome.name} is available at ${formatWNBASpread(
              outcome.point
            )}.`,
            `Verified price: ${outcome.price.toFixed(
              2
            )} with ${bookmaker.title}.`,
          ];

          if (alignedWithPreferredTeam) {
            reasons.push(
              `${outcome.name} is the current EasyRunLine preferred team.`
            );
          } else {
            reasons.push(
              `${outcome.name} is not the current EasyRunLine preferred team; the handicap protection is being evaluated separately.`
            );
          }

          if (context.confidence === "Low") {
            reasons.push(
              "Current matchup confidence is Low, so the selection remains safety-oriented rather than a high-confidence recommendation."
            );
          }
          if (qualification === "STRONG PLAY") {
  reasons.push(
    "The selection satisfies the strongest current line-protection, market-alignment, price-quality and matchup-confidence requirements."
  );
}

if (qualification === "PLAY") {
  reasons.push(
    "The selection satisfies the full EasyRunLine play requirements, although it remains below the strongest-play standard."
  );
}
if (qualification === "STRONG PLAY") {
  reasons.push(
    "The selection satisfies the strongest current line-protection, market-alignment, price-quality and matchup-confidence requirements."
  );
}

if (qualification === "PLAY") {
  reasons.push(
    "The selection satisfies the full EasyRunLine play requirements, although it remains below the strongest-play standard."
  );
}
          if (qualification === "LEAN") {
  reasons.push(
    "The available handicap provides meaningful line protection, but matchup alignment is not strong enough for a full EasyRunLine play."
  );
}

if (qualification === "PASS") {
  reasons.push(
    "The selection does not currently satisfy enough combined protection, alignment and confidence requirements for an EasyRunLine play."
  );
}

          return {
            team: outcome.name,
            point: outcome.point,
            price: outcome.price,
            bookmaker:
              bookmaker.title,

            protectionScore: Number(
              protectionScore.toFixed(1)
            ),

            marketAlignmentScore:
              Number(
                marketAlignmentScore.toFixed(
                  1
                )
              ),

            priceQualityScore: Number(
              priceQualityScore.toFixed(1)
            ),

                        safetyScore:
              finalSafetyScore,

            qualification,

            alignedWithPreferredTeam,
            priceProfile:
              getPriceProfile(
                outcome.price
              ),

            reasons,
          };
        })
    );

   if (selections.length === 0) {
  return null;
}

const qualificationRank: Record<
  WNBAAlternateSpreadSelection["qualification"],
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

  if (b.protectionScore !== a.protectionScore) {
    return (
      b.protectionScore -
      a.protectionScore
    );
  }

  return b.price - a.price;
});

return selections[0];
}