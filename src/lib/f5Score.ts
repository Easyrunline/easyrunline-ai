import {
  calculatePitcherScore,
} from "./pitchers";

export type F5Outcome = {
  name: string;
  price: number;
  point?: number;
};

export type F5Market = {
  key: string;
  outcomes: F5Outcome[];
};

export type F5Bookmaker = {
  title: string;
  markets: F5Market[];
};

export type F5Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;

  homeERA?: number;
  awayERA?: number;

  homeF5GamesCounted?: number;
  awayF5GamesCounted?: number;

  homeF5Record?: string;
  awayF5Record?: string;

  homeRunsScoredF5Last10?: number;
  awayRunsScoredF5Last10?: number;

  homeRunsAllowedF5Last10?: number;
  awayRunsAllowedF5Last10?: number;

  homeRunDifferentialF5Last10?: number;
  awayRunDifferentialF5Last10?: number;

  homeAverageRunsScoredF5?: number;
  awayAverageRunsScoredF5?: number;

  homeAverageRunsAllowedF5?: number;
  awayAverageRunsAllowedF5?: number;

  homePlus25CoversF5Last10?: number;
  awayPlus25CoversF5Last10?: number;

  homePlus25FailuresF5Last10?: number;
  awayPlus25FailuresF5Last10?: number;

  homePlus25CoverRateF5?: number;
  awayPlus25CoverRateF5?: number;

  homeEarlyBlowoutLossesF5Last10?: number;
  awayEarlyBlowoutLossesF5Last10?: number;

  homeVenueF5Games?: number;
  awayVenueF5Games?: number;

  homeVenuePlus25CoversF5?: number;
  awayVenuePlus25CoversF5?: number;

  f5H2HMeetingsCounted?: number;

  homeF5H2HPlus25Covers?: number;
  awayF5H2HPlus25Covers?: number;

  homeF5H2HPlus25Failures?: number;
  awayF5H2HPlus25Failures?: number;

  homeF5H2HPlus25CoverRecord?: string;
  awayF5H2HPlus25CoverRecord?: string;

  homeF5H2HPlus25CoverRate?: number;
  awayF5H2HPlus25CoverRate?: number;

  homeF5H2HRunDifferential?: number;
  awayF5H2HRunDifferential?: number;

  homeF5H2HAverageRunDifferential?: number;
  awayF5H2HAverageRunDifferential?: number;

  homeF5H2HEarlyBlowoutLosses?: number;
  awayF5H2HEarlyBlowoutLosses?: number;

  bookmakers?: F5Bookmaker[];
};

export type F5ScoredPick = {
  team: string;
  opponent: string;
  side: "home" | "away";

  moneyline: number;
standardRunLine: string;
bookmaker: string;

  score: number;

  confidence:
    | "Very High"
    | "High"
    | "Moderate"
    | "Low"
    | "Very Low";

  earlyBlowoutRisk:
    | "Low"
    | "Moderate"
    | "High"
    | "Very High";

  verdict:
    | "STRONG PLAY"
    | "PLAY"
    | "LEAN"
    | "CAUTIOUS PLAY"
    | "PASS";

  verdictReason: string;
  reasons: string[];
};

function getConfidence(
  score: number
): F5ScoredPick["confidence"] {
  if (score >= 85) {
    return "Very High";
  }

  if (score >= 75) {
    return "High";
  }

  if (score >= 60) {
    return "Moderate";
  }

  if (score >= 45) {
    return "Low";
  }

  return "Very Low";
}

