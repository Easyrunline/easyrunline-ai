type WNBAAlternateTotalOutcome = {
  name?: string;
  price?: number;
  point?: number;
};

type WNBAAlternateTotalMarket = {
  key?: string;
  last_update?: string;
  outcomes?: WNBAAlternateTotalOutcome[];
};

type WNBAAlternateTotalBookmaker = {
  key?: string;
  title?: string;
  last_update?: string;
  markets?: WNBAAlternateTotalMarket[];
};

type WNBAAlternateTotalResponse = {
  id?: string;
  sport_key?: string;
  sport_title?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: WNBAAlternateTotalBookmaker[];
};

export async function GET(request: Request) {
  const apiKey =
    process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "Missing THE_ODDS_API_KEY",
      },
      {
        status: 500,
      }
    );
  }

  const { searchParams } =
    new URL(request.url);

  const eventId =
    searchParams.get("eventId")?.trim();

  if (!eventId) {
    return Response.json(
      {
        error:
          "Missing eventId query parameter.",
        usage:
          "/api/wnba-alternate-totals?eventId=EVENT_ID",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const url = new URL(
      `https://api.the-odds-api.com/v4/sports/basketball_wnba/events/${encodeURIComponent(
        eventId
      )}/odds`
    );

    url.searchParams.set(
      "regions",
      "us"
    );

    url.searchParams.set(
      "markets",
      "alternate_totals"
    );

    url.searchParams.set(
      "oddsFormat",
      "decimal"
    );

    url.searchParams.set(
      "apiKey",
      apiKey
    );

    const response = await fetch(
      url,
      {
        next: {
          revalidate: 300,
        },
      }
    );

    const responseText =
      await response.text();

    let data:
      | WNBAAlternateTotalResponse
      | Record<string, unknown>;

    try {
      data = JSON.parse(
        responseText
      ) as
        | WNBAAlternateTotalResponse
        | Record<string, unknown>;
    } catch {
      data = {
        rawResponse: responseText,
      };
    }

    if (!response.ok) {
      return Response.json(
        {
          available: false,
          error:
            "WNBA alternate totals API failed.",
          details: data,
          eventId,
          bookmakers: [],
        },
        {
          status: response.status,
        }
      );
    }

    const event =
      data as WNBAAlternateTotalResponse;

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
        )
          .filter(
            (outcome) =>
              typeof outcome.name ===
                "string" &&
              Number.isFinite(
                outcome.price
              ) &&
              Number.isFinite(
                outcome.point
              )
          )
          .map((outcome) => ({
            name:
              outcome.name as string,

            price:
              outcome.price as number,

            point:
              outcome.point as number,
          }));

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

    const available =
      bookmakers.length > 0;

    return Response.json(
      {
        status: "ready",
        available,
        eventId,

        game: {
          homeTeam:
            event.home_team ?? null,

          awayTeam:
            event.away_team ?? null,

          commenceTime:
            event.commence_time ??
            null,
        },

        bookmakers,

        message: available
          ? "WNBA alternate totals are available."
          : "WNBA alternate totals are not currently available for this matchup.",

        cacheMinutes: 5,
        fetchedAt:
          new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=900",
        },
      }
    );
  } catch (error) {
    console.error(
      "WNBA alternate totals error:",
      error
    );

    return Response.json(
      {
        available: false,
        error:
          "Something went wrong fetching WNBA alternate totals.",
        eventId,
        bookmakers: [],
      },
      {
        status: 500,
      }
    );
  }
}