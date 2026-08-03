"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import GameCard from "@/components/GameCard";
import LeagueHeader from "@/components/LeagueHeader";
import MarketCard from "@/components/MarketCard";
import { getWNBALogoUrl } from "@/lib/wnba/wnbaLogos";
import {
  buildWNBAIntelligence,
  type RankedWNBAGame,
} from "@/lib/wnba/wnbaIntelligence";

import {
  findWNBATeamForm,
  type WNBATeamForm,
} from "@/lib/wnba/wnbaForm";

import {
  buildWNBASpreadHistoricalAnalysis,
} from "@/lib/wnba/wnbaSpreadHistory";

 import {
  findSafestWNBAAvailableSpread,
  type WNBAAlternateSpreadBookmaker,
  type WNBAAlternateSpreadSelection,
} from "@/lib/wnba/wnbaAlternateSpread";
import {
  findSafestWNBAAlternateTotal,
  type WNBAAlternateTotalBookmaker,
  type WNBAAlternateTotalSelection,
} from "@/lib/wnba/wnbaAlternateTotal";

import {
  findSafestWNBAFirstQuarterTotal,
  type WNBAFirstQuarterTotalBookmaker,
  type WNBAFirstQuarterTotalSelection,
} from "@/lib/wnba/wnbaFirstQuarterTotal";

import {
  findSafestWNBAFirstHalfTotal,
  type WNBAFirstHalfTotalBookmaker,
  type WNBAFirstHalfTotalSelection,
} from "@/lib/wnba/wnbaFirstHalfTotal";

import {
  buildWNBAFirstHalfTotalHistoricalAnalysis,
} from "@/lib/wnba/wnbaFirstHalfTotalHistory";

import type {
  WNBAGame,
  WNBAHistoricalGame,
  WNBAHistoryResponse,
  WNBAMarket,
  WNBAOddsResponse,
  WNBAOutcome,
} from "@/lib/wnba/wnbaTypes";
import {
  buildWNBATotalHistoricalAnalysis,
  getWNBATotalFinalVerdict,
} from "@/lib/wnba/wnbaTotalHistory";
  


function formatPrice(price?: number) {
  if (!Number.isFinite(price)) {
    return "N/A";
  }

  return Number(price).toFixed(2);
}
function formatMarketImpliedProbability(
  price?: number
) {
  if (
    !Number.isFinite(price) ||
    price! <= 1
  ) {
    return "N/A";
  }

  return `${(
    (1 / price!) *
    100
  ).toFixed(1)}%`;
}


function calculateMedian(
  values: number[]
) {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [
    ...values,
  ].sort(
    (first, second) =>
      first - second
  );

  const middleIndex =
    Math.floor(
      sortedValues.length / 2
    );

  if (
    sortedValues.length % 2 ===
    0
  ) {
    return (
      sortedValues[middleIndex - 1] +
      sortedValues[middleIndex]
    ) / 2;
  }

  return sortedValues[middleIndex];
}

function formatPoint(point?: number) {
  if (!Number.isFinite(point)) {
    return "N/A";
  }

  return point! > 0
    ? `+${point}`
    : `${point}`;
}

function findMarket(
  game: WNBAGame,
  marketKey: string
): {
  bookmaker: string;
  market: WNBAMarket;
} | null {
  for (const bookmaker of game.bookmakers ?? []) {
    const market = bookmaker.markets.find(
      (item) => item.key === marketKey
    );

    if (market) {
      return {
        bookmaker: bookmaker.title,
        market,
      };
    }
  }

  return null;
}

function findOutcome(
  outcomes: WNBAOutcome[],
  outcomeName: string
) {
  return outcomes.find(
    (outcome) => outcome.name === outcomeName
  );
}
function calculateImpliedProbabilities(
  homePrice?: number,
  awayPrice?: number
) {
  if (
    !Number.isFinite(homePrice) ||
    !Number.isFinite(awayPrice) ||
    homePrice! <= 1 ||
    awayPrice! <= 1
  ) {
    return null;
  }

  const rawHomeProbability = 1 / homePrice!;
  const rawAwayProbability = 1 / awayPrice!;

  const marketTotal =
    rawHomeProbability + rawAwayProbability;

  if (marketTotal <= 0) {
    return null;
  }

  return {
    home:
      (rawHomeProbability / marketTotal) * 100,
    away:
      (rawAwayProbability / marketTotal) * 100,
  };
}
type WNBAAlternateSpreadResponse = {
  available?: boolean;
  eventId?: string;

  bookmakers?: WNBAAlternateSpreadBookmaker[];

  error?: string;
  details?: unknown;
  message?: string;
};
type WNBAAlternateSpreadPick =
  WNBAAlternateSpreadSelection & {
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;

    erlScore: number;
    probabilityEdge: number;
    confidence: RankedWNBAGame["confidence"];
    dataCompleteness: number;
  };

  type WNBAAlternateTotalResponse = {
  available?: boolean;
  eventId?: string;

  bookmakers?: WNBAAlternateTotalBookmaker[];

  error?: string;
  details?: unknown;
  message?: string;
};

type WNBAAlternateTotalPick =
  WNBAAlternateTotalSelection & {
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;

    erlScore: number;
    probabilityEdge: number;
    confidence: RankedWNBAGame["confidence"];
    dataCompleteness: number;
  };
  type WNBAFirstHalfTotalResponse = {
  available?: boolean;
  eventId?: string;

  bookmakers?: WNBAFirstHalfTotalBookmaker[];

  error?: string;
  details?: unknown;
  message?: string;
};

type WNBAFirstHalfTotalPick =
  WNBAFirstHalfTotalSelection & {
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;

    erlScore: number;
    probabilityEdge: number;
    confidence: RankedWNBAGame["confidence"];
    dataCompleteness: number;
  };
  type WNBAFirstQuarterTotalResponse = {
  available?: boolean;
  eventId?: string;

  bookmakers?: WNBAFirstQuarterTotalBookmaker[];

  error?: string;
  details?: unknown;
  message?: string;
};

type WNBAFirstQuarterTotalPick =
  WNBAFirstQuarterTotalSelection & {
    eventId: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
  };
  type WNBAHistoryWithFormsResponse =
  WNBAHistoryResponse & {
    teams?: WNBATeamForm[];
  };
export default function WNBAPage() {
  const [games, setGames] = useState<WNBAGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamForms, setTeamForms] =
  useState<WNBATeamForm[]>([]);

const [
  historicalGames,
  setHistoricalGames,
] = useState<WNBAHistoricalGame[]>([]);

const [historyMessage, setHistoryMessage] =
  useState("");
  const [
  safestAlternateSpread,
  setSafestAlternateSpread,
] =
  useState<WNBAAlternateSpreadPick | null>(
    null
  );

const [
  safestAlternateSpreadMessage,
  setSafestAlternateSpreadMessage,
] = useState("");

const [
  safestAlternateSpreadLoading,
  setSafestAlternateSpreadLoading,
] = useState(false);
const [
  safestAlternateTotal,
  setSafestAlternateTotal,
] =
  useState<WNBAAlternateTotalPick | null>(
    null
  );

const [
  safestAlternateTotalMessage,
  setSafestAlternateTotalMessage,
] = useState("");

const [
  safestAlternateTotalLoading,
  setSafestAlternateTotalLoading,
] = useState(false);

const [
  safestFirstHalfTotal,
  setSafestFirstHalfTotal,
] =
  useState<WNBAFirstHalfTotalPick | null>(
    null
  );

const [
  safestFirstHalfTotalMessage,
  setSafestFirstHalfTotalMessage,
] = useState("");

const [
  safestFirstHalfTotalLoading,
  setSafestFirstHalfTotalLoading,
] = useState(false);
const [
  safestFirstQuarterTotal,
  setSafestFirstQuarterTotal,
] =
  useState<WNBAFirstQuarterTotalPick | null>(
    null
  );

const [
  safestFirstQuarterTotalMessage,
  setSafestFirstQuarterTotalMessage,
] = useState("");

