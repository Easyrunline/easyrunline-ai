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
  export type WNBAHistoricalGame = {
  eventId: string;
  commenceTime: string;

  seasonYear: number;
  seasonType: number | null;
  seasonTypeName: string;

  homeTeamId: string;
  homeTeam: string;
  homeTeamAbbreviation: string;
  homeScore: number;
  homeFirstHalfScore: number | null;

  awayTeamId: string;
  awayTeam: string;
  awayTeamAbbreviation: string;
  awayScore: number;
  awayFirstHalfScore: number | null;

  winner: string;
  loser: string;
  pointMargin: number;

  neutralSite: boolean;
  completed: true;
};

export type WNBAHistoryResponse = {
  seasonYear?: number;
  gameCount?: number;
  games?: WNBAHistoricalGame[];
  source?: string;
  cacheMinutes?: number;
  fetchedAt?: string;
  error?: string;
  details?: string;
};