function getRecentF5CoverScore(
  covers?: number,
  failures?: number
) {
  if (
    covers === undefined ||
    failures === undefined ||
    covers + failures === 0
  ) {
    return {
      score: 0,
      reason:
        "Recent F5 +2.5 cover data unavailable",
    };
  }

  const games = covers + failures;
  const rate = covers / games;

  if (rate >= 0.9) {
    return {
      score: 18,
      reason:
        `Last 10 F5 +2.5 cover record: ${covers}-${failures}`,
    };
  }

  if (rate >= 0.8) {
    return {
      score: 13,
      reason:
        `Last 10 F5 +2.5 cover record: ${covers}-${failures}`,
    };
  }

  if (rate >= 0.7) {
    return {
      score: 7,
      reason:
        `Last 10 F5 +2.5 cover record: ${covers}-${failures}`,
    };
  }

  if (rate >= 0.6) {
    return {
      score: 2,
      reason:
        `Last 10 F5 +2.5 cover record: ${covers}-${failures}`,
    };
  }

  return {
    score: -10,
    reason:
      `Weak recent F5 +2.5 cover record: ${covers}-${failures}`,
  };
}

function getRecentF5RunScore(
  differential?: number,
  averageScored?: number,
  averageAllowed?: number
) {
  if (
    differential === undefined ||
    averageScored === undefined ||
    averageAllowed === undefined
  ) {
    return {
      score: 0,
      reasons: [
        "Recent F5 scoring data unavailable",
      ],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  if (differential >= 10) {
    score += 9;
  } else if (differential >= 1) {
    score += 5;
  } else if (differential >= -5) {
    score += 1;
  } else if (differential >= -12) {
    score -= 5;
  } else {
    score -= 10;
  }

  reasons.push(
    `Last-10 F5 run differential: ${
      differential >= 0 ? "+" : ""
    }${differential}`
  );

  reasons.push(
    `F5 averages: ${averageScored} runs scored and ${averageAllowed} runs allowed`
  );

  return {
    score,
    reasons,
  };
}

function getF5H2HScore(
  meetings?: number,
  covers?: number,
  failures?: number,
  averageDifferential?: number
) {
  if (
    meetings === undefined ||
    covers === undefined ||
    failures === undefined ||
    meetings === 0
  ) {
    return {
      score: 0,
      reasons: [
        "F5 head-to-head data unavailable",
      ],
    };
  }

  const coverRate =
    covers / meetings;

  let score = 0;

  if (coverRate >= 0.9) {
    score += 14;
  } else if (coverRate >= 0.8) {
    score += 10;
  } else if (coverRate >= 0.7) {
    score += 5;
  } else if (coverRate < 0.6) {
    score -= 8;
  }

  if (
    averageDifferential !== undefined
  ) {
    if (averageDifferential >= 1) {
      score += 4;
    } else if (
      averageDifferential <= -2
    ) {
      score -= 5;
    }
  }

  return {
    score,
    reasons: [
      `H2H F5 +2.5 cover record: ${covers}-${failures} across ${meetings} meetings`,

      averageDifferential !== undefined
        ? `H2H F5 average run differential: ${
            averageDifferential >= 0
              ? "+"
              : ""
          }${averageDifferential}`
        : "H2H F5 average run differential unavailable",
    ],
  };
}

export function getF5Pick(
  game: F5Game
): F5ScoredPick | null {
  const bookmaker =
    game.bookmakers?.[0];

  const moneyline =
    bookmaker?.markets.find(
      (market) =>
        market.key === "h2h"
    );
const spread =
  bookmaker?.markets.find(
    (market) =>
      market.key === "spreads"
  );
  if (
    !bookmaker ||
    !moneyline
  ) {
    return null;
  }

  const homeMoneyline =
    moneyline.outcomes.find(
      (outcome) =>
        outcome.name ===
        game.home_team
    );

  const awayMoneyline =
    moneyline.outcomes.find(
      (outcome) =>
        outcome.name ===
        game.away_team
    );

  if (
    !homeMoneyline ||
    !awayMoneyline
  ) {
    return null;
  }

  const underdog =
    homeMoneyline.price >
    awayMoneyline.price
      ? homeMoneyline
      : awayMoneyline;

  const favorite =
    underdog.name ===
    game.home_team
      ? awayMoneyline
      : homeMoneyline;
      const underdogSpread =
  spread?.outcomes.find(
    (outcome) =>
      outcome.name ===
      underdog.name
  );

  if (
    underdog.price <=
      favorite.price ||
    underdog.name ===
      favorite.name
  ) {
    return null;
  }

  const isHome =
    underdog.name ===
    game.home_team;

  const opponent =
    favorite.name;

  const recentCovers =
    isHome
      ? game.homePlus25CoversF5Last10
      : game.awayPlus25CoversF5Last10;

  const recentFailures =
    isHome
      ? game.homePlus25FailuresF5Last10
      : game.awayPlus25FailuresF5Last10;

  const recentDifferential =
    isHome
      ? game.homeRunDifferentialF5Last10
      : game.awayRunDifferentialF5Last10;

  const averageScored =
    isHome
      ? game.homeAverageRunsScoredF5
      : game.awayAverageRunsScoredF5;

  const averageAllowed =
    isHome
      ? game.homeAverageRunsAllowedF5
      : game.awayAverageRunsAllowedF5;

  const recentEarlyBlowouts =
    isHome
      ? game.homeEarlyBlowoutLossesF5Last10
      : game.awayEarlyBlowoutLossesF5Last10;

  const h2hCovers =
    isHome
      ? game.homeF5H2HPlus25Covers
      : game.awayF5H2HPlus25Covers;

  const h2hFailures =
    isHome
      ? game.homeF5H2HPlus25Failures
      : game.awayF5H2HPlus25Failures;

  const h2hAverageDifferential =
    isHome
      ? game.homeF5H2HAverageRunDifferential
      : game.awayF5H2HAverageRunDifferential;

  const h2hEarlyBlowouts =
    isHome
      ? game.homeF5H2HEarlyBlowoutLosses
      : game.awayF5H2HEarlyBlowoutLosses;

  const pitcherResult =
    calculatePitcherScore(
      isHome
        ? game.homeERA
        : game.awayERA,

      isHome
        ? game.awayERA
        : game.homeERA
    );

  const recentCoverResult =
    getRecentF5CoverScore(
      recentCovers,
      recentFailures
    );

  const recentRunResult =
    getRecentF5RunScore(
      recentDifferential,
      averageScored,
      averageAllowed
    );

  const h2hResult =
    getF5H2HScore(
      game.f5H2HMeetingsCounted,
      h2hCovers,
      h2hFailures,
      h2hAverageDifferential
    );

  /*
   * F5 begins from a neutral base.
   * Starting pitching receives increased weight
   * because relief pitching should not drive an
   * innings 1–5 recommendation.
   */
  let score = 45;

  score +=
    Math.round(
      pitcherResult.score * 1.5
    );

  score += recentCoverResult.score;
  score += recentRunResult.score;
  score += h2hResult.score;

  const reasons: string[] = [
    "Valid EasyRunLine underdog F5 +2.5 candidate",
    pitcherResult.reason,
    recentCoverResult.reason,
    ...recentRunResult.reasons,
    ...h2hResult.reasons,
  ];

  if (isHome) {
    score += 3;

    reasons.push(
      "Home underdog receives the final F5 plate appearance when required"
    );
  }

  const moneylineGap =
    underdog.price -
    favorite.price;

  if (moneylineGap <= 0.45) {
    score += 5;

    reasons.push(
      "Small moneyline gap supports a competitive early matchup"
    );
  } else if (
    moneylineGap > 1.25
  ) {
    score -= 6;

    reasons.push(
      "Wide moneyline gap increases early separation risk"
    );
  }

  if (
    recentEarlyBlowouts !==
    undefined
  ) {
    if (
      recentEarlyBlowouts === 0
    ) {
      score += 5;

      reasons.push(
        "No recent F5 losses outside the +2.5 cushion"
      );
    } else {
      score -=
        recentEarlyBlowouts * 3;

      reasons.push(
        `${recentEarlyBlowouts} recent F5 losses exceeded the +2.5 cushion`
      );
    }
  }

  if (
    h2hEarlyBlowouts !==
    undefined &&
    h2hEarlyBlowouts > 0
  ) {
    score -=
      Math.min(
        h2hEarlyBlowouts * 2,
        8
      );

    reasons.push(
      `${h2hEarlyBlowouts} H2H F5 losses exceeded the +2.5 cushion`
    );
  }

  score = Math.max(
    0,
    Math.min(100, score)
  );

  const confidence =
    getConfidence(score);

  let earlyRiskPoints = 0;

  if (pitcherResult.score <= -12) {
    earlyRiskPoints += 4;
  } else if (
    pitcherResult.score <= -8
  ) {
    earlyRiskPoints += 3;
  } else if (
    pitcherResult.score < 0
  ) {
    earlyRiskPoints += 1;
  }

  if (
    recentEarlyBlowouts !==
    undefined
  ) {
    if (recentEarlyBlowouts >= 4) {
      earlyRiskPoints += 4;
    } else if (
      recentEarlyBlowouts >= 2
    ) {
      earlyRiskPoints += 2;
    } else if (
      recentEarlyBlowouts === 1
    ) {
      earlyRiskPoints += 1;
    }
  }

  if (
    h2hEarlyBlowouts !==
    undefined
  ) {
    if (h2hEarlyBlowouts >= 4) {
      earlyRiskPoints += 3;
    } else if (
      h2hEarlyBlowouts >= 2
    ) {
      earlyRiskPoints += 2;
    } else if (
      h2hEarlyBlowouts === 1
    ) {
      earlyRiskPoints += 1;
    }
  }

  if (moneylineGap > 1.25) {
    earlyRiskPoints += 2;
  } else if (
    moneylineGap > 0.75
  ) {
    earlyRiskPoints += 1;
  }

  let earlyBlowoutRisk:
    F5ScoredPick["earlyBlowoutRisk"];

  if (earlyRiskPoints >= 8) {
    earlyBlowoutRisk =
      "Very High";
  } else if (
    earlyRiskPoints >= 6
  ) {
    earlyBlowoutRisk = "High";
  } else if (
    earlyRiskPoints >= 3
  ) {
    earlyBlowoutRisk =
      "Moderate";
  } else {
    earlyBlowoutRisk = "Low";
  }

  let verdict:
    F5ScoredPick["verdict"];

  let verdictReason: string;

  if (
    earlyBlowoutRisk ===
    "Very High"
  ) {
    verdict = "PASS";

    verdictReason =
      "The risk of falling outside the F5 +2.5 cushion is too high.";
  } else if (
    earlyBlowoutRisk === "High"
  ) {
    if (score >= 80) {
      verdict =
        "CAUTIOUS PLAY";

      verdictReason =
        "Strong F5 evidence is present, but elevated early blowout risk requires caution.";
    } else {
      verdict = "PASS";

      verdictReason =
        "The F5 score does not sufficiently offset the elevated early blowout risk.";
    }
  } else if (score >= 80) {
    verdict = "STRONG PLAY";

    verdictReason =
      "The selection combines an elite F5 +2.5 profile with acceptable early blowout risk.";
  } else if (score >= 65) {
    verdict = "PLAY";

    verdictReason =
      "The selection has a strong F5 +2.5 profile with acceptable early-game risk.";
  } else if (score >= 50) {
    verdict = "LEAN";

    verdictReason =
      "The selection has supporting F5 evidence, but the overall advantage is not strong enough for a full Play.";
  } else {
    verdict = "PASS";

    verdictReason =
      "The supplied F5 evidence does not meet the minimum EasyRunLine threshold.";
  }

  return {
    team: underdog.name,
    opponent,
    side:
      isHome
        ? "home"
        : "away",

    moneyline:
  underdog.price,

standardRunLine:
  underdogSpread?.point !==
  undefined
    ? `${underdogSpread.point} at ${underdogSpread.price}`
    : "Not available",

bookmaker:
  bookmaker.title ||
  "Not available",

    score,
    confidence,
    earlyBlowoutRisk,
    verdict,
    verdictReason,
    reasons,
  };
}

export function rankF5Picks(
  games: F5Game[]
) {
  return games
    .map((game) =>
      getF5Pick(game)
    )
    .filter(
      (
        pick
      ): pick is F5ScoredPick =>
        pick !== null
    )
    .sort(
      (a, b) =>
        b.score - a.score
    );
}