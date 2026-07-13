type AlternateSpreadOutcome = {
  name?: string;
  price?: number;
  point?: number;
};

type AlternateSpreadMarket = {
  key?: string;
  last_update?: string;
  outcomes?: AlternateSpreadOutcome[];
};

type AlternateSpreadBookmaker = {
  key?: string;
  title?: string;
  last_update?: string;
  markets?: AlternateSpreadMarket[];
};

type AlternateSpreadResponse = {
  id?: string;
  sport_key?: string;
  sport_title?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: AlternateSpreadBookmaker[];
};

export async function GET(request: Request) {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Missing THE_ODDS_API_KEY" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return Response.json(
        { error: "Missing eventId query parameter." },
        { status: 400 }
      );
    }

    const url =
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/${eventId}/odds` +
      `?regions=us` +
      `&markets=alternate_spreads` +
      `&oddsFormat=decimal` +
      `&apiKey=${apiKey}`;

    const response = await fetch(url, {
      next: {
        revalidate: 600,
      },
    });

    if (!response.ok) {
      const details = await response.text();

      return Response.json(
        {
          error: "NFL alternate spreads API failed",
          details,
        },
        { status: response.status }
      );
    }

    const event =
      (await response.json()) as AlternateSpreadResponse;

    const bookmakers = (event.bookmakers ?? [])
      .map((bookmaker) => {
        const market = bookmaker.markets?.find(
          (item) => item.key === "alternate_spreads"
        );

        return {
          key: bookmaker.key ?? "",
          title: bookmaker.title ?? "Unknown bookmaker",
          lastUpdate:
            market?.last_update ??
            bookmaker.last_update ??
            null,
          outcomes: market?.outcomes ?? [],
        };
      })
      .filter((bookmaker) => bookmaker.outcomes.length > 0);

    const available = bookmakers.length > 0;

    return Response.json(
      {
        status: "ready",
        available,
        eventId,
        game: {
          homeTeam: event.home_team ?? null,
          awayTeam: event.away_team ?? null,
          commenceTime: event.commence_time ?? null,
        },
        bookmakers,
        message: available
          ? "Alternate spreads are available."
          : "Alternate spreads are not available yet for this matchup.",
        cacheMinutes: 10,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error("NFL alternate spreads error:", error);

    return Response.json(
      {
        error:
          "Something went wrong fetching NFL alternate spreads.",
      },
      { status: 500 }
    );
  }
}