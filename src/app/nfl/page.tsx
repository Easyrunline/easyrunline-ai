"use client";

import { useEffect, useState } from "react";
import { getNFLLogoUrl } from "@/lib/nfl/nflLogos";
import SportSelector from "@/components/SportSelector";
import type {
  NFLGame,
  NFLMarket,
  NFLOutcome,
  NFLTeamForm,
  NFLTeamQuarterbacks,
} from "@/lib/nfl/nflTypes";

type NFLOddsResponse = {
  games?: NFLGame[];
  error?: string;
  details?: string;
};

export default function NFLPage() {
  const [games, setGames] = useState<NFLGame[]>([]);
  const [teamForm, setTeamForm] = useState<NFLTeamForm[]>([]);
  const [teamQuarterbacks, setTeamQuarterbacks] =
  useState<NFLTeamQuarterbacks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNFLGames();
  }, []);
async function loadNFLTeamForm() {
  const response = await fetch("/api/nfl-form", {
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as NFLTeamForm[];
  }

  const data = await response.json();

  return (data.teams || []) as NFLTeamForm[];
}
async function loadNFLQuarterbacks() {
  const response = await fetch("/api/nfl-quarterbacks", {
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as NFLTeamQuarterbacks[];
  }

  const data = await response.json();

  return (data.teams || []) as NFLTeamQuarterbacks[];
}


  
  async function loadNFLGames() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/nfl-odds", {
        cache: "no-store",
      });

      const data = (await response.json()) as NFLOddsResponse;

      if (!response.ok) {
  setGames([]);
  setError(
    data.error ||
      data.details ||
      "Could not load NFL games."
  );
  return;
}

const [formData, quarterbackData] = await Promise.all([
  loadNFLTeamForm(),
  loadNFLQuarterbacks(),
]);

