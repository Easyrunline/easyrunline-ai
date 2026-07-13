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
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds` +
      `?regions=us&markets=h2h,spreads,totals&oddsFormat=decimal&apiKey=${apiKey}`;

    const res = await fetch(url, {
  next: {
    revalidate: 900,
  },
});

    if (!res.ok) {
      const text = await res.text();

      return Response.json(
        { error: "NFL Odds API failed", details: text },
        { status: res.status }
      );
    }

    const games = await res.json();

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
    console.error(error);

    return Response.json(
      { error: "Something went wrong fetching NFL odds." },
      { status: 500 }
    );
  }
}