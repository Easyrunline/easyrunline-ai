type PitcherStatsResponse = {
  stats?: Array<{
    splits?: Array<{
      stat?: {
        era?: string;
      };
    }>;
  }>;
};

type ScheduleGame = {
  teams?: {
    away?: {
      team?: {
        name?: string;
      };
      probablePitcher?: {
        id?: number;
        fullName?: string;
      };
    };
    home?: {
      team?: {
        name?: string;
      };
      probablePitcher?: {
        id?: number;
        fullName?: string;
      };
    };
  };
};

async function getPitcherERA(
  pitcherId: number | undefined,
  season: number
): Promise<number | null> {
  if (!pitcherId) return null;

  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=season&group=pitching&season=${season}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as PitcherStatsResponse;
    const era = data.stats?.[0]?.splits?.[0]?.stat?.era;

    if (!era) return null;

    const parsedERA = Number(era);

    return Number.isFinite(parsedERA) ? parsedERA : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const now = new Date();

    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const season = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
      }).format(now)
    );

    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=probablePitcher`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Could not load MLB probable pitchers." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const games: ScheduleGame[] = data.dates?.[0]?.games ?? [];

    const probables = await Promise.all(
      games.map(async (game) => {
        const awayTeam = game.teams?.away?.team?.name ?? "Unknown";
        const homeTeam = game.teams?.home?.team?.name ?? "Unknown";

        const awayProbable = game.teams?.away?.probablePitcher;
        const homeProbable = game.teams?.home?.probablePitcher;

        const [awayERA, homeERA] = await Promise.all([
          getPitcherERA(awayProbable?.id, season),
          getPitcherERA(homeProbable?.id, season),
        ]);

        return {
          awayTeam,
          homeTeam,
          awayPitcher: awayProbable?.fullName ?? "TBD",
          homePitcher: homeProbable?.fullName ?? "TBD",
          awayERA,
          homeERA,
        };
      })
    );

    return Response.json({
      status: "ready",
      date,
      probables,
    });
  } catch (error) {
    console.error("Probable pitchers error:", error);

    return Response.json(
      { error: "Unexpected probable-pitcher error." },
      { status: 500 }
    );
  }
}