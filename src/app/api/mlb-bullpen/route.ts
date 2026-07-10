type MLBTeam = {
  id: number;
  name: string;
};

type TeamsResponse = {
  teams?: MLBTeam[];
};

type BullpenStatsResponse = {
  stats?: Array<{
    splits?: Array<{
      stat?: {
        era?: string;
        inningsPitched?: string;
        strikeOuts?: number;
        baseOnBalls?: number;
        homeRuns?: number;
      };
    }>;
  }>;
};

type BullpenTeam = {
  team: string;
  bullpenERA: number | null;
  inningsPitched: number | null;
  strikeouts: number | null;
  walks: number | null;
  homeRunsAllowed: number | null;
};

async function getBullpenStats(
  team: MLBTeam,
  season: number
): Promise<BullpenTeam> {
  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/teams/${team.id}/stats?stats=season&group=pitching&season=${season}&sitCodes=rp`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        team: team.name,
        bullpenERA: null,
        inningsPitched: null,
        strikeouts: null,
        walks: null,
        homeRunsAllowed: null,
      };
    }

    const data = (await response.json()) as BullpenStatsResponse;
    const stat = data.stats?.[0]?.splits?.[0]?.stat;

    const parsedERA = stat?.era !== undefined ? Number(stat.era) : null;
    const parsedIP =
      stat?.inningsPitched !== undefined
        ? Number(stat.inningsPitched)
        : null;

    return {
      team: team.name,
      bullpenERA:
        parsedERA !== null && Number.isFinite(parsedERA)
          ? parsedERA
          : null,
      inningsPitched:
        parsedIP !== null && Number.isFinite(parsedIP)
          ? parsedIP
          : null,
      strikeouts: stat?.strikeOuts ?? null,
      walks: stat?.baseOnBalls ?? null,
      homeRunsAllowed: stat?.homeRuns ?? null,
    };
  } catch {
    return {
      team: team.name,
      bullpenERA: null,
      inningsPitched: null,
      strikeouts: null,
      walks: null,
      homeRunsAllowed: null,
    };
  }
}

export async function GET() {
  try {
    const season = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
      }).format(new Date())
    );

    const teamsResponse = await fetch(
      `https://statsapi.mlb.com/api/v1/teams?sportId=1&season=${season}`,
      {
        cache: "no-store",
      }
    );

    if (!teamsResponse.ok) {
      return Response.json(
        {
          error: "Unable to load MLB teams.",
        },
        {
          status: 502,
        }
      );
    }

    const teamsData = (await teamsResponse.json()) as TeamsResponse;
    const teams = teamsData.teams ?? [];

    const bullpenTeams = await Promise.all(
      teams.map((team) => getBullpenStats(team, season))
    );

    const rankedTeams = [...bullpenTeams]
      .filter((team) => team.bullpenERA !== null)
      .sort(
        (a, b) =>
          (a.bullpenERA ?? Number.POSITIVE_INFINITY) -
          (b.bullpenERA ?? Number.POSITIVE_INFINITY)
      );

    const rankByTeam = new Map(
      rankedTeams.map((team, index) => [
        team.team,
        index + 1,
      ])
    );

    const bullpens = bullpenTeams
      .map((team) => ({
        ...team,
        bullpenRank: rankByTeam.get(team.team) ?? null,
      }))
      .sort((a, b) => a.team.localeCompare(b.team));

    return Response.json({
      status: "ready",
      season,
      bullpens,
    });
  } catch (error) {
    console.error("Bullpen data error:", error);

    return Response.json(
      {
        error: "Unexpected bullpen data error.",
      },
      {
        status: 500,
      }
    );
  }
}