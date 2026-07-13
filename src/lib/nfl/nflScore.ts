import type { NFLTeamForm } from "./nflTypes";

export type NFLTeamScore = {
  team: string;
  score: number;
  confidence: "Low" | "Moderate" | "High";
  reasons: string[];
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getWinPercentage(wins?: number, losses?: number) {
  const total = (wins ?? 0) + (losses ?? 0);

  if (total === 0) {
    return 0.5;
  }

  return (wins ?? 0) / total;
}

export function scoreNFLTeam(
  form: NFLTeamForm | undefined,
  teamName: string,
  isHomeTeam: boolean
): NFLTeamScore {
  if (!form) {
    return {
      team: teamName,
      score: 50,
      confidence: "Low",
      reasons: ["Limited team data available"],
    };
  }

  let score = 50;
  const reasons: string[] = [];

  const lastFiveWinRate = getWinPercentage(
    form.winsLast5,
    form.lossesLast5
  );

  const lastTenWinRate = getWinPercentage(
    form.winsLast10,
    form.lossesLast10
  );

  const locationWinRate = isHomeTeam
    ? getWinPercentage(
        form.homeWinsLast10,
        form.homeLossesLast10
      )
    : getWinPercentage(
        form.awayWinsLast10,
        form.awayLossesLast10
      );

  const pointsFor =
    form.averagePointsForLast10 ?? 0;

  const pointsAgainst =
    form.averagePointsAgainstLast10 ?? 0;

  const pointDifferential = pointsFor - pointsAgainst;

  // Recent five-game form: maximum influence ±12.
  score += (lastFiveWinRate - 0.5) * 24;

  if (lastFiveWinRate >= 0.7) {
    reasons.push("Strong last-five form");
  } else if (lastFiveWinRate <= 0.3) {
    reasons.push("Weak last-five form");
  }

  // Ten-game form: maximum influence ±10.
  score += (lastTenWinRate - 0.5) * 20;

  if (lastTenWinRate >= 0.7) {
    reasons.push("Strong ten-game record");
  } else if (lastTenWinRate <= 0.3) {
    reasons.push("Poor ten-game record");
  }

  // Home or away performance: maximum influence ±8.
  score += (locationWinRate - 0.5) * 16;

  if (locationWinRate >= 0.7) {
    reasons.push(
      isHomeTeam
        ? "Strong home performance"
        : "Strong away performance"
    );
  } else if (locationWinRate <= 0.3) {
    reasons.push(
      isHomeTeam
        ? "Weak home performance"
        : "Weak away performance"
    );
  }

  // Point differential: capped to prevent one metric dominating.
  const differentialAdjustment = Math.max(
    -15,
    Math.min(15, pointDifferential)
  );

  score += differentialAdjustment;

  if (pointDifferential >= 7) {
    reasons.push("Strong positive scoring differential");
  } else if (pointDifferential <= -7) {
    reasons.push("Poor scoring differential");
  }

  // Small home-field advantage.
  if (isHomeTeam) {
    score += 3;
    reasons.push("Home-field advantage");
  }

  const finalScore = clampScore(score);

  let confidence: NFLTeamScore["confidence"] = "Low";

  if (finalScore >= 75) {
    confidence = "High";
  } else if (finalScore >= 60) {
    confidence = "Moderate";
  }

  return {
    team: teamName,
    score: finalScore,
    confidence,
    reasons:
      reasons.length > 0
        ? reasons
        : ["Balanced statistical profile"],
  };
}