type AlternateTotalOutcome = {
  name?: string;
  price?: number;
  point?: number;
};

type AlternateTotalMarket = {
  key?: string;
  last_update?: string;
  outcomes?: AlternateTotalOutcome[];
};

type AlternateTotalBookmaker = {
  key?: string;
  title?: string;
  last_update?: string;
  markets?: AlternateTotalMarket[];
};

type AlternateTotalResponse = {
  id?: string;
  sport_key?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: AlternateTotalBookmaker[];
};

const competitionSportKeys: Record<string, string> = {
  MLS: "soccer_usa_mls",
  "Premier League": "soccer_epl",
  "La Liga": "soccer_spain_la_liga",
  Bundesliga: "soccer_germany_bundesliga",
  "Serie A": "soccer_italy_serie_a",
  "Ligue 1": "soccer_france_ligue_one",
  "Champions League": "soccer_uefa_champs_league",
  "Europa League": "soccer_uefa_europa_league",
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

    const eventId =
      searchParams.get("eventId")?.trim() || "";

    const competition =
      searchParams.get("competition")?.trim() || "";

    if (!eventId) {
      return Response.json(
        { error: "Missing eventId query parameter." },
        { status: 400 }
      );
    }

    const sportKey =
      competitionSportKeys[competition];

    if (!sportKey) {
      return Response.json(
        {
          error: "Unsupported soccer competition.",
        },
        { status: 400 }
      );
    }

    const url = new URL(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${encodeURIComponent(
        eventId
      )}/odds`
    );

    url.searchParams.set("regions", "uk,eu");
    url.searchParams.set(
      "markets",
      "alternate_totals"
    );
    url.searchParams.set(
      "oddsFormat",
      "decimal"
    );
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url, {
      next: {
        revalidate: 600,
      },
    });

    if (!response.ok) {
      const details = await response.text();

      return Response.json(
        {
          available: false,
          error:
            "Soccer alternate totals API failed.",
          details,
          eventId,
          competition,
          bookmakers: [],
        },
        { status: response.status }
      );
    }

    const event =
      (await response.json()) as AlternateTotalResponse;

    const bookmakers = (
      event.bookmakers ?? []
    )
      .map((bookmaker) => {
        const market =
          bookmaker.markets?.find(
            (item) =>
              item.key ===
              "alternate_totals"
          );

        const outcomes = (
          market?.outcomes ?? []
        ).filter(
          (outcome) =>
            typeof outcome.name === "string" &&
            Number.isFinite(outcome.price) &&
            Number.isFinite(outcome.point)
        );

        return {
          key: bookmaker.key ?? "",
          title:
            bookmaker.title ??
            "Unknown bookmaker",
          lastUpdate:
            market?.last_update ??
            bookmaker.last_update ??
            null,
          outcomes,
        };
      })
      .filter(
        (bookmaker) =>
          bookmaker.outcomes.length > 0
      );

    return Response.json(
      {
        status: "ready",
        available: bookmakers.length > 0,
        eventId,
        competition,
        game: {
          homeTeam: event.home_team ?? null,
          awayTeam: event.away_team ?? null,
          commenceTime:
            event.commence_time ?? null,
        },
        bookmakers,
        message:
          bookmakers.length > 0
            ? "Soccer alternate totals are available."
            : "Soccer alternate totals are not available for this matchup.",
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
    console.error(
      "Soccer alternate totals error:",
      error
    );

    return Response.json(
      {
        available: false,
        error:
          "Something went wrong fetching soccer alternate totals.",
        bookmakers: [],
      },
      { status: 500 }
    );
  }
}