setTeamForm(formData);
setTeamQuarterbacks(quarterbackData);
setGames(data.games || []);
    } catch {
      setGames([]);
      setError("Could not load NFL games.");
    } finally {
      setLoading(false);
    }
  }

  function getMarket(
    game: NFLGame,
    marketKey: string
  ): NFLMarket | undefined {
    return game.bookmakers?.[0]?.markets.find(
      (market) => market.key === marketKey
    );
  }

  function getTeamOutcome(
    market: NFLMarket | undefined,
    teamName: string
  ): NFLOutcome | undefined {
    return market?.outcomes.find(
      (outcome) => outcome.name === teamName
    );
  }

  function getNamedOutcome(
    market: NFLMarket | undefined,
    outcomeName: string
  ): NFLOutcome | undefined {
    return market?.outcomes.find(
      (outcome) => outcome.name === outcomeName
    );
  }

  function formatPrice(price?: number) {
    return price !== undefined ? price.toFixed(2) : "N/A";
  }

  function formatSpread(outcome?: NFLOutcome) {
    if (!outcome || outcome.point === undefined) {
      return "N/A";
    }

    const point =
      outcome.point > 0
        ? `+${outcome.point}`
        : `${outcome.point}`;

    return `${point} at ${formatPrice(outcome.price)}`;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-900 bg-black/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-yellow-400">
              EASYRUNLINE AI
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Multi-Sport Intelligence
            </p>
          </div>

          <SportSelector />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              NFL Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Live NFL Games
            </h1>

            <p className="mt-3 max-w-2xl text-zinc-400">
              Live NFL moneyline, spread and total markets.
              Scoring intelligence is under development.
            </p>
          </div>

          <button
            type="button"
            onClick={loadNFLGames}
            disabled={loading}
            className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh NFL Games"}
          </button>
        </div>

        {loading && (
          <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
            Loading live NFL markets...
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-xl border border-red-900/70 bg-red-950/30 p-6 text-red-300">
            <p className="font-semibold">
              NFL games could not be loaded.
            </p>

            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <p className="font-semibold text-white">
              No NFL games are currently available.
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              The odds feed may not have active NFL markets at
              this time.
            </p>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {games.map((game) => {
              const moneyline = getMarket(game, "h2h");
              const spread = getMarket(game, "spreads");
              const total = getMarket(game, "totals");

              const awayMoneyline = getTeamOutcome(
                moneyline,
                game.away_team
              );

              const homeMoneyline = getTeamOutcome(
                moneyline,
                game.home_team
              );

              const awaySpread = getTeamOutcome(
                spread,
                game.away_team
              );

              const homeSpread = getTeamOutcome(
                spread,
                game.home_team
              );

              const over = getNamedOutcome(total, "Over");
              const under = getNamedOutcome(total, "Under");

              const bookmaker =
                game.bookmakers?.[0]?.title || "Not available";
                const awayForm = teamForm.find(
  (team) => team.team === game.away_team
);

const homeForm = teamForm.find(
  (team) => team.team === game.home_team
);
const awayQuarterbacks = teamQuarterbacks.find(
  (team) => team.team === game.away_team
)?.quarterbacks ?? [];

const homeQuarterbacks = teamQuarterbacks.find(
  (team) => team.team === game.home_team
)?.quarterbacks ?? [];
const awayLikelyQuarterback = [...awayQuarterbacks]
  .filter((quarterback) => quarterback.status === "Active")
  .sort(
    (a, b) => b.experienceYears - a.experienceYears
  )[0];

const homeLikelyQuarterback = [...homeQuarterbacks]
  .filter((quarterback) => quarterback.status === "Active")
  .sort(
    (a, b) => b.experienceYears - a.experienceYears
  )[0];

              return (
                <article
                  key={game.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-lg shadow-black/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
    NFL Matchup
  </p>

  <div className="mt-3 flex items-center gap-3">
    {getNFLLogoUrl(game.away_team) && (
      <img
        src={getNFLLogoUrl(game.away_team) ?? ""}
        alt={`${game.away_team} logo`}
        className="h-10 w-10 object-contain"
      />
    )}

    <h2 className="text-xl font-bold">
      {game.away_team}
    </h2>
  </div>

  <p className="my-2 text-sm text-zinc-500">
    at
  </p>

  <div className="flex items-center gap-3">
    {getNFLLogoUrl(game.home_team) && (
      <img
        src={getNFLLogoUrl(game.home_team) ?? ""}
        alt={`${game.home_team} logo`}
        className="h-10 w-10 object-contain"
      />
    )}

    <h2 className="text-xl font-bold">
      {game.home_team}
    </h2>
  </div>
</div>

                    <p className="max-w-36 text-right text-xs text-zinc-500">
                      {new Date(
                        game.commence_time
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Moneyline
                      </p>

                      <p className="mt-3 text-sm">
                        {game.away_team}:{" "}
                        <span className="font-semibold text-yellow-400">
                          {formatPrice(awayMoneyline?.price)}
                        </span>
                      </p>

                      <p className="mt-2 text-sm">
                        {game.home_team}:{" "}
                        <span className="font-semibold text-yellow-400">
                          {formatPrice(homeMoneyline?.price)}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Spread
                      </p>

                      <p className="mt-3 text-sm">
                        {game.away_team}:{" "}
                        <span className="font-semibold text-yellow-400">
                          {formatSpread(awaySpread)}
                        </span>
                      </p>

                      <p className="mt-2 text-sm">
                        {game.home_team}:{" "}
                        <span className="font-semibold text-yellow-400">
                          {formatSpread(homeSpread)}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Total
                      </p>

                      <p className="mt-3 text-sm">
                        Over{" "}
                        {over?.point !== undefined
                          ? over.point
                          : "N/A"}
                        :{" "}
                        <span className="font-semibold text-yellow-400">
                          {formatPrice(over?.price)}
                        </span>
                      </p>

                      <p className="mt-2 text-sm">
                        Under{" "}
                        {under?.point !== undefined
                          ? under.point
                          : "N/A"}
                        :{" "}
                        <span className="font-semibold text-yellow-400">
                          {formatPrice(under?.price)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-black p-4">
  <div className="flex items-center justify-between gap-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
      QB Roster Intelligence
    </p>

    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
      Verify starter before kickoff
    </p>
  </div>

  <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs font-semibold text-zinc-500">
        {game.away_team}
      </p>

      {awayLikelyQuarterback ? (
        <div className="mt-3 flex items-center gap-3">
          {awayLikelyQuarterback.headshot && (
            <img
              src={awayLikelyQuarterback.headshot}
              alt={`${awayLikelyQuarterback.player} headshot`}
              className="h-14 w-14 rounded-full object-cover"
            />
          )}

          <div>
            <p className="font-semibold text-white">
              {awayLikelyQuarterback.player}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              #{awayLikelyQuarterback.jersey} ·{" "}
              {awayLikelyQuarterback.experienceYears} years experience
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Most experienced active roster candidate
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          No active quarterback candidate found.
        </p>
      )}
    </div>

    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs font-semibold text-zinc-500">
        {game.home_team}
      </p>

      {homeLikelyQuarterback ? (
        <div className="mt-3 flex items-center gap-3">
          {homeLikelyQuarterback.headshot && (
            <img
              src={homeLikelyQuarterback.headshot}
              alt={`${homeLikelyQuarterback.player} headshot`}
              className="h-14 w-14 rounded-full object-cover"
            />
          )}

          <div>
            <p className="font-semibold text-white">
              {homeLikelyQuarterback.player}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              #{homeLikelyQuarterback.jersey} ·{" "}
              {homeLikelyQuarterback.experienceYears} years experience
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Most experienced active roster candidate
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          No active quarterback candidate found.
        </p>
      )}
    </div>
  </div>
</div>
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-black p-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
    Recent Form
  </p>

  <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <div>
      <p className="font-semibold text-white">
        {game.away_team}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Last 5:{" "}
        <span className="font-semibold text-white">
          {awayForm
            ? `${awayForm.winsLast5}-${awayForm.lossesLast5}${
                awayForm.tiesLast5 > 0
                  ? `-${awayForm.tiesLast5}`
                  : ""
              }`
            : "N/A"}
        </span>
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Last 10:{" "}
        <span className="font-semibold text-white">
          {awayForm
            ? `${awayForm.winsLast10}-${awayForm.lossesLast10}${
                awayForm.tiesLast10 > 0
                  ? `-${awayForm.tiesLast10}`
                  : ""
              }`
            : "N/A"}
        </span>
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Points For:{" "}
        <span className="font-semibold text-white">
          {awayForm?.averagePointsForLast10 ?? "N/A"}
        </span>
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Points Against:{" "}
        <span className="font-semibold text-white">
          {awayForm?.averagePointsAgainstLast10 ?? "N/A"}
        </span>
      </p>
    </div>

    <div>
      <p className="font-semibold text-white">
        {game.home_team}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Last 5:{" "}
        <span className="font-semibold text-white">
          {homeForm
            ? `${homeForm.winsLast5}-${homeForm.lossesLast5}${
                homeForm.tiesLast5 > 0
                  ? `-${homeForm.tiesLast5}`
                  : ""
              }`
            : "N/A"}
        </span>
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Last 10:{" "}
        <span className="font-semibold text-white">
          {homeForm
            ? `${homeForm.winsLast10}-${homeForm.lossesLast10}${
                homeForm.tiesLast10 > 0
                  ? `-${homeForm.tiesLast10}`
                  : ""
              }`
            : "N/A"}
        </span>
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Points For:{" "}
        <span className="font-semibold text-white">
          {homeForm?.averagePointsForLast10 ?? "N/A"}
        </span>
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        Points Against:{" "}
        <span className="font-semibold text-white">
          {homeForm?.averagePointsAgainstLast10 ?? "N/A"}
        </span>
      </p>
    </div>
  </div>
</div>

                  <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4 text-xs text-zinc-500">
                    <span>Bookmaker</span>
                    <span className="font-semibold text-zinc-300">
                      {bookmaker}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}