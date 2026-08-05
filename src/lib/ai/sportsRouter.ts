export type SupportedSport =
  | "mlb"
  | "nba"
  | "wnba"
  | "nfl"
  | "nhl"
  | "soccer"
  | "general";

export type SportsIntent =
  | "general_knowledge"
  | "best_bet"
  | "compare_games"
  | "explain_pick"
  | "market_breakdown"
  | "games_to_avoid"
  | "team_analysis"
  | "player_analysis"
  | "schedule"
  | "standings"
  | "injury_update"
  | "platform_help"
  | "unknown";

export type RouterConfidence =
  | "high"
  | "medium"
  | "low";

export type SportsRoute = {
  sport: SupportedSport;
  intent: SportsIntent;
  confidence: RouterConfidence;
};

const SPORT_KEYWORDS: Record<
  Exclude<SupportedSport, "general">,
  string[]
> = {
  mlb: [
    "mlb",
    "baseball",
    "run line",
    "f5",
    "first 5",
    "first five",
    "pitcher",
    "bullpen",
    "whip",
    "era",
  ],

  nba: [
  "nba",
  "basketball",
  "offensive rating",
  "defensive rating",
  "net rating",
  "effective field goal",
  "three pointer",
  "free throw",
  "rebound",
  "assist",
],

  wnba: [
    "wnba",
    "aces",
    "liberty",
    "lynx",
    "fever",
    "sky",
    "sun",
    "mercury",
    "storm",
    "wings",
    "mystics",
    "dream",
    "valkyries",
  ],

  nfl: [
    "nfl",
    "football",
    "quarterback",
    "touchdown",
    "passing yards",
    "rushing yards",
  ],

  nhl: [
    "nhl",
    "hockey",
    "puck line",
    "goalie",
    "goaltender",
    "shots on goal",
  ],

  soccer: [
    "soccer",
    "premier league",
    "champions league",
    "la liga",
    "serie a",
    "bundesliga",
    "ligue 1",
    "asian handicap",
    "double chance",
    "over 1.5 goals",
    "under 4.5 goals",
  ],
};

function includesAny(
  text: string,
  keywords: string[]
) {
  return keywords.some((keyword) =>
    text.includes(keyword)
  );
}

export function detectSport(
  question: string
): {
  sport: SupportedSport;
  confidence: RouterConfidence;
} {
  const text = question.toLowerCase().trim();

  if (!text) {
    return {
      sport: "general",
      confidence: "low",
    };
  }

  const matches = Object.entries(
    SPORT_KEYWORDS
  ).filter(([, keywords]) =>
    includesAny(text, keywords)
  );

  if (matches.length === 1) {
    return {
      sport:
        matches[0][0] as SupportedSport,
      confidence: "high",
    };
  }

  if (matches.length > 1) {
    const explicitLeague = matches.find(
      ([sport]) => text.includes(sport)
    );

    if (explicitLeague) {
      return {
        sport:
          explicitLeague[0] as SupportedSport,
        confidence: "high",
      };
    }

    return {
      sport:
        matches[0][0] as SupportedSport,
      confidence: "medium",
    };
  }

  return {
    sport: "general",
    confidence: "low",
  };
}

export function detectIntent(
  question: string
): SportsIntent {
  const text = question.toLowerCase().trim();

  if (!text) {
    return "unknown";
  }

  if (
  includesAny(text, [
    "best bet",
    "best bets",
    "safest bet",
    "safest pick",
    "safest selection",
    "safest spread",
    "safest total",
    "safest moneyline",
    "safest handicap",
    "best pick",
    "best selection",
    "best spread",
    "best total",
    "best moneyline",
    "best handicap",
    "highest probability",
    "best alternate",
    "strongest play",
    "top play",
    "top pick",
  ])
) {
  return "best_bet";
}

 if (
  includesAny(text, [
    "compare",
    "difference between",
    "matter more",
    "more important",
    "which is safer",
    "which game is better",
    "versus the other",
  ])
) {
  return "compare_games";
}

  if (
    includesAny(text, [
      "why this pick",
      "explain this pick",
      "why did",
      "why is",
      "explain the erl score",
    ])
  ) {
    return "explain_pick";
  }

  if (
    includesAny(text, [
      "games to avoid",
      "avoid today",
      "which games should i avoid",
      "high risk games",
    ])
  ) {
    return "games_to_avoid";
  }

  if (
  includesAny(text, [
    "spread breakdown",
    "total breakdown",
    "moneyline breakdown",
    "market breakdown",
    "line movement",
    "implied probability",
    "alternate spread",
    "point spread",
    "moneyline",
    "game total",
    "team total",
    "over under",
    "over/under",
  ])
) {
  return "market_breakdown";
}

  if (
    includesAny(text, [
      "team analysis",
      "analyse the team",
      "analyze the team",
      "tell me about the team",
      "team form",
    ])
  ) {
    return "team_analysis";
  }

  if (
    includesAny(text, [
      "player analysis",
      "tell me about",
      "player stats",
      "pitcher stats",
      "quarterback stats",
    ])
  ) {
    return "player_analysis";
  }

  if (
  includesAny(text, [
    "schedule",
    "fixtures",
    "games today",
    "games tonight",
    "matches today",
    "matches tonight",
    "who plays today",
    "who plays tonight",
    "next game",
    "next match",
  ])
) {
  return "schedule";
}

  if (
    includesAny(text, [
      "standings",
      "league table",
      "conference table",
      "division standings",
    ])
  ) {
    return "standings";
  }

  if (
    includesAny(text, [
      "injury",
      "injured",
      "available tonight",
      "lineup status",
    ])
  ) {
    return "injury_update";
  }

  if (
    includesAny(text, [
      "how does easyrunline work",
      "how do i use",
      "erl score",
      "easy run line website",
      "easyrunline website",
    ])
  ) {
    return "platform_help";
  }

  if (
    includesAny(text, [
      "what is",
      "what does",
      "meaning of",
      "explain",
      "how does",
      "how do",
    ])
  ) {
    return "general_knowledge";
  }

  return "unknown";
}

export function routeSportsQuestion(
  question: string
): SportsRoute {
  const sportResult = detectSport(question);
  const intent = detectIntent(question);

  return {
    sport: sportResult.sport,
    intent,
    confidence:
      sportResult.confidence,
  };
}