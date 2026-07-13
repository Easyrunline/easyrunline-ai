import { scoreNFLTeam } from "./nflScore";

export type RankedNFLGame = {
  eventId: string;

  homeTeam: string;
  awayTeam: string;

  preferredTeam: string;

  preferredScore: number;

  scoreGap: number;
};

export function buildNFLIntelligence(
  games: any[],
  teamForm: any[]
): RankedNFLGame[] {
  return games
    .map((game) => {
      const awayForm = teamForm.find(
        (team) => team.team === game.away_team
      );

      const homeForm = teamForm.find(
        (team) => team.team === game.home_team
      );

      const awayScore = scoreNFLTeam(
        awayForm,
        game.away_team,
        false
      );

      const homeScore = scoreNFLTeam(
        homeForm,
        game.home_team,
        true
      );

      const preferredTeam =
        homeScore.score >= awayScore.score
          ? game.home_team
          : game.away_team;

      const preferredScore = Math.max(
        homeScore.score,
        awayScore.score
      );

      return {
        eventId: game.id,

        homeTeam: game.home_team,

        awayTeam: game.away_team,

        preferredTeam,

        preferredScore,

        scoreGap: Math.abs(
          homeScore.score - awayScore.score
        ),
      };
    })
    .sort((a, b) => {
      if (b.preferredScore !== a.preferredScore) {
        return b.preferredScore - a.preferredScore;
      }

      return b.scoreGap - a.scoreGap;
    });
}