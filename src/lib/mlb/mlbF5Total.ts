export type F5TotalOutcome = {
  name: "Over" | "Under";
  price: number;
  point: number;
};

export type F5TotalMarket = {
  key: string;
  outcomes: F5TotalOutcome[];
};

export type F5TotalBookmaker = {
  key: string;
  title: string;
  markets: F5TotalMarket[];
};

export type F5TotalGame = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: F5TotalBookmaker[];
};

export type NormalizedF5Total = {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;

  direction: "Over" | "Under";
  line: number;

  bestPrice: number;
  bookmaker: string;

  supportingBookmakers: number;
};

export type F5TotalLineEvaluation = {
  direction: "Over" | "Under";
  line: number;

  wins: number;
  losses: number;
  pushes: number;

  gamesCounted: number;

  record: string;
  hitRate: number;

  averageCombinedRuns: number;
};

export type F5TotalContext = {
  recentCombinedRunsHome: number[];
  recentCombinedRunsAway: number[];
  h2hCombinedRuns: number[];

  homeStarterERA: number | null;
  awayStarterERA: number | null;
};

export type ScoredF5Total =
  NormalizedF5Total & {
    score: number;

    verdict:
      | "STRONG PLAY"
      | "PLAY"
      | "LEAN"
      | "PASS";

    recentHome:
      F5TotalLineEvaluation;

    recentAway:
      F5TotalLineEvaluation;

    h2h:
      F5TotalLineEvaluation;

    factors: {
      homeRecent: number;
      awayRecent: number;
      h2h: number;
      startingPitching: number;
      bookmakerConsensus: number;
      priceQuality: number;
    };

    reasons: string[];
  };

  export function normalizeMLBF5Totals(
  games: F5TotalGame[]
): NormalizedF5Total[] {
  const candidates = new Map<
    string,
    NormalizedF5Total
  >();

  for (const game of games) {
    for (
      const bookmaker of
        game.bookmakers ?? []
    ) {
      const market =
        bookmaker.markets.find(
          (item) =>
            item.key ===
            "alternate_totals_1st_5_innings"
        );

      if (!market) {
        continue;
      }

      for (const outcome of market.outcomes) {
        if (
          outcome.name !== "Over" &&
          outcome.name !== "Under"
        ) {
          continue;
        }

        if (
          !Number.isFinite(
            outcome.point
          ) ||
          !Number.isFinite(
            outcome.price
          )
        ) {
          continue;
        }

        const key =
          `${game.id}|${outcome.name}|${outcome.point}`;

        const existing =
          candidates.get(key);

        if (!existing) {
          candidates.set(key, {
            gameId: game.id,
            homeTeam:
              game.home_team,
            awayTeam:
              game.away_team,
            commenceTime:
              game.commence_time,

            direction:
              outcome.name,
            line:
              outcome.point,

            bestPrice:
              outcome.price,
            bookmaker:
              bookmaker.title,

            supportingBookmakers: 1,
          });

          continue;
        }

        existing.supportingBookmakers += 1;

        if (
          outcome.price >
          existing.bestPrice
        ) {
          existing.bestPrice =
            outcome.price;

          existing.bookmaker =
            bookmaker.title;
        }
      }
    }
  }

  return Array.from(
  candidates.values()
).filter(
  (candidate) =>
    candidate.bestPrice >= 1.20
);
}

export function evaluateF5TotalLine(
  combinedRuns: number[],
  direction: "Over" | "Under",
  line: number
): F5TotalLineEvaluation {
  let wins = 0;
  let losses = 0;
  let pushes = 0;

  for (const total of combinedRuns) {
    if (total === line) {
      pushes += 1;
      continue;
    }

    if (direction === "Over") {
      if (total > line) {
        wins += 1;
      } else {
        losses += 1;
      }
    } else {
      if (total < line) {
        wins += 1;
      } else {
        losses += 1;
      }
    }
  }

  const gamesCounted =
    wins + losses + pushes;

  const decidedGames =
    wins + losses;

  const hitRate =
    decidedGames > 0
      ? Number(
          (
            (wins / decidedGames) *
            100
          ).toFixed(1)
        )
      : 0;

  const averageCombinedRuns =
    combinedRuns.length > 0
      ? Number(
          (
            combinedRuns.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            combinedRuns.length
          ).toFixed(2)
        )
      : 0;

  return {
    direction,
    line,
    wins,
    losses,
    pushes,
    gamesCounted,
    record:
      `${wins}-${losses}-${pushes}`,
    hitRate,
    averageCombinedRuns,
  };
}
export function getCombinedRunsFromRecentF5Games(
  recentGames:
    | {
        combinedRuns: number;
      }[]
    | undefined
) {
  return (
    recentGames
      ?.map(
        (game) =>
          game.combinedRuns
      )
      .filter(Number.isFinite) ??
    []
  );
}

export function getCombinedRunsFromF5H2H(
  meetings:
    | {
        awayF5Score: number;
        homeF5Score: number;
      }[]
    | undefined
) {
  return (
    meetings
      ?.map(
        (meeting) =>
          meeting.awayF5Score +
          meeting.homeF5Score
      )
      .filter(Number.isFinite) ??
    []
  );
}

