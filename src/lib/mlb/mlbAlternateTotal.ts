export type AlternateTotalOutcome = {
  name: "Over" | "Under";
  price: number;
  point: number;
};

export type AlternateTotalMarket = {
  key: string;
  outcomes: AlternateTotalOutcome[];
};

export type AlternateTotalBookmaker = {
  key: string;
  title: string;
  markets: AlternateTotalMarket[];
};

export type AlternateTotalGame = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: AlternateTotalBookmaker[];
};

export type NormalizedAlternateTotal = {
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
export type TotalLineEvaluation = {
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
export type H2HMeetingForTotal = {
  awayScore: number;
  homeScore: number;
};
export type MLBAlternateTotalContext = {
  recentCombinedRunsHome: number[];
  recentCombinedRunsAway: number[];
  h2hCombinedRuns: number[];

  homeStarterERA: number | null;
  awayStarterERA: number | null;

  homeBullpenERA: number | null;
  awayBullpenERA: number | null;
};

export type ScoredAlternateTotal =
  NormalizedAlternateTotal & {
    score: number;

    verdict:
      | "STRONG PLAY"
      | "PLAY"
      | "LEAN"
      | "PASS";

    recentHome:
      TotalLineEvaluation;

    recentAway:
      TotalLineEvaluation;

    h2h:
      TotalLineEvaluation;

    factors: {
      homeRecent: number;
      awayRecent: number;
      h2h: number;
      startingPitching: number;
      bullpen: number;
      bookmakerConsensus: number;
      priceQuality: number;
    };

    reasons: string[];
  };
  function clampScore(
  value: number
) {
  return Math.max(
    0,
    Math.min(10, value)
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

function scoreStarterERA(
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

function scoreBullpenERA(
  direction: "Over" | "Under",
  era: number | null
) {
  if (era === null) {
    return 0;
  }

  if (direction === "Over") {
    if (era >= 5) return 10;
    if (era >= 4.5) return 8;
    if (era >= 4) return 6;
    if (era >= 3.5) return 4;
    return 1;
  }

  if (era <= 3) return 10;
  if (era <= 3.5) return 8;
  if (era <= 4) return 6;
  if (era <= 4.5) return 4;

  return 1;
}

function scoreBookmakerSupport(
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

function scorePriceQuality(
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


export function scoreMLBAlternateTotal(
  candidate: NormalizedAlternateTotal,
  context: MLBAlternateTotalContext
): ScoredAlternateTotal {
  const recentHome =
    evaluateTotalLine(
      context.recentCombinedRunsHome,
      candidate.direction,
      candidate.line
    );

  const recentAway =
    evaluateTotalLine(
      context.recentCombinedRunsAway,
      candidate.direction,
      candidate.line
    );

  const h2h =
    evaluateTotalLine(
      context.h2hCombinedRuns,
      candidate.direction,
      candidate.line
    );

  const averageStarterERA =
    averageNumbers([
      context.homeStarterERA,
      context.awayStarterERA,
    ]);

  const averageBullpenERA =
    averageNumbers([
      context.homeBullpenERA,
      context.awayBullpenERA,
    ]);

  const homeRecentScore =
    scoreHitRate(
      recentHome.hitRate,
      20
    );

  const awayRecentScore =
    scoreHitRate(
      recentAway.hitRate,
      20
    );

  const h2hScore =
    h2h.gamesCounted >= 3
      ? scoreHitRate(
          h2h.hitRate,
          20
        )
      : 0;

  const startingPitchingScore =
    scoreStarterERA(
      candidate.direction,
      averageStarterERA
    );

  const bullpenScore =
    scoreBullpenERA(
      candidate.direction,
      averageBullpenERA
    );

  const bookmakerConsensusScore =
    scoreBookmakerSupport(
      candidate.supportingBookmakers
    );

  const priceQualityScore =
    scorePriceQuality(
      candidate.bestPrice
    );

  const score =
    Number(
      (
        homeRecentScore +
        awayRecentScore +
        h2hScore +
        startingPitchingScore +
        bullpenScore +
        bookmakerConsensusScore +
        priceQualityScore
      ).toFixed(1)
    );

  const verdict:
    ScoredAlternateTotal["verdict"] =
      score >= 85
        ? "STRONG PLAY"
        : score >= 75
          ? "PLAY"
          : score >= 65
            ? "LEAN"
            : "PASS";

  const reasons: string[] = [];

  reasons.push(
    `Home recent ${candidate.direction} ${candidate.line} record: ${recentHome.record}.`
  );

  reasons.push(
    `Away recent ${candidate.direction} ${candidate.line} record: ${recentAway.record}.`
  );

  if (h2h.gamesCounted >= 3) {
    reasons.push(
      `H2H ${candidate.direction} ${candidate.line} record: ${h2h.record}.`
    );
  } else {
    reasons.push(
      "Limited H2H sample receives no historical scoring bonus."
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

  if (
    averageBullpenERA !== null
  ) {
    reasons.push(
      `Average bullpen ERA: ${averageBullpenERA.toFixed(
        2
      )}.`
    );
  }

  reasons.push(
    `${candidate.supportingBookmakers} bookmaker(s) support this alternate line.`
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

      bullpen:
        bullpenScore,

      bookmakerConsensus:
        bookmakerConsensusScore,

      priceQuality:
        priceQualityScore,
    },

    reasons,
  };
}




export function rankMLBAlternateTotals(
  candidates:
    NormalizedAlternateTotal[],
  getContext: (
    candidate:
      NormalizedAlternateTotal
  ) => MLBAlternateTotalContext
) {
  return candidates
    .map(
      (candidate) =>
        scoreMLBAlternateTotal(
          candidate,
          getContext(candidate)
        )
    )
    .sort(
      (a, b) =>
        b.score - a.score
    );
}
export function evaluateTotalLine(
  combinedRuns: number[],
  direction: "Over" | "Under",
  line: number
): TotalLineEvaluation {
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



export function getCombinedRunsFromH2H(
  meetings:
    | H2HMeetingForTotal[]
    | undefined
) {
  return (
    meetings
      ?.map(
        (meeting) =>
          meeting.awayScore +
          meeting.homeScore
      )
      .filter(Number.isFinite) ??
    []
  );
}
export function getCombinedRunsFromRecentGames(
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

export function normalizeMLBAlternateTotals(
  games: AlternateTotalGame[]
): NormalizedAlternateTotal[] {
  const candidates = new Map<
    string,
    NormalizedAlternateTotal
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
            "alternate_totals"
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

  ).sort((a, b) => {
    if (
      a.gameId !== b.gameId
    ) {
      return a.gameId.localeCompare(
        b.gameId
      );
    }

    if (
      a.direction !==
      b.direction
    ) {
      return a.direction.localeCompare(
        b.direction
      );
    }

    return a.line - b.line;
  });
}