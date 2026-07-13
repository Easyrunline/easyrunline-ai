export type NFLOutcome = {
  name: string;
  price: number;
  point?: number;
};

export type NFLMarket = {
  key: string;
  outcomes: NFLOutcome[];
};

export type NFLBookmaker = {
  key: string;
  title: string;
  markets: NFLMarket[];
};

export type NFLGame = {
  id: string;
  sport_key?: string;
  commence_time: string;

  home_team: string;
  away_team: string;

  bookmakers: NFLBookmaker[];

  homeQuarterback?: string;
  awayQuarterback?: string;

  homeLast5Wins?: number;
  homeLast5Losses?: number;
  awayLast5Wins?: number;
  awayLast5Losses?: number;

  homeLast10Wins?: number;
  homeLast10Losses?: number;
  awayLast10Wins?: number;
  awayLast10Losses?: number;

  homePointsPerGame?: number;
  awayPointsPerGame?: number;

  homePointsAllowedPerGame?: number;
  awayPointsAllowedPerGame?: number;

  homeInjuryImpact?: number;
  awayInjuryImpact?: number;

  homeRestDays?: number;
  awayRestDays?: number;
};

export type NFLConfidence =
  | "Very High"
  | "High"
  | "Moderate"
  | "Low"
  | "Very Low";

export type NFLBlowoutRisk =
  | "Low"
  | "Moderate"
  | "High"
  | "Very High";

export type NFLScoredPick = {
  team: string;
  opponent: string;

  side: "home" | "away";

  moneyline?: number;
  spread?: number;
  spreadPrice?: number;

  bookmaker: string;

  score: number;
  confidence: NFLConfidence;
  blowoutRisk: NFLBlowoutRisk;

  reasons: string[];
};
export type NFLTeamForm = {
  team: string;
  abbreviation: string;

  winsLast5: number;
  lossesLast5: number;
  tiesLast5: number;

  winsLast10: number;
  lossesLast10: number;
  tiesLast10: number;

  homeWinsLast10: number;
  homeLossesLast10: number;

  awayWinsLast10: number;
  awayLossesLast10: number;

  averagePointsForLast10: number;
  averagePointsAgainstLast10: number;

  gamesCounted: number;
  trendLast5: string;
  trendLast10: string;
};
export type NFLQuarterbackStats = {
  playerId: string;
  player: string;
  team: string;
  abbreviation: string;

  gamesPlayed: number;
  gamesStarted: number;

  completions: number;
  attempts: number;
  completionPercentage: number;

  passingYards: number;
  passingYardsPerGame: number;

  passingTouchdowns: number;
  interceptions: number;

  passerRating?: number;
  sacksTaken?: number;

  status?: string;
};
export type NFLQuarterbackCandidate = {
  playerId: string;
  player: string;
  jersey: string;
  depth: number | null;
  experienceYears: number;
  headshot: string | null;
  status: string;
};

export type NFLTeamQuarterbacks = {
  team: string;
  abbreviation: string;
  quarterbacks: NFLQuarterbackCandidate[];
};