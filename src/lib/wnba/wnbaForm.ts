import type {
  WNBAHistoricalGame,
} from "./wnbaTypes";

export type WNBAFormGame = {
  eventId: string;
  commenceTime: string;

  opponent: string;
  homeAway: "home" | "away";

  result: "W" | "L";
  pointsFor: number;
  pointsAgainst: number;
  pointMargin: number;
};

export type WNBAFormSplit = {
  gamesPlayed: number;

  wins: number;
  losses: number;
  winPercentage: number;

  averagePointsFor: number;
  averagePointsAgainst: number;
  averagePointMargin: number;
};

export type WNBATeamForm = {
  teamId: string;
  team: string;
  abbreviation: string;

  last5: WNBAFormSplit;
  last10: WNBAFormSplit;

  season: WNBAFormSplit;
  home: WNBAFormSplit;
  away: WNBAFormSplit;

  recentGames: WNBAFormGame[];
};

type TeamFormAccumulator = {
  teamId: string;
  team: string;
  abbreviation: string;
  games: WNBAFormGame[];
};

function roundToOneDecimal(
  value: number
) {
  return Number(value.toFixed(1));
}

function buildFormSplit(
  games: WNBAFormGame[]
): WNBAFormSplit {
  const gamesPlayed = games.length;

  if (gamesPlayed === 0) {
    return {
      gamesPlayed: 0,

      wins: 0,
      losses: 0,
      winPercentage: 0,

      averagePointsFor: 0,
      averagePointsAgainst: 0,
      averagePointMargin: 0,
    };
  }

  const wins = games.filter(
    (game) => game.result === "W"
  ).length;

  const losses =
    gamesPlayed - wins;

  const totalPointsFor =
    games.reduce(
      (total, game) =>
        total + game.pointsFor,
      0
    );

  const totalPointsAgainst =
    games.reduce(
      (total, game) =>
        total + game.pointsAgainst,
      0
    );

  const totalPointMargin =
    games.reduce(
      (total, game) =>
        total + game.pointMargin,
      0
    );

  return {
    gamesPlayed,

    wins,
    losses,

    winPercentage:
      roundToOneDecimal(
        (wins / gamesPlayed) * 100
      ),

    averagePointsFor:
      roundToOneDecimal(
        totalPointsFor / gamesPlayed
      ),

    averagePointsAgainst:
      roundToOneDecimal(
        totalPointsAgainst /
          gamesPlayed
      ),

    averagePointMargin:
      roundToOneDecimal(
        totalPointMargin /
          gamesPlayed
      ),
  };
}

export function buildWNBATeamForm(
  historicalGames: WNBAHistoricalGame[]
): WNBATeamForm[] {
  const regularSeasonGames =
    historicalGames
      .filter(
        (game) =>
          game.completed === true &&
          game.seasonType === 2
      )
      .sort(
        (firstGame, secondGame) =>
          new Date(
            secondGame.commenceTime
          ).getTime() -
          new Date(
            firstGame.commenceTime
          ).getTime()
      );

  const formByTeam =
    new Map<
      string,
      TeamFormAccumulator
    >();

  function ensureTeam(
    teamId: string,
    team: string,
    abbreviation: string
  ) {
    if (!formByTeam.has(teamId)) {
      formByTeam.set(teamId, {
        teamId,
        team,
        abbreviation,
        games: [],
      });
    }

    return formByTeam.get(teamId);
  }

  for (
    const game of regularSeasonGames
  ) {
    const homeTeam = ensureTeam(
      game.homeTeamId,
      game.homeTeam,
      game.homeTeamAbbreviation
    );

    const awayTeam = ensureTeam(
      game.awayTeamId,
      game.awayTeam,
      game.awayTeamAbbreviation
    );

    const homeWon =
      game.homeScore >
      game.awayScore;

    homeTeam?.games.push({
      eventId: game.eventId,
      commenceTime:
        game.commenceTime,

      opponent: game.awayTeam,
      homeAway: "home",

      result: homeWon
        ? "W"
        : "L",

      pointsFor: game.homeScore,
      pointsAgainst:
        game.awayScore,

      pointMargin:
        game.homeScore -
        game.awayScore,
    });

    awayTeam?.games.push({
      eventId: game.eventId,
      commenceTime:
        game.commenceTime,

      opponent: game.homeTeam,
      homeAway: "away",

      result: homeWon
        ? "L"
        : "W",

      pointsFor: game.awayScore,
      pointsAgainst:
        game.homeScore,

      pointMargin:
        game.awayScore -
        game.homeScore,
    });
  }

  return Array.from(
    formByTeam.values()
  )
    .map((team) => {
      const last5 =
        team.games.slice(0, 5);

      const last10 =
        team.games.slice(0, 10);

      const homeGames =
        team.games.filter(
          (game) =>
            game.homeAway === "home"
        );

      const awayGames =
        team.games.filter(
          (game) =>
            game.homeAway === "away"
        );

      return {
        teamId: team.teamId,
        team: team.team,
        abbreviation:
          team.abbreviation,

        last5:
          buildFormSplit(last5),

        last10:
          buildFormSplit(last10),

        season:
          buildFormSplit(
            team.games
          ),

        home:
          buildFormSplit(
            homeGames
          ),

        away:
          buildFormSplit(
            awayGames
          ),

        recentGames:
          team.games.slice(0, 10),
      };
    })
    .sort(
      (firstTeam, secondTeam) =>
        secondTeam.season
          .winPercentage -
        firstTeam.season
          .winPercentage
    );
}

export function findWNBATeamForm(
  teams: WNBATeamForm[],
  teamName: string
) {
  const normalizedTeamName =
    teamName
      .trim()
      .toLowerCase();

  return teams.find(
    (team) =>
      team.team
        .trim()
        .toLowerCase() ===
      normalizedTeamName
  );
}