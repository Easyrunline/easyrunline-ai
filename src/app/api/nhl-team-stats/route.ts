import { getNHLTeamStats } from "@/lib/nhl/teamStats";

function isValidTeamCode(value: string): boolean {
  return /^[A-Za-z]{3}$/.test(value.trim());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedTeam = searchParams.get("team") ?? "TOR";

    if (!isValidTeamCode(requestedTeam)) {
      return Response.json(
        {
          error:
            "Invalid NHL team abbreviation. Use a three-letter code such as TOR.",
        },
        {
          status: 400,
        }
      );
    }

    const stats = await getNHLTeamStats(requestedTeam);

    return Response.json(
      {
        team: stats.team,
        stats,
        cacheMinutes: 5,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=900",
        },
      }
    );
  } catch (error) {
    console.error("NHL team stats error:", error);

    return Response.json(
      {
        error: "Unable to fetch NHL team statistics.",
      },
      {
        status: 500,
      }
    );
  }
}