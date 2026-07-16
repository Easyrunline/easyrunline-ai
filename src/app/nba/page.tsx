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
import {
  findSafestNBAPremiumMarket,
  getNBAPremiumMarketLabel,
  type NBAPremiumMarketKey,
  type NBAPremiumMarketResponse,
  type NBAPremiumSelection,
} from "@/lib/nba/nbaPremiumMarkets";

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
  const [
  premiumSelection,
  setPremiumSelection,
] =
  useState<NBAPremiumSelection | null>(
    null
  );

const [
  premiumMessage,
  setPremiumMessage,
] = useState("");

const [
  premiumLoadingMarket,
  setPremiumLoadingMarket,
] =
  useState<NBAPremiumMarketKey | null>(
    null
  );
  

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
  setPremiumSelection(null);
  setPremiumMessage("");


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
async function findBestTwoLegParlay() {
  clearNBAAnalysisResults();

  try {
    setBestTwoLegLoading(true);

    if (games.length < 2) {
      setBestTwoLegMessage(
        "At least two NBA games are required for a 2-leg parlay."
      );
      return;
    }

    const availableLegs: NBAAlternateSpreadLeg[] = [];

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

      availableLegs.push({
        ...selection,
        eventId: candidate.eventId,
        homeTeam: candidate.homeTeam,
        awayTeam: candidate.awayTeam,
        erlScore: candidate.preferredScore,
        scoreGap: candidate.scoreGap,
      });
    }

    const parlay =
      buildNBAAlternateSpreadParlay(
        availableLegs,
        2
      );

    if (!parlay) {
      setBestTwoLegMessage(
        "No dependable NBA 2-leg alternate-spread parlay was identified."
      );
      return;
    }

    setBestTwoLegParlay(parlay);

    setBestTwoLegMessage(
      "Two highest-rated available NBA alternate spreads from different games."
    );
  } catch {
    setBestTwoLegMessage(
      "Could not complete NBA 2-leg analysis."
    );
  } finally {
    setBestTwoLegLoading(false);
  }
}
function findGamesToAvoid() {
  clearNBAAnalysisResults();

  if (games.length === 0) {
    setAvoidMessage(
      "No NBA games are currently available for analysis."
    );
    return;
  }

  const results = buildNBAGamesToAvoid(
    rankedGames,
    3
  );

  if (results.length === 0) {
    setAvoidMessage(
      "No clear NBA avoid games were identified."
    );
    return;
  }

  setAvoidGames(results);

  setAvoidMessage(
    "These matchups carry the highest combination of uncertainty, incomplete data and limited ERL separation."
  );
}
async function findBestPremiumMarket(
  marketKey: NBAPremiumMarketKey
) {
  clearNBAAnalysisResults();

  try {
    setPremiumLoadingMarket(marketKey);

    if (games.length === 0) {
      setPremiumMessage(
        "No NBA games are currently available."
      );
      return;
    }

    let bestSelection:
      | NBAPremiumSelection
      | null = null;

    for (const candidate of rankedGames) {
      if (candidate.avoid) {
        continue;
      }

      /*
       * Total markets require a real projected total.
       * Do not generate a recommendation when the
       * total projection is unavailable.
       */
      const isTotalMarket =
        marketKey === "alternate_totals" ||
        marketKey ===
          "alternate_totals_h1";

      if (
        isTotalMarket &&
        candidate.projectedTotal === null
      ) {
        continue;
      }

      const response = await fetch(
        `/api/nba-markets?eventId=${encodeURIComponent(
          candidate.eventId
        )}&markets=${encodeURIComponent(
          marketKey
        )}`,
        {
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as
          NBAPremiumMarketResponse;

      if (
        !response.ok ||
        !data.available
      ) {
        continue;
      }

      /*
       * First-half total starts from approximately
       * half of the full-game projected total.
       */
      const projectedTotal =
        candidate.projectedTotal === null
          ? undefined
          : marketKey ===
              "alternate_totals_h1"
            ? candidate.projectedTotal *
              0.5
            : candidate.projectedTotal;

      const selection =
        findSafestNBAPremiumMarket(
          data.bookmakers || [],
          marketKey,
          {
            eventId:
              candidate.eventId,

            homeTeam:
              candidate.homeTeam,

            awayTeam:
              candidate.awayTeam,

            preferredTeam:
              candidate.preferredTeam,

            erlRating:
              candidate.preferredScore,

            projectedMargin:
              candidate.projectedMargin,

            projectedTotal,

            uncertainty:
              candidate.uncertainty,

            dataCompleteness:
              candidate.dataCompleteness,
          }
        );

      if (!selection) {
        continue;
      }

      if (
        !bestSelection ||
        selection.safetyScore >
          bestSelection.safetyScore ||
        (selection.safetyScore ===
          bestSelection.safetyScore &&
          selection.modelCushion >
            bestSelection.modelCushion)
      ) {
        bestSelection = selection;
      }
    }

    if (!bestSelection) {
      setPremiumMessage(
        `No dependable ${getNBAPremiumMarketLabel(
          marketKey
        ).toLowerCase()} was identified.`
      );
      return;
    }

    setPremiumSelection(bestSelection);

    setPremiumMessage(
      `${bestSelection.selection} is the highest-rated available ${bestSelection.marketLabel.toLowerCase()}.`
    );
  } catch {
    setPremiumMessage(
      `Could not complete ${getNBAPremiumMarketLabel(
        marketKey
      ).toLowerCase()} analysis.`
    );
  } finally {
    setPremiumLoadingMarket(null);
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
        <div className="mb-8 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={findSafestAltSpread}
    disabled={
      loading ||
      games.length === 0 ||
      safestAltLoading
    }
    className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {safestAltLoading
      ? "Analyzing..."
      : "Safest Alternate Spread"}
  </button>

  <button
    type="button"
    onClick={findBestTwoLegParlay}
    disabled={
      loading ||
      games.length < 2 ||
      bestTwoLegLoading
    }
    className="rounded-lg bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {bestTwoLegLoading
      ? "Building Parlay..."
      : "Best 2-Leg Alt Spread"}
  </button>

  <button
    type="button"
    onClick={findGamesToAvoid}
    disabled={loading || games.length === 0}
    className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
  >
    Games to Avoid
  </button>

  <button
    type="button"
    onClick={() =>
      findBestPremiumMarket(
        "alternate_spreads_q1"
      )
    }
    disabled={
      loading ||
      games.length === 0 ||
      premiumLoadingMarket !== null
    }
    className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {premiumLoadingMarket ===
    "alternate_spreads_q1"
      ? "Analyzing Q1..."
      : "Best Q1 Spread"}
  </button>

  <button
    type="button"
    onClick={() =>
      findBestPremiumMarket(
        "alternate_spreads_h1"
      )
    }
    disabled={
      loading ||
      games.length === 0 ||
      premiumLoadingMarket !== null
    }
    className="rounded-lg bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {premiumLoadingMarket ===
    "alternate_spreads_h1"
      ? "Analyzing H1..."
      : "Best First-Half Spread"}
  </button>

  <button
    type="button"
    onClick={() =>
      findBestPremiumMarket(
        "alternate_totals"
      )
    }
    disabled={
      loading ||
      games.length === 0 ||
      premiumLoadingMarket !== null
    }
    className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {premiumLoadingMarket ===
    "alternate_totals"
      ? "Analyzing Total..."
      : "Best Alternate Total"}
  </button>

  <button
    type="button"
    onClick={() =>
      findBestPremiumMarket(
        "alternate_totals_h1"
      )
    }
    disabled={
      loading ||
      games.length === 0 ||
      premiumLoadingMarket !== null
    }
    className="rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {premiumLoadingMarket ===
    "alternate_totals_h1"
      ? "Analyzing H1 Total..."
      : "Best First-Half Total"}
  </button>
</div>
{premiumSelection && (
  <div className="mb-6 rounded-2xl border border-blue-800 bg-blue-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-wide text-blue-400">
      EasyRunLine — {premiumSelection.marketLabel}
    </p>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-zinc-500">
          Selection
        </p>

        <p className="mt-1 text-lg font-bold text-white">
          {premiumSelection.selection}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Price
        </p>

        <p className="mt-1 font-bold text-white">
          {formatPrice(
            premiumSelection.price
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Safety Score
        </p>

        <p className="mt-1 font-bold text-emerald-400">
          {premiumSelection.safetyScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Bookmaker
        </p>

        <p className="mt-1 font-bold text-white">
          {premiumSelection.bookmaker}
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 border-t border-blue-900 pt-4 sm:grid-cols-3">
      <div>
        <p className="text-xs text-zinc-500">
          Model Cushion
        </p>

        <p className="mt-1 font-semibold text-white">
          {premiumSelection.modelCushion > 0
            ? "+"
            : ""}
          {premiumSelection.modelCushion.toFixed(
            1
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Projected Margin
        </p>

        <p className="mt-1 font-semibold text-white">
          {premiumSelection.projectedMargin ===
          null
            ? "N/A"
            : `${
                premiumSelection.projectedMargin >
                0
                  ? "+"
                  : ""
              }${premiumSelection.projectedMargin.toFixed(
                1
              )}`}
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">
          Projected Total
        </p>

        <p className="mt-1 font-semibold text-white">
          {premiumSelection.projectedTotal ===
          null
            ? "N/A"
            : premiumSelection.projectedTotal.toFixed(
                1
              )}
        </p>
      </div>
    </div>

    <div className="mt-5 space-y-2 border-t border-blue-900 pt-4 text-sm text-zinc-300">
      {premiumSelection.reasons.map(
        (reason) => (
          <p key={reason}>
            • {reason}
          </p>
        )
      )}
    </div>
  </div>
)}

{premiumMessage && (
  <div className="mb-6 rounded-xl border border-blue-900 bg-blue-950/10 p-4 text-sm text-blue-300">
    {premiumMessage}
  </div>
)}

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
                          projectedTotal={
  intelligence.projectedTotal
}
totalProjectionSource={
  intelligence.totalProjectionSource
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