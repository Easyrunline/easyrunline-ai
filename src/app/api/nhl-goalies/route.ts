import { getNHLGoalies } from "@/lib/nhl/goalies";

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedDate =
      searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    if (!isValidDate(requestedDate)) {
      return Response.json(
        {
          error: "Invalid date. Use YYYY-MM-DD.",
        },
        {
          status: 400,
        }
      );
    }

    const games = await getNHLGoalies(requestedDate);

    return Response.json(
      {
        date: requestedDate,
        games,
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
    console.error(error);

    return Response.json(
      {
        error: "Something went wrong fetching NHL goalie data.",
      },
      {
        status: 500,
      }
    );
  }
}