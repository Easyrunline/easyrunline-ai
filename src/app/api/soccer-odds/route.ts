import { NextRequest, NextResponse } from "next/server";

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


export async function GET(request: NextRequest) {
  const competition =
    request.nextUrl.searchParams.get("competition") ||
    "Premier League";
    

  const sportKey = competitionSportKeys[competition];

  if (!sportKey) {
    return NextResponse.json(
      {
        error: "Unsupported soccer competition.",
      },
      {
        status: 400,
      }
    );
  }

  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "THE_ODDS_API_KEY is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const url = new URL(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds`
    );

    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", "uk,eu");
    url.searchParams.set("markets", "h2h,spreads,totals");
    url.searchParams.set("oddsFormat", "decimal");
    url.searchParams.set("dateFormat", "iso");

    const response = await fetch(url, {
      next: {
        revalidate: 300,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Could not load soccer odds.",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json({
      competition,
      sportKey,
      games: data,
    });
  } catch (error) {
    console.error("Soccer odds route error:", error);

    return NextResponse.json(
      {
        error: "Could not load soccer odds.",
      },
      {
        status: 500,
      }
    );
  }
}