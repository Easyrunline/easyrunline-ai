import { NextRequest } from "next/server";

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
          "/api/nba-markets?eventId=YOUR_EVENT_ID",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const url =
      `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${encodeURIComponent(
        eventId
      )}/odds` +
      `?regions=us&oddsFormat=decimal&apiKey=${apiKey}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: "NBA market discovery failed.",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    const marketKeys = Array.from(
      new Set(
        (data.bookmakers || []).flatMap(
          (bookmaker: {
            markets?: Array<{
              key?: string;
            }>;
          }) =>
            (bookmaker.markets || [])
              .map((market) => market.key)
              .filter(
                (
                  key
                ): key is string =>
                  typeof key === "string"
              )
        )
      )
    ).sort();

    return Response.json({
      eventId,
      marketKeys,
      bookmakerCount:
        data.bookmakers?.length ?? 0,
    });
  } catch (error) {
    console.error(
      "NBA market discovery error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong discovering NBA markets.",
      },
      {
        status: 500,
      }
    );
  }
}