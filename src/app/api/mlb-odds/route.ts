export async function GET() {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Missing THE_ODDS_API_KEY" },
        { status: 500 }
      );
    }

    const url =
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds` +
      `?regions=us&markets=h2h,spreads,totals&oddsFormat=decimal&apiKey=${apiKey}`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();

      return Response.json(
        { error: "Odds API failed", details: text },
        { status: res.status }
      );
    }

    const games = await res.json();

    return Response.json({ games });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Something went wrong fetching MLB odds." },
      { status: 500 }
    );
  }
}