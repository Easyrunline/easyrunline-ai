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