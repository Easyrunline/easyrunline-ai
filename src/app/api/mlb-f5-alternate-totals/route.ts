type MLBEvent = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
};

export async function GET() {
  try {
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

    const eventsUrl =
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/events` +
      `?apiKey=${apiKey}`;

    const eventsResponse =
      await fetch(eventsUrl, {
        next: {
          revalidate: 600,
        },
      });

    if (!eventsResponse.ok) {
      const text =
        await eventsResponse.text();

      return Response.json(
        {
          error:
            "Could not load MLB events.",
          details: text,
        },
        {
          status:
            eventsResponse.status,
        }
      );
    }

    const events =
      (await eventsResponse.json()) as
        MLBEvent[];

    const games =
      await Promise.all(
        events.map(
          async (event) => {
            try {
              const oddsUrl =
                `https://api.the-odds-api.com/v4/sports/baseball_mlb/events/${event.id}/odds` +
                `?regions=us&markets=alternate_totals_1st_5_innings&oddsFormat=decimal&apiKey=${apiKey}`;

              const oddsResponse =
                await fetch(oddsUrl, {
                  next: {
                    revalidate: 600,
                  },
                });

              if (
                !oddsResponse.ok
              ) {
                return {
                  id: event.id,
                  home_team:
                    event.home_team,
                  away_team:
                    event.away_team,
                  commence_time:
                    event.commence_time,
                  bookmakers: [],
                  error:
                    "F5 alternate totals unavailable.",
                };
              }

              return await oddsResponse.json();
            } catch {
              return {
                id: event.id,
                home_team:
                  event.home_team,
                away_team:
                  event.away_team,
                commence_time:
                  event.commence_time,
                bookmakers: [],
                error:
                  "F5 alternate totals request failed.",
              };
            }
          }
        )
      );

    return Response.json(
      {
        games,
        gamesCount:
          games.length,
        cacheMinutes: 10,
        fetchedAt:
          new Date().toISOString(),
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
      "MLB F5 alternate totals error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong fetching MLB F5 alternate totals.",
      },
      {
        status: 500,
      }
    );
  }
}