const [
  safestFirstQuarterTotalLoading,
  setSafestFirstQuarterTotalLoading,
] = useState(false);
  const rankedGames =
    useMemo<RankedWNBAGame[]>(
      () =>
        buildWNBAIntelligence(
          games
        ),
      [games]
    );

    const safestAlternateSpreadHistory =
  useMemo(() => {
    if (
      !safestAlternateSpread ||
      historicalGames.length === 0
    ) {
      return null;
    }

    const selectedTeamIsHome =
      safestAlternateSpread.team ===
      safestAlternateSpread.homeTeam;

    const opponent =
      selectedTeamIsHome
        ? safestAlternateSpread.awayTeam
        : safestAlternateSpread.homeTeam;

    return buildWNBASpreadHistoricalAnalysis({
      selectedTeam:
        safestAlternateSpread.team,

      opponent,

      selectedLine:
        safestAlternateSpread.point,

      homeTeam:
        safestAlternateSpread.homeTeam,

      commenceTime:
        safestAlternateSpread.commenceTime,

      historicalGames,
    });
  }, [
    safestAlternateSpread,
    historicalGames,
  ]);
  const safestAlternateTotalHistory =
  useMemo(() => {
    if (
      !safestAlternateTotal ||
      historicalGames.length === 0
    ) {
      return null;
    }

    return buildWNBATotalHistoricalAnalysis(
      historicalGames,
      {
        direction:
          safestAlternateTotal.direction,

        selectedTotal:
          safestAlternateTotal.point,

        homeTeam:
          safestAlternateTotal.homeTeam,

        awayTeam:
          safestAlternateTotal.awayTeam,
      }
    );
  }, [
    safestAlternateTotal,
    historicalGames,
  ]);
    

  const safestFirstHalfTotalHistory =
    useMemo(() => {
      if (
        !safestFirstHalfTotal ||
        historicalGames.length === 0
      ) {
        return null;
      }

      return buildWNBAFirstHalfTotalHistoricalAnalysis(
        historicalGames,
        {
          direction:
            safestFirstHalfTotal.direction,

          selectedTotal:
            safestFirstHalfTotal.point,

          homeTeam:
            safestFirstHalfTotal.homeTeam,

          awayTeam:
            safestFirstHalfTotal.awayTeam,
        }
      );
    }, [
      safestFirstHalfTotal,
      historicalGames,
    ]);

    const safestFirstHalfTotalFinalVerdict =
  useMemo(() => {
    if (
      !safestFirstHalfTotal ||
      !safestFirstHalfTotalHistory
    ) {
      return null;
    }

    return getWNBATotalFinalVerdict(
      safestFirstHalfTotal.qualification,
      safestFirstHalfTotalHistory
    );
  }, [
    safestFirstHalfTotal,
    safestFirstHalfTotalHistory,
  ]);

  
  const safestAlternateTotalFinalVerdict =
  useMemo(() => {
    if (
      !safestAlternateTotal ||
      !safestAlternateTotalHistory
    ) {
      return null;
    }

    return getWNBATotalFinalVerdict(
      safestAlternateTotal.qualification,
      safestAlternateTotalHistory
    );
  }, [
    safestAlternateTotal,
    safestAlternateTotalHistory,
  ]);
  async function loadGames() {
    setSafestAlternateSpread(null);
setSafestAlternateSpreadMessage("");

setSafestAlternateTotal(null);
setSafestAlternateTotalMessage("");
setSafestFirstHalfTotal(null);
setSafestFirstHalfTotalMessage("");
setSafestFirstQuarterTotal(null);
setSafestFirstQuarterTotalMessage("");
    
setLoading(true);
setError("");
setHistoryMessage("");
setHistoricalGames([]);

    try {
      const [
  oddsResponse,
  historyResponse,
] = await Promise.all([
  fetch("/api/wnba-odds", {
    cache: "no-store",
  }),

  fetch(
    "/api/wnba-history?season=2026",
    {
      cache: "no-store",
    }
  ),
]);

const data =
  (await oddsResponse.json()) as
    WNBAOddsResponse;

const historyData =
  (await historyResponse.json()) as
    WNBAHistoryWithFormsResponse;

      if (!oddsResponse.ok) {
        setError(
          data.error ||
            "Could not load WNBA games."
        );
        return;
      }


      if (historyResponse.ok) {
  setTeamForms(
    historyData.teams ?? []
  );

  setHistoricalGames(
    historyData.games ?? []
  );
} else {
  setTeamForms([]);
  setHistoricalGames([]);

  setHistoryMessage(
    historyData.error ||
      "Historical WNBA form is temporarily unavailable."
  );
}

      const uniqueGames = Array.from(
        new Map(
          (data.games ?? []).map((game) => [
            game.id,
            game,
          ])
        ).values()
      ).sort(
        (firstGame, secondGame) =>
          new Date(
            firstGame.commence_time
          ).getTime() -
          new Date(
            secondGame.commence_time
          ).getTime()
      );

      setGames(uniqueGames);
    } catch (error) {
      console.error(
        "WNBA game loading error:",
        error
      );
      setTeamForms([]);
  setHistoricalGames([]);

      setError(
        "Could not load WNBA games."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGames();
  }, []);
  async function findSafestAlternateSpread() {
    setSafestFirstQuarterTotal(null);
setSafestFirstQuarterTotalMessage("");
  setSafestAlternateSpread(null);
  setSafestAlternateSpreadMessage("");
  setSafestAlternateTotal(null);
setSafestAlternateTotalMessage("");
setSafestFirstHalfTotal(null);
setSafestFirstHalfTotalMessage("");

  if (
    games.length === 0 ||
    rankedGames.length === 0
  ) {
    setSafestAlternateSpreadMessage(
      "No WNBA games are currently available for alternate-spread analysis."
    );
    return;
  }

  setSafestAlternateSpreadLoading(true);

  try {
    const candidates = await Promise.all(
      games.map(async (game) => {
  
        const intelligence =
          rankedGames.find(
            (rankedGame) =>
              rankedGame.eventId === game.id
          );

        if (!intelligence) {
          return null;
        }

        const params =
          new URLSearchParams({
            eventId: game.id,
          });

        const response = await fetch(
          `/api/wnba-alternate-spreads?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as
            WNBAAlternateSpreadResponse;

        if (
          !response.ok ||
          !data.available ||
          !data.bookmakers
        ) {
          return null;
        }

        const selection =
          findSafestWNBAAvailableSpread(
            data.bookmakers,
            {
              homeTeam: game.home_team,
              awayTeam: game.away_team,

              preferredTeam:
                intelligence.preferredTeam,

              erlScore:
                intelligence.erlScore,

              probabilityEdge:
                intelligence.probabilityEdge,

              confidence:
                intelligence.confidence,

              dataCompleteness:
                intelligence.dataCompleteness,

              bookmakerCount:
                intelligence.bookmakerCount,

              avoid:
                intelligence.avoid,
            }
          );

        if (!selection) {
          return null;
        }

        return {
          ...selection,

          eventId: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          commenceTime:
            game.commence_time,

          erlScore:
            intelligence.erlScore,

          probabilityEdge:
            intelligence.probabilityEdge,

          confidence:
            intelligence.confidence,

          dataCompleteness:
            intelligence.dataCompleteness,
        } satisfies WNBAAlternateSpreadPick;
      })
    );

    const availableCandidates =
      candidates.filter(
        (
          candidate
        ): candidate is WNBAAlternateSpreadPick =>
          candidate !== null
      );

    availableCandidates.sort(
      (first, second) => {
        if (
          second.safetyScore !==
          first.safetyScore
        ) {
          return (
            second.safetyScore -
            first.safetyScore
          );
        }

        return (
          second.price -
          first.price
        );
      }
    );

    const safest =
      availableCandidates[0];

    if (!safest) {
      setSafestAlternateSpreadMessage(
        "No verified WNBA alternate spread satisfied the current price and safety requirements."
      );
      return;
    }

    setSafestAlternateSpread(
      safest
    );

    const verdictMessage =
  safest.qualification === "PLAY"
    ? "STRONG PLAY — the selection satisfies the current market, protection, price and matchup requirements."
    : safest.qualification === "LEAN"
      ? "LEAN — the selection has useful protection, but one or more confidence requirements remain below the strong-play standard."
      : "PASS — this is the highest-ranked verified option available, but it does not satisfy enough requirements for an EasyRunLine recommendation.";

setSafestAlternateSpreadMessage(
  `${safest.team} ${formatPoint(
    safest.point
  )} at ${formatPrice(
    safest.price
  )}. ${verdictMessage}`
);
  } catch (error) {
    console.error(
      "WNBA alternate-spread analysis error:",
      error
    );

    setSafestAlternateSpreadMessage(
      "Could not complete the WNBA alternate-spread analysis."
    );
  } finally {
    setSafestAlternateSpreadLoading(false);
  }
}
async function findSafestAlternateTotal() {
  setSafestAlternateTotal(null);
setSafestAlternateTotalMessage("");
  

  setSafestAlternateSpread(null);
  setSafestAlternateSpreadMessage("");
  

  if (games.length === 0) {
    setSafestAlternateTotalMessage(
      "No WNBA games are currently available for alternate-total analysis."
    );
    return;
  }

  setSafestAlternateTotalLoading(true);

  try {
    const candidates =
      await Promise.all(
        games.map(async (game) => {
          const intelligence =
  rankedGames.find(
    (rankedGame) =>
      rankedGame.eventId === game.id
  );

if (!intelligence) {
  return null;
}
          const standardTotalPoints =
            game.bookmakers.flatMap(
              (bookmaker) =>
                bookmaker.markets
                  .filter(
                    (market) =>
                      market.key ===
                      "totals"
                  )
                  .flatMap((market) =>
                    market.outcomes
                      .filter(
                        (outcome) =>
                          outcome.name ===
                            "Over" &&
                          Number.isFinite(
                            outcome.point
                          )
                      )
                      .map(
                        (outcome) =>
                          outcome.point as number
                      )
                  )
            );
            const standardOverPrices =
  game.bookmakers.flatMap(
    (bookmaker) =>
      bookmaker.markets
        .filter(
          (market) =>
            market.key === "totals"
        )
        .flatMap((market) =>
          market.outcomes
            .filter(
              (outcome) =>
                outcome.name === "Over" &&
                Number.isFinite(
                  outcome.price
                )
            )
            .map(
              (outcome) =>
                outcome.price as number
            )
        )
  );

const standardUnderPrices =
  game.bookmakers.flatMap(
    (bookmaker) =>
      bookmaker.markets
        .filter(
          (market) =>
            market.key === "totals"
        )
        .flatMap((market) =>
          market.outcomes
            .filter(
              (outcome) =>
                outcome.name === "Under" &&
                Number.isFinite(
                  outcome.price
                )
            )
            .map(
              (outcome) =>
                outcome.price as number
            )
        )
  );

          if (
            standardTotalPoints.length ===
            0
          ) {
            return null;
          }

          const sortedStandardTotals = [
            ...standardTotalPoints,
          ].sort(
            (first, second) =>
              first - second
          );

          const middleIndex =
            Math.floor(
              sortedStandardTotals.length /
                2
            );

          const standardTotalPoint =
            sortedStandardTotals.length %
              2 ===
            0
              ? (sortedStandardTotals[
                  middleIndex - 1
                ] +
                  sortedStandardTotals[
                    middleIndex
                  ]) /
                2
              : sortedStandardTotals[
                  middleIndex
                ];
                const standardOverPrice =
  calculateMedian(
    standardOverPrices
  );

const standardUnderPrice =
  calculateMedian(
    standardUnderPrices
  );

if (
  standardOverPrice === null ||
  standardUnderPrice === null
) {
  return null;
}

          const params =
            new URLSearchParams({
              eventId: game.id,
            });

          const response = await fetch(
            `/api/wnba-alternate-totals?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

          const data =
            (await response.json()) as
              WNBAAlternateTotalResponse;

          if (
            !response.ok ||
            !data.available ||
            !data.bookmakers
          ) {
            return null;
          }

          const selection =
            findSafestWNBAAlternateTotal(
              data.bookmakers,
              {
  standardTotalPoint,
  standardOverPrice,
  standardUnderPrice,
}
            );

          if (!selection) {
            return null;
          }

          return {
            ...selection,

            eventId: game.id,
            homeTeam:
              game.home_team,
            awayTeam:
              game.away_team,
            commenceTime:
              game.commence_time,
              erlScore:
  intelligence.erlScore,

probabilityEdge:
  intelligence.probabilityEdge,

confidence:
  intelligence.confidence,

dataCompleteness:
  intelligence.dataCompleteness,
          } satisfies WNBAAlternateTotalPick;
        })
      );

    const availableCandidates =
      candidates.filter(
        (
          candidate
        ): candidate is WNBAAlternateTotalPick =>
          candidate !== null
      );

    availableCandidates.sort(
      (first, second) => {
        if (
          second.safetyScore !==
          first.safetyScore
        ) {
          return (
            second.safetyScore -
            first.safetyScore
          );
        }

        if (
          second.protectionPoints !==
          first.protectionPoints
        ) {
          return (
            second.protectionPoints -
            first.protectionPoints
          );
        }

        return (
          second.price -
          first.price
        );
      }
    );

    const safest =
      availableCandidates[0];

    if (!safest) {
      setSafestAlternateTotalMessage(
        "No verified WNBA alternate total satisfied the current protection, price and bookmaker-consensus requirements."
      );
      return;
    }

    setSafestAlternateTotal(
      safest
    );

    setSafestAlternateTotalMessage(
      `${safest.direction} ${safest.point} at ${formatPrice(
        safest.price
      )} is the highest-ranked qualified WNBA alternate total currently available.`
    );
  } catch (error) {
    console.error(
      "WNBA alternate-total analysis error:",
      error
    );

    setSafestAlternateTotalMessage(
      "Could not complete the WNBA alternate-total analysis."
    );
  } finally {
    setSafestAlternateTotalLoading(false);
  }
}
async function findSafestFirstHalfTotal() {
  setSafestFirstQuarterTotal(null);
setSafestFirstQuarterTotalMessage("");
  setSafestFirstQuarterTotal(null);
setSafestFirstQuarterTotalMessage("");
  setSafestFirstHalfTotal(null);
  setSafestFirstHalfTotalMessage("");

  setSafestAlternateSpread(null);
  setSafestAlternateSpreadMessage("");

  setSafestAlternateTotal(null);
  setSafestAlternateTotalMessage("");

  if (games.length === 0) {
    setSafestFirstHalfTotalMessage(
      "No WNBA games are currently available for first-half-total analysis."
    );
    return;
  }

  setSafestFirstHalfTotalLoading(true);

  try {
    const candidates =
      await Promise.all(
        games.map(async (game) => {
          const intelligence =
  rankedGames.find(
    (rankedGame) =>
      rankedGame.eventId === game.id
  );

if (!intelligence) {
  return null;
}
          const params =
            new URLSearchParams({
              eventId: game.id,
            });

          const response = await fetch(
            `/api/wnba-first-half-totals?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

          const data =
            (await response.json()) as
              WNBAFirstHalfTotalResponse;

          if (
            !response.ok ||
            !data.available ||
            !data.bookmakers
          ) {
            return null;
          }

          const selection =
            findSafestWNBAFirstHalfTotal(
              data.bookmakers
            );

          if (!selection) {
            return null;
          }

          return {
            ...selection,

            eventId: game.id,
            homeTeam:
              game.home_team,
            awayTeam:
              game.away_team,
            commenceTime:
              game.commence_time,
              

erlScore:
  intelligence.erlScore,

probabilityEdge:
  intelligence.probabilityEdge,

confidence:
  intelligence.confidence,

dataCompleteness:
  intelligence.dataCompleteness,
          } satisfies WNBAFirstHalfTotalPick;
        })
      );

    const availableCandidates =
      candidates.filter(
        (
          candidate
        ): candidate is WNBAFirstHalfTotalPick =>
          candidate !== null
      );

    availableCandidates.sort(
      (first, second) => {
        if (
          second.safetyScore !==
          first.safetyScore
        ) {
          return (
            second.safetyScore -
            first.safetyScore
          );
        }

        if (
          second.consensusScore !==
          first.consensusScore
        ) {
          return (
            second.consensusScore -
            first.consensusScore
          );
        }

        if (
          second.supportingBookmakers !==
          first.supportingBookmakers
        ) {
          return (
            second.supportingBookmakers -
            first.supportingBookmakers
          );
        }

        return (
          second.price -
          first.price
        );
      }
    );

    const safest =
      availableCandidates[0];

    if (!safest) {
      setSafestFirstHalfTotalMessage(
        "No verified WNBA first-half total satisfied the current market-alignment, price and bookmaker-consensus requirements."
      );
      return;
    }

    setSafestFirstHalfTotal(
      safest
    );

    setSafestFirstHalfTotalMessage(
      `${safest.direction} ${safest.point} at ${formatPrice(
        safest.price
      )} is the highest-ranked qualified WNBA first-half total currently available.`
    );
  } catch (error) {
    console.error(
      "WNBA first-half-total analysis error:",
      error
    );

    setSafestFirstHalfTotalMessage(
      "Could not complete the WNBA first-half-total analysis."
    );
  } finally {
    setSafestFirstHalfTotalLoading(false);
  }
}
async function findSafestFirstQuarterTotal() {
  setSafestFirstQuarterTotal(null);
  setSafestFirstQuarterTotalMessage("");

  setSafestAlternateSpread(null);
  setSafestAlternateSpreadMessage("");

  setSafestAlternateTotal(null);
  setSafestAlternateTotalMessage("");

  setSafestFirstHalfTotal(null);
  setSafestFirstHalfTotalMessage("");

  if (games.length === 0) {
    setSafestFirstQuarterTotalMessage(
      "No WNBA games are currently available for first-quarter-total analysis."
    );
    return;
  }

  setSafestFirstQuarterTotalLoading(true);

  try {
    const candidates = await Promise.all(
      games.map(async (game) => {
        const params = new URLSearchParams({
          eventId: game.id,
        });

        const response = await fetch(
          `/api/wnba-first-quarter-totals?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as
            WNBAFirstQuarterTotalResponse;

        if (
          !response.ok ||
          !data.available ||
          !data.bookmakers
        ) {
          return null;
        }

        const selection =
          findSafestWNBAFirstQuarterTotal(
            data.bookmakers
          );

        if (!selection) {
          return null;
        }

        return {
          ...selection,

          eventId: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          commenceTime: game.commence_time,
        } satisfies WNBAFirstQuarterTotalPick;
      })
    );

    const availableCandidates =
      candidates.filter(
        (
          candidate
        ): candidate is WNBAFirstQuarterTotalPick =>
          candidate !== null
      );

    availableCandidates.sort(
      (first, second) => {
        if (
          second.safetyScore !==
          first.safetyScore
        ) {
          return (
            second.safetyScore -
            first.safetyScore
          );
        }

        if (
          second.consensusScore !==
          first.consensusScore
        ) {
          return (
            second.consensusScore -
            first.consensusScore
          );
        }

        if (
          second.supportingBookmakers !==
          first.supportingBookmakers
        ) {
          return (
            second.supportingBookmakers -
            first.supportingBookmakers
          );
        }

        return first.price - second.price;
      }
    );

    const safest =
      availableCandidates[0];

    if (!safest) {
      setSafestFirstQuarterTotalMessage(
        "No verified WNBA first-quarter total satisfied the current market-alignment, price and bookmaker-consensus requirements."
      );
      return;
    }

    setSafestFirstQuarterTotal(
      safest
    );

    setSafestFirstQuarterTotalMessage(
      `${safest.direction} ${safest.point} at ${formatPrice(
        safest.price
      )} is the highest-ranked qualified WNBA first-quarter total currently available.`
    );
  } catch (error) {
    console.error(
      "WNBA first-quarter-total analysis error:",
      error
    );

    setSafestFirstQuarterTotalMessage(
      "Could not complete the WNBA first-quarter-total analysis."
    );
  } finally {
    setSafestFirstQuarterTotalLoading(false);
  }
}


  return (
    <main className="min-h-screen bg-black text-white">
      <LeagueHeader
        title="EasyRunLine WNBA"
        subtitle="Women's basketball market intelligence"
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
              WNBA Intelligence
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Live WNBA Games
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Review live moneylines, spreads and
              totals from connected sportsbook
              markets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadGames()}
            disabled={loading}
            className="rounded-xl bg-orange-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Refresh WNBA Games"}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={() =>
      void findSafestAlternateSpread()
    }
    disabled={
      loading ||
      safestAlternateSpreadLoading ||
      games.length === 0
    }
    className="rounded-xl bg-blue-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {safestAlternateSpreadLoading
      ? "Checking Alternate Spreads..."
      : "Safest Alternate Spread"}
  </button>
    <button
    type="button"
    onClick={() =>
      void findSafestAlternateTotal()
    }
    disabled={
      loading ||
      safestAlternateTotalLoading ||
      games.length === 0
    }
    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {safestAlternateTotalLoading
      ? "Checking Alternate Totals..."
      : "Safest Alternate Total"}
  </button>
  <button
  type="button"
  onClick={() =>
    void findSafestFirstHalfTotal()
  }
  disabled={
    loading ||
    safestFirstHalfTotalLoading ||
    games.length === 0
  }
  className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
>
  {safestFirstHalfTotalLoading
    ? "Checking 1st Half Totals..."
    : "Safest 1st Half Total"}
</button>

<button
  type="button"
  onClick={() =>
    void findSafestFirstQuarterTotal()
  }
  disabled={
    loading ||
    safestFirstQuarterTotalLoading ||
    games.length === 0
  }
  className="rounded-xl bg-fuchsia-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-50"
>
  {safestFirstQuarterTotalLoading
    ? "Checking 1st Quarter Totals..."
    : "Safest 1st Quarter Total"}
</button>
</div>

{safestAlternateSpread && (
  <div className="mt-6 rounded-2xl border border-blue-800 bg-blue-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
      EasyRunLine — Safest Verified WNBA Alternate Spread
    </p>

        <p
      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        safestAlternateSpread.qualification ===
          "STRONG PLAY" ||
        safestAlternateSpread.qualification === "PLAY"
          ? "bg-emerald-950 text-emerald-300"
          : safestAlternateSpread.qualification === "LEAN"
            ? "bg-amber-950 text-amber-300"
            : "bg-red-950 text-red-300"
      }`}
    >
      Market Qualification:{" "}
      {safestAlternateSpread.qualification}
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Selection
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateSpread.team}{" "}
          {formatPoint(
            safestAlternateSpread.point
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Matchup
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateSpread.awayTeam} at{" "}
          {safestAlternateSpread.homeTeam}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price
        </p>

        <p className="mt-1 font-bold text-blue-400">
          {formatPrice(
            safestAlternateSpread.price
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Bookmaker
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateSpread.bookmaker}
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 border-t border-blue-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Start Time
        </p>

        <p className="mt-1 font-semibold text-white">
          {new Date(
            safestAlternateSpread.commenceTime
          ).toLocaleString()}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Safety Rank
        </p>

        <p className="mt-1 font-bold text-blue-400">
          {safestAlternateSpread.safetyScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          ERL Matchup Score
        </p>

        <p className="mt-1 font-bold text-orange-400">
          {safestAlternateSpread.erlScore}/100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Matchup Confidence
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateSpread.confidence}
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-3 border-t border-blue-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Line Protection
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateSpread.protectionScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Alignment
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateSpread.marketAlignmentScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Quality
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateSpread.priceQualityScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Profile
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateSpread.priceProfile}
        </p>
      </div>
    </div>

    <div className="mt-5 border-t border-blue-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-blue-400">
        EasyRunLine Market Classification:{" "}
        {safestAlternateSpread.safetyScore >= 85
          ? "Strong Verified Protection"
          : safestAlternateSpread.safetyScore >= 70
            ? "Moderate Verified Protection"
            : "Limited Verified Protection"}
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-300">
        EasyRunLine ranks{" "}
        {safestAlternateSpread.team}{" "}
        {formatPoint(
          safestAlternateSpread.point
        )} as the highest-ranked verified WNBA
        alternate spread currently available. The
        exact market is available at{" "}
        {formatPrice(
          safestAlternateSpread.price
        )} with{" "}
        {safestAlternateSpread.bookmaker}.
      </p>

      <ul className="mt-3 space-y-1 text-sm text-zinc-400">
        {safestAlternateSpread.reasons.map(
          (reason) => (
            <li key={reason}>• {reason}</li>
          )
        )}
      </ul>
      

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        The Market Safety Rank is a comparative
        EasyRunLine ranking, not a predicted cover
        probability, guarantee or claim of positive
        betting value. Confirm the displayed alternate
        line and price before placing a wager.
      </p>
    </div>
  </div>
  )}
  {safestAlternateSpread &&
  safestAlternateSpreadHistory && (
  <div className="mt-6 rounded-2xl border border-amber-800 bg-amber-950/10 p-6">
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
      Why This Play
    </p>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs text-zinc-500">
          Selection
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateSpread.team}{" "}
          {formatPoint(safestAlternateSpread.point)}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Final Engine Verdict
        </p>

        <p
          className={
            safestAlternateSpread.qualification === "PLAY"
              ? "mt-1 font-bold text-emerald-400"
              : safestAlternateSpread.qualification === "LEAN"
                ? "mt-1 font-bold text-amber-400"
                : "mt-1 font-bold text-red-400"
          }
        >
          {safestAlternateSpread.qualification}
        </p>
      </div>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Line Protection
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-300">
        {safestAlternateSpread.point > 0
          ? `${safestAlternateSpread.team} receives ${formatPoint(
              safestAlternateSpread.point
            )} points of protection. The selection can still cover when the team loses by fewer than ${safestAlternateSpread.point} points.`
          : `${safestAlternateSpread.team} must overcome the ${formatPoint(
              safestAlternateSpread.point
            )} handicap for the selection to cover.`}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Current Line Protection:{" "}
        <span className="font-bold text-white">
          {safestAlternateSpread.protectionScore.toFixed(1)}
          /100
        </span>
      </p>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Recent Form Against Today&apos;s{" "}
        {formatPoint(safestAlternateSpread.point)}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <p className="font-bold text-white">
            Last 5
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {safestAlternateSpreadHistory.last5.covers} Covers –{" "}
            {safestAlternateSpreadHistory.last5.misses} Misses
            {safestAlternateSpreadHistory.last5.pushes > 0
              ? ` – ${safestAlternateSpreadHistory.last5.pushes} Pushes`
              : ""}
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated Cover Rate:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.last5.coverRate.toFixed(1)}%
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Actual Margin:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.last5.averageActualMargin > 0
                ? "+"
                : ""}
              {safestAlternateSpreadHistory.last5.averageActualMargin.toFixed(
                1
              )}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Adjusted Margin:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.last5.averageAdjustedMargin > 0
                ? "+"
                : ""}
              {safestAlternateSpreadHistory.last5.averageAdjustedMargin.toFixed(
                1
              )}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <p className="font-bold text-white">
            Last 10
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {safestAlternateSpreadHistory.last10.covers} Covers –{" "}
            {safestAlternateSpreadHistory.last10.misses} Misses
            {safestAlternateSpreadHistory.last10.pushes > 0
              ? ` – ${safestAlternateSpreadHistory.last10.pushes} Pushes`
              : ""}
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated Cover Rate:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.last10.coverRate.toFixed(1)}%
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Actual Margin:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.last10.averageActualMargin > 0
                ? "+"
                : ""}
              {safestAlternateSpreadHistory.last10.averageActualMargin.toFixed(
                1
              )}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Adjusted Margin:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.last10.averageAdjustedMargin > 0
                ? "+"
                : ""}
              {safestAlternateSpreadHistory.last10.averageAdjustedMargin.toFixed(
                1
              )}
            </span>
          </p>
        </div>
      </div>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        {safestAlternateSpreadHistory.venueLabel} Performance Against{" "}
        {formatPoint(safestAlternateSpread.point)}
      </p>

      <p className="mt-3 text-sm text-zinc-300">
        {safestAlternateSpreadHistory.venue.covers} Covers –{" "}
        {safestAlternateSpreadHistory.venue.misses} Misses from{" "}
        {safestAlternateSpreadHistory.venue.gamesPlayed} available games.
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Simulated Cover Rate:{" "}
        <span className="font-bold text-white">
          {safestAlternateSpreadHistory.venue.coverRate.toFixed(1)}%
        </span>
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Average Adjusted Margin:{" "}
        <span className="font-bold text-white">
          {safestAlternateSpreadHistory.venue.averageAdjustedMargin > 0
            ? "+"
            : ""}
          {safestAlternateSpreadHistory.venue.averageAdjustedMargin.toFixed(1)}
        </span>
      </p>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Head-to-Head Against {safestAlternateSpreadHistory.opponent}
      </p>

      {safestAlternateSpreadHistory.headToHead.gamesPlayed > 0 ? (
        <>
          <p className="mt-3 text-sm text-zinc-300">
            Available Meetings:{" "}
            {safestAlternateSpreadHistory.headToHead.gamesPlayed}
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            {safestAlternateSpreadHistory.headToHead.covers} Covers –{" "}
            {safestAlternateSpreadHistory.headToHead.misses} Misses
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated Cover Rate:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.headToHead.coverRate.toFixed(1)}%
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Actual Margin:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.headToHead.averageActualMargin > 0
                ? "+"
                : ""}
              {safestAlternateSpreadHistory.headToHead.averageActualMargin.toFixed(
                1
              )}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Adjusted Margin:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.headToHead.averageAdjustedMargin > 0
                ? "+"
                : ""}
              {safestAlternateSpreadHistory.headToHead.averageAdjustedMargin.toFixed(
                1
              )}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Largest Defeat:{" "}
            <span className="font-bold text-white">
              {safestAlternateSpreadHistory.headToHead.largestDefeat} points
            </span>
          </p>

          {safestAlternateSpreadHistory.headToHead.gamesPlayed < 3 && (
            <p className="mt-2 text-xs text-amber-300">
              The available head-to-head sample is limited and should not
              independently determine the verdict.
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">
          No completed regular-season head-to-head meetings were available
          before this matchup.
        </p>
      )}
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Opponent Blowout Test
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="text-sm text-zinc-400">
          Opponent Last 5 Average Margin:{" "}
          <span className="font-bold text-white">
            {safestAlternateSpreadHistory.opponentLast5AverageMargin > 0
              ? "+"
              : ""}
            {safestAlternateSpreadHistory.opponentLast5AverageMargin.toFixed(1)}
          </span>
        </p>

        <p className="text-sm text-zinc-400">
          Opponent Last 10 Average Margin:{" "}
          <span className="font-bold text-white">
            {safestAlternateSpreadHistory.opponentLast10AverageMargin > 0
              ? "+"
              : ""}
            {safestAlternateSpreadHistory.opponentLast10AverageMargin.toFixed(1)}
          </span>
        </p>

        <p className="text-sm text-zinc-400">
          Blowout Wins:{" "}
          <span className="font-bold text-white">
            {safestAlternateSpreadHistory.opponentBlowoutWins} of{" "}
            {safestAlternateSpreadHistory.opponentGamesChecked}
          </span>
        </p>

        <p className="text-sm text-zinc-400">
          Blowout Risk:{" "}
          <span
            className={
              safestAlternateSpreadHistory.blowoutRisk === "High"
                ? "font-bold text-red-400"
                : safestAlternateSpreadHistory.blowoutRisk === "Moderate"
                  ? "font-bold text-amber-400"
                  : "font-bold text-emerald-400"
            }
          >
            {safestAlternateSpreadHistory.blowoutRisk}
          </span>
        </p>
      </div>
    </div>

    <div className="mt-6 grid gap-5 border-t border-amber-900 pt-5 lg:grid-cols-2">
      <div className="rounded-lg border border-emerald-900 bg-emerald-950/10 p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-400">
          Why the Play Can Cover
        </p>

        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
          <li>
            • The selection receives{" "}
            {formatPoint(safestAlternateSpread.point)} of line protection.
          </li>

          <li>
            • It covered the simulated line in{" "}
            {safestAlternateSpreadHistory.last5.covers} of its last{" "}
            {safestAlternateSpreadHistory.last5.gamesPlayed} games.
          </li>

          <li>
            • It covered in{" "}
            {safestAlternateSpreadHistory.last10.covers} of the last{" "}
            {safestAlternateSpreadHistory.last10.gamesPlayed} games.
          </li>

          <li>
            • The adjusted Last 5 margin is{" "}
            {safestAlternateSpreadHistory.last5.averageAdjustedMargin > 0
              ? "+"
              : ""}
            {safestAlternateSpreadHistory.last5.averageAdjustedMargin.toFixed(
              1
            )}.
          </li>

          <li>
            • The verified price is{" "}
            {formatPrice(safestAlternateSpread.price)} with{" "}
            {safestAlternateSpread.bookmaker}.
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-red-900 bg-red-950/10 p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-red-400">
          Why the Play May Not Cover
        </p>

        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
          {!safestAlternateSpread.alignedWithPreferredTeam && (
            <li>
              • The selection is not the current EasyRunLine preferred team.
            </li>
          )}

          <li>
            • Market alignment is only{" "}
            {safestAlternateSpread.marketAlignmentScore.toFixed(1)}/100.
          </li>

          <li>
            • Opponent blowout risk is{" "}
            {safestAlternateSpreadHistory.blowoutRisk}.
          </li>

          {safestAlternateSpreadHistory.headToHead.misses > 0 && (
            <li>
              • The selection failed this simulated line in{" "}
              {safestAlternateSpreadHistory.headToHead.misses} available
              head-to-head meetings.
            </li>
          )}

          <li>
            • Historical simulations apply today&apos;s line to previous
            results and do not use each game&apos;s original closing spread.
          </li>
        </ul>
      </div>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Final EasyRunLine Assessment
      </p>

      <p className="mt-3 text-sm leading-6 text-zinc-300">
        <span className="font-bold text-white">
          {safestAlternateSpread.qualification}
        </span>
        {" — "}
        {safestAlternateSpread.team}{" "}
        {formatPoint(safestAlternateSpread.point)} provides meaningful line
        protection. Historical support is classified as{" "}
        <span className="font-bold text-white">
          {safestAlternateSpreadHistory.historicalSupport}
        </span>
        . The final verdict also considers market alignment, price quality,
        matchup confidence and opponent blowout risk.
      </p>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Historical line simulation is not an official historical ATS record.
        It applies today&apos;s selected handicap retrospectively to completed
        regular-season scores and does not guarantee that the selection will
        cover.
      </p>
    </div>
  </div>
)}


{safestAlternateSpreadMessage && (
  <div className="mt-4 rounded-xl border border-blue-900 bg-blue-950/20 p-4 text-sm text-blue-200">
    {safestAlternateSpreadMessage}
  </div>
)}
{safestAlternateTotal && (
  <div className="mt-6 rounded-2xl border border-cyan-800 bg-cyan-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
      EasyRunLine — Highest-Ranked Qualified WNBA Alternate Total
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Selection
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateTotal.direction}{" "}
          {safestAlternateTotal.point}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Matchup
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateTotal.awayTeam} at{" "}
          {safestAlternateTotal.homeTeam}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price
        </p>

        <p className="mt-1 font-bold text-cyan-400">
          {formatPrice(
            safestAlternateTotal.price
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Bookmaker
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateTotal.bookmaker}
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 border-t border-cyan-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Start Time
        </p>

        <p className="mt-1 font-semibold text-white">
          {new Date(
            safestAlternateTotal.commenceTime
          ).toLocaleString()}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Standard Total
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateTotal.standardTotalPoint}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Protection
        </p>

        <p className="mt-1 font-bold text-cyan-400">
          {safestAlternateTotal.protectionPoints.toFixed(
            1
          )}{" "}
          points
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
  Market Qualification
</p>

        <p
  className={
    safestAlternateTotal.qualification === "STRONG PLAY"
      ? "mt-1 font-bold text-emerald-400"
      : safestAlternateTotal.qualification === "PLAY"
        ? "mt-1 font-bold text-green-400"
        : safestAlternateTotal.qualification === "LEAN"
          ? "mt-1 font-bold text-amber-400"
          : "mt-1 font-bold text-red-400"
  }
>
  {safestAlternateTotal.qualification}
</p>
      </div>
    </div>

    <div className="mt-5 grid gap-3 border-t border-cyan-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Market Safety Rank
        </p>

        <p className="mt-1 font-bold text-cyan-400">
          {safestAlternateTotal.safetyScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Protection Score
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateTotal.protectionScore.toFixed(
            1
          )}
          /100
        </p>
      </div>
      <div>
  <p className="text-xs text-zinc-500">
    Market Alignment
  </p>

  <p className="mt-1 font-semibold text-white">
    {safestAlternateTotal.marketAlignmentScore.toFixed(
      1
    )}
    /100
  </p>
</div>

<div>
  <p className="text-xs text-zinc-500">
    ERL Matchup Score
  </p>

  <p className="mt-1 font-semibold text-orange-400">
    {safestAlternateTotal.erlScore}/100
  </p>
</div>

<div>
  <p className="text-xs text-zinc-500">
    Matchup Confidence
  </p>

  <p className="mt-1 font-semibold text-white">
    {safestAlternateTotal.confidence}
  </p>
</div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Consensus
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateTotal.consensusScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Quality
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateTotal.priceQualityScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Availability Score
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateTotal.availabilityScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Supporting Bookmakers
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateTotal.supportingBookmakers}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Profile
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestAlternateTotal.priceProfile}
        </p>
      </div>
    </div>

    <div className="mt-5 border-t border-cyan-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-cyan-400">
        EasyRunLine Market Classification:{" "}
        {safestAlternateTotal.safetyScore >= 85
          ? "Strong Verified Protection"
          : safestAlternateTotal.safetyScore >= 70
            ? "Moderate Verified Protection"
            : "Limited Verified Protection"}
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-300">
        EasyRunLine ranks{" "}
        {safestAlternateTotal.direction}{" "}
        {safestAlternateTotal.point} in{" "}
        {safestAlternateTotal.awayTeam} at{" "}
        {safestAlternateTotal.homeTeam} as the
        highest-ranked qualified WNBA alternate total
        currently available. The exact market is
        available at{" "}
        {formatPrice(
          safestAlternateTotal.price
        )} with{" "}
        {safestAlternateTotal.bookmaker}.
      </p>

      <ul className="mt-3 space-y-1 text-sm text-zinc-400">
        {safestAlternateTotal.reasons.map(
          (reason) => (
            <li key={reason}>• {reason}</li>
          )
        )}
      </ul>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        The Market Safety Rank compares qualified
        alternate totals currently available to the
        engine. It is not a predicted win probability,
        guarantee or claim of positive betting value.
        Confirm the displayed total and price before
        placing a wager.
      </p>
    </div>
  </div>
)}
{safestAlternateTotal &&
  safestAlternateTotalHistory && (
  <div className="mt-6 rounded-2xl border border-amber-800 bg-amber-950/10 p-6">
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
      Why This Total
    </p>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs text-zinc-500">
          Selection
        </p>

        <p className="mt-1 font-bold text-white">
          {safestAlternateTotal.direction}{" "}
          {safestAlternateTotal.point}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Engine Verdict
        </p>

        <p
          className={
            safestAlternateTotal.qualification ===
            "STRONG PLAY"
              ? "mt-1 font-bold text-emerald-400"
              : safestAlternateTotal.qualification ===
                  "PLAY"
                ? "mt-1 font-bold text-green-400"
                : safestAlternateTotal.qualification ===
                    "LEAN"
                  ? "mt-1 font-bold text-amber-400"
                  : "mt-1 font-bold text-red-400"
          }
        >
          {safestAlternateTotalFinalVerdict}
        </p>
      </div>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Total Protection
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-300">
        The visible standard total is{" "}
        {safestAlternateTotal.standardTotalPoint}.
        EasyRunLine selected{" "}
        {safestAlternateTotal.direction}{" "}
        {safestAlternateTotal.point}, providing{" "}
        {safestAlternateTotal.protectionPoints.toFixed(
          1
        )}{" "}
        points of alternate-line protection.
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Protection Score:{" "}
        <span className="font-bold text-white">
          {safestAlternateTotal.protectionScore.toFixed(
            1
          )}
          /100
        </span>
      </p>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Recent Scoring Against{" "}
        {safestAlternateTotal.direction}{" "}
        {safestAlternateTotal.point}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <p className="font-bold text-white">
            {safestAlternateTotal.awayTeam}
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-zinc-400">
                Last 5
              </p>

              <p className="mt-2 text-sm text-zinc-300">
                {
                  safestAlternateTotalHistory
                    .awayLast5.hits
                }{" "}
                Hits –{" "}
                {
                  safestAlternateTotalHistory
                    .awayLast5.misses
                }{" "}
                Misses
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Simulated Hit Rate:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.awayLast5.hitRate.toFixed(
                    1
                  )}
                  %
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Average Total:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.awayLast5.averageCombinedTotal.toFixed(
                    1
                  )}
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Average Line Difference:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.awayLast5.averageDifferenceFromLine >
                  0
                    ? "+"
                    : ""}
                  {safestAlternateTotalHistory.awayLast5.averageDifferenceFromLine.toFixed(
                    1
                  )}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-400">
                Last 10
              </p>

              <p className="mt-2 text-sm text-zinc-300">
                {
                  safestAlternateTotalHistory
                    .awayLast10.hits
                }{" "}
                Hits –{" "}
                {
                  safestAlternateTotalHistory
                    .awayLast10.misses
                }{" "}
                Misses
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Simulated Hit Rate:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.awayLast10.hitRate.toFixed(
                    1
                  )}
                  %
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Average Total:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.awayLast10.averageCombinedTotal.toFixed(
                    1
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <p className="font-bold text-white">
            {safestAlternateTotal.homeTeam}
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-zinc-400">
                Last 5
              </p>

              <p className="mt-2 text-sm text-zinc-300">
                {
                  safestAlternateTotalHistory
                    .homeLast5.hits
                }{" "}
                Hits –{" "}
                {
                  safestAlternateTotalHistory
                    .homeLast5.misses
                }{" "}
                Misses
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Simulated Hit Rate:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.homeLast5.hitRate.toFixed(
                    1
                  )}
                  %
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Average Total:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.homeLast5.averageCombinedTotal.toFixed(
                    1
                  )}
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Average Line Difference:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.homeLast5.averageDifferenceFromLine >
                  0
                    ? "+"
                    : ""}
                  {safestAlternateTotalHistory.homeLast5.averageDifferenceFromLine.toFixed(
                    1
                  )}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-400">
                Last 10
              </p>

              <p className="mt-2 text-sm text-zinc-300">
                {
                  safestAlternateTotalHistory
                    .homeLast10.hits
                }{" "}
                Hits –{" "}
                {
                  safestAlternateTotalHistory
                    .homeLast10.misses
                }{" "}
                Misses
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Simulated Hit Rate:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.homeLast10.hitRate.toFixed(
                    1
                  )}
                  %
                </span>
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                Average Total:{" "}
                <span className="font-bold text-white">
                  {safestAlternateTotalHistory.homeLast10.averageCombinedTotal.toFixed(
                    1
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6 grid gap-6 border-t border-amber-900 pt-5 lg:grid-cols-2">
      
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
          Venue Performance
        </p>

        <p className="mt-3 text-sm text-zinc-300">
          {safestAlternateTotal.awayTeam} away:
          {" "}
          {
            safestAlternateTotalHistory
              .awayVenue.hits
          }{" "}
          Hits –{" "}
          {
            safestAlternateTotalHistory
              .awayVenue.misses
          }{" "}
          Misses
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Away Hit Rate:{" "}
          <span className="font-bold text-white">
            {safestAlternateTotalHistory.awayVenue.hitRate.toFixed(
              1
            )}
            %
          </span>
        </p>

        <p className="mt-3 text-sm text-zinc-300">
          {safestAlternateTotal.homeTeam} home:
          {" "}
          {
            safestAlternateTotalHistory
              .homeVenue.hits
          }{" "}
          Hits –{" "}
          {
            safestAlternateTotalHistory
              .homeVenue.misses
          }{" "}
          Misses
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Home Hit Rate:{" "}
          <span className="font-bold text-white">
            {safestAlternateTotalHistory.homeVenue.hitRate.toFixed(
              1
            )}
            %
          </span>
        </p>
      </div>

      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
          Head-to-Head Simulation
        </p>

        <p className="mt-3 text-sm text-zinc-300">
          Available Meetings:{" "}
          {
            safestAlternateTotalHistory
              .headToHead.gamesPlayed
          }
        </p>

        {safestAlternateTotalHistory.headToHead
          .gamesPlayed > 0 ? (
          <>
            <p className="mt-1 text-sm text-zinc-400">
              {
                safestAlternateTotalHistory
                  .headToHead.hits
              }{" "}
              Hits –{" "}
              {
                safestAlternateTotalHistory
                  .headToHead.misses
              }{" "}
              Misses
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Simulated Hit Rate:{" "}
              <span className="font-bold text-white">
                {safestAlternateTotalHistory.headToHead.hitRate.toFixed(
                  1
                )}
                %
              </span>
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Average Combined Score:{" "}
              <span className="font-bold text-white">
                {safestAlternateTotalHistory.headToHead.averageCombinedTotal.toFixed(
                  1
                )}
              </span>
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            No completed regular-season meetings are
            available for this simulation.
          </p>
        )}
      </div>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Scoring Consistency Test
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-zinc-500">
            Combined Recent Hit Rate
          </p>

          <p className="mt-1 font-bold text-white">
            {safestAlternateTotalHistory.combinedRecent.hitRate.toFixed(
              1
            )}
            %
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Scoring Volatility
          </p>

          <p className="mt-1 font-bold text-white">
            {safestAlternateTotalHistory.scoringVolatility.toFixed(
              1
            )}{" "}
            points
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Volatility Risk
          </p>

          <p
            className={
              safestAlternateTotalHistory.volatilityLevel ===
              "High"
                ? "mt-1 font-bold text-red-400"
                : safestAlternateTotalHistory.volatilityLevel ===
                    "Moderate"
                  ? "mt-1 font-bold text-amber-400"
                  : "mt-1 font-bold text-emerald-400"
            }
          >
            {
              safestAlternateTotalHistory
                .volatilityLevel
            }
          </p>
        </div>
      </div>
    </div>

    <div className="mt-6 grid gap-4 border-t border-amber-900 pt-5 lg:grid-cols-2">
      <div className="rounded-lg border border-emerald-900 bg-emerald-950/10 p-4">
        <p className="text-sm font-bold uppercase text-emerald-400">
          Why the Total Can Hit
        </p>

        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          <li>
            • The alternate total provides{" "}
            {safestAlternateTotal.protectionPoints.toFixed(
              1
            )}{" "}
            points of protection from the standard
            total.
          </li>

          <li>
            • Recent combined results produced a{" "}
            {safestAlternateTotalHistory.combinedRecent.hitRate.toFixed(
              1
            )}
            % simulated hit rate.
          </li>

          <li>
            • The exact market is verified at{" "}
            {formatPrice(
              safestAlternateTotal.price
            )}{" "}
            with{" "}
            {safestAlternateTotal.bookmaker}.
          </li>

          <li>
            •{" "}
            {
              safestAlternateTotal
                .supportingBookmakers
            }{" "}
            bookmakers support a comparable market.
          </li>

          {(
  safestAlternateTotalHistory.historicalSupport ===
    "Strong" ||
  safestAlternateTotalHistory.historicalSupport ===
    "Moderate"
) && (
  <li>
    • Historical support is classified as{" "}
    <span className="font-bold text-emerald-300">
      {
        safestAlternateTotalHistory
          .historicalSupport
      }
    </span>
    .
  </li>
)}
        </ul>
      </div>

      <div className="rounded-lg border border-red-900 bg-red-950/10 p-4">
        <p className="text-sm font-bold uppercase text-red-400">
          Why the Total May Not Hit
        </p>

        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          {(
  safestAlternateTotalHistory.historicalSupport ===
    "Weak" ||
  safestAlternateTotalHistory.historicalSupport ===
    "Mixed"
) && (
  <li>
    • Historical support is classified as{" "}
    <span className="font-bold text-red-300">
      {
        safestAlternateTotalHistory
          .historicalSupport
      }
    </span>
    .
  </li>
)}
          <li>
            • Historical simulations apply today&apos;s
            total retrospectively and do not use each
            game&apos;s original closing total.
          </li>

          {safestAlternateTotalHistory.volatilityLevel !==
            "Low" && (
            <li>
              • Recent combined scoring volatility is{" "}
              {
                safestAlternateTotalHistory
                  .volatilityLevel
              }
              .
            </li>
          )}

          {safestAlternateTotalHistory.headToHead
            .gamesPlayed < 3 && (
            <li>
              • The available head-to-head sample is
              limited and should not independently
              determine the verdict.
            </li>
          )}

          <li>
            • An alternate line reduces risk but does
            not eliminate unexpected pace, shooting or
            defensive changes.
          </li>

          <li>
            • The displayed price and total may change
            before the wager is placed.
          </li>
        </ul>
      </div>
    </div>

    <div className="mt-6 border-t border-amber-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
        Final EasyRunLine Assessment
      </p>

      <p className="mt-3 text-sm leading-6 text-zinc-300">
        <span className="font-bold text-white">
          {safestAlternateTotalFinalVerdict}
        </span>
        {" — "}
        {safestAlternateTotal.direction}{" "}
        {safestAlternateTotal.point} provides{" "}
        {safestAlternateTotal.protectionPoints.toFixed(
          1
        )}{" "}
        points of protection from the standard total.
        Historical support is classified as{" "}
        <span className="font-bold text-white">
          {
            safestAlternateTotalHistory
              .historicalSupport
          }
        </span>
        . The final market verdict also considers
        protection, price quality, bookmaker consensus
        and availability.
      </p>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Historical total simulation is not an official
        historical over/under record. It applies
        today&apos;s selected total retrospectively to
        completed regular-season scores and does not
        guarantee that the selection will hit.
      </p>
    </div>
  </div>
)}

{safestAlternateTotalMessage && (
  <div className="mt-4 rounded-xl border border-cyan-900 bg-cyan-950/20 p-4 text-sm text-cyan-200">
    {safestAlternateTotalMessage}
  </div>
)}
{safestFirstHalfTotal && (
  <div className="mt-6 rounded-2xl border border-violet-800 bg-violet-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
      EasyRunLine — Highest-Ranked Qualified WNBA 1st Half Total
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Selection
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstHalfTotal.direction}{" "}
          {safestFirstHalfTotal.point}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Matchup
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstHalfTotal.awayTeam} at{" "}
          {safestFirstHalfTotal.homeTeam}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price
        </p>

        <p className="mt-1 font-bold text-violet-400">
          {formatPrice(
            safestFirstHalfTotal.price
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Bookmaker
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstHalfTotal.bookmaker}
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 border-t border-violet-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Start Time
        </p>

        <p className="mt-1 font-semibold text-white">
          {new Date(
            safestFirstHalfTotal.commenceTime
          ).toLocaleString()}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Consensus 1st Half Total
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstHalfTotal.consensusPoint}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Safety Rank
        </p>

        <p className="mt-1 font-bold text-violet-400">
          {safestFirstHalfTotal.safetyScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Qualification
        </p>

        <p
  className={
    safestFirstHalfTotal.qualification ===
      "STRONG PLAY" ||
    safestFirstHalfTotal.qualification ===
      "PLAY"
      ? "mt-1 font-bold text-emerald-400"
      : safestFirstHalfTotal.qualification ===
          "LEAN"
        ? "mt-1 font-bold text-amber-400"
        : "mt-1 font-bold text-red-400"
  }
>
  {safestFirstHalfTotal.qualification}
</p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 border-t border-violet-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Market Alignment
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstHalfTotal.marketAlignmentScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
  <p className="text-xs text-zinc-500">
    ERL Matchup Score
  </p>

  <p className="mt-1 font-semibold text-amber-400">
    {safestFirstHalfTotal.erlScore}/100
  </p>
</div>

<div>
  <p className="text-xs text-zinc-500">
    Matchup Confidence
  </p>

  <p className="mt-1 font-semibold text-white">
    {safestFirstHalfTotal.confidence}
  </p>
</div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Consensus
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstHalfTotal.consensusScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Quality
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstHalfTotal.priceQualityScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Availability Score
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstHalfTotal.availabilityScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Supporting Bookmakers
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstHalfTotal.supportingBookmakers}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Line Difference
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstHalfTotal.lineDifference.toFixed(
            1
          )}{" "}
          points
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Profile
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstHalfTotal.priceProfile}
        </p>
      </div>
    </div>

    <div className="mt-5 border-t border-violet-900 pt-5">
  <p className="text-sm font-bold uppercase tracking-wide text-violet-400">
  EasyRunLine Market Classification:{" "}
  <span
    className={
      safestFirstHalfTotal.qualification ===
        "STRONG PLAY" ||
      safestFirstHalfTotal.qualification ===
        "PLAY"
        ? "text-emerald-400"
        : safestFirstHalfTotal.qualification ===
            "LEAN"
          ? "text-amber-400"
          : "text-red-400"
    }
  >
    {safestFirstHalfTotal.qualification}
  </span>
</p>

  <p className="mt-2 text-sm leading-6 text-zinc-300">
    EasyRunLine ranks{" "}
    {safestFirstHalfTotal.direction}{" "}
    {safestFirstHalfTotal.point} in{" "}
    {safestFirstHalfTotal.awayTeam} at{" "}
    {safestFirstHalfTotal.homeTeam} as the
    highest-ranked available WNBA first-half total.
    The exact market is available at{" "}
    {formatPrice(
      safestFirstHalfTotal.price
    )}{" "}
    with {safestFirstHalfTotal.bookmaker}.
  </p>

  <ul className="mt-3 space-y-1 text-sm text-zinc-400">
    {safestFirstHalfTotal.reasons.map(
      (reason) => (
        <li key={reason}>
          • {reason}
        </li>
      )
    )}
  </ul>

  <p className="mt-3 text-xs leading-5 text-zinc-500">
    The Market Safety Rank measures market alignment,
    price quality, bookmaker consensus and
    availability. It is not a predicted win
    probability, guarantee or claim of positive
    betting value. The separate orange report applies
    verified historical first-half scoring to the
    final EasyRunLine assessment.
  </p>
</div>
    </div>
  
)}


  {safestFirstHalfTotal &&
  safestFirstHalfTotalHistory &&
  safestFirstHalfTotalFinalVerdict && (
    <div className="mt-6 rounded-2xl border border-amber-700 bg-amber-950/10 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
        Why This First-Half Total
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-zinc-500">
            Selection
          </p>

          <p className="mt-1 font-bold text-white">
            {safestFirstHalfTotal.direction}{" "}
            {safestFirstHalfTotal.point}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Final Engine Verdict
          </p>

          <p
            className={
              safestFirstHalfTotalFinalVerdict ===
              "STRONG PLAY"
                ? "mt-1 font-bold text-emerald-400"
                : safestFirstHalfTotalFinalVerdict ===
                    "PLAY"
                  ? "mt-1 font-bold text-emerald-400"
                  : safestFirstHalfTotalFinalVerdict ===
                      "LEAN"
                    ? "mt-1 font-bold text-amber-400"
                    : "mt-1 font-bold text-red-400"
            }
          >
            {safestFirstHalfTotalFinalVerdict}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-amber-900 pt-5">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
          First-Half Market Position
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          The visible market consensus first-half total
          is{" "}
          {safestFirstHalfTotal.consensusPoint}.
          EasyRunLine selected{" "}
          {safestFirstHalfTotal.direction}{" "}
          {safestFirstHalfTotal.point}, which is{" "}
          {safestFirstHalfTotal.lineDifference.toFixed(
            1
          )}{" "}
          points from the consensus line.
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-500">
              Market Alignment
            </p>

            <p className="mt-1 font-bold text-white">
              {safestFirstHalfTotal.marketAlignmentScore.toFixed(
                1
              )}
              /100
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Supporting Bookmakers
            </p>

            <p className="mt-1 font-bold text-white">
              {
                safestFirstHalfTotal
                  .supportingBookmakers
              }
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Verified Price
            </p>

            <p className="mt-1 font-bold text-white">
              {formatPrice(
                safestFirstHalfTotal.price
              )}{" "}
              with{" "}
              {safestFirstHalfTotal.bookmaker}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 border-t border-amber-900 pt-5 lg:grid-cols-2">
  <div className="lg:col-span-2">

  <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
    Recent First-Half Scoring Against{" "}
    {safestFirstHalfTotal.direction}{" "}
    {safestFirstHalfTotal.point}
  </p>

  <p className="mt-2 text-xs leading-5 text-zinc-500">
    The selected first-half total is applied
    retrospectively to verified historical first-half
    scores.
  </p>

  <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <div className="rounded-lg border border-zinc-800 bg-black p-4">
      <p className="font-bold text-white">
        {safestFirstHalfTotal.awayTeam}
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold text-zinc-400">
            Last 5
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {
              safestFirstHalfTotalHistory
                .awayLast5.hits
            }{" "}
            Hits –{" "}
            {
              safestFirstHalfTotalHistory
                .awayLast5.misses
            }{" "}
            Misses
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated Hit Rate:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.awayLast5.hitRate.toFixed(
                1
              )}
              %
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average First-Half Total:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.awayLast5.averageCombinedTotal.toFixed(
                1
              )}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Line Difference:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.awayLast5.averageDifferenceFromLine >
              0
                ? "+"
                : ""}
              {safestFirstHalfTotalHistory.awayLast5.averageDifferenceFromLine.toFixed(
                1
              )}
            </span>
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-zinc-400">
            Last 10
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {
              safestFirstHalfTotalHistory
                .awayLast10.hits
            }{" "}
            Hits –{" "}
            {
              safestFirstHalfTotalHistory
                .awayLast10.misses
            }{" "}
            Misses
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated Hit Rate:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.awayLast10.hitRate.toFixed(
                1
              )}
              %
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average First-Half Total:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.awayLast10.averageCombinedTotal.toFixed(
                1
              )}
            </span>
          </p>
        </div>
      </div>
    </div>

    <div className="rounded-lg border border-zinc-800 bg-black p-4">
      <p className="font-bold text-white">
        {safestFirstHalfTotal.homeTeam}
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold text-zinc-400">
            Last 5
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {
              safestFirstHalfTotalHistory
                .homeLast5.hits
            }{" "}
            Hits –{" "}
            {
              safestFirstHalfTotalHistory
                .homeLast5.misses
            }{" "}
            Misses
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated Hit Rate:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.homeLast5.hitRate.toFixed(
                1
              )}
              %
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average First-Half Total:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.homeLast5.averageCombinedTotal.toFixed(
                1
              )}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average Line Difference:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.homeLast5.averageDifferenceFromLine >
              0
                ? "+"
                : ""}
              {safestFirstHalfTotalHistory.homeLast5.averageDifferenceFromLine.toFixed(
                1
              )}
            </span>
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-zinc-400">
            Last 10
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {
              safestFirstHalfTotalHistory
                .homeLast10.hits
            }{" "}
            Hits –{" "}
            {
              safestFirstHalfTotalHistory
                .homeLast10.misses
            }{" "}
            Misses
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Simulated Hit Rate:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.homeLast10.hitRate.toFixed(
                1
              )}
              %
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Average First-Half Total:{" "}
            <span className="font-bold text-white">
              {safestFirstHalfTotalHistory.homeLast10.averageCombinedTotal.toFixed(
                1
              )}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
<div className="border-t border-amber-900 lg:col-span-2" />
  <div>
    <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
      Venue Performance
    </p>

    <p className="mt-3 text-sm text-zinc-300">
      {safestFirstHalfTotal.awayTeam} away:{" "}
      {safestFirstHalfTotalHistory.awayVenue.hits}{" "}
      Hits –{" "}
      {safestFirstHalfTotalHistory.awayVenue.misses}{" "}
      Misses
    </p>

    <p className="mt-1 text-sm text-zinc-400">
      Away Hit Rate:{" "}
      <span className="font-bold text-white">
        {safestFirstHalfTotalHistory.awayVenue.hitRate.toFixed(
          1
        )}
        %
      </span>
    </p>

    <p className="mt-3 text-sm text-zinc-300">
      {safestFirstHalfTotal.homeTeam} home:{" "}
      {safestFirstHalfTotalHistory.homeVenue.hits}{" "}
      Hits –{" "}
      {safestFirstHalfTotalHistory.homeVenue.misses}{" "}
      Misses
    </p>

    <p className="mt-1 text-sm text-zinc-400">
      Home Hit Rate:{" "}
      <span className="font-bold text-white">
        {safestFirstHalfTotalHistory.homeVenue.hitRate.toFixed(
          1
        )}
        %
      </span>
    </p>
  </div>

  <div>
    <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
      Head-to-Head Simulation
    </p>

    <p className="mt-3 text-sm text-zinc-300">
      Available Meetings:{" "}
      {
        safestFirstHalfTotalHistory
          .headToHead.gamesPlayed
      }
    </p>

    {safestFirstHalfTotalHistory.headToHead
      .gamesPlayed > 0 ? (
      <>
        <p className="mt-1 text-sm text-zinc-400">
          {
            safestFirstHalfTotalHistory
              .headToHead.hits
          }{" "}
          Hits –{" "}
          {
            safestFirstHalfTotalHistory
              .headToHead.misses
          }{" "}
          Misses
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Simulated Hit Rate:{" "}
          <span className="font-bold text-white">
            {safestFirstHalfTotalHistory.headToHead.hitRate.toFixed(
              1
            )}
            %
          </span>
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Average Combined First-Half Score:{" "}
          <span className="font-bold text-white">
            {safestFirstHalfTotalHistory.headToHead.averageCombinedTotal.toFixed(
              1
            )}
          </span>
        </p>
      </>
    ) : (
      <p className="mt-1 text-sm text-zinc-500">
        No completed regular-season meetings are
        available for this first-half simulation.
      </p>
    )}
  </div>
</div>

<div className="mt-6 border-t border-amber-900 pt-5">
  <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
    First-Half Scoring Consistency Test
  </p>

  <div className="mt-3 grid gap-4 sm:grid-cols-3">
    <div>
      <p className="text-xs text-zinc-500">
        Combined Recent Hit Rate
      </p>

      <p className="mt-1 font-bold text-white">
        {safestFirstHalfTotalHistory.combinedRecent.hitRate.toFixed(
          1
        )}
        %
      </p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">
        First-Half Scoring Volatility
      </p>

      <p className="mt-1 font-bold text-white">
        {safestFirstHalfTotalHistory.scoringVolatility.toFixed(
          1
        )}{" "}
        points
      </p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">
        Volatility Risk
      </p>

      <p
        className={
          safestFirstHalfTotalHistory.volatilityLevel ===
          "High"
            ? "mt-1 font-bold text-red-400"
            : safestFirstHalfTotalHistory.volatilityLevel ===
                "Moderate"
              ? "mt-1 font-bold text-amber-400"
              : "mt-1 font-bold text-emerald-400"
        }
      >
        {
          safestFirstHalfTotalHistory
            .volatilityLevel
        }
      </p>
    </div>
  </div>
</div>
<div className="mt-6 grid gap-4 border-t border-amber-900 pt-5 lg:grid-cols-2">
  <div className="rounded-lg border border-emerald-900 bg-emerald-950/10 p-4">
    <p className="text-sm font-bold uppercase text-emerald-400">
      Why the First-Half Total Can Hit
    </p>

    <ul className="mt-3 space-y-2 text-sm text-zinc-300">
      <li>
        • The selected first-half line is{" "}
        {safestFirstHalfTotal.lineDifference.toFixed(
          1
        )}{" "}
        points from the verified market consensus.
      </li>

      <li>
        • Recent combined first-half results produced
        a{" "}
        {safestFirstHalfTotalHistory.combinedRecent.hitRate.toFixed(
          1
        )}
        % simulated hit rate.
      </li>

      <li>
        • The exact first-half market is verified at{" "}
        {formatPrice(
          safestFirstHalfTotal.price
        )}{" "}
        with{" "}
        {safestFirstHalfTotal.bookmaker}.
      </li>

      <li>
        •{" "}
        {
          safestFirstHalfTotal
            .supportingBookmakers
        }{" "}
        bookmakers support a comparable{" "}
        {safestFirstHalfTotal.direction} first-half
        total.
      </li>

      {(safestFirstHalfTotalHistory.historicalSupport ===
        "Strong" ||
        safestFirstHalfTotalHistory.historicalSupport ===
          "Moderate") && (
        <li>
          • Historical first-half support is classified
          as{" "}
          <span className="font-bold text-emerald-300">
            {
              safestFirstHalfTotalHistory
                .historicalSupport
            }
          </span>
          .
        </li>
      )}
    </ul>
  </div>

  <div className="rounded-lg border border-red-900 bg-red-950/10 p-4">
    <p className="text-sm font-bold uppercase text-red-400">
      Why the First-Half Total May Not Hit
    </p>

    <ul className="mt-3 space-y-2 text-sm text-zinc-300">
      {(safestFirstHalfTotalHistory.historicalSupport ===
        "Weak" ||
        safestFirstHalfTotalHistory.historicalSupport ===
          "Mixed") && (
        <li>
          • Historical first-half support is classified
          as{" "}
          <span className="font-bold text-red-300">
            {
              safestFirstHalfTotalHistory
                .historicalSupport
            }
          </span>
          .
        </li>
      )}

      <li>
        • Historical simulations apply today&apos;s
        first-half total retrospectively and do not use
        each game&apos;s original closing first-half
        total.
      </li>

      {safestFirstHalfTotalHistory.volatilityLevel !==
        "Low" && (
        <li>
          • Recent combined first-half scoring
          volatility is{" "}
          {
            safestFirstHalfTotalHistory
              .volatilityLevel
          }
          .
        </li>
      )}

      {safestFirstHalfTotalHistory.headToHead
        .gamesPlayed < 3 && (
        <li>
          • The available head-to-head first-half
          sample is limited and should not
          independently determine the verdict.
        </li>
      )}

      {safestFirstHalfTotal.supportingBookmakers <
        3 && (
        <li>
          • Fewer than three bookmakers support a
          comparable first-half market, limiting market
          availability.
        </li>
      )}

      <li>
        • First-half scoring can change unexpectedly
        because of pace, shooting, fouls and player
        rotations.
      </li>

      <li>
        • The displayed price and first-half total may
        change before the wager is placed.
      </li>
    </ul>
  </div>
</div>

<div className="mt-6 border-t border-amber-900 pt-5">
  <p className="text-sm font-bold uppercase tracking-wide text-amber-400">
    Final EasyRunLine Assessment
  </p>

  <p className="mt-3 text-sm leading-6 text-zinc-300">
    <span className="font-bold text-white">
      {safestFirstHalfTotalFinalVerdict}
    </span>
    {" — "}
    EasyRunLine selected{" "}
    {safestFirstHalfTotal.direction}{" "}
    {safestFirstHalfTotal.point} at{" "}
    {formatPrice(
      safestFirstHalfTotal.price
    )}{" "}
    with {safestFirstHalfTotal.bookmaker}. Historical
    first-half support is classified as{" "}
    <span className="font-bold text-white">
      {
        safestFirstHalfTotalHistory
          .historicalSupport
      }
    </span>
    . The final verdict also considers market
    alignment, price quality, bookmaker consensus,
    availability and first-half scoring volatility.
  </p>

  <p className="mt-3 text-xs leading-5 text-zinc-500">
    Historical first-half simulation is not an
    official historical over/under record. It applies
    today&apos;s selected first-half total
    retrospectively to completed regular-season
    first-half scores and does not guarantee that the
    selection will hit.
  </p>
</div>

    </div>
  )}
  {safestFirstHalfTotalMessage && (
  <div className="mt-4 rounded-xl border border-violet-900 bg-violet-950/20 p-4 text-sm text-violet-200">
    {safestFirstHalfTotalMessage}

   </div>
)}

{safestFirstQuarterTotal && (
  <div className="mt-6 rounded-2xl border border-fuchsia-800 bg-fuchsia-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-400">
      EasyRunLine — Highest-Ranked Qualified WNBA 1st Quarter Total
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Selection
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstQuarterTotal.direction}{" "}
          {safestFirstQuarterTotal.point}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Matchup
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstQuarterTotal.awayTeam} at{" "}
          {safestFirstQuarterTotal.homeTeam}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price
        </p>

        <p className="mt-1 font-bold text-fuchsia-400">
          {formatPrice(
            safestFirstQuarterTotal.price
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Bookmaker
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstQuarterTotal.bookmaker}
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 border-t border-fuchsia-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Start Time
        </p>

        <p className="mt-1 font-semibold text-white">
          {new Date(
            safestFirstQuarterTotal.commenceTime
          ).toLocaleString()}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Consensus 1st Quarter Total
        </p>

        <p className="mt-1 font-bold text-white">
          {safestFirstQuarterTotal.consensusPoint}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Safety Rank
        </p>

        <p className="mt-1 font-bold text-fuchsia-400">
          {safestFirstQuarterTotal.safetyScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Qualification
        </p>

        <p className="mt-1 font-bold text-fuchsia-400">
          {safestFirstQuarterTotal.qualification}
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 border-t border-fuchsia-900 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Market Alignment
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstQuarterTotal.marketAlignmentScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Market Consensus
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstQuarterTotal.consensusScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Quality
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstQuarterTotal.priceQualityScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Availability Score
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstQuarterTotal.availabilityScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Supporting Bookmakers
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstQuarterTotal.supportingBookmakers}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Line Difference
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstQuarterTotal.lineDifference.toFixed(
            1
          )}{" "}
          points
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price Profile
        </p>

        <p className="mt-1 font-semibold text-white">
          {safestFirstQuarterTotal.priceProfile}
        </p>
      </div>
    </div>

    <div className="mt-5 border-t border-fuchsia-900 pt-5">
      <p className="text-sm font-bold uppercase tracking-wide text-fuchsia-400">
        EasyRunLine Market Classification:{" "}
        {safestFirstQuarterTotal.safetyScore >= 85
          ? "Strong Verified Market Alignment"
          : safestFirstQuarterTotal.safetyScore >= 78
            ? "Qualified Verified Market Alignment"
            : "Limited Verified Market Alignment"}
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-300">
        EasyRunLine ranks{" "}
        {safestFirstQuarterTotal.direction}{" "}
        {safestFirstQuarterTotal.point} in{" "}
        {safestFirstQuarterTotal.awayTeam} at{" "}
        {safestFirstQuarterTotal.homeTeam} as the
        highest-ranked qualified WNBA first-quarter
        total currently available. The exact market is
        available at{" "}
        {formatPrice(
          safestFirstQuarterTotal.price
        )}{" "}
        with {safestFirstQuarterTotal.bookmaker}.
      </p>

      <ul className="mt-3 space-y-1 text-sm text-zinc-400">
        {safestFirstQuarterTotal.reasons.map(
          (reason) => (
            <li key={reason}>
              • {reason}
            </li>
          )
        )}
      </ul>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        The Market Safety Rank compares verified
        first-quarter totals currently available to the
        engine. It measures market alignment, price
        quality, bookmaker consensus and availability.
        It is not a predicted win probability,
        guarantee or claim of positive betting value.
        Confirm the displayed first-quarter total and
        price before placing a wager.
      </p>
    </div>
  </div>
)}

{safestFirstQuarterTotalMessage && (
  <div className="mt-4 rounded-xl border border-fuchsia-900 bg-fuchsia-950/20 p-4 text-sm text-fuchsia-200">
    {safestFirstQuarterTotalMessage}
  </div>
)}

        {loading && (
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            Loading live WNBA games...
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-300">
            {error}
          </div>
        )}
        {historyMessage && (
  <div className="mt-6 rounded-xl border border-amber-900 bg-amber-950/20 p-4 text-sm text-amber-300">
    {historyMessage}
  </div>
)}

        {!loading &&
          !error &&
          games.length === 0 && (
            <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
              No currently available WNBA fixtures
              were returned. Please check again when
              bookmaker markets open.
            </div>
          )}

        {!loading &&
          !error &&
          games.length > 0 && (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {games.map((game) => {
                                const intelligence =
                  rankedGames.find(
                    (rankedGame) =>
                      rankedGame.eventId ===
                      game.id
                  );

                 const homeForm =
  findWNBATeamForm(
    teamForms,
    game.home_team
  );

const awayForm =
  findWNBATeamForm(
    teamForms,
    game.away_team
  );
                const h2h = findMarket(
                  game,
                  "h2h"
                );

                const spreads = findMarket(
                  game,
                  "spreads"
                );

                const totals = findMarket(
                  game,
                  "totals"
                );

                const homeMoneyline =
                  findOutcome(
                    h2h?.market.outcomes ?? [],
                    game.home_team
                  );

                const awayMoneyline =
                  findOutcome(
                    h2h?.market.outcomes ?? [],
                    game.away_team
                  );
                  const impliedProbabilities =
  calculateImpliedProbabilities(
    homeMoneyline?.price,
    awayMoneyline?.price
  );

                const homeSpread =
                  findOutcome(
                    spreads?.market.outcomes ?? [],
                    game.home_team
                  );

                const awaySpread =
                  findOutcome(
                    spreads?.market.outcomes ?? [],
                    game.away_team
                  );

                const over = findOutcome(
                  totals?.market.outcomes ?? [],
                  "Over"
                );

                const under = findOutcome(
                  totals?.market.outcomes ?? [],
                  "Under"
                );

                return (
                  <GameCard
                    key={game.id}
                    league="WNBA"
                    homeTeam={game.home_team}
                    awayTeam={game.away_team}
                    homeLogo={getWNBALogoUrl(game.home_team)}
awayLogo={getWNBALogoUrl(game.away_team)}
                    commenceTime={
                      game.commence_time
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MarketCard title="Moneyline">
                        <p>
                          {game.home_team}:{" "}
                          <span className="font-bold text-white">
                            {formatPrice(
                              homeMoneyline?.price
                            )}
                          </span>
                        </p>

                        <p>
                          {game.away_team}:{" "}
                          <span className="font-bold text-white">
                            {formatPrice(
                              awayMoneyline?.price
                            )}
                          </span>
                        </p>
                      </MarketCard>

                      <MarketCard title="Spread">
                        <p>
                          {game.home_team}:{" "}
                          <span className="font-bold text-white">
                            {formatPoint(
                              homeSpread?.point
                            )}{" "}
                            at{" "}
                            {formatPrice(
                              homeSpread?.price
                            )}
                          </span>
                        </p>

                        <p>
                          {game.away_team}:{" "}
                          <span className="font-bold text-white">
                            {formatPoint(
                              awaySpread?.point
                            )}{" "}
                            at{" "}
                            {formatPrice(
                              awaySpread?.price
                            )}
                          </span>
                        </p>
                      </MarketCard>

                      <MarketCard title="Total">
                        <p>
                          Over{" "}
                          {over?.point ?? "N/A"}:{" "}
                          <span className="font-bold text-white">
                            {formatPrice(over?.price)}
                          </span>
                        </p>

                        <p>
                          Under{" "}
                          {under?.point ?? "N/A"}:{" "}
                          <span className="font-bold text-white">
                            {formatPrice(
                              under?.price
                            )}
                          </span>
                        </p>
                      </MarketCard>
                    </div>
                    

                    {impliedProbabilities && (
                      <div className="mt-4 rounded-xl border border-blue-900 bg-blue-950/20 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                          Market-Implied Probability
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-blue-950 bg-black p-3">
                            <p className="text-xs text-zinc-500">
                              {game.home_team}
                            </p>

                            <p className="mt-1 font-bold text-white">
                              {impliedProbabilities.home.toFixed(1)}%
                            </p>
                          </div>

                          <div className="rounded-lg border border-blue-950 bg-black p-3">
                            <p className="text-xs text-zinc-500">
                              {game.away_team}
                            </p>

                            <p className="mt-1 font-bold text-white">
                              {impliedProbabilities.away.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-5 text-zinc-500">
                          Normalized from the selected bookmaker&apos;s
                          moneyline prices. These figures reflect
                          market-implied probability, not an EasyRunLine
                          prediction or guarantee.
                        </p>
                      </div>
                    )}
                    {homeForm && awayForm && (
  <div className="mt-4 rounded-xl border border-cyan-900 bg-cyan-950/10 p-4">
    <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
      Historical WNBA Form
    </p>

    <p className="mt-2 text-xs leading-5 text-zinc-500">
      Completed 2026 regular-season results.
      Historical form is informational and is not
      currently included in the independent win
      probability.
    </p>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {[
        {
          form: awayForm,
          venue: awayForm.away,
          venueLabel: "Away Form",
        },
        {
          form: homeForm,
          venue: homeForm.home,
          venueLabel: "Home Form",
        },
      ].map(
        ({
          form,
          venue,
          venueLabel,
        }) => (
          <div
            key={form.team}
            className="rounded-lg border border-zinc-800 bg-black p-4"
          >
            <p className="font-bold text-white">
              {form.team}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-500">
                  Last 5
                </p>

                <p className="font-semibold text-white">
                  {form.last5.wins}-
                  {form.last5.losses}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  Last 10
                </p>

                <p className="font-semibold text-white">
                  {form.last10.wins}-
                  {form.last10.losses}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  {venueLabel}
                </p>

                <p className="font-semibold text-white">
                  {venue.wins}-{venue.losses}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  Season
                </p>

                <p className="font-semibold text-white">
                  {form.season.wins}-
                  {form.season.losses}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
              <p>
                Last 5 scoring:{" "}
                <span className="font-semibold text-white">
                  {form.last5.averagePointsFor}
                </span>{" "}
                for /{" "}
                <span className="font-semibold text-white">
                  {form.last5.averagePointsAgainst}
                </span>{" "}
                against
              </p>

              <p className="mt-1">
                Last 5 average margin:{" "}
                <span
                  className={
                    form.last5.averagePointMargin >= 0
                      ? "font-bold text-emerald-400"
                      : "font-bold text-red-400"
                  }
                >
                  {form.last5.averagePointMargin > 0
                    ? "+"
                    : ""}
                  {form.last5.averagePointMargin}
                </span>
              </p>

              <p className="mt-1">
                {venueLabel} average margin:{" "}
                <span
                  className={
                    venue.averagePointMargin >= 0
                      ? "font-bold text-emerald-400"
                      : "font-bold text-red-400"
                  }
                >
                  {venue.averagePointMargin > 0
                    ? "+"
                    : ""}
                  {venue.averagePointMargin}
                </span>
              </p>
            </div>
          </div>
        )
      )}
    </div>
  </div>
)}

                                        {intelligence && (
                      <div className="mt-4 rounded-xl border border-orange-900 bg-orange-950/20 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
                          EasyRunLine WNBA Intelligence
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs text-zinc-500">
                              Preferred Team
                            </p>

                            <p className="mt-1 font-bold text-white">
                              {intelligence.preferredTeam}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              ERL Score
                            </p>

                            <p className="mt-1 font-bold text-orange-400">
                              {intelligence.erlScore}/100
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Confidence
                            </p>

                            <p className="mt-1 font-bold text-white">
                              {intelligence.confidence}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Matchup Grade
                            </p>

                            <p className="mt-1 font-bold text-white">
                              {intelligence.grade}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 border-t border-orange-900 pt-4 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-zinc-500">
                              Market Edge
                            </p>

                            <p className="mt-1 font-semibold text-white">
                              {intelligence.probabilityEdge.toFixed(1)}
                              points
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Bookmakers Verified
                            </p>

                            <p className="mt-1 font-semibold text-white">
                              {intelligence.bookmakerCount}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                            Market Qualification
                            </p>

                            <p
                              className={`mt-1 font-bold ${
                                intelligence.avoid
                                  ? "text-red-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {intelligence.avoid
                                ? "PASS"
                                : "QUALIFIED"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 border-t border-orange-900 pt-4 text-xs leading-5 text-zinc-500">
                          This initial WNBA score is based on
                          normalized market probability and verified
                          bookmaker coverage. Confidence remains
                          restricted until team form, injuries and
                          rest data are connected.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 space-y-1 text-xs text-zinc-500">
                      <p>
                        Moneyline bookmaker:{" "}
                        {h2h?.bookmaker ?? "N/A"}
                      </p>

                      <p>
                        Spread bookmaker:{" "}
                        {spreads?.bookmaker ?? "N/A"}
                      </p>

                      <p>
                        Total bookmaker:{" "}
                        {totals?.bookmaker ?? "N/A"}
                      </p>
                    </div>
                  </GameCard>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
}