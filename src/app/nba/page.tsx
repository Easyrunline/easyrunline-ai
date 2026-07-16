"use client";

import { useEffect, useMemo, useState } from "react";

import SportSelector from "@/components/SportSelector";
import LeagueHeader from "@/components/LeagueHeader";
import GameCard from "@/components/GameCard";
import MarketCard from "@/components/MarketCard";
import ERLMetricsCard from "@/components/ERLMetricsCard";

import { getNBALogoUrl } from "@/lib/nba/nbaLogos";

import {
  buildNBAIntelligence,
  type RankedNBAGame,
} from "@/lib/nba/nbaIntelligence";

import type {
  NBAGame,
  NBAMarket,
  NBAOutcome,
  NBATeamForm,
} from "@/lib/nba/nbaTypes";
import {
  findSafestNBAAvailableSpread,
  type NBAAlternateSpreadBookmaker,
  type NBAAlternateSpreadSelection,
  type NBAAlternateSpreadLeg,
  type NBAAlternateSpreadParlay,
} from "@/lib/nba/nbaAlternateSpread";

import { buildNBAAlternateSpreadParlay } from "@/lib/nba/nbaParlay";

import {
  buildNBAGamesToAvoid,
  type NBAAvoidGame,
} from "@/lib/nba/nbaAvoid";

type NBAOddsResponse = {
  games?: NBAGame[];
  error?: string;
  details?: string;
};

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
  game: NBAGame,
  marketKey: string
): {
  bookmaker: string;
  market: NBAMarket;
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
  outcomes: NBAOutcome[],
  teamName: string
) {
  return outcomes.find(
    (outcome) => outcome.name === teamName
  );
}

function getGameIntelligence(
  rankedGames: RankedNBAGame[],
  eventId: string
) {
  return rankedGames.find(
    (game) => game.eventId === eventId
  );
}

