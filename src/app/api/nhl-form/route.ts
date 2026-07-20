import { getNHLRecentForm } from "@/lib/nhl/form";

function isValidTeamCode(value: string): boolean {
  return /^[A-Za-z]{3}$/.test(value.trim());
}

function parseLimit(value: string | null): number {
  if (!value) {
    return 10;
  }

  return Number(value);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedTeam = searchParams.get("team") ?? "TOR";
    const requestedLimit = parseLimit(
      searchParams.get("limit")
    );

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

    if (
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1 ||
      requestedLimit > 20
    ) {
      return Response.json(
        {
          error:
            "Invalid limit. Use a whole number between 1 and 20.",
        },
        {
          status: 400,
        }
      );
    }

    const form = await getNHLRecentForm(
      requestedTeam,
      requestedLimit
    );

    return Response.json(
      {
        team: form.team,
        form,
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
    console.error("NHL recent-form error:", error);

    return Response.json(
      {
        error: "Unable to fetch NHL recent form.",
      },
      {
        status: 500,
      }
    );
  }
}