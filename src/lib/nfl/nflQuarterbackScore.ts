import type {
  NFLQuarterbackCandidate,
  NFLTeamQuarterbacks,
} from "./nflTypes";

export type NFLQuarterbackScore = {
  team: string;
  quarterback: string | null;

  score: number;
  confidence: "Low" | "Moderate" | "High";

  starterConfirmed: boolean;
  dataAvailable: boolean;

  reasons: string[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function isUnavailableStatus(status: string) {
  const normalized = normalizeStatus(status);

  return (
    normalized.includes("injured reserve") ||
    normalized.includes("out") ||
    normalized.includes("suspended") ||
    normalized.includes("inactive")
  );
}

function isQuestionableStatus(status: string) {
  const normalized = normalizeStatus(status);

  return (
    normalized.includes("questionable") ||
    normalized.includes("doubtful") ||
    normalized.includes("limited")
  );
}

function findLikelyStarter(
  quarterbacks: NFLQuarterbackCandidate[]
) {
  const available = quarterbacks.filter(
    (quarterback) =>
      !isUnavailableStatus(quarterback.status)
  );

  if (available.length === 0) {
    return null;
  }

  return [...available].sort((a, b) => {
    const depthA =
      a.depth === null ? Number.MAX_SAFE_INTEGER : a.depth;

    const depthB =
      b.depth === null ? Number.MAX_SAFE_INTEGER : b.depth;

    if (depthA !== depthB) {
      return depthA - depthB;
    }

    return b.experienceYears - a.experienceYears;
  })[0];
}

export function scoreNFLQuarterbackSituation(
  teamQuarterbacks: NFLTeamQuarterbacks | undefined
): NFLQuarterbackScore {
  if (
    !teamQuarterbacks ||
    teamQuarterbacks.quarterbacks.length === 0
  ) {
    return {
      team: teamQuarterbacks?.team ?? "Unknown team",
      quarterback: null,

      score: 50,
      confidence: "Low",

      starterConfirmed: false,
      dataAvailable: false,

      reasons: [
        "No quarterback roster data is currently available.",
      ],
    };
  }

  const likelyStarter = findLikelyStarter(
    teamQuarterbacks.quarterbacks
  );

  if (!likelyStarter) {
    return {
      team: teamQuarterbacks.team,
      quarterback: null,

      score: 20,
      confidence: "Moderate",

      starterConfirmed: false,
      dataAvailable: true,

      reasons: [
        "No available quarterback candidate was identified.",
      ],
    };
  }

  let score = 55;
  const reasons: string[] = [];

    const listedFirst =
    likelyStarter.depth === 1;

  /*
   * ESPN roster depth identifies the likely
   * starter, but it is not official game-day
   * confirmation.
   */
  const starterConfirmed = false;

  if (listedFirst) {
    score += 8;
    reasons.push(
      "Listed first on the quarterback depth chart, but not confirmed for game day."
    );
  } else {
    score -= 5;
    reasons.push(
      "Starting-quarterback position is not clearly identified or confirmed."
    );
  }

  const experienceBonus = Math.min(
    likelyStarter.experienceYears * 2,
    16
  );

  score += experienceBonus;

  if (likelyStarter.experienceYears >= 5) {
    reasons.push(
      "Experienced quarterback option."
    );
  } else if (likelyStarter.experienceYears <= 1) {
    score -= 6;
    reasons.push(
      "Limited NFL experience increases uncertainty."
    );
  }

  if (isQuestionableStatus(likelyStarter.status)) {
    score -= 18;
    reasons.push(
      `Quarterback status raises availability concerns: ${likelyStarter.status}.`
    );
  } else if (
    isUnavailableStatus(likelyStarter.status)
  ) {
    score -= 35;
    reasons.push(
      `Quarterback is currently unavailable: ${likelyStarter.status}.`
    );
  } else {
    score += 5;
    reasons.push(
      "No unavailable designation was identified."
    );
  }

  const availableQuarterbacks =
    teamQuarterbacks.quarterbacks.filter(
      (quarterback) =>
        !isUnavailableStatus(quarterback.status)
    );

  if (availableQuarterbacks.length >= 2) {
    score += 4;
    reasons.push(
      "The team has additional available quarterback depth."
    );
  } else {
    score -= 4;
    reasons.push(
      "Limited available quarterback depth."
    );
  }

  const finalScore = clamp(score);

  let confidence: NFLQuarterbackScore["confidence"] =
    "Low";

  if (starterConfirmed && finalScore >= 70) {
    confidence = "High";
  } else if (finalScore >= 50) {
    confidence = "Moderate";
  }

  return {
    team: teamQuarterbacks.team,
    quarterback: likelyStarter.player,

    score: finalScore,
    confidence,

    starterConfirmed,
    dataAvailable: true,

    reasons,
  };
}