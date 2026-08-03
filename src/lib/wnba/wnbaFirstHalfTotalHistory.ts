import type {
  WNBAHistoricalGame,
} from "./wnbaTypes";

import {
  buildWNBATotalHistoricalAnalysis,
  type WNBATotalHistoricalAnalysis,
} from "./wnbaTotalHistory";

export type WNBAFirstHalfTotalHistoricalAnalysis =
  WNBATotalHistoricalAnalysis;

export function buildWNBAFirstHalfTotalHistoricalAnalysis(
  historicalGames:
    WNBAHistoricalGame[],
  selection: {
    direction: "Over" | "Under";
    selectedTotal: number;

    homeTeam: string;
    awayTeam: string;
  }
): WNBAFirstHalfTotalHistoricalAnalysis | null {
  const firstHalfGames =
    historicalGames.flatMap(
      (game) => {
        if (
          !Number.isFinite(
            game.homeFirstHalfScore
          ) ||
          !Number.isFinite(
            game.awayFirstHalfScore
          )
        ) {
          return [];
        }

        return [
          {
            ...game,

            homeScore:
              game.homeFirstHalfScore as number,

            awayScore:
              game.awayFirstHalfScore as number,
          },
        ];
      }
    );

  if (firstHalfGames.length === 0) {
    return null;
  }

  return buildWNBATotalHistoricalAnalysis(
    firstHalfGames,
    selection
  );
}