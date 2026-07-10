type ScheduleTeam = {
  id?: number;
  name?: string;
};

type ScheduleGame = {
  gameDate?: string;
  status?: {
    abstractGameState?: string;
  };
  teams?: {
    away?: {
      team?: ScheduleTeam;
      isWinner?: boolean;
    };
    home?: {
      team?: ScheduleTeam;
      isWinner?: boolean;
    };
  };
};

type TeamFormAccumulator = {
  team: string;
  results: Array<"W" | "L">;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET() {
  try {
    const endDate = new Date();
    const startDate = new Date();

    // Use a wide enough window to capture at least 10 completed games.
    startDate.setDate(startDate.getDate() - 30);

    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${formatDate(
        startDate
      )}&endDate=${formatDate(endDate)}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Unable to load recent MLB games." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const games: ScheduleGame[] =
      data.dates?.flatMap(
        (dateEntry: { games?: ScheduleGame[] }) => dateEntry.games ?? []
      ) ?? [];

    const completedGames = games
      .filter(
        (game) => game.status?.abstractGameState === "Final"
      )
      .sort(
        (a, b) =>
          new Date(b.gameDate ?? 0).getTime() -
          new Date(a.gameDate ?? 0).getTime()
      );

    const formByTeam = new Map<number, TeamFormAccumulator>();

    for (const game of completedGames) {
      const awayTeam = game.teams?.away?.team;
      const homeTeam = game.teams?.home?.team;

      if (
        !awayTeam?.id ||
        !awayTeam.name ||
        !homeTeam?.id ||
        !homeTeam.name
      ) {
        continue;
      }

      if (!formByTeam.has(awayTeam.id)) {
        formByTeam.set(awayTeam.id, {
          team: awayTeam.name,
          results: [],
        });
      }

      if (!formByTeam.has(homeTeam.id)) {
        formByTeam.set(homeTeam.id, {
          team: homeTeam.name,
          results: [],
        });
      }

      const awayForm = formByTeam.get(awayTeam.id);
      const homeForm = formByTeam.get(homeTeam.id);

      if (
        awayForm &&
        awayForm.results.length < 10 &&
        game.teams?.away?.isWinner !== undefined
      ) {
        awayForm.results.push(
          game.teams.away.isWinner ? "W" : "L"
        );
      }

      if (
        homeForm &&
        homeForm.results.length < 10 &&
        game.teams?.home?.isWinner !== undefined
      ) {
        homeForm.results.push(
          game.teams.home.isWinner ? "W" : "L"
        );
      }
    }

    const teams = Array.from(formByTeam.values())
      .filter((team) => team.results.length > 0)
      .map((team) => ({
        team: team.team,
        winsLast10: team.results.filter(
          (result) => result === "W"
        ).length,
        lossesLast10: team.results.filter(
          (result) => result === "L"
        ).length,
        gamesCounted: team.results.length,
        trend: team.results.join(""),
      }))
      .sort((a, b) => a.team.localeCompare(b.team));

    return Response.json({
      status: "ready",
      teams,
    });
  } catch (error) {
    console.error("Recent form error:", error);

    return Response.json(
      { error: "Unexpected recent-form error." },
      { status: 500 }
    );
  }
}