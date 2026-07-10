export type RecentFormResult = {
  score: number;
  reason: string;
};

export function calculateRecentFormScore(
  underdogWinsLast10?: number,
  favoriteWinsLast10?: number
): RecentFormResult {
  if (
    underdogWinsLast10 === undefined ||
    favoriteWinsLast10 === undefined
  ) {
    return {
      score: 0,
      reason: "Recent form data unavailable",
    };
  }

  const formDifference = underdogWinsLast10 - favoriteWinsLast10;

  if (formDifference >= 4) {
    return {
      score: 10,
      reason: "Underdog is in significantly better recent form",
    };
  }

  if (formDifference >= 2) {
    return {
      score: 7,
      reason: "Underdog has the stronger recent form",
    };
  }

  if (formDifference >= 0) {
    return {
      score: 3,
      reason: "Underdog recent form is competitive",
    };
  }

  if (formDifference >= -2) {
    return {
      score: -4,
      reason: "Favorite has a modest recent-form advantage",
    };
  }

  return {
    score: -10,
    reason: "Underdog is in considerably weaker recent form",
  };
}