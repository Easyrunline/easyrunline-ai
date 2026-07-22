"use client";

import { useEffect, useState } from "react";
import { getNFLLogoUrl } from "@/lib/nfl/nflLogos";
import SportSelector from "@/components/SportSelector";
import { scoreNFLTeam } from "@/lib/nfl/nflScore";
import { buildNFLIntelligence } from "@/lib/nfl/nflIntelligence";
import { buildERLRating } from "@/lib/erl/erlRating";
import { buildNFLAlternateSpreadParlay } from "@/lib/nfl/nflParlay";
import {
  buildNFLGamesToAvoid,
  type NFLAvoidGame,
} from "@/lib/nfl/nflAvoid";
import {
  findSafestAvailableSpread,
  formatNFLSpread,
  type NFLAlternateSpreadBookmaker,
  type NFLAlternateSpreadSelection,
  type NFLAlternateSpreadLeg,
type NFLAlternateSpreadParlay,

} from "@/lib/nfl/nflAlternateSpread";
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
  const [safestAltSpread, setSafestAltSpread] =
  useState<NFLAlternateSpreadSelection | null>(null);

const [safestAltMessage, setSafestAltMessage] = useState("");

const [safestAltLoading, setSafestAltLoading] =
  useState(false);
  const [bestTwoLegLoading, setBestTwoLegLoading] =
  useState(false);

const [bestTwoLegParlay, setBestTwoLegParlay] =
  useState<NFLAlternateSpreadParlay | null>(null);

const [bestTwoLegMessage, setBestTwoLegMessage] =
  useState("");
  const [avoidGames, setAvoidGames] =
  useState<NFLAvoidGame[]>([]);

const [avoidMessage, setAvoidMessage] =
  useState("");

  useEffect(() => {
    loadNFLGames();
  }, []);
  function clearNFLAnalysisResults() {
  setSafestAltSpread(null);
  setSafestAltMessage("");

  setBestTwoLegParlay(null);
  setBestTwoLegMessage("");

  setAvoidGames([]);
  setAvoidMessage("");
}
  function getOffenseRank(teamName: string) {
  const ranked = [...teamForm].sort(
    (a, b) =>
      (b.averagePointsForLast10 ?? 0) -
      (a.averagePointsForLast10 ?? 0)
  );

  const index = ranked.findIndex(
    (team) => team.team === teamName
  );

  return index >= 0 ? index + 1 : "N/A";
}

