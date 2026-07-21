/* ===========================================================
   EASYRUNLINE AI
   NHL SCORING ENGINE
   Converts NHL statistics into ERL Scores
   =========================================================== */
   import type { ScoreBreakdown } from "./types";


const clamp = (
  value: number,
  min: number,
  max: number
) => Math.max(min, Math.min(max, value));

/* ===========================================================
   GOALIE
   Range: -30 → +30
   =========================================================== */

export function scoreGoalie(
  savePct: number
): ScoreBreakdown {

  if (savePct >= .925) {
    return {
      title: "Goaltending",
      score: 30,
      reason: `Elite save percentage (${savePct.toFixed(3)})`,
    };
  }

  if (savePct >= .920) {
    return {
      title: "Goaltending",
      score: 26,
      reason: `Excellent save percentage (${savePct.toFixed(3)})`,
    };
  }

  if (savePct >= .915) {
    return {
      title: "Goaltending",
      score: 22,
      reason: `Very good save percentage (${savePct.toFixed(3)})`,
    };
  }

  if (savePct >= .910) {
    return {
      title: "Goaltending",
      score: 16,
      reason: `Above-average save percentage (${savePct.toFixed(3)})`,
    };
  }

  if (savePct >= .905) {
    return {
      title: "Goaltending",
      score: 10,
      reason: `Average save percentage (${savePct.toFixed(3)})`,
    };
  }

  if (savePct >= .900) {
    return {
      title: "Goaltending",
      score: 5,
      reason: `Below-average save percentage (${savePct.toFixed(3)})`,
    };
  }

  return {
    title: "Goaltending",
    score: -10,
    reason: `Poor save percentage (${savePct.toFixed(3)})`,
  };

}

/* ===========================================================
   RECENT FORM
   Range: -20 → +20
   =========================================================== */

export function scoreRecentForm(
  pointsPct: number
): ScoreBreakdown {

  const score = clamp(
    Math.round((pointsPct - 0.50) * 40),
    -20,
    20
  );

  let reason = "";

  if (pointsPct >= 0.750) {
    reason = "Excellent recent form";
  } else if (pointsPct >= 0.600) {
    reason = "Good recent form";
  } else if (pointsPct >= 0.500) {
    reason = "Average recent form";
  } else if (pointsPct >= 0.400) {
    reason = "Below-average recent form";
  } else {
    reason = "Poor recent form";
  }

  return {
    title: "Recent Form",
    score,
    reason,
  };
}

/* ===========================================================
   GOAL DIFFERENTIAL
   Range: -10 → +10
   =========================================================== */

export function scoreGoalDifferential(
  differential: number
): ScoreBreakdown {

  const score = clamp(
    Math.round(differential * 10),
    -10,
    10
  );

  let reason = "";

  if (differential >= 1.0) {
    reason = "Excellent goal differential";
  } else if (differential >= 0.5) {
    reason = "Positive goal differential";
  } else if (differential >= 0) {
    reason = "Even goal differential";
  } else if (differential >= -0.5) {
    reason = "Slightly negative goal differential";
  } else {
    reason = "Poor goal differential";
  }

  return {
    title: "Goal Differential",
    score,
    reason,
  };
}

/* ===========================================================
   OFFENSE
   Goals Per Game
   Range: -10 → +10
   =========================================================== */

export function scoreOffense(
  goalsPerGame: number
): ScoreBreakdown {

  const score = clamp(
    Math.round((goalsPerGame - 3) * 8),
    -10,
    10
  );

  let reason = "";

  if (goalsPerGame >= 3.8) {
    reason = "Elite offensive production";
  } else if (goalsPerGame >= 3.4) {
    reason = "Strong offensive production";
  } else if (goalsPerGame >= 3.0) {
    reason = "Average offensive production";
  } else if (goalsPerGame >= 2.6) {
    reason = "Below-average offensive production";
  } else {
    reason = "Poor offensive production";
  }

  return {
    title: "Offense",
    score,
    reason,
  };

}

/* ===========================================================
   DEFENSE
   Goals Allowed
   Lower is Better
   Range: -10 → +10
   =========================================================== */

export function scoreDefense(
  goalsAllowedPerGame: number
): ScoreBreakdown {

  const score = clamp(
    Math.round((3 - goalsAllowedPerGame) * 8),
    -10,
    10
  );

  let reason = "";

  if (goalsAllowedPerGame <= 2.2) {
    reason = "Elite defensive play";
  } else if (goalsAllowedPerGame <= 2.6) {
    reason = "Strong defensive play";
  } else if (goalsAllowedPerGame <= 3.0) {
    reason = "Average defensive play";
  } else if (goalsAllowedPerGame <= 3.4) {
    reason = "Below-average defensive play";
  } else {
    reason = "Poor defensive play";
  }

  return {
    title: "Defense",
    score,
    reason,
  };

}

/* ===========================================================
   HOME ICE
   =========================================================== */

export function scoreHomeIce(
  isHome: boolean
): ScoreBreakdown {

  return {
    title: "Home Ice",
    score: isHome ? 5 : 0,
    reason: isHome
      ? "Playing at home"
      : "Playing on the road",
  };

}
/* ===========================================================
   INJURIES
   keyPlayers = number of missing impact players
   =========================================================== */

export function scoreInjuries(
  keyPlayers: number | null
): ScoreBreakdown {
  if (keyPlayers === null) {
    return {
      title: "Injuries",
      score: 0,
      reason:
        "Live NHL injury data is not available",
    };
  }

  const score = clamp(
    -(keyPlayers * 3),
    -10,
    0
  );

  let reason = "";

  if (keyPlayers === 0) {
    reason =
      "No key player injuries reported";
  } else if (keyPlayers === 1) {
    reason =
      "One key player unavailable";
  } else if (keyPlayers === 2) {
    reason =
      "Two key players unavailable";
  } else {
    reason =
      `${keyPlayers} key players unavailable`;
  }

  return {
    title: "Injuries",
    score,
    reason,
  };
}

/* ===========================================================
   MARKET
   Positive if market agrees
   Negative if fading
   =========================================================== */

export function scoreMarket(
  impliedProbability: number
): ScoreBreakdown {

  const score = clamp(
    Math.round((impliedProbability - 0.50) * 20),
    -10,
    10
  );

  let reason = "";

  if (impliedProbability >= 0.65) {
    reason = "Strong market support";
  } else if (impliedProbability >= 0.55) {
    reason = "Moderate market support";
  } else if (impliedProbability >= 0.45) {
    reason = "Balanced market";
  } else if (impliedProbability >= 0.35) {
    reason = "Market fading this team";
  } else {
    reason = "Strong market opposition";
  }

  return {
    title: "Market",
    score,
    reason,
  };

}