const SPORT = "icehockey_nhl";

type OddsOutcome = {
  name: string;
  price: number;
  point?: number;
};

type OddsMarket = {
  key: "h2h" | "spreads" | "totals";
  outcomes: OddsOutcome[];
};

type Bookmaker = {
  key: string;
  title: string;
  markets: OddsMarket[];
};

type RawNHLGame = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

export type NormalizedNHLOddsGame = {
  id: string;
  commenceTime: string;

  homeTeam: string;
  awayTeam: string;

  favorite: string | null;
  underdog: string | null;

  bookmaker: {
    key: string;
    title: string;
  } | null;

  moneyline: {
    home: number | null;
    away: number | null;
  };

  puckLine: {
    homePoint: number | null;
    homePrice: number | null;
    awayPoint: number | null;
    awayPrice: number | null;
  };

  total: {
    point: number | null;
    overPrice: number | null;
    underPrice: number | null;
  };
};

function findOutcome(
  outcomes: OddsOutcome[] | undefined,
  name: string
): OddsOutcome | undefined {
  return outcomes?.find((outcome) => outcome.name === name);
}

function normalizeGame(game: RawNHLGame): NormalizedNHLOddsGame {
  const selectedBookmaker =
    game.bookmakers.find((bookmaker) =>
      bookmaker.markets.some((market) => market.key === "h2h")
    ) ?? game.bookmakers[0];

  if (!selectedBookmaker) {
    return {
      id: game.id,
      commenceTime: game.commence_time,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      favorite: null,
      underdog: null,
      bookmaker: null,
      moneyline: {
        home: null,
        away: null,
      },
      puckLine: {
        homePoint: null,
        homePrice: null,
        awayPoint: null,
        awayPrice: null,
      },
      total: {
        point: null,
        overPrice: null,
        underPrice: null,
      },
    };
  }

  const moneylineMarket = selectedBookmaker.markets.find(
    (market) => market.key === "h2h"
  );

  const spreadMarket = selectedBookmaker.markets.find(
    (market) => market.key === "spreads"
  );

  const totalsMarket = selectedBookmaker.markets.find(
    (market) => market.key === "totals"
  );

  const homeMoneyline = findOutcome(
    moneylineMarket?.outcomes,
    game.home_team
  );

  const awayMoneyline = findOutcome(
    moneylineMarket?.outcomes,
    game.away_team
  );

  const homeSpread = findOutcome(
    spreadMarket?.outcomes,
    game.home_team
  );

  const awaySpread = findOutcome(
    spreadMarket?.outcomes,
    game.away_team
  );

  const over = findOutcome(totalsMarket?.outcomes, "Over");
  const under = findOutcome(totalsMarket?.outcomes, "Under");

  let favorite: string | null = null;
  let underdog: string | null = null;

  if (homeMoneyline && awayMoneyline) {
    if (homeMoneyline.price < awayMoneyline.price) {
      favorite = game.home_team;
      underdog = game.away_team;
    } else if (awayMoneyline.price < homeMoneyline.price) {
      favorite = game.away_team;
      underdog = game.home_team;
    }
  }

  return {
    id: game.id,
    commenceTime: game.commence_time,

    homeTeam: game.home_team,
    awayTeam: game.away_team,

    favorite,
    underdog,

    bookmaker: {
      key: selectedBookmaker.key,
      title: selectedBookmaker.title,
    },

    moneyline: {
      home: homeMoneyline?.price ?? null,
      away: awayMoneyline?.price ?? null,
    },

    puckLine: {
      homePoint: homeSpread?.point ?? null,
      homePrice: homeSpread?.price ?? null,
      awayPoint: awaySpread?.point ?? null,
      awayPrice: awaySpread?.price ?? null,
    },

    total: {
      point: over?.point ?? under?.point ?? null,
      overPrice: over?.price ?? null,
      underPrice: under?.price ?? null,
    },
  };
}

export async function getNHLOdds(): Promise<NormalizedNHLOddsGame[]> {
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing THE_ODDS_API_KEY");
  }

  const url =
    `https://api.the-odds-api.com/v4/sports/${SPORT}/odds` +
    `?regions=us&markets=h2h,spreads,totals` +
    `&oddsFormat=decimal&apiKey=${apiKey}`;

  const response = await fetch(url, {
    next: {
      revalidate: 600,
    },
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `NHL odds request failed with status ${response.status}: ${details}`
    );
  }

  const games = (await response.json()) as RawNHLGame[];

  return games.map(normalizeGame);
}