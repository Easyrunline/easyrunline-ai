export type ERLEdgeGrade =
  | "Very Close"
  | "Slight Edge"
  | "Strong Edge"
  | "Elite Edge"
  | "Major Mismatch";

export type ERLConfidence =
  | "Low"
  | "Moderate"
  | "High"
  | "Very High";

export type ERLRating = {
  score: number;
  opponentScore: number;
  edge: number;
  edgeGrade: ERLEdgeGrade;
  confidence: ERLConfidence;
  stars: number;
  starDisplay: string;
  summary: string;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getERLEdgeGrade(edge: number): ERLEdgeGrade {
  const absoluteEdge = Math.abs(edge);

  if (absoluteEdge >= 20) {
    return "Major Mismatch";
  }

  if (absoluteEdge >= 15) {
    return "Elite Edge";
  }

  if (absoluteEdge >= 10) {
    return "Strong Edge";
  }

  if (absoluteEdge >= 5) {
    return "Slight Edge";
  }

  return "Very Close";
}

export function getERLConfidence(
  score: number,
  edge: number
): ERLConfidence {
  const safeScore = clampScore(score);
  const absoluteEdge = Math.abs(edge);

  if (safeScore >= 90 && absoluteEdge >= 15) {
    return "Very High";
  }

  if (safeScore >= 80 && absoluteEdge >= 10) {
    return "High";
  }

  if (safeScore >= 65 && absoluteEdge >= 5) {
    return "Moderate";
  }

  return "Low";
}

export function getERLStars(score: number) {
  const safeScore = clampScore(score);

  if (safeScore >= 90) return 5;
  if (safeScore >= 80) return 4;
  if (safeScore >= 70) return 3;
  if (safeScore >= 60) return 2;

  return 1;
}

export function formatERLStars(stars: number) {
  const safeStars = Math.max(1, Math.min(5, stars));

  return `${"★".repeat(safeStars)}${"☆".repeat(
    5 - safeStars
  )}`;
}

export function getERLSummary(
  edgeGrade: ERLEdgeGrade
): string {
  switch (edgeGrade) {
    case "Major Mismatch":
      return "The selected team grades far above its opponent across the current EasyRunLine factors.";

    case "Elite Edge":
      return "The selected team holds a clear and substantial statistical advantage.";

    case "Strong Edge":
      return "The selected team grades significantly higher across offense, defense, recent form and situational factors.";

    case "Slight Edge":
      return "The selected team holds an advantage, but the matchup still carries meaningful risk.";

    case "Very Close":
      return "The teams grade closely, so the matchup may not offer a dependable betting edge.";
  }
}

export function buildERLRating(
  score: number,
  opponentScore: number
): ERLRating {
  const safeScore = clampScore(score);
  const safeOpponentScore = clampScore(opponentScore);
  const edge = safeScore - safeOpponentScore;
  const edgeGrade = getERLEdgeGrade(edge);
  const confidence = getERLConfidence(safeScore, edge);
  const stars = getERLStars(safeScore);

  return {
    score: safeScore,
    opponentScore: safeOpponentScore,
    edge,
    edgeGrade,
    confidence,
    stars,
    starDisplay: formatERLStars(stars),
    summary: getERLSummary(edgeGrade),
  };
}