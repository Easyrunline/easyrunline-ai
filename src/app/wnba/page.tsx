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

export default function WNBAPage() {
  const [games, setGames] = useState<WNBAGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const rankedGames =
    useMemo<RankedWNBAGame[]>(
      () =>
        buildWNBAIntelligence(
          games
        ),
      [games]
    );
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
                                const intelligence =
                  rankedGames.find(
                    (rankedGame) =>
                      rankedGame.eventId ===
                      game.id
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
                              Engine Status
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