function getDefenseRank(teamName: string) {
  const ranked = [...teamForm].sort(
    (a, b) =>
      (a.averagePointsAgainstLast10 ?? 999) -
      (b.averagePointsAgainstLast10 ?? 999)
  );

  const index = ranked.findIndex(
    (team) => team.team === teamName
  );

  return index >= 0 ? index + 1 : "N/A";
}
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
async function findSafestAltSpread() {
  clearNFLAnalysisResults();

  try {
    setSafestAltLoading(true);
    setSafestAltSpread(null);
    setSafestAltMessage("");

    if (games.length === 0) {
      setSafestAltMessage(
        "No NFL games are currently available."
      );
      return;
    }
    const rankedGames = buildNFLIntelligence(
  games,
  teamForm,
  teamQuarterbacks
)

    

    
      


   for (const candidate of rankedGames) {
  if (candidate.avoid) {
    continue;
  }

  const response = await fetch(
        `/api/nfl-alternate-spreads?eventId=${encodeURIComponent(
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
        bookmakers?: NFLAlternateSpreadBookmaker[];
        message?: string;
      };

      if (!data.available) {
        continue;
      }

      const selection = findSafestAvailableSpread(
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

      if (selection) {
  const opponentScore =
    candidate.preferredScore - candidate.scoreGap;

  const rating = buildERLRating(
    candidate.preferredScore,
    opponentScore
  );

  setSafestAltSpread(selection);

  setSafestAltMessage(
    `EasyRunLine preferred team: ${
      candidate.preferredTeam
    }. ERL Score: ${
      rating.score
    }/100. EasyRunLine Edge: ${
      rating.edge > 0 ? "+" : ""
    }${rating.edge}. ${
      rating.edgeGrade
    }. Confidence: ${
      rating.confidence
    }. ${rating.starDisplay}. ${
      rating.summary
    }`
  );

  return;
}
    }

    const strongestCandidate = rankedGames[0];

    if (!strongestCandidate) {
      setSafestAltMessage(
        "No suitable NFL matchup was found."
      );
      return;
    }

    const strongestGame = games.find(
  (game) => game.id === strongestCandidate.eventId
);

const mainSpreadMarket = strongestGame
  ? getMarket(strongestGame, "spreads")
  : undefined;

    const mainSpreadOutcome =
      mainSpreadMarket?.outcomes.find(
        (outcome) =>
          outcome.name === strongestCandidate.preferredTeam
      );

    const currentMainSpread =
      mainSpreadOutcome?.point !== undefined
        ? formatNFLSpread(mainSpreadOutcome.point)
        : "unavailable";

    setSafestAltMessage(
      `Alternate spreads are not available yet for this matchup. Current main spread: ${strongestCandidate.preferredTeam} ${currentMainSpread}.`
    );
  } catch (error) {
    console.error(
      "Safest alternate spread error:",
      error
    );

    setSafestAltMessage(
      "Could not analyze NFL alternate spreads."
    );
  } finally {
    setSafestAltLoading(false);
  }
}
async function findBestTwoLegAltSpread() {
  clearNFLAnalysisResults();
  try {
    setBestTwoLegLoading(true);
    setBestTwoLegParlay(null);
    setBestTwoLegMessage("");

    if (games.length < 2) {
      setBestTwoLegMessage(
        "At least two NFL games are required for a 2-leg parlay."
      );
      return;
    }

    const rankedGames = buildNFLIntelligence(
  games,
  teamForm,
  teamQuarterbacks
)
    const availableLegs: NFLAlternateSpreadLeg[] = [];

    for (const candidate of rankedGames) {
  if (candidate.avoid) {
    continue;
  }

  const response = await fetch(
        `/api/nfl-alternate-spreads?eventId=${encodeURIComponent(
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
        bookmakers?: NFLAlternateSpreadBookmaker[];
      };

      if (!data.available) {
        continue;
      }

      const selection = findSafestAvailableSpread(
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

      if (availableLegs.length === 2) {
        break;
      }
    }

    const parlay = buildNFLAlternateSpreadParlay(
      availableLegs,
      2
    );

    if (!parlay) {
      setBestTwoLegMessage(
        "Two suitable alternate-spread selections are not available yet."
      );
      return;
    }

    setBestTwoLegParlay(parlay);
    setBestTwoLegMessage(
      "Two highest-ranked available alternate spreads from different NFL games."
    );
  } catch (error) {
    console.error("Best 2-leg alternate spread error:", error);

    setBestTwoLegMessage(
      "Could not build the NFL 2-leg alternate-spread parlay."
    );
  } finally {
    setBestTwoLegLoading(false);
  }
  }
  function findGamesToAvoid() {
    clearNFLAnalysisResults();
  setAvoidGames([]);
  setAvoidMessage("");

  if (games.length === 0) {
    setAvoidMessage(
      "No NFL games are currently available for analysis."
    );
    return;
  }

  const rankedGames = buildNFLIntelligence(
  games,
  teamForm,
  teamQuarterbacks
)

  const results = buildNFLGamesToAvoid(
    rankedGames,
    3
  );

  if (results.length === 0) {
    setAvoidMessage(
      "No clear avoid games were identified."
    );
    return;
  }

  setAvoidGames(results);
  setAvoidMessage(
    "These matchups currently offer the weakest EasyRunLine betting edges."
  );
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

            
          </div>

          <button
            type="button"
           onClick={() => {
  clearNFLAnalysisResults();
  loadNFLGames();
}}
            disabled={loading}
            className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh NFL Games"}
          </button>
          <button
  type="button"
  onClick={findSafestAltSpread}
  disabled={safestAltLoading || games.length === 0}
  className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
>
  {safestAltLoading
    ? "Checking Alt Spreads..."
    : "Safest Alt Spread"}
</button>
<button
  type="button"
  onClick={findBestTwoLegAltSpread}
  disabled={bestTwoLegLoading || games.length < 2}
  className="rounded-lg bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
>
  {bestTwoLegLoading
    ? "Building 2-Leg..."
    : "Best 2-Leg Alt Spread"}
</button>
<button
  type="button"
  onClick={findGamesToAvoid}
  disabled={games.length === 0}
  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
>
  Games To Avoid
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
        {safestAltSpread && (
  <div className="mb-6 rounded-xl border border-emerald-500 bg-zinc-950 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
      🟢 EasyRunLine Safest Alt Spread
    </p>

    <div className="mt-4 space-y-2 text-sm text-white">
      <p>
        <span className="font-semibold">
          {safestAltSpread.team}
        </span>
      </p>

      <p>
        Line:
        <span className="ml-2 font-bold text-emerald-400">
          {safestAltSpread.point > 0 ? "+" : ""}
          {safestAltSpread.point}
        </span>
      </p>

      <p>
        Price:
        <span className="ml-2 text-yellow-400">
          {safestAltSpread.price}
        </span>
      </p>

      <p>
        Bookmaker:
        <span className="ml-2">
          {safestAltSpread.bookmaker}
        </span>
      </p>
      <p className="mt-2 text-sm text-emerald-400">
  Safety Score:{" "}
  {safestAltSpread.safetyScore.toFixed(1)}/100
</p>

<p className="mt-1 text-sm text-zinc-300">
  Projected Team Margin:{" "}
  {safestAltSpread.projectedTeamMargin > 0 ? "+" : ""}
  {safestAltSpread.projectedTeamMargin.toFixed(1)}
</p>

<p className="mt-1 text-sm text-zinc-300">
  Model Cushion:{" "}
  {safestAltSpread.modelCushion > 0 ? "+" : ""}
  {safestAltSpread.modelCushion.toFixed(1)}
</p>

      
    </div>
  </div>
)}

{safestAltMessage && (
  <div className="mb-6 rounded-xl border border-yellow-600 bg-yellow-950/40 p-4 text-yellow-300">
    {safestAltMessage}
  </div>
)}
{bestTwoLegParlay && (
  <div className="mb-6 rounded-xl border border-violet-500 bg-zinc-950 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
      EASYRUNLINE AI — BEST 2-LEG ALT SPREAD
    </p>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {bestTwoLegParlay.legs.map((leg, index) => (
        <div
          key={leg.eventId}
          className="rounded-lg border border-zinc-800 bg-black p-4"
        >
          <p className="text-xs font-bold uppercase text-zinc-500">
            Leg {index + 1}
          </p>

          <p className="mt-2 font-semibold text-white">
            {leg.team}
          </p>

          <p className="mt-1 text-sm text-zinc-300">
            {leg.awayTeam} at {leg.homeTeam}
          </p>

          <p className="mt-3 text-sm text-zinc-300">
            Line:
            <span className="ml-2 font-bold text-violet-400">
              {formatNFLSpread(leg.point)}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-300">
            Price:
            <span className="ml-2 text-yellow-400">
              {leg.price}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-300">
            Bookmaker:
            <span className="ml-2 text-white">
              {leg.bookmaker}
            </span>
          </p>

          <p className="mt-3 text-sm text-zinc-400">
            ERL Score:
            <span className="ml-2 font-semibold text-white">
              {leg.erlScore}/100
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            EasyRunLine Edge:
            <span className="ml-2 font-semibold text-violet-400">
              +{leg.scoreGap}
            </span>
          </p>
          <p className="mt-1 text-sm text-emerald-400">
  Safety Score: {leg.safetyScore.toFixed(1)}/100
</p>

<p className="mt-1 text-sm text-zinc-300">
  Projected Team Margin:{" "}
  {leg.projectedTeamMargin > 0 ? "+" : ""}
  {leg.projectedTeamMargin.toFixed(1)}
</p>

<p className="mt-1 text-sm text-zinc-300">
  Model Cushion:{" "}
  {leg.modelCushion > 0 ? "+" : ""}
  {leg.modelCushion.toFixed(1)}
</p>
        </div>
      ))}
    </div>

    <div className="mt-5 rounded-lg border border-violet-700 bg-violet-950/30 p-4">
      <p className="text-sm text-zinc-300">
        Combined odds:
        <span className="ml-2 text-lg font-bold text-yellow-400">
          {bestTwoLegParlay.combinedPrice}
        </span>
      </p>
    </div>
  </div>
)}

{bestTwoLegMessage && (
  <div className="mb-6 rounded-xl border border-violet-700 bg-violet-950/30 p-4 text-violet-200">
    {bestTwoLegMessage}
  </div>
)}
{avoidGames.length > 0 && (
  <div className="mb-6 rounded-xl border border-red-700 bg-red-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-red-400">
      EASYRUNLINE AI — GAMES TO AVOID
    </p>

    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {avoidGames.map((game) => (
        <div
          key={game.eventId}
          className="rounded-lg border border-red-900 bg-black p-4"
        >
          <p className="font-semibold text-white">
            {game.awayTeam} at {game.homeTeam}
          </p>

          <p className="mt-3 text-sm text-zinc-400">
            Preferred team:
            <span className="ml-2 text-white">
              {game.preferredTeam}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            ERL Score:
            <span className="ml-2 font-semibold text-white">
              {game.preferredScore}/100
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            EasyRunLine Edge:
            <span className="ml-2 font-semibold text-red-400">
              +{game.rating.edge}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Confidence:
            <span className="ml-2 font-semibold text-red-300">
              {game.rating.confidence}
            </span>
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Grade:
            <span className="ml-2 text-white">
              {game.rating.edgeGrade}
            </span>
          </p>

          <div className="mt-4 border-t border-red-950 pt-3">
            <p className="text-xs font-bold uppercase text-red-400">
              Reasons
            </p>

            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              {game.reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-sm font-bold uppercase text-red-400">
            No Play
          </p>
        </div>
      ))}
    </div>
  </div>
)}

{avoidMessage && (
  <div className="mb-6 rounded-xl border border-red-800 bg-red-950/30 p-4 text-red-200">
    {avoidMessage}
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
const awayActiveQuarterbacks = awayQuarterbacks.filter(
  (quarterback) => quarterback.status === "Active"
);

const homeActiveQuarterbacks = homeQuarterbacks.filter(
  (quarterback) => quarterback.status === "Active"
);

const awayLikelyQuarterback =
  awayActiveQuarterbacks.find(
    (quarterback) => quarterback.depth === 1
  ) ??
  [...awayActiveQuarterbacks].sort(
    (a, b) => b.experienceYears - a.experienceYears
  )[0];

const homeLikelyQuarterback =
  homeActiveQuarterbacks.find(
    (quarterback) => quarterback.depth === 1
  ) ??
  [...homeActiveQuarterbacks].sort(
    (a, b) => b.experienceYears - a.experienceYears
  )[0];

const awayTeamScore = scoreNFLTeam(
  awayForm,
  game.away_team,
  false
);

const homeTeamScore = scoreNFLTeam(
  homeForm,
  game.home_team,
  true
);
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
<div className="mt-5 rounded-xl border border-zinc-800 bg-black p-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
    Team Intelligence
  </p>

  <div className="mt-4 grid gap-4 sm:grid-cols-2">

    <div>
      <p className="font-semibold text-white">
        {game.away_team}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Offense Rank:
        <span className="ml-2 font-semibold text-white">
          #{getOffenseRank(game.away_team)}
        </span>
      </p>

      <p className="text-sm text-zinc-400">
        Defense Rank:
        <span className="ml-2 font-semibold text-white">
          #{getDefenseRank(game.away_team)}
        </span>
      </p>

      <p className="text-sm text-zinc-400">
        Points/Game:
        <span className="ml-2 font-semibold text-white">
          {awayForm?.averagePointsForLast10 ?? "N/A"}
        </span>
      </p>

      <p className="text-sm text-zinc-400">
        Allowed/Game:
        <span className="ml-2 font-semibold text-white">
          {awayForm?.averagePointsAgainstLast10 ?? "N/A"}
        </span>
      </p>

    </div>

    <div>
      <p className="font-semibold text-white">
        {game.home_team}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        Offense Rank:
        <span className="ml-2 font-semibold text-white">
          #{getOffenseRank(game.home_team)}
        </span>
      </p>

      <p className="text-sm text-zinc-400">
        Defense Rank:
        <span className="ml-2 font-semibold text-white">
          #{getDefenseRank(game.home_team)}
        </span>
      </p>

      <p className="text-sm text-zinc-400">
        Points/Game:
        <span className="ml-2 font-semibold text-white">
          {homeForm?.averagePointsForLast10 ?? "N/A"}
        </span>
      </p>

      <p className="text-sm text-zinc-400">
        Allowed/Game:
        <span className="ml-2 font-semibold text-white">
          {homeForm?.averagePointsAgainstLast10 ?? "N/A"}
        </span>
      </p>

    </div>

  </div>
</div>
<div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
    EasyRunLine Score
  </p>

  <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <div className="rounded-lg border border-zinc-800 bg-black p-3">
      <p className="font-semibold text-white">
        {game.away_team}
      </p>

      <p className="mt-2 text-2xl font-bold text-yellow-400">
        {awayTeamScore.score}/100
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        Confidence: {awayTeamScore.confidence}
      </p>

      <ul className="mt-3 space-y-1 text-xs text-zinc-500">
        {awayTeamScore.reasons.slice(0, 3).map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </div>

    <div className="rounded-lg border border-zinc-800 bg-black p-3">
      <p className="font-semibold text-white">
        {game.home_team}
      </p>

      <p className="mt-2 text-2xl font-bold text-yellow-400">
        {homeTeamScore.score}/100
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        Confidence: {homeTeamScore.confidence}
      </p>

      <ul className="mt-3 space-y-1 text-xs text-zinc-500">
        {homeTeamScore.reasons.slice(0, 3).map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
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