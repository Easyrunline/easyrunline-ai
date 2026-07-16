import { NextRequest } from "next/server";

type RawOutcome = {
  name?: string;
  description?: string;
  price?: number;
  point?: number;
};

type RawMarket = {
  key?: string;
  last_update?: string;
  outcomes?: RawOutcome[];
};

type RawBookmaker = {
  key?: string;
  title?: string;
  last_update?: string;
  markets?: RawMarket[];
};

type RawEventOddsResponse = {
  id?: string;
  sport_key?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  bookmakers?: RawBookmaker[];
};

const supportedNBAMarkets = new Set([
  "alternate_spreads",
  "alternate_spreads_q1",
  "alternate_spreads_h1",
  "alternate_totals",
  "alternate_totals_q1",
  "alternate_totals_h1",
  "spreads_q1",
  "spreads_h1",
  "totals_q1",
  "totals_h1",
]);

function parseRequestedMarkets(value: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((market) => market.trim())
        .filter(Boolean)
    )
  );
}

export async function GET(request: NextRequest) {
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

  const eventId =
    request.nextUrl.searchParams
      .get("eventId")
      ?.trim();

  if (!eventId) {
    return Response.json(
      {
        error: "Missing NBA eventId.",
        usage:
          "/api/nba-markets?eventId=EVENT_ID&markets=alternate_spreads_q1",
      },
      {
        status: 400,
      }
    );
  }

  const requestedMarkets =
    parseRequestedMarkets(
      request.nextUrl.searchParams.get(
        "markets"
      )
    );

  if (requestedMarkets.length === 0) {
    return Response.json(
      {
        error:
          "At least one NBA market key is required.",
        supportedMarkets: Array.from(
          supportedNBAMarkets
        ),
        examples: [
          `/api/nba-markets?eventId=${eventId}&markets=alternate_spreads_q1`,
          `/api/nba-markets?eventId=${eventId}&markets=alternate_spreads_h1`,
          `/api/nba-markets?eventId=${eventId}&markets=alternate_totals`,
          `/api/nba-markets?eventId=${eventId}&markets=alternate_totals_h1`,
        ],
      },
      {
        status: 400,
      }
    );
  }

  const unsupportedMarkets =
    requestedMarkets.filter(
      (market) =>
        !supportedNBAMarkets.has(market)
    );

  if (unsupportedMarkets.length > 0) {
    return Response.json(
      {
        error:
          "One or more requested NBA markets are unsupported by this route.",
        unsupportedMarkets,
        supportedMarkets: Array.from(
          supportedNBAMarkets
        ),
      },
      {
        status: 400,
      }
    );
  }

  try {
    const url = new URL(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${encodeURIComponent(
        eventId
      )}/odds`
    );

    url.searchParams.set(
      "regions",
      "us"
    );

    url.searchParams.set(
      "markets",
      requestedMarkets.join(",")
    );

    url.searchParams.set(
      "oddsFormat",
      "decimal"
    );

    url.searchParams.set(
      "apiKey",
      apiKey
    );

    const response = await fetch(url, {
      next: {
        revalidate: 300,
      },
    });

    const data =
      (await response.json()) as
        | RawEventOddsResponse
        | Record<string, unknown>;

    if (!response.ok) {
      return Response.json(
        {
          available: false,
          error:
            "NBA market request failed.",
          details: data,
          eventId,
          requestedMarkets,
          bookmakers: [],
        },
        {
          status: response.status,
        }
      );
    }

    const eventData =
      data as RawEventOddsResponse;

    const bookmakers = (
      eventData.bookmakers || []
    )
      .map((bookmaker) => {
        const markets = (
          bookmaker.markets || []
        )
          .filter(
            (market) =>
              typeof market.key === "string" &&
              requestedMarkets.includes(
                market.key
              )
          )
          .map((market) => ({
            key: market.key as string,

            lastUpdate:
              market.last_update ??
              bookmaker.last_update ??
              null,

            outcomes: (
              market.outcomes || []
            )
              .filter(
                (outcome) =>
                  typeof outcome.name ===
                    "string" &&
                  Number.isFinite(
                    outcome.price
                  )
              )
              .map((outcome) => ({
                name:
                  outcome.name as string,

                description:
                  typeof outcome.description ===
                  "string"
                    ? outcome.description
                    : null,

                price:
                  outcome.price as number,

                point:
                  Number.isFinite(
                    outcome.point
                  )
                    ? (outcome.point as number)
                    : null,
              })),
          }))
          .filter(
            (market) =>
              market.outcomes.length > 0
          );

        return {
          key: bookmaker.key ?? "",
          title:
            bookmaker.title ??
            "Unknown bookmaker",

          lastUpdate:
            bookmaker.last_update ?? null,

          markets,
        };
      })
      .filter(
        (bookmaker) =>
          bookmaker.markets.length > 0
      );

    const returnedMarketKeys =
      Array.from(
        new Set(
          bookmakers.flatMap(
            (bookmaker) =>
              bookmaker.markets.map(
                (market) => market.key
              )
          )
        )
      );

    const unavailableMarkets =
      requestedMarkets.filter(
        (market) =>
          !returnedMarketKeys.includes(
            market
          )
      );

    return Response.json(
      {
        eventId,

        sportKey:
          eventData.sport_key ??
          "basketball_nba",

        commenceTime:
          eventData.commence_time ??
          null,

        homeTeam:
          eventData.home_team ?? null,

        awayTeam:
          eventData.away_team ?? null,

        requestedMarkets,
        returnedMarketKeys,
        unavailableMarkets,

        available:
          bookmakers.length > 0,

        bookmakerCount:
          bookmakers.length,

        bookmakers,

        message:
          bookmakers.length > 0
            ? null
            : "None of the requested NBA markets are currently available for this event.",

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
      "NBA market route error:",
      error
    );

    return Response.json(
      {
        available: false,
        error:
          "Something went wrong fetching NBA markets.",
        eventId,
        requestedMarkets,
        bookmakers: [],
      },
      {
        status: 500,
      }
    );
  }
}