function scoreHitRate(
  hitRate: number,
  weight: number
) {
  return (
    Math.max(
      0,
      Math.min(100, hitRate)
    ) /
    100
  ) * weight;
}

function averageNumbers(
  values: (number | null)[]
) {
  const valid =
    values.filter(
      (value): value is number =>
        value !== null &&
        Number.isFinite(value)
    );

  if (valid.length === 0) {
    return null;
  }

  return (
    valid.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / valid.length
  );
}

function scoreF5StarterERA(
  direction: "Over" | "Under",
  era: number | null
) {
  if (era === null) {
    return 0;
  }

  if (direction === "Over") {
    if (era >= 5) return 15;
    if (era >= 4.5) return 13;
    if (era >= 4) return 10;
    if (era >= 3.5) return 6;

    return 2;
  }

  if (era <= 3) return 15;
  if (era <= 3.5) return 13;
  if (era <= 4) return 10;
  if (era <= 4.5) return 6;

  return 2;
}

function scoreF5BookmakerSupport(
  bookmakers: number
) {
  if (bookmakers >= 6) return 10;
  if (bookmakers === 5) return 9;
  if (bookmakers === 4) return 8;
  if (bookmakers === 3) return 6;
  if (bookmakers === 2) return 4;
  if (bookmakers === 1) return 2;

  return 0;
}

function scoreF5PriceQuality(
  price: number
) {
  if (price < 1.12) return 0;
  if (price < 1.2) return 1;
  if (price < 1.3) return 3;

  if (
    price >= 1.3 &&
    price <= 1.8
  ) {
    return 5;
  }

  if (price <= 2) {
    return 4;
  }

  return 3;
}

export function scoreMLBF5Total(
  candidate: NormalizedF5Total,
  context: F5TotalContext
): ScoredF5Total {
  const recentHome =
    evaluateF5TotalLine(
      context.recentCombinedRunsHome,
      candidate.direction,
      candidate.line
    );

  const recentAway =
    evaluateF5TotalLine(
      context.recentCombinedRunsAway,
      candidate.direction,
      candidate.line
    );

  const h2h =
    evaluateF5TotalLine(
      context.h2hCombinedRuns,
      candidate.direction,
      candidate.line
    );

  const averageStarterERA =
    averageNumbers([
      context.homeStarterERA,
      context.awayStarterERA,
    ]);

  const homeRecentScore =
    scoreHitRate(
      recentHome.hitRate,
      25
    );

  const awayRecentScore =
    scoreHitRate(
      recentAway.hitRate,
      25
    );

  const h2hScore =
    h2h.gamesCounted >= 3
      ? scoreHitRate(
          h2h.hitRate,
          20
        )
      : 0;

  const startingPitchingScore =
    scoreF5StarterERA(
      candidate.direction,
      averageStarterERA
    );

  const bookmakerConsensusScore =
    scoreF5BookmakerSupport(
      candidate.supportingBookmakers
    );

  const priceQualityScore =
    scoreF5PriceQuality(
      candidate.bestPrice
    );

  const score =
    Number(
      (
        homeRecentScore +
        awayRecentScore +
        h2hScore +
        startingPitchingScore +
        bookmakerConsensusScore +
        priceQualityScore
      ).toFixed(1)
    );

  const verdict:
    ScoredF5Total["verdict"] =
      score >= 85
        ? "STRONG PLAY"
        : score >= 75
          ? "PLAY"
          : score >= 65
            ? "LEAN"
            : "PASS";

  const reasons: string[] = [];

  reasons.push(
    `Home recent F5 ${candidate.direction} ${candidate.line} record: ${recentHome.record}.`
  );

  reasons.push(
    `Away recent F5 ${candidate.direction} ${candidate.line} record: ${recentAway.record}.`
  );

  if (h2h.gamesCounted >= 3) {
    reasons.push(
      `H2H F5 ${candidate.direction} ${candidate.line} record: ${h2h.record}.`
    );
  } else {
    reasons.push(
      "Limited F5 H2H sample receives no historical scoring bonus."
    );
  }

  if (
    averageStarterERA !== null
  ) {
    reasons.push(
      `Average starting-pitcher ERA: ${averageStarterERA.toFixed(
        2
      )}.`
    );
  }

  reasons.push(
    `${candidate.supportingBookmakers} bookmaker(s) support this F5 alternate total.`
  );

  reasons.push(
    `Best available price: ${candidate.bestPrice}.`
  );

  return {
    ...candidate,

    score,
    verdict,

    recentHome,
    recentAway,
    h2h,

    factors: {
      homeRecent:
        Number(
          homeRecentScore.toFixed(1)
        ),

      awayRecent:
        Number(
          awayRecentScore.toFixed(1)
        ),

      h2h:
        Number(
          h2hScore.toFixed(1)
        ),

      startingPitching:
        startingPitchingScore,

      bookmakerConsensus:
        bookmakerConsensusScore,

      priceQuality:
        priceQualityScore,
    },

    reasons,
  };
}

export function rankMLBF5Totals(
  candidates:
    NormalizedF5Total[],
  getContext: (
    candidate:
      NormalizedF5Total
  ) => F5TotalContext
) {
  return candidates
    .map(
      (candidate) =>
        scoreMLBF5Total(
          candidate,
          getContext(candidate)
        )
    )
    .sort(
      (a, b) =>
        b.score - a.score
    );
}