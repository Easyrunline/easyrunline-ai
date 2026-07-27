export type Plus45ProfileInput = {
  recentGames?: number;
  recentCoverRate?: number;
  recentCoverRecord?: string;
  recentBlowoutLosses?: number;
  recentRunDifferential?: number;

  h2hGames?: number;
  h2hCoverRate?: number;
  h2hCoverRecord?: string;
  h2hBlowoutLosses?: number;
  h2hAverageRunDifferential?: number;
};

export type Plus45ProfileResult = {
  score: number;
  blowoutRiskPoints: number;
  reasons: string[];
};

function sampleWeight(
  games?: number
) {
  if (
    games === undefined ||
    games <= 0
  ) {
    return 0;
  }

  return Math.min(
    games / 10,
    1
  );
}

function recentCoverScore(
  coverRate: number
) {
  if (coverRate >= 90) return 18;
  if (coverRate >= 80) return 14;
  if (coverRate >= 70) return 9;
  if (coverRate >= 60) return 4;
  if (coverRate >= 50) return 0;
  if (coverRate >= 40) return -6;

  return -12;
}

function h2hCoverScore(
  coverRate: number
) {
  if (coverRate >= 90) return 12;
  if (coverRate >= 80) return 9;
  if (coverRate >= 70) return 6;
  if (coverRate >= 60) return 3;
  if (coverRate >= 50) return 0;

  return -6;
}

function runDifferentialScore(
  runDifferential: number
) {
  if (runDifferential >= 15) return 7;
  if (runDifferential >= 5) return 5;
  if (runDifferential >= -5) return 2;
  if (runDifferential >= -15) return -3;
  if (runDifferential >= -25) return -5;

  return -7;
}

export function calculatePlus45ProfileScore(
  input: Plus45ProfileInput
): Plus45ProfileResult {
  let score = 0;
  let blowoutRiskPoints = 0;

  const reasons: string[] = [];

  const recentWeight =
    sampleWeight(input.recentGames);

  if (
    input.recentCoverRate !== undefined &&
    recentWeight > 0
  ) {
    const adjustment = Math.round(
      recentCoverScore(
        input.recentCoverRate
      ) * recentWeight
    );

    score += adjustment;

    reasons.push(
      `Last ${input.recentGames} +4.5 cover record: ${
        input.recentCoverRecord ??
        `${input.recentCoverRate}%`
      }`
    );
  } else {
    reasons.push(
      "Recent +4.5 cover data unavailable"
    );
  }

  if (
    input.recentRunDifferential !== undefined
  ) {
    score += runDifferentialScore(
      input.recentRunDifferential
    );

    reasons.push(
      `Last-10 run differential: ${
        input.recentRunDifferential > 0
          ? "+"
          : ""
      }${input.recentRunDifferential}`
    );
  }

  const recentBlowouts =
    input.recentBlowoutLosses;

  if (recentBlowouts !== undefined) {
    if (recentBlowouts === 0) {
      blowoutRiskPoints = Math.max(
        0,
        blowoutRiskPoints - 1
      );

      reasons.push(
        "No losses by five or more runs in the recent sample"
      );
    } else if (recentBlowouts === 1) {
      reasons.push(
        "One recent failure to stay within the +4.5 cushion"
      );
    } else if (recentBlowouts === 2) {
      blowoutRiskPoints += 1;

      reasons.push(
        "Two recent losses exceeded the +4.5 cushion"
      );
    } else {
      blowoutRiskPoints += 3;

      reasons.push(
        `${recentBlowouts} recent losses exceeded the +4.5 cushion`
      );
    }
  }

  const h2hWeight =
    sampleWeight(input.h2hGames);

  if (
    input.h2hCoverRate !== undefined &&
    h2hWeight > 0
  ) {
    const adjustment = Math.round(
      h2hCoverScore(
        input.h2hCoverRate
      ) * h2hWeight
    );

    score += adjustment;

    reasons.push(
      `H2H +4.5 cover record: ${
        input.h2hCoverRecord ??
        `${input.h2hCoverRate}%`
      } across ${input.h2hGames} meetings`
    );
  } else {
    reasons.push(
      "H2H +4.5 cover data unavailable"
    );
  }

  const h2hBlowouts =
    input.h2hBlowoutLosses;

  if (
    h2hBlowouts !== undefined &&
    h2hWeight > 0
  ) {
    if (h2hBlowouts >= 3) {
      blowoutRiskPoints += 2;
    } else if (h2hBlowouts === 2) {
      blowoutRiskPoints += 1;
    }
  }

  if (
    input.h2hAverageRunDifferential !==
    undefined
  ) {
    reasons.push(
      `H2H average run differential: ${
        input.h2hAverageRunDifferential > 0
          ? "+"
          : ""
      }${input.h2hAverageRunDifferential}`
    );
  }

  return {
    score,
    blowoutRiskPoints,
    reasons,
  };
}