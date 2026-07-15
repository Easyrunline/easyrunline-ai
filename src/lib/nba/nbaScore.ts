import type { NBATeamForm } from "./nbaTypes";

export type NBATeamScore = {
  team: string;
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

function getWinPercentage(
  wins?: number,
  losses?: number
) {
  const total = (wins ?? 0) + (losses ?? 0);

  if (total === 0) {
    return 0.5;
  }

  return (wins ?? 0) / total;
}

function calculateDataCompleteness(
  form: NBATeamForm | undefined
) {
  if (!form) {
    return 25;
  }

  let completeness = 45;

  if (form.gamesCounted >= 5) {
    completeness += 20;
  }

  if (form.gamesCounted >= 10) {
    completeness += 15;
  }

  if (
    Number.isFinite(form.averagePointsForLast10) &&
    Number.isFinite(form.averagePointsAgainstLast10)
  ) {
    completeness += 10;
  }

  if (Number.isFinite(form.restDays)) {
    completeness += 5;
  }

  if (typeof form.backToBack === "boolean") {
    completeness += 5;
  }

  return clamp(completeness);
}

export function scoreNBATeam(
  form: NBATeamForm | undefined,
  teamName: string,
  isHomeTeam: boolean
): NBATeamScore {
  if (!form) {
    return {
      team: teamName,
      score: isHomeTeam ? 53 : 50,
      confidence: "Low",
      dataCompleteness: 25,
      reasons: [
        "Limited NBA team-form data is currently available.",
      ],
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

  const scoringDifferential =
    pointsFor - pointsAgainst;

  /*
   * Recent five-game momentum:
   * maximum influence approximately ±12.
   */
  score +=
    (lastFiveWinRate - 0.5) * 24;

  if (lastFiveWinRate >= 0.7) {
    reasons.push(
      "Strong recent five-game momentum."
    );
  } else if (lastFiveWinRate <= 0.3) {
    reasons.push(
      "Weak recent five-game form."
    );
  }

  /*
   * Ten-game consistency:
   * maximum influence approximately ±10.
   */
  score +=
    (lastTenWinRate - 0.5) * 20;

  if (lastTenWinRate >= 0.7) {
    reasons.push(
      "Strong ten-game performance profile."
    );
  } else if (lastTenWinRate <= 0.3) {
    reasons.push(
      "Poor ten-game performance profile."
    );
  }

  /*
   * Home or away performance:
   * maximum influence approximately ±8.
   */
  score +=
    (locationWinRate - 0.5) * 16;

  if (locationWinRate >= 0.7) {
    reasons.push(
      isHomeTeam
        ? "Strong home-court record."
        : "Strong away record."
    );
  } else if (locationWinRate <= 0.3) {
    reasons.push(
      isHomeTeam
        ? "Weak home-court record."
        : "Weak away record."
    );
  }

  /*
   * NBA scoring margin is highly useful, but it is
   * capped so one hot offensive stretch does not
   * dominate the complete team rating.
   */
  const differentialAdjustment = clamp(
    scoringDifferential,
    -18,
    18
  );

  score += differentialAdjustment;

  if (scoringDifferential >= 8) {
    reasons.push(
      "Excellent recent scoring differential."
    );
  } else if (scoringDifferential >= 4) {
    reasons.push(
      "Positive recent scoring differential."
    );
  } else if (scoringDifferential <= -8) {
    reasons.push(
      "Very poor recent scoring differential."
    );
  } else if (scoringDifferential <= -4) {
    reasons.push(
      "Negative recent scoring differential."
    );
  }

  /*
   * Home-court advantage is meaningful but smaller
   * than the NFL home-field adjustment.
   */
  if (isHomeTeam) {
    score += 2.5;
    reasons.push(
      "Home-court advantage."
    );
  }

  /*
   * Rest and back-to-back context.
   */
  if (form.backToBack) {
    score -= 7;
    reasons.push(
      "Back-to-back scheduling creates a fatigue penalty."
    );
  } else if (
    Number.isFinite(form.restDays) &&
    (form.restDays ?? 0) >= 2
  ) {
    score += 3;
    reasons.push(
      "The team enters with additional rest."
    );
  } else if (
    Number.isFinite(form.restDays) &&
    (form.restDays ?? 0) === 0
  ) {
    score -= 4;
    reasons.push(
      "No rest-day advantage is available."
    );
  }

  const finalScore = Math.round(
    clamp(score)
  );

  let confidence: NBATeamScore["confidence"] =
    "Low";

  if (finalScore >= 75) {
    confidence = "High";
  } else if (finalScore >= 60) {
    confidence = "Moderate";
  }

  return {
    team: teamName,
    score: finalScore,
    confidence,
    dataCompleteness:
      calculateDataCompleteness(form),
    reasons:
      reasons.length > 0
        ? reasons
        : [
            "Balanced NBA statistical profile.",
          ],
  };
}