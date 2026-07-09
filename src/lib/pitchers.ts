export function calculatePitcherScore(
  underdogERA?: number,
  favoriteERA?: number
) {
  if (
    underdogERA === undefined ||
    favoriteERA === undefined
  ) {
    return {
      score: 0,
      reason: "Starting pitcher data unavailable",
    };
  }

  const diff = favoriteERA - underdogERA;

  if (diff >= 1.5) {
    return {
      score: 12,
      reason: "Underdog has a significant pitching advantage",
    };
  }

  if (diff >= 0.75) {
    return {
      score: 8,
      reason: "Underdog has the stronger starting pitcher",
    };
  }

  if (diff >= -0.5) {
    return {
      score: 2,
      reason: "Pitching matchup is relatively even",
    };
  }

  if (diff >= -1.25) {
    return {
      score: -8,
      reason: "Favorite has the stronger starting pitcher",
    };
  }

  return {
    score: -12,
    reason: "Major pitching disadvantage for the underdog",
  };
}