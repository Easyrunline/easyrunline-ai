export type Outcome = {
  name: string;
  price: number;
  point?: number;
};

export type Market = {
  key: string;
  outcomes: Outcome[];
};

export type Bookmaker = {
  title: string;
  markets: Market[];
};

export type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers?: Bookmaker[];
};

export type ScoredPick = {
  team: string;
  opponent: string;
  side: "home" | "away";
  moneyline: number;
  standardRunLine?: string;
  bookmaker: string;
  score: number;
  reasons: string[];
};

export function getUnderdogPick(game: Game): ScoredPick | null {
  const bookmaker = game.bookmakers?.[0];
  const moneyline = bookmaker?.markets.find((market) => market.key === "h2h");
  const spread = bookmaker?.markets.find((market) => market.key === "spreads");

  if (!bookmaker || !moneyline || moneyline.outcomes.length < 2) return null;

  const awayMl = moneyline.outcomes.find((o) => o.name === game.away_team);
  const homeMl = moneyline.outcomes.find((o) => o.name === game.home_team);

  if (!awayMl || !homeMl) return null;

  const underdog = awayMl.price > homeMl.price ? awayMl : homeMl;
  const favorite = awayMl.price > homeMl.price ? homeMl : awayMl;

  const isHome = underdog.name === game.home_team;
  const opponent = favorite.name;

  let score = 50;
  const reasons: string[] = [];

  score += 20;
  reasons.push("Valid EasyRunLine underdog +4.5 candidate");

  if (isHome) {
    score += 8;
    reasons.push("Home underdog protection");
  }

  const mlGap = underdog.price - favorite.price;

  if (mlGap <= 0.45) {
    score += 18;
    reasons.push("Small moneyline gap suggests competitive matchup");
  } else if (mlGap <= 0.9) {
    score += 10;
    reasons.push("Moderate moneyline gap");
  } else {
    score -= 8;
    reasons.push("Wide moneyline gap increases blowout risk");
  }

  if (underdog.price <= 2.25) {
    score += 10;
    reasons.push("Market does not price this team as a heavy underdog");
  } else if (underdog.price <= 2.8) {
    score += 4;
    reasons.push("Playable underdog range");
  } else {
    score -= 6;
    reasons.push("Heavy underdog profile");
  }

  const underdogSpread = spread?.outcomes.find((o) => o.name === underdog.name);

  if (underdogSpread?.point === 1.5) {
    score += 8;
    reasons.push("Sportsbook standard run line supports this underdog at +1.5");
  }

  if (underdog.price >= 3.0) {
    score = Math.min(score, 78);
  } else if (underdog.price >= 2.6) {
    score = Math.min(score, 84);
  } else if (underdog.price >= 2.25) {
    score = Math.min(score, 90);
  } else {
    score = Math.min(score, 94);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    team: underdog.name,
    opponent,
    side: isHome ? "home" : "away",
    moneyline: underdog.price,
    standardRunLine:
      underdogSpread?.point !== undefined
        ? `${underdogSpread.point} at ${underdogSpread.price}`
        : "Not available",
    bookmaker: bookmaker.title || "Not available",
    score,
    reasons,
  };
}

export function rankEasyRunLinePicks(games: Game[]) {
  return games
    .map((game) => getUnderdogPick(game))
    .filter((pick): pick is ScoredPick => pick !== null)
    .sort((a, b) => b.score - a.score);
}