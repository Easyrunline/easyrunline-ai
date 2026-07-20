/* ===========================================================
   EASYRUNLINE AI
   NHL Shared Types
   =========================================================== */

export interface ScoreBreakdown {
  title: string;
  score: number;
  reason: string;
}

export interface GoalieAnalysis {
  goalieName: string;
  savePct: number;
  gaa: number;
  starts: number;
  wins: number;
  losses: number;
}

export interface RecentFormAnalysis {
  last10: string;
  wins: number;
  losses: number;
  overtimeLosses: number;
  pointsPct: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  streak: string;
  momentum: string;
}

export interface TeamStatsAnalysis {
  goalsPerGame: number;
  goalsAgainstPerGame: number;
  powerPlayPct: number;
  penaltyKillPct: number;
  shotsPerGame: number;
  shotsAgainstPerGame: number;
}

export interface InjuryAnalysis {
  keyPlayersOut: number;
  totalPlayersOut: number;
}

export interface MarketAnalysis {
  moneyline: number;
  impliedProbability: number;
}

export interface NHLTeamAnalysis {

  team: string;

  goalie: GoalieAnalysis;

  form: RecentFormAnalysis;

  stats: TeamStatsAnalysis;

  injuries: InjuryAnalysis;

  market: MarketAnalysis;

}

export interface NHLGameAnalysis {

  home: NHLTeamAnalysis;

  away: NHLTeamAnalysis;

}

export interface EasyRunLineBreakdown {

  goalie: ScoreBreakdown;

  recentForm: ScoreBreakdown;

  offense: ScoreBreakdown;

  defense: ScoreBreakdown;

  homeIce: ScoreBreakdown;

  injuries: ScoreBreakdown;

  market: ScoreBreakdown;

}

export interface NHLRecommendation {

  team: string;

  erlScore: number;

  confidence:
    | "Very Low"
    | "Low"
    | "Moderate"
    | "High"
    | "Very High";

  recommendation:
    | "Avoid"
    | "Lean"
    | "Playable"
    | "Strong"
    | "Best Bet";

  breakdown: EasyRunLineBreakdown;

}