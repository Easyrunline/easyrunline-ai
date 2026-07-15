import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    const eventId =
      request.nextUrl.searchParams
        .get("eventId")
        ?.trim();

    if (!eventId) {
      return Response.json(
        {
          error: "Missing NBA eventId.",
        },
        {
          status: 400,
        }
      );
    }

    const url =
      `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${encodeURIComponent(
        eventId
      )}/odds` +
      `?regions=us&markets=alternate_spreads&oddsFormat=decimal&apiKey=${apiKey}`;

    const response = await fetch(url, {
      next: {
        revalidate: 900,
      },
    });

    if (!response.ok) {
      const details = await response.text();

      return Response.json(
        {
          available: false,
          error:
            "NBA alternate-spread request failed.",
          details,
          bookmakers: [],
        },
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();

    const bookmakers = (
      data.bookmakers || []
    )
      .map(
        (bookmaker: {
          key?: string;
          title?: string;
          last_update?: string;
          markets?: Array<{
            key?: string;
            outcomes?: Array<{
              name?: string;
              price?: number;
              point?: number;
            }>;
          }>;
        }) => {
          const alternateMarket =
            bookmaker.markets?.find(
              (market) =>
                market.key ===
                "alternate_spreads"
            );

          return {
            key: bookmaker.key ?? "",
            title:
              bookmaker.title ??
              "Unknown bookmaker",

            lastUpdate:
              bookmaker.last_update ?? null,

            outcomes:
              alternateMarket?.outcomes
                ?.filter(
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
                  name: outcome.name as string,
                  price:
                    outcome.price as number,
                  point:
                    outcome.point as number,
                })) ?? [],
          };
        }
      )
      .filter(
        (bookmaker: {
          outcomes: unknown[];
        }) =>
          bookmaker.outcomes.length > 0
      );

    return Response.json(
      {
        eventId,

        available:
          bookmakers.length > 0,

        bookmakers,

        message:
          bookmakers.length > 0
            ? null
            : "No NBA alternate spreads are currently available for this event.",

        cacheMinutes: 15,
        fetchedAt:
          new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error(
      "NBA alternate-spread route error:",
      error
    );

    return Response.json(
      {
        available: false,
        error:
          "Something went wrong fetching NBA alternate spreads.",
        bookmakers: [],
      },
      {
        status: 500,
      }
    );
  }
}