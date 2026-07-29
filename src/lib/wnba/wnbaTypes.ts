export type WNBAOutcome = {
  name: string;
  price: number;
  point?: number;
};

export type WNBAMarket = {
  key: string;
  outcomes: WNBAOutcome[];
};

export type WNBABookmaker = {
  key: string;
  title: string;
  markets: WNBAMarket[];
};

export type WNBAGame = {
  id: string;
  sport_key?: string;
  sport_title?: string;
  commence_time: string;

  home_team: string;
  away_team: string;

  bookmakers: WNBABookmaker[];
};

export type WNBAOddsResponse = {
  games?: WNBAGame[];
  cacheMinutes?: number;
  fetchedAt?: string;
  error?: string;
  details?: string;
};

export type WNBAConfidence =
  | "Very High"
  | "High"
  | "Moderate"
  | "Low"
  | "Very Low";

export type WNBABlowoutRisk =
  | "Low"
  | "Moderate"
  | "High"
  | "Very High";