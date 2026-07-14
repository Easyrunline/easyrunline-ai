export type SoccerTeamForm = {
  teamName: string;

  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;

  goalsFor: number;
  goalsAgainst: number;

  averageGoalsFor: number;
  averageGoalsAgainst: number;

  homeMatchesPlayed: number;
  homeWins: number;
  homeDraws: number;
  homeLosses: number;
  homeGoalsFor: number;
  homeGoalsAgainst: number;

  awayMatchesPlayed: number;
  awayWins: number;
  awayDraws: number;
  awayLosses: number;
  awayGoalsFor: number;
  awayGoalsAgainst: number;

  recentPointsPerGame: number;
  recentGoalDifferencePerGame: number;

  over15Rate: number;
  over25Rate: number;
  under45Rate: number;
  bothTeamsToScoreRate: number;
};

export type SoccerMatchResult = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  commencedAt: string;
};

export function calculateSoccerTeamForm(
  teamName: string,
  results: SoccerMatchResult[],
  recentMatchLimit = 8
): SoccerTeamForm {
  const matches = results
    .filter(
      (match) =>
        match.homeTeam === teamName ||
        match.awayTeam === teamName
    )
    .sort(
      (a, b) =>
        new Date(b.commencedAt).getTime() -
        new Date(a.commencedAt).getTime()
    )
    .slice(0, recentMatchLimit);

  let wins = 0;
  let draws = 0;
  let losses = 0;

  let goalsFor = 0;
  let goalsAgainst = 0;

  let homeMatchesPlayed = 0;
  let homeWins = 0;
  let homeDraws = 0;
  let homeLosses = 0;
  let homeGoalsFor = 0;
  let homeGoalsAgainst = 0;

  let awayMatchesPlayed = 0;
  let awayWins = 0;
  let awayDraws = 0;
  let awayLosses = 0;
  let awayGoalsFor = 0;
  let awayGoalsAgainst = 0;

  let over15Matches = 0;
  let over25Matches = 0;
  let under45Matches = 0;
  let bothTeamsToScoreMatches = 0;

  for (const match of matches) {
    const isHome = match.homeTeam === teamName;

    const teamGoals = isHome
      ? match.homeGoals
      : match.awayGoals;

    const opponentGoals = isHome
      ? match.awayGoals
      : match.homeGoals;

    goalsFor += teamGoals;
    goalsAgainst += opponentGoals;

    if (teamGoals > opponentGoals) {
      wins += 1;
    } else if (teamGoals === opponentGoals) {
      draws += 1;
    } else {
      losses += 1;
    }

    if (isHome) {
      homeMatchesPlayed += 1;
      homeGoalsFor += teamGoals;
      homeGoalsAgainst += opponentGoals;

      if (teamGoals > opponentGoals) {
        homeWins += 1;
      } else if (teamGoals === opponentGoals) {
        homeDraws += 1;
      } else {
        homeLosses += 1;
      }
    } else {
      awayMatchesPlayed += 1;
      awayGoalsFor += teamGoals;
      awayGoalsAgainst += opponentGoals;

      if (teamGoals > opponentGoals) {
        awayWins += 1;
      } else if (teamGoals === opponentGoals) {
        awayDraws += 1;
      } else {
        awayLosses += 1;
      }
    }

    const totalGoals = teamGoals + opponentGoals;

    if (totalGoals > 1.5) {
      over15Matches += 1;
    }

    if (totalGoals > 2.5) {
      over25Matches += 1;
    }

    if (totalGoals < 4.5) {
      under45Matches += 1;
    }

    if (teamGoals > 0 && opponentGoals > 0) {
      bothTeamsToScoreMatches += 1;
    }
  }

  const matchesPlayed = matches.length;
  const points = wins * 3 + draws;

  return {
    teamName,

    matchesPlayed,
    wins,
    draws,
    losses,

    goalsFor,
    goalsAgainst,

    averageGoalsFor:
      matchesPlayed > 0 ? goalsFor / matchesPlayed : 0,

    averageGoalsAgainst:
      matchesPlayed > 0 ? goalsAgainst / matchesPlayed : 0,

    homeMatchesPlayed,
    homeWins,
    homeDraws,
    homeLosses,
    homeGoalsFor,
    homeGoalsAgainst,

    awayMatchesPlayed,
    awayWins,
    awayDraws,
    awayLosses,
    awayGoalsFor,
    awayGoalsAgainst,

    recentPointsPerGame:
      matchesPlayed > 0 ? points / matchesPlayed : 0,

    recentGoalDifferencePerGame:
      matchesPlayed > 0
        ? (goalsFor - goalsAgainst) / matchesPlayed
        : 0,

    over15Rate:
      matchesPlayed > 0
        ? over15Matches / matchesPlayed
        : 0,

    over25Rate:
      matchesPlayed > 0
        ? over25Matches / matchesPlayed
        : 0,

    under45Rate:
      matchesPlayed > 0
        ? under45Matches / matchesPlayed
        : 0,

    bothTeamsToScoreRate:
      matchesPlayed > 0
        ? bothTeamsToScoreMatches / matchesPlayed
        : 0,
  };
}