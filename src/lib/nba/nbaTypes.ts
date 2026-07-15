export type NBAOutcome = {
  name: string;
  price: number;
  point?: number;
};

export type NBAMarket = {
  key: string;
  outcomes: NBAOutcome[];
};

export type NBABookmaker = {
  key: string;
  title: string;
  markets: NBAMarket[];
};

export type NBAGame = {
  id: string;
  sport_key?: string;
  commence_time: string;

  home_team: string;
  away_team: string;

  bookmakers: NBABookmaker[];
};

export type NBAConfidence =
  | "Very High"
  | "High"
  | "Moderate"
  | "Low"
  | "Very Low";

export type NBABlowoutRisk =
  | "Low"
  | "Moderate"
  | "High"
  | "Very High";

export type NBATeamForm = {
  team: string;
  abbreviation: string;

  winsLast5: number;
  lossesLast5: number;

  winsLast10: number;
  lossesLast10: number;

  homeWinsLast10: number;
  homeLossesLast10: number;

  awayWinsLast10: number;
  awayLossesLast10: number;

  averagePointsForLast10: number;
  averagePointsAgainstLast10: number;

  gamesCounted: number;

  restDays?: number;
  backToBack?: boolean;
};

export type NBAScoredPick = {
  team: string;
  opponent: string;

  side: "home" | "away";

  moneyline?: number;
  spread?: number;
  spreadPrice?: number;

  bookmaker: string;

  score: number;
  confidence: NBAConfidence;
  blowoutRisk: NBABlowoutRisk;

  reasons: string[];
};