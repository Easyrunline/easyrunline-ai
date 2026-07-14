import type { RankedSoccerGame } from "./soccer/soccerIntelligence";

export type SoccerRiskLevel =
  | "Low"
  | "Medium"
  | "High";

export type SoccerEngineRecommendation = {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  preferredTeam: string;

  erlScore: number;
  probabilityEdge: number;
  confidence: "Low" | "Medium" | "High";

  safestHandicapTeam: string;
  safestHandicapLine: number;

  safestOver15: boolean;
  safestUnder45: boolean;

  blowoutRisk: SoccerRiskLevel;
  avoid: boolean;

  reasons: string[];
};

export function analyzeSoccerMatch(
  match: RankedSoccerGame
): SoccerEngineRecommendation {
  const reasons: string[] = [];

  const safestHandicapLine =
    match.erlScore >= 70 ? -0.5 : 1.5;

  const avoid =
    match.probabilityEdge < 6 ||
    match.confidence === "Low";

  const blowoutRisk: SoccerRiskLevel =
    match.probabilityEdge >= 25
      ? "High"
      : match.probabilityEdge >= 14
      ? "Medium"
      : "Low";

  if (match.erlScore >= 70) {
    reasons.push(
      `${match.preferredTeam} has a strong market-implied advantage.`
    );
  }

  if (match.probabilityEdge >= 12) {
    reasons.push(
      `EasyRunLine probability edge is ${match.probabilityEdge} points.`
    );
  }

  if (avoid) {
    reasons.push(
      "The current matchup does not provide a dependable betting edge."
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "The matchup carries a moderate EasyRunLine advantage."
    );
  }

  return {
    eventId: match.eventId,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    preferredTeam: match.preferredTeam,

    erlScore: match.erlScore,
    probabilityEdge: match.probabilityEdge,
    confidence: match.confidence,

    safestHandicapTeam: match.preferredTeam,
    safestHandicapLine,

    safestOver15: match.erlScore >= 45,
    safestUnder45: true,

    blowoutRisk,
    avoid,

    reasons,
  };
}

export function buildSoccerRecommendations(
  matches: RankedSoccerGame[]
): SoccerEngineRecommendation[] {
  return matches
    .map(analyzeSoccerMatch)
    .sort((a, b) => {
      if (b.erlScore !== a.erlScore) {
        return b.erlScore - a.erlScore;
      }

      return b.probabilityEdge - a.probabilityEdge;
    });
}