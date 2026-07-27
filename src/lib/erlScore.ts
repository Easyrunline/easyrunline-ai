import { calculatePitcherScore } from "./pitchers";
import { calculatePlus45ProfileScore } from "./plus45Profile";
import { calculateBullpenScore } from "./bullpen";
export type Outcome = {
  name: string;
  price: number;
  point?: number;
};

export type Market = {
  key: string;
  outcomes: Outcome[];
};

export type Bookmaker = {
  title: string;
  markets: Market[];
};

export type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  homePitcher?: string;
awayPitcher?: string;
homeERA?: number;
awayERA?: number;
homeLast10Wins?: number;
homeLast10Losses?: number;
awayLast10Wins?: number;
awayLast10Losses?: number;
homeRunDifferentialLast10?: number;
awayRunDifferentialLast10?: number;

homeAverageRunsScored?: number;
awayAverageRunsScored?: number;

homeAverageRunsAllowed?: number;
awayAverageRunsAllowed?: number;

homePlus45CoversLast10?: number;
awayPlus45CoversLast10?: number;

homePlus45FailuresLast10?: number;
awayPlus45FailuresLast10?: number;

homePlus45CoverRate?: number;
awayPlus45CoverRate?: number;

homeBlowoutLossesLast10?: number;
awayBlowoutLossesLast10?: number;

homeRecentStreak?: string;
awayRecentStreak?: string;

h2hMeetingsCounted?: number;

homeH2HPlus45Covers?: number;
homeH2HPlus45Failures?: number;
homeH2HPlus45CoverRecord?: string;
homeH2HPlus45CoverRate?: number;
homeH2HBlowoutLosses?: number;
homeH2HAverageRunDifferential?: number;

awayH2HPlus45Covers?: number;
awayH2HPlus45Failures?: number;
awayH2HPlus45CoverRecord?: string;
awayH2HPlus45CoverRate?: number;
awayH2HBlowoutLosses?: number;
awayH2HAverageRunDifferential?: number;
homeBullpenERA?: number;
awayBullpenERA?: number;
  bookmakers?: Bookmaker[];
};