export default function NBAPage() {
  const [games, setGames] = useState<NBAGame[]>([]);
  const [teamForm] = useState<NBATeamForm[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [
  safestAltSpread,
  setSafestAltSpread,
] =
  useState<NBAAlternateSpreadSelection | null>(
    null
  );

const [
  safestAltMessage,
  setSafestAltMessage,
] = useState("");

const [
  safestAltLoading,
  setSafestAltLoading,
] = useState(false);

const [
  bestTwoLegParlay,
  setBestTwoLegParlay,
] =
  useState<NBAAlternateSpreadParlay | null>(
    null
  );

const [
  bestTwoLegMessage,
  setBestTwoLegMessage,
] = useState("");

const [
  bestTwoLegLoading,
  setBestTwoLegLoading,
] = useState(false);

const [avoidGames, setAvoidGames] =
  useState<NBAAvoidGame[]>([]);

const [avoidMessage, setAvoidMessage] =
  useState("");
  

  useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/nba-odds",
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as NBAOddsResponse;

        if (!response.ok) {
          setGames([]);
          setError(
            data.error ||
              data.details ||
              "Could not load NBA games."
          );
          return;
        }

        setGames(data.games || []);
      } catch {
        setGames([]);
        setError(
          "Could not load NBA games."
        );
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  const rankedGames = useMemo(
    () =>
      buildNBAIntelligence(
        games,
        teamForm
      ),
    [games, teamForm]
  );
function clearNBAAnalysisResults() {
  setSafestAltSpread(null);
  setSafestAltMessage("");

  setBestTwoLegParlay(null);
  setBestTwoLegMessage("");

  setAvoidGames([]);
  setAvoidMessage("");
}
async function findSafestAltSpread() {
  clearNBAAnalysisResults();

  try {
    setSafestAltLoading(true);

    if (games.length === 0) {
      setSafestAltMessage(
        "No NBA games are currently available."
      );
      return;
    }

    for (const candidate of rankedGames) {
      if (candidate.avoid) {
        continue;
      }

      const response = await fetch(
        `/api/nba-alternate-spreads?eventId=${encodeURIComponent(
          candidate.eventId
        )}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        available?: boolean;
        bookmakers?: NBAAlternateSpreadBookmaker[];
      };

      if (!data.available) {
        continue;
      }

      const selection =
        findSafestNBAAvailableSpread(
          data.bookmakers || [],
          {
            homeTeam: candidate.homeTeam,
            awayTeam: candidate.awayTeam,

            preferredTeam:
              candidate.preferredTeam,

            projectedMargin:
              candidate.projectedMargin,

            erlRating:
              candidate.preferredScore,

            uncertainty:
              candidate.uncertainty,

            dataCompleteness:
              candidate.dataCompleteness,
          }
        );

      if (!selection) {
        continue;
      }

      setSafestAltSpread(selection);

      setSafestAltMessage(
        `${selection.team} ${formatPoint(
          selection.point
        )} is the highest-rated available NBA alternate spread.`
      );

      return;
    }

    setSafestAltMessage(
      "No dependable NBA alternate spread was identified."
    );
  } catch {
    setSafestAltMessage(
      "Could not complete NBA alternate-spread analysis."
    );
  } finally {
    setSafestAltLoading(false);
  }
}
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SportSelector />

        <div className="mt-8">
          <LeagueHeader
            title="EasyRunLine NBA"
            subtitle="NBA Spread and Game Intelligence"
          />
        </div>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
            Loading NBA games...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/20 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          games.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
              <p className="text-lg font-bold text-white">
                No NBA games are currently available.
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The NBA is currently outside the main betting window. EasyRunLine will automatically display fixtures, odds and ERL intelligence when NBA markets become available.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  "Safest Alternate Spread",
                  "Best Q1 Spread",
                  "Best First-Half Spread",
                  "Best Alternate Total",
                  "Best First-Half Total",
                  "Best 2-Leg Parlay",
                  "Games to Avoid",
                  "Ask EasyRunLine",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="rounded-xl border border-zinc-800 bg-black p-4 text-sm font-semibold text-zinc-300"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          games.length > 0 && (
            <div className="space-y-6">
              {games.map((game) => {
                const intelligence =
                  getGameIntelligence(
                    rankedGames,
                    game.id
                  );

                const moneyline = findMarket(
                  game,
                  "h2h"
                );

                const spread = findMarket(
                  game,
                  "spreads"
                );

                const total = findMarket(
                  game,
                  "totals"
                );

                const awayMoneyline =
                  moneyline
                    ? findOutcome(
                        moneyline.market.outcomes,
                        game.away_team
                      )
                    : undefined;

                const homeMoneyline =
                  moneyline
                    ? findOutcome(
                        moneyline.market.outcomes,
                        game.home_team
                      )
                    : undefined;

                const awaySpread =
                  spread
                    ? findOutcome(
                        spread.market.outcomes,
                        game.away_team
                      )
                    : undefined;

                const homeSpread =
                  spread
                    ? findOutcome(
                        spread.market.outcomes,
                        game.home_team
                      )
                    : undefined;

                const overOutcome =
                  total?.market.outcomes.find(
                    (outcome) =>
                      outcome.name === "Over"
                  );

                const underOutcome =
                  total?.market.outcomes.find(
                    (outcome) =>
                      outcome.name === "Under"
                  );

                return (
                  <GameCard
                    key={game.id}
                    league="NBA"
                    awayTeam={game.away_team}
                    homeTeam={game.home_team}
                    awayLogo={getNBALogoUrl(
                      game.away_team
                    )}
                    homeLogo={getNBALogoUrl(
                      game.home_team
                    )}
                    commenceTime={
                      game.commence_time
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <MarketCard title="Moneyline">
                        <p>
                          {game.away_team}:{" "}
                          {formatPrice(
                            awayMoneyline?.price
                          )}
                        </p>

                        <p>
                          {game.home_team}:{" "}
                          {formatPrice(
                            homeMoneyline?.price
                          )}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {moneyline?.bookmaker ||
                            "Not available"}
                        </p>
                      </MarketCard>

                      <MarketCard title="Spread">
                        <p>
                          {game.away_team}:{" "}
                          {formatPoint(
                            awaySpread?.point
                          )}{" "}
                          at{" "}
                          {formatPrice(
                            awaySpread?.price
                          )}
                        </p>

                        <p>
                          {game.home_team}:{" "}
                          {formatPoint(
                            homeSpread?.point
                          )}{" "}
                          at{" "}
                          {formatPrice(
                            homeSpread?.price
                          )}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {spread?.bookmaker ||
                            "Not available"}
                        </p>
                      </MarketCard>

                      <MarketCard title="Total">
                        <p>
                          Over{" "}
                          {formatPoint(
                            overOutcome?.point
                          )}{" "}
                          at{" "}
                          {formatPrice(
                            overOutcome?.price
                          )}
                        </p>

                        <p>
                          Under{" "}
                          {formatPoint(
                            underOutcome?.point
                          )}{" "}
                          at{" "}
                          {formatPrice(
                            underOutcome?.price
                          )}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {total?.bookmaker ||
                            "Not available"}
                        </p>
                      </MarketCard>
                    </div>

                    {intelligence && (
                      <div className="mt-5">
                        <ERLMetricsCard
                          erlRating={
                            intelligence.preferredScore
                          }
                          erlEdge={
                            intelligence.scoreGap
                          }
                          projectedMargin={
                            intelligence.projectedMargin
                          }
                          confidence={
                            intelligence.confidence
                          }
                          blowoutRisk={
                            intelligence.blowoutRisk
                          }
                          dataCompleteness={
                            intelligence.dataCompleteness
                          }
                          uncertainty={
                            intelligence.uncertainty
                          }
                        />

                        <div className="mt-4 rounded-xl border border-zinc-800 bg-black p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
                            ERL Recommendation
                          </p>

                          <p className="mt-2 text-lg font-bold text-white">
                            {
                              intelligence.preferredTeam
                            }
                          </p>

                          <p className="mt-1 text-sm text-zinc-400">
                            Preferred over{" "}
                            {
                              intelligence.opponentTeam
                            }
                          </p>

                          <div className="mt-3 space-y-1 text-sm text-zinc-300">
                            {intelligence.reasons.map(
                              (reason) => (
                                <p key={reason}>
                                  • {reason}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </GameCard>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}