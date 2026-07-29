export type WNBAMarketScoreInput = {
  homeTeam: string;
  awayTeam: string;

  homeMarketProbability: number;
  awayMarketProbability: number;

  bookmakerCount: number;
};

export type WNBAMarketScore = {
  preferredTeam: string;
  opponentTeam: string;

  preferredProbability: number;
  opponentProbability: number;

  probabilityEdge: number;
  score: number;

  confidence: "Low" | "Moderate" | "High";
  dataCompleteness: number;

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

export function scoreWNBAMarket(
  input: WNBAMarketScoreInput
): WNBAMarketScore {
  const {
    homeTeam,
    awayTeam,
    homeMarketProbability,
    awayMarketProbability,
    bookmakerCount,
  } = input;

  const homeIsPreferred =
    homeMarketProbability >=
    awayMarketProbability;

  const preferredTeam = homeIsPreferred
    ? homeTeam
    : awayTeam;

  const opponentTeam = homeIsPreferred
    ? awayTeam
    : homeTeam;

  const preferredProbability = homeIsPreferred
    ? homeMarketProbability
    : awayMarketProbability;

  const opponentProbability = homeIsPreferred
    ? awayMarketProbability
    : homeMarketProbability;

  const probabilityEdge =
    Math.abs(
      preferredProbability -
        opponentProbability
    ) * 100;

  /*
   * The initial WNBA score measures the strength
   * and verification of the current market signal.
   * It is not yet a historical team-performance model.
   */
  let score =
    45 + probabilityEdge * 0.8;

  const reasons: string[] = [];

  if (probabilityEdge >= 30) {
    reasons.push(
      `${preferredTeam} has a decisive market-implied advantage.`
    );
  } else if (probabilityEdge >= 18) {
    reasons.push(
      `${preferredTeam} has a strong market-implied advantage.`
    );
  } else if (probabilityEdge >= 8) {
    reasons.push(
      `${preferredTeam} has a moderate market-implied advantage.`
    );
  } else {
    reasons.push(
      "The current moneyline market indicates a close matchup."
    );
  }

  /*
   * Broad bookmaker coverage improves confidence
   * that the market signal is properly verified.
   */
  if (bookmakerCount >= 8) {
    score += 8;

    reasons.push(
      `The moneyline is verified across ${bookmakerCount} bookmakers.`
    );
  } else if (bookmakerCount >= 4) {
    score += 4;

    reasons.push(
      `The moneyline is available from ${bookmakerCount} bookmakers.`
    );
  } else {
    reasons.push(
      "Limited bookmaker coverage reduces confidence."
    );
  }

  /*
   * Small home-court influence. This does not
   * override the market-selected preferred team.
   */
  if (homeIsPreferred) {
    score += 2;

    reasons.push(
      `${homeTeam} also has home-court position.`
    );
  }

  const dataCompleteness = clamp(
    35 + Math.min(bookmakerCount * 6, 60)
  );

  /*
   * Confidence remains deliberately restricted
   * until WNBA form, injuries and rest context
   * are connected.
   */
  let confidence:
    WNBAMarketScore["confidence"] = "Low";

  if (
    probabilityEdge >= 25 &&
    bookmakerCount >= 8 &&
    dataCompleteness >= 80
  ) {
    confidence = "Moderate";
  }

  const finalScore = Math.round(
    clamp(score)
  );

  return {
    preferredTeam,
    opponentTeam,

    preferredProbability: Number(
      (preferredProbability * 100).toFixed(1)
    ),

    opponentProbability: Number(
      (opponentProbability * 100).toFixed(1)
    ),

    probabilityEdge: Number(
      probabilityEdge.toFixed(1)
    ),

    score: finalScore,
    confidence,
    dataCompleteness,
    reasons,
  };
}