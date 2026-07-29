export async function GET() {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error: "Missing THE_ODDS_API_KEY",
        },
        {
          status: 500,
        }
      );
    }

    const url =
      `https://api.the-odds-api.com/v4/sports/basketball_wnba/odds` +
      `?regions=us&markets=h2h,spreads,totals&oddsFormat=decimal&apiKey=${apiKey}`;

    const response = await fetch(url, {
      next: {
        revalidate: 900,
      },
    });

    if (!response.ok) {
      const details = await response.text();

      return Response.json(
        {
          error: "WNBA Odds API failed",
          details,
        },
        {
          status: response.status,
        }
      );
    }

    const games = await response.json();

    return Response.json(
      {
        games,
        cacheMinutes: 15,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("WNBA odds route error:", error);

    return Response.json(
      {
        error: "Something went wrong fetching WNBA odds.",
      },
      {
        status: 500,
      }
    );
  }
}