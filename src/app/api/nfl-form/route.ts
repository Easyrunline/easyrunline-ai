type ESPNTeam = {
  id?: string;
  displayName?: string;
  abbreviation?: string;
};

type ESPNCompetitor = {
  homeAway?: "home" | "away";
  score?: string;
  winner?: boolean;
  team?: ESPNTeam;
};

type ESPNCompetition = {
  date?: string;
  status?: {
    type?: {
      completed?: boolean;
    };
  };
  competitors?: ESPNCompetitor[];
};

type ESPNEvent = {
  date?: string;
  competitions?: ESPNCompetition[];
};

type TeamResult = {
  result: "W" | "L" | "T";
  pointsFor: number;
  pointsAgainst: number;
  homeAway: "home" | "away";
};

type TeamFormAccumulator = {
  team: string;
  abbreviation: string;
  results: TeamResult[];
};

function getFormSeasonYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Before September, use the most recently completed NFL season.
  return currentMonth >= 8 ? currentYear : currentYear - 1;
}

export async function GET() {
  try {
    const seasonYear = getFormSeasonYear();

    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates=${seasonYear}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Unable to load recent NFL games." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const events: ESPNEvent[] = data.events ?? [];

    const completedGames = events
      .flatMap((event) =>
        (event.competitions ?? []).map((competition) => ({
          ...competition,
          date: competition.date ?? event.date,
        }))
      )
      .filter(
        (competition) =>
          competition.status?.type?.completed === true
      )
      .sort(
        (a, b) =>
          new Date(b.date ?? 0).getTime() -
          new Date(a.date ?? 0).getTime()
      );

    const formByTeam = new Map<string, TeamFormAccumulator>();

    for (const game of completedGames) {
      const home = game.competitors?.find(
        (competitor) => competitor.homeAway === "home"
      );

      const away = game.competitors?.find(
        (competitor) => competitor.homeAway === "away"
      );

      if (
        !home?.team?.id ||
        !home.team.displayName ||
        !away?.team?.id ||
        !away.team.displayName
      ) {
        continue;
      }

      const homeScore = Number(home.score);
      const awayScore = Number(away.score);

      if (
        !Number.isFinite(homeScore) ||
        !Number.isFinite(awayScore)
      ) {
        continue;
      }

      if (!formByTeam.has(home.team.id)) {
        formByTeam.set(home.team.id, {
          team: home.team.displayName,
          abbreviation: home.team.abbreviation ?? "",
          results: [],
        });
      }

      if (!formByTeam.has(away.team.id)) {
        formByTeam.set(away.team.id, {
          team: away.team.displayName,
          abbreviation: away.team.abbreviation ?? "",
          results: [],
        });
      }

      const homeForm = formByTeam.get(home.team.id);
      const awayForm = formByTeam.get(away.team.id);

      const homeResult: "W" | "L" | "T" =
        homeScore > awayScore
          ? "W"
          : homeScore < awayScore
            ? "L"
            : "T";

      const awayResult: "W" | "L" | "T" =
        awayScore > homeScore
          ? "W"
          : awayScore < homeScore
            ? "L"
            : "T";

      if (homeForm && homeForm.results.length < 10) {
        homeForm.results.push({
          result: homeResult,
          pointsFor: homeScore,
          pointsAgainst: awayScore,
          homeAway: "home",
        });
      }

      if (awayForm && awayForm.results.length < 10) {
        awayForm.results.push({
          result: awayResult,
          pointsFor: awayScore,
          pointsAgainst: homeScore,
          homeAway: "away",
        });
      }
    }

    const teams = Array.from(formByTeam.values())
      .filter((team) => team.results.length > 0)
      .map((team) => {
        const last5 = team.results.slice(0, 5);
        const last10 = team.results.slice(0, 10);

        const totalPointsFor = last10.reduce(
          (total, game) => total + game.pointsFor,
          0
        );

        const totalPointsAgainst = last10.reduce(
          (total, game) => total + game.pointsAgainst,
          0
        );

        return {
          team: team.team,
          abbreviation: team.abbreviation,

          winsLast5: last5.filter(
            (game) => game.result === "W"
          ).length,
          lossesLast5: last5.filter(
            (game) => game.result === "L"
          ).length,
          tiesLast5: last5.filter(
            (game) => game.result === "T"
          ).length,

          winsLast10: last10.filter(
            (game) => game.result === "W"
          ).length,
          lossesLast10: last10.filter(
            (game) => game.result === "L"
          ).length,
          tiesLast10: last10.filter(
            (game) => game.result === "T"
          ).length,

          homeWinsLast10: last10.filter(
            (game) =>
              game.homeAway === "home" &&
              game.result === "W"
          ).length,
          homeLossesLast10: last10.filter(
            (game) =>
              game.homeAway === "home" &&
              game.result === "L"
          ).length,

          awayWinsLast10: last10.filter(
            (game) =>
              game.homeAway === "away" &&
              game.result === "W"
          ).length,
          awayLossesLast10: last10.filter(
            (game) =>
              game.homeAway === "away" &&
              game.result === "L"
          ).length,

          averagePointsForLast10:
            last10.length > 0
              ? Number(
                  (totalPointsFor / last10.length).toFixed(1)
                )
              : 0,

          averagePointsAgainstLast10:
            last10.length > 0
              ? Number(
                  (
                    totalPointsAgainst / last10.length
                  ).toFixed(1)
                )
              : 0,

          gamesCounted: last10.length,
          trendLast5: last5
            .map((game) => game.result)
            .join(""),
          trendLast10: last10
            .map((game) => game.result)
            .join(""),
        };
      })
      .sort((a, b) => a.team.localeCompare(b.team));

    return Response.json({
      status: "ready",
      season: seasonYear,
      teams,
    });
  } catch (error) {
    console.error("NFL recent-form error:", error);

    return Response.json(
      { error: "Unexpected NFL recent-form error." },
      { status: 500 }
    );
  }
}