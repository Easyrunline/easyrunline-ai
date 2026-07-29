"use client";

import { useEffect, useState } from "react";

import GameCard from "@/components/GameCard";
import LeagueHeader from "@/components/LeagueHeader";
import MarketCard from "@/components/MarketCard";
import { getWNBALogoUrl } from "@/lib/wnba/wnbaLogos";

import type {
  WNBAGame,
  WNBAMarket,
  WNBAOddsResponse,
  WNBAOutcome,
} from "@/lib/wnba/wnbaTypes";

function formatPrice(price?: number) {
  if (!Number.isFinite(price)) {
    return "N/A";
  }

  return Number(price).toFixed(2);
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

export default function WNBAPage() {
  const [games, setGames] = useState<WNBAGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGames() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/wnba-odds",
        {
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as WNBAOddsResponse;

      if (!response.ok) {
        setError(
          data.error ||
            "Could not load WNBA games."
        );
        return;
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