export type ScoredPick = {
  team: string;
  opponent: string;
  side: "home" | "away";
  moneyline: number;
  standardRunLine?: string;
  bookmaker: string;
  score: number;
confidence:
    | "Very High"
    | "High"
    | "Moderate"
    | "Low"
    | "Very Low";

  blowoutRisk:
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

export function getUnderdogPick(game: Game): ScoredPick | null {
  const bookmaker = game.bookmakers?.[0];
  const moneyline = bookmaker?.markets.find((market) => market.key === "h2h");
  const spread = bookmaker?.markets.find((market) => market.key === "spreads");

  if (!bookmaker || !moneyline || moneyline.outcomes.length < 2) return null;

  const awayMl = moneyline.outcomes.find((o) => o.name === game.away_team);
  const homeMl = moneyline.outcomes.find((o) => o.name === game.home_team);

  if (!awayMl || !homeMl) return null;

  const underdog = awayMl.price > homeMl.price ? awayMl : homeMl;
  const favorite = awayMl.price > homeMl.price ? homeMl : awayMl;
  if (
  !underdog ||
  !favorite ||
  underdog.price <= favorite.price ||
  underdog.name === favorite.name
) {
  return null;
}

const validTeamNames = new Set([
  game.home_team,
  game.away_team,
]);

if (
  !validTeamNames.has(underdog.name) ||
  !validTeamNames.has(favorite.name)
) {
  return null;
}

  const isHome = underdog.name === game.home_team;
  const opponent = favorite.name;

  let score = 45;
const reasons: string[] = [];

const pitcherResult = calculatePitcherScore(
  isHome ? game.homeERA : game.awayERA,
  isHome ? game.awayERA : game.homeERA
);

const plus45Profile =
  calculatePlus45ProfileScore({
    recentGames: 10,

    recentCoverRate:
      isHome
        ? game.homePlus45CoverRate
        : game.awayPlus45CoverRate,

    recentCoverRecord:
      isHome
        ? game.homePlus45CoversLast10 !== undefined &&
          game.homePlus45FailuresLast10 !== undefined
          ? `${game.homePlus45CoversLast10}-${game.homePlus45FailuresLast10}`
          : undefined
        : game.awayPlus45CoversLast10 !== undefined &&
          game.awayPlus45FailuresLast10 !== undefined
          ? `${game.awayPlus45CoversLast10}-${game.awayPlus45FailuresLast10}`
          : undefined,

    recentBlowoutLosses:
      isHome
        ? game.homeBlowoutLossesLast10
        : game.awayBlowoutLossesLast10,

    recentRunDifferential:
      isHome
        ? game.homeRunDifferentialLast10
        : game.awayRunDifferentialLast10,

    h2hGames:
      game.h2hMeetingsCounted,

    h2hCoverRate:
      isHome
        ? game.homeH2HPlus45CoverRate
        : game.awayH2HPlus45CoverRate,

    h2hCoverRecord:
      isHome
        ? game.homeH2HPlus45CoverRecord
        : game.awayH2HPlus45CoverRecord,

    h2hBlowoutLosses:
      isHome
        ? game.homeH2HBlowoutLosses
        : game.awayH2HBlowoutLosses,

    h2hAverageRunDifferential:
      isHome
        ? game.homeH2HAverageRunDifferential
        : game.awayH2HAverageRunDifferential,
  });

const bullpenResult = calculateBullpenScore(
  isHome ? game.homeBullpenERA : game.awayBullpenERA,
  isHome ? game.awayBullpenERA : game.homeBullpenERA
);

score += pitcherResult.score;
score += plus45Profile.score;
score += bullpenResult.score;

reasons.push("Valid EasyRunLine underdog +4.5 candidate");

if (isHome) {
  score += 4;
  reasons.push("Home underdog protection");
}

const mlGap = underdog.price - favorite.price;

if (mlGap <= 0.45) {
  score += 8;
  reasons.push("Small moneyline gap suggests a competitive matchup");
} else if (mlGap <= 0.9) {
  score += 3;
  reasons.push("Moderate moneyline gap");
} else {
  score -= 8;
  reasons.push("Wide moneyline gap increases blowout risk");
}

if (underdog.price <= 2.25) {
  score += 4;
  reasons.push("Market does not price this team as a heavy underdog");
} else if (underdog.price <= 2.8) {
  reasons.push("Playable underdog range");
} else {
  score -= 6;
  reasons.push("Heavy underdog profile");
}

const underdogSpread = spread?.outcomes.find(
  (outcome) => outcome.name === underdog.name
);

if (
  underdogSpread?.point !== undefined &&
  underdogSpread.point < 0
) {
  return null;
}


score = Math.max(0, Math.min(100, score));
let confidence: ScoredPick["confidence"];

if (score >= 85) {
  confidence = "Very High";
} else if (score >= 75) {
  confidence = "High";
} else if (score >= 60) {
  confidence = "Moderate";
} else if (score >= 40) {
  confidence = "Low";
} else {
  confidence = "Very Low";
}
let blowoutRiskPoints = 0;

if (underdog.price >= 3.5) {
  blowoutRiskPoints += 3;
} else if (underdog.price >= 2.75) {
  blowoutRiskPoints += 2;
} else if (underdog.price >= 2.3) {
  blowoutRiskPoints += 1;
}

if (pitcherResult.score <= -8) {
  blowoutRiskPoints += 3;
} else if (pitcherResult.score <= -4) {
  blowoutRiskPoints += 2;
} else if (pitcherResult.score < 0) {
  blowoutRiskPoints += 1;
}

blowoutRiskPoints +=
  plus45Profile.blowoutRiskPoints;

if (bullpenResult.score <= -6) {
  blowoutRiskPoints += 2;
} else if (bullpenResult.score < 0) {
  blowoutRiskPoints += 1;
}

if (isHome) {
  blowoutRiskPoints = Math.max(0, blowoutRiskPoints - 1);
}

let blowoutRisk: ScoredPick["blowoutRisk"];

if (blowoutRiskPoints >= 7) {
  blowoutRisk = "Very High";
} else if (blowoutRiskPoints >= 5) {
  blowoutRisk = "High";
} else if (blowoutRiskPoints >= 3) {
  blowoutRisk = "Moderate";
} else {
  blowoutRisk = "Low";
}
let verdict: ScoredPick["verdict"];
let verdictReason: string;

if (blowoutRisk === "Very High") {
  verdict = "PASS";
  verdictReason =
    "Very High blowout risk overrides the historical +4.5 cover profile.";
} else if (blowoutRisk === "High") {
  if (score >= 80) {
    verdict = "CAUTIOUS PLAY";
    verdictReason =
      "The +4.5 profile is exceptionally strong, but elevated matchup blowout risk prevents a full Strong Play classification.";
  } else {
    verdict = "PASS";
    verdictReason =
      "The matchup carries too much blowout risk for the current ERL Score.";
  }
} else if (score >= 80) {
  verdict = "STRONG PLAY";
  verdictReason =
    "The selection combines an elite +4.5 profile with acceptable matchup blowout risk.";
} else if (score >= 65) {
  verdict = "PLAY";
  verdictReason =
    "The selection has a strong +4.5 profile with acceptable matchup risk.";
} else if (score >= 50) {
  verdict = "LEAN";
  verdictReason =
    "The selection has supporting +4.5 evidence, but the overall advantage is not strong enough for a full Play.";
} else {
  verdict = "PASS";
  verdictReason =
    "The supplied matchup evidence does not meet the minimum EasyRunLine threshold.";
}
reasons.push(pitcherResult.reason);
reasons.push(
  ...plus45Profile.reasons
);
reasons.push(bullpenResult.reason);


 

return {
  team: underdog.name,
  opponent,
  side: isHome ? "home" : "away",
  moneyline: underdog.price,

  standardRunLine:
    underdogSpread?.point !== undefined
      ? `${underdogSpread.point} at ${underdogSpread.price}`
      : "Not available",

  bookmaker:
    bookmaker.title || "Not available",

  score,
  confidence,
  blowoutRisk,
  verdict,
  verdictReason,
  reasons,
};
}

export function rankEasyRunLinePicks(games: Game[]) {
  return games
    .map((game) => getUnderdogPick(game))
    .filter((pick): pick is ScoredPick => pick !== null)
    .sort((a, b) => b.score - a.score);
}