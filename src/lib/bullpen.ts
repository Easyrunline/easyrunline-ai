export type BullpenResult = {
  score: number;
  reason: string;
};

export function calculateBullpenScore(
  underdogBullpenERA?: number,
  favoriteBullpenERA?: number
): BullpenResult {

  if (
    underdogBullpenERA === undefined ||
    favoriteBullpenERA === undefined
  ) {
    return {
      score: 0,
      reason: "Bullpen data unavailable",
    };
  }

  const difference = favoriteBullpenERA - underdogBullpenERA;

  if (difference >= 1.0) {
    return {
      score: 10,
      reason: "Underdog has the stronger bullpen",
    };
  }

  if (difference >= 0.5) {
    return {
      score: 6,
      reason: "Bullpen slightly favors the underdog",
    };
  }

  if (difference >= -0.3) {
    return {
      score: 2,
      reason: "Bullpens are evenly matched",
    };
  }

  if (difference >= -1.0) {
    return {
      score: -5,
      reason: "Favorite has the stronger bullpen",
    };
  }

  return {
    score: -10,
    reason: "Favorite bullpen is significantly stronger